import { NextResponse, NextRequest } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, START, END } from '@langchain/langgraph';
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { tavily } from '@tavily/core';
import { LangChainTracer } from 'langchain/callbacks';
import { Client } from 'langsmith';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '~/components/redis-client';
import RedisCheckpointer from '~/components/multi-agent-redis';
import { runJsInWorker } from '~/utils/run-js-in-worker';
import '@langchain/langgraph/zod';

// 建立智能体节点间通信 AgentState
const AgentState = z.object({
  messages: z
    .array(z.any())
    .default(() => [])
    .langgraph.reducer(
      (a, b) => a.concat(Array.isArray(b) ? b : [b]),
      z.array(
        z.union([
          z.instanceof(HumanMessage),
          z.instanceof(AIMessage),
          z.instanceof(ToolMessage),
        ])
      )
    ),
  sender: z.string().optional(),
  sessionId: z.string(),
  checkpointId: z.string().optional(),
});

const tavilyTool = new DynamicStructuredTool({
  name: 'web_search',
  description: '使用Tavily搜索引擎获取最新的网络信息',
  schema: z.object({
    query: z.string().describe('要搜索的问题关键词'),
  }),
  func: async ({ query }) => {
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const results = await tvly.search(query, { maxResults: 3 });
    return JSON.stringify(results.results);
  },
});

const jsReplTool = new DynamicStructuredTool({
  name: 'js_repl',
  description:
    '生成用于创建图表的JavaScript代码。代码应该是一个完整的JavaScript函数，返回一个包含HTML和JavaScript的字符串。',
  schema: z.object({
    code: z
      .string()
      .describe(
        '要生成的JavaScript代码，应该是一个完整的函数，返回HTML和JavaScript字符串'
      ),
  }),
  func: async ({ code }) => {
    try {
      // 如果代码是一个函数，直接返回代码字符串
      if (code.includes('function') || code.includes('=>')) {
        return code;
      }
      // 否则尝试执行代码
      return await runJsInWorker(code);
    } catch (error: any) {
      console.error('js_repl error:', error);
      return `Error executing code: ${error.message}`;
    }
  },
});

const research_llm = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL_NAME,
  temperature: 0.8,
  openAIApiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_API_BASE_URL,
  },
  maxRetries: 10,
});

// 创建图表生成器的语言模型
const chart_llm = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL_NAME,
  temperature: 0.8,
  openAIApiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_API_BASE_URL,
  },
  maxRetries: 10,
});

