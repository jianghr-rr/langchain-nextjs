import { NextResponse, NextRequest } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, START, END } from '@langchain/langgraph';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { tavily } from '@tavily/core';
import { LangChainTracer } from 'langchain/callbacks';
import { Client } from 'langsmith';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '~/components/redis-client';
import RedisCheckpointer from '~/components/multi-agent-redis';
import '@langchain/langgraph/zod';

// 建立智能体节点间通信 AgentState
const AgentState = z.object({
  messages: z
    .array(z.any())
    .default(() => [])
    .langgraph.reducer(
      (a, b) => a.concat(Array.isArray(b) ? b : [b]),
      z.array(z.union([z.instanceof(HumanMessage), z.instanceof(AIMessage)]))
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

const research_llm = new ChatOpenAI({
  modelName: process.env.OPENAI_CHAT_MODEL_NAME,
  temperature: 0.8,
  openAIApiKey: process.env.OPENAI_CHAT_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_CHAT_API_BASE_URL,
  },
  maxRetries: 10,
});

// 辅助函数：创建写作智能体
const createAgent = (llm: ChatOpenAI, tools: DynamicStructuredTool<any>[]) => {
  const writer_prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a writing assistant tasked with creating well-crafted, coherent, and engaging articles based on the user's request.
      Focus on clarity, structure, and quality to produce the best possible piece of writing.
      If the user provides feedback or suggestions, revise and improve the writing to better align with their expectations.
      用中文输出`,
    ],
    '{messages}',
  ]);
  return writer_prompt.pipe(llm.bind({ tools }));
};

// 辅助函数：创建反思智能体
const createReflectionAgent = (
  llm: ChatOpenAI,
  tools: DynamicStructuredTool<any>[]
) => {
  const reflection_prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a teacher grading an article submission. writer critique and recommendations for the user's submission.
      Provide detailed recommendations, including requests for length, depth, style, etc.
      用中文输出`,
    ],
    '{messages}',
  ]);
  return reflection_prompt.pipe(llm.bind({ tools }));
};

const MAX_ROUND = 6;
// writer 智能体
const writerAgent = createAgent(research_llm, [tavilyTool]);
// reflection 智能体
const reflectionAgent = createReflectionAgent(research_llm, [tavilyTool]);

// 生成节点：生成内容
const generationNode = async (state: any) => {
  const result = await writerAgent.invoke({ messages: state.messages });
  return {
    ...state,
    messages: [...state.messages, result],
  };
};

// 反思节点：对内容进行反思和反馈
const reflectionNode = async (state: any) => {
  const clsMap = {
    ai: (content: string) => new HumanMessage({ content }),
    human: (content: string) => new AIMessage({ content }),
  };
  const translated = [
    state.messages[0],
    ...state.messages.slice(1).map((msg: any) => {
      const type = msg._getType?.() || msg.type;
      return clsMap[type as keyof typeof clsMap](msg.content);
    }),
  ];
  const res = await reflectionAgent.invoke({ messages: translated });
  return {
    ...state,
    messages: [...state.messages, new HumanMessage({ content: res.content })],
  };
};

// 是否继续反思
function shouldContinueReflection(state: any) {
  if (state.messages.length > MAX_ROUND) {
    return END;
  }
  return 'reflect';
}

// 构建反思智能体 StateGraph
function createReflectionGraph() {
  const workflow = new StateGraph<any>(AgentState)
    .addNode('writer', generationNode)
    .addNode('reflect', reflectionNode)
    .addEdge(START, 'writer')
    .addConditionalEdges('writer', shouldContinueReflection)
    .addEdge('reflect', 'writer');
  return workflow.compile();
}

// 只保留反思智能体 POST 接口
export async function POST(req: NextRequest) {
  const { message, sessionId } = await req.json();

  // 前置连接检查
  if (redisClient.status === 'end') {
    await redisClient.connect();
  }
  const checkpointer = new RedisCheckpointer(redisClient);

  const tracer = new LangChainTracer({
    client: new Client({
      apiKey: process.env.LANGSMITH_REFLECTION_AGENT_API_KEY,
    }),
    projectName: process.env.LANGSMITH_REFLECTION_AGENT_PROJECT,
  });

  // 反思智能体流程
  const graph = createReflectionGraph();
  let state = {
    messages: [new HumanMessage({ content: message, id: uuidv4() })],
    sessionId: sessionId ?? '',
    sender: undefined,
    checkpointId: undefined,
  };
  const resultMessages: string[] = [];
  try {
    for await (const { messages } of await graph.stream(state, {
      recursionLimit: 20,
      streamMode: 'values',
      callbacks: [tracer],
    })) {
      for (const msg of messages) {
        if (msg instanceof AIMessage) {
          resultMessages.push(`[AI_ANSWER]${msg.content}`);
        } else if (msg instanceof HumanMessage) {
          resultMessages.push(`[HUMAN]${msg.content}`);
        }
      }
    }
  } catch (error) {
    console.error('Reflection stream error:', error);
    resultMessages.push('服务暂时中断，请刷新页面重试');
  }
  return NextResponse.json({
    text: resultMessages.join('\n'),
    structured: resultMessages.map((msg) => ({
      type: msg.startsWith('[AI_ANSWER]')
        ? 'ai'
        : msg.startsWith('[HUMAN]')
          ? 'human'
          : 'error',
      content: msg.replace(/^\[[^\]]+\]/, ''),
    })),
  });
}