// 辅助函数：创建智能体
const createAgent = (
  llm: ChatOpenAI,
  tools: DynamicStructuredTool<any>[],
  toolMessage: string,
  customNotice: string = ''
) => {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a helpful AI assistant, collaborating with other assistants.
      Use the provided tools to progress towards answering the question.
      If you are unable to fully answer, that's OK, another assistant with different tools
      will help where you left off. Execute what you can to make progress.
      If you or any of the other assistants have the final answer or deliverable,
      prefix your response with FINAL ANSWER so the team knows to stop.
      ${customNotice}
      You have access to the following tools: ${tools.map((tool) => tool.name).join(', ')}.
      ${toolMessage}`,
    ],
    ['human', '{messages}'],
  ]);

  return prompt.pipe(llm.bind({ tools }));
};

// 辅助函数：为智能体创建一个节点
const agentNode = async (
  state: {
    messages: any[];
    sender?: string;
    sessionId: string;
    checkpointId?: string;
  },
  agent: any,
  name: string
) => {
  // 修正名称格式，移除空格并确保只包含合法字符
  const formattedName = name.replace(/\s+/g, '_').replace(/-/g, '_');

  // 调用智能体，获取结果
  const result = await agent.invoke(state);

  // 将智能体的输出转换为适合追加到全局状态的格式
  if (result instanceof ToolMessage) {
    return {
      ...state,
      messages: [...state.messages, result],
      sender: formattedName,
    };
  } else {
    // 将结果转换为 AIMessage，并添加发送者名称
    const aiMessage = new AIMessage({
      content: result.content,
      name: formattedName,
      tool_calls: result.tool_calls,
      additional_kwargs: result.additional_kwargs,
    });

    return {
      ...state,
      messages: [...state.messages, aiMessage],
      sender: formattedName,
    };
  }
};

// 创建特定名称的智能体节点
const createNamedAgentNode = (agent: any, name: string) => {
  return (state: { messages: any[]; sessionId: string }) =>
    agentNode(state, agent, name);
};

// 研究智能体及其节点
const researchAgent = createAgent(
  research_llm,
  [tavilyTool],
  'Before using the search engine, carefully think through and clarify the query. ' +
    'Then, conduct a single search that addresses all aspects of the query in one go. ' +
    'You must provide a meaningful response with the search results. ' +
    'If you cannot find relevant information, explicitly state that.',
  'Notice:\n' +
    '1. You must provide a meaningful response with search results.\n' +
    '2. If you cannot find relevant information, respond with "No relevant information found."\n' +
    '3. Never return an empty response.\n' +
    '4. After providing search results, your response will be passed to Chart_Generator for visualization.\n' +
    '5. Do not include FINAL ANSWER in your response.'
);

// 创建研究智能体节点
const researcherNode = createNamedAgentNode(researchAgent, 'Researcher');

// 图表生成器智能体及其节点
const chartAgent = createAgent(
  chart_llm,
  [jsReplTool],
  'You are a chart generation expert. Your task is to create visualizations based on the data provided by the Researcher. ' +
    "You must use the js_repl tool to generate chart code. Here's how to use it:\n" +
    '1. First, analyze the data provided by the Researcher\n' +
    '2. Use the js_repl tool to create a chart using JavaScript code\n' +
    '3. The code should be a complete JavaScript function that returns a string containing HTML and JavaScript\n' +
    '4. Make sure to include all necessary chart libraries (like Chart.js) in your code\n' +
    'Notice:\n' +
    '1. Always use the js_repl tool to generate chart code\n' +
    '2. The code must be a complete JavaScript function that returns a string\n' +
    '3. The returned string must contain both HTML and JavaScript\n' +
    '4. Make sure to include Chart.js library in your code\n' +
    '5. After generating the chart, respond with "FINAL ANSWER: [brief description of the chart]"'
);

// 创建图表生成器智能体节点
const chartNode = createNamedAgentNode(chartAgent, 'Chart_Generator');

// 定义工具列表
const tools = [tavilyTool, jsReplTool];

// 创建工具节点
const toolNode = new ToolNode(tools);

// 路由器函数，用于决定下一步是执行工具还是结束任务
const router = (state: { messages: any[] }) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // 如果最新消息包含工具调用，则返回 "call_tool"
  if (
    lastMessage instanceof AIMessage &&
    lastMessage.tool_calls &&
    lastMessage.tool_calls.length > 0
  ) {
    return 'call_tool' as const;
  }

  // 如果最新消息中包含 "FINAL ANSWER"，且消息来自 Chart_Generator，则结束工作流
  if (
    lastMessage instanceof AIMessage &&
    typeof lastMessage.content === 'string' &&
    lastMessage.content.includes('FINAL ANSWER') &&
    lastMessage.name === 'Chart_Generator'
  ) {
    return END;
  }

  // 如果既没有工具调用也没有完成任务，继续流程
  return 'continue' as const;
};

function createGraph(sessionId: string, checkpointer: RedisCheckpointer) {
  // 创建一个状态图 workflow
  const workflow = new StateGraph(AgentState)
    .addNode('Researcher', researcherNode)
    .addNode('Chart_Generator', chartNode)
    .addNode('call_tool', toolNode);

  // 为 "Researcher" 智能体节点添加条件边
  workflow.addConditionalEdges('Researcher', router, {
    continue: 'Chart_Generator',
    call_tool: 'call_tool',
    [END]: END,
  });

  // 为 "Chart_Generator" 智能体节点添加条件边
  workflow.addConditionalEdges('Chart_Generator', router, {
    continue: 'Researcher',
    call_tool: 'call_tool',
    [END]: END,
  });

  // 为 "call_tool" 工具节点添加条件边
  workflow.addConditionalEdges(
    'call_tool',
    (state) => state.sender || 'Researcher',
    {
      Researcher: 'Researcher',
      Chart_Generator: 'Chart_Generator',
    }
  );

  // 设置起始节点
  workflow.addEdge(START, 'Researcher');

  // 编译工作流
  return workflow.compile();
}

/**
 * 多轮对话
 * @param req
 * @returns
 */
export async function POST(req: NextRequest) {
  const { message, sessionId } = await req.json();

  // 前置连接检查
  if (redisClient.status === 'end') {
    await redisClient.connect();
  }
  const checkpointer = new RedisCheckpointer(redisClient);

  const tracer = new LangChainTracer({
    client: new Client({ apiKey: process.env.LANGSMITH_MULTI_AGENT_API_KEY }),
    projectName: process.env.LANGSMITH_MULTI_AGENT_PROJECT,
  });

  const graph = createGraph(sessionId, checkpointer);
  const initialMessages = [
    new HumanMessage({
      content: message,
      id: uuidv4(), // 生成唯一标识
    }),
  ];
  const resultMessages: string[] = [];

  try {
    for await (const { messages } of await graph.stream(
      { messages: initialMessages },
      {
        recursionLimit: 20,
        streamMode: 'values',
        callbacks: [tracer],
      }
    )) {
      for (const message of messages) {
        // 根据消息类型进行处理
        if (message instanceof AIMessage) {
          resultMessages.push(`[AI_ANSWER]${message.content}`);
        } else if (message instanceof ToolMessage) {
          resultMessages.push(`[TOOL_RESULT]${message.content}`);
        }
      }
    }
  } catch (error) {
    console.error('Stream error:', error);
    resultMessages.push('服务暂时中断，请刷新页面重试');
  }

  return NextResponse.json({
    text: resultMessages.join('\n'),
    structured: resultMessages.map((msg) => ({
      type: msg.startsWith('[AI_ANSWER]')
        ? 'ai'
        : msg.startsWith('[TOOL_RESULT]')
          ? 'tool'
          : 'error',
      content: msg.replace(/^\[[^\]]+\]/, ''),
    })),
  });
}
