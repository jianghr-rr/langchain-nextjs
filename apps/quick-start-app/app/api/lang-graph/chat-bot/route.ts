import { NextResponse, NextRequest } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, START, END } from '@langchain/langgraph';
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from '@langchain/core/tools';
import { tavily } from '@tavily/core';
import { LangChainTracer } from 'langchain/callbacks';
import { Client } from 'langsmith';
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '~/components/redis-client';
import "@langchain/langgraph/zod";
import { isEmpty } from "lodash";

interface CheckpointData {
  sessionId: string;
  checkpointId: string;
  messages: (HumanMessage | AIMessage | ToolMessage)[];
  timestamp: number;
}

/**
 * RedisCheckpointer 类用于管理检查点数据的存储和检索。
 * 它提供了 put、get 和 getLatest 方法来操作检查点数据。
 */
class RedisCheckpointer {
  private readonly prefix: string;
  private readonly ttl: number;
  private seenUids = new Set<string>();

  constructor(
    private client: typeof redisClient,
    options?: { prefix?: string; ttl?: number }
  ) {
    this.prefix = options?.prefix || 'chat:checkpoints';
    this.ttl = options?.ttl || 86400; // 24小时
  }

  private genKey(sessionId: string, checkpointId?: string) {
    return sessionId;
  }

  async put(sessionId: string, data: CheckpointData) {
    const checkpointId = `ckpt_${Date.now()}`;
    const key = this.genKey(sessionId, checkpointId);
    
    // 使用pipeline保证原子性
    const pipeline = this.client.multi()
      .hset(key, {
        ...data,
        messages: JSON.stringify(data.messages.map(m => ({
          ...m.toDict(),
          // 添加唯一标识
          uid: `${sessionId}_${checkpointId}_${m.id ?? (m instanceof ToolMessage ? m.tool_call_id : '')}`
        }))),
      })
      .expire(key, this.ttl)
      .lpush(this.genKey(sessionId), checkpointId)
      // 保持最多5个检查点版本
      .ltrim(this.genKey(sessionId), 0, 4);

    await pipeline.exec();
    
    return checkpointId;
  }

  async get(sessionId: string, checkpointId: string) {
    const data = await this.client.hgetall(this.genKey(sessionId, checkpointId));
    if (!data || isEmpty(data)) return null;
    
    return {
      ...data,
      messages: JSON.parse(data.messages ?? '[]').map((m: any) => {
        // 根据唯一标识过滤重复
        if (m.uid && this.seenUids.has(m.uid)) {
          return null;
        }
        this.seenUids.add(m.uid);
        
        switch (m.type) {
          case 'human': return new HumanMessage(m);
          case 'ai': return new AIMessage(m);
          case 'tool': return new ToolMessage(m);
          default: throw new Error("未知消息类型");
        }
      }).filter(Boolean),
      checkpointId
    } as CheckpointData;
  }

  async getLatest(sessionId: string) {
    const [checkpointId] = await this.client.lrange(this.genKey(sessionId), 0, 0);
    return checkpointId ? this.get(sessionId, checkpointId) : null;
  }

  async list(sessionId: string) {
    const messages = await this.client.hget(sessionId, 'messages');
    try {
      const parsedMessages = messages ? JSON.parse(messages) : [];
      return parsedMessages;
    }
    catch (error) {
      console.error("Error parsing messages:", error);
      return [];
    }
  }
}

const tavilyTool = new DynamicStructuredTool({
  name: "web_search",
  description: "使用Tavily搜索引擎获取最新的网络信息",
  schema: z.object({
    query: z.string().describe("要搜索的问题关键词")
  }),
  func: async ({ query }) => {
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const results = await tvly.search(query, { maxResults: 3 });
    return JSON.stringify(results.results);
  }
});

// 增强状态类型以支持消息对象
const AgentState = z.object({
  messages: z
    .array(z.any())
    .default(() => [])
    .langgraph.reducer(
      (a, b) => a.concat(Array.isArray(b) ? b : [b]),
      z.array(z.union([
        z.instanceof(HumanMessage),
        z.instanceof(AIMessage),
        z.instanceof(ToolMessage)
      ]))
  ),
  sessionId: z.string(),
  checkpointId: z.string().optional()
});
  
const llm = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL_NAME,
    temperature: 0.5,
    openAIApiKey: process.env.OPENAI_API_KEY,
    configuration: {
        baseURL: process.env.OPENAI_API_BASE_URL,
    },
    maxRetries: 10,
}).bind({
    tools: [tavilyTool],
    tool_choice: "auto",
});

function createGraph(sessionId: string, checkpointer: RedisCheckpointer) {
  const graph = new StateGraph(AgentState)
    .addNode("initialize", async (state) => {
      return {
        ...state,
        sessionId,
        checkpointId: state.checkpointId || `ckpt_${Date.now()}`,
        messages: state.messages || [] // 确保消息初始化为空数组
      }
    })
    .addNode("load_checkpoint", async (state) => {
      if (state.checkpointId) {
        const allMessages = await checkpointer.list(state.sessionId);

        const structuredMessages = allMessages.map((msg: {
          type: string;
          data: {
            content: string;
            id: string;
            tool_call_id: string;
          };
        }) => {
          if (msg.type === 'human') {
            return new HumanMessage({
              ...msg.data,
            });
          } else if (msg.type === 'ai') {
            return new AIMessage({
             ...msg.data,
            });
          } else if (msg.type === 'tool') {
            return new ToolMessage({
             ...msg.data,
            });
          } else {
            return null;
          }
        });
    
        if (structuredMessages) {
          const uniqueMessages = [
            ...structuredMessages,
            ...state.messages
          ]
          state.messages = uniqueMessages;
          return { 
            ...state,
            messages: uniqueMessages, // 保持消息不可变性
          };
        }
      }
      return state;
    })
    .addNode("agent", async (state: z.TypeOf<typeof AgentState>) => {
      // 只处理最新消息
      try {
        const response = await llm.invoke(state.messages);
        return {
          ...state,
          messages: [
            ...state.messages,
            ...(Array.isArray(response) ? response : [response]) // 确保response是数组并展开
          ] 
        };
      } catch (error) {
        console.error("Agent error:", error);
        return { 
          ...state,
          messages: [
            ...state.messages,
            new AIMessage("服务暂时不可用，请稍后再试")
          ] 
        };
      }    
    })
    .addNode("tool_node", async (state) => {
      try {
        const lastMessage = state.messages[state.messages.length - 1];
        const toolCalls = (lastMessage as AIMessage)?.tool_calls || [];

        const processedToolCallIds = new Set(state.messages.filter(msg => msg instanceof ToolMessage).map(msg => msg.tool_call_id));

        const toolMessages = await Promise.all(toolCalls.map(async (tc) => {
          if (processedToolCallIds.has(tc.id!)) {
            return null;
          }
          processedToolCallIds.add(tc.id!);

          try {
            const output = await tavilyTool.invoke(tc.args as { query: string });
            return new ToolMessage({
              content: output,
              tool_call_id: tc.id ?? "unknown_id",
              name: tc.name
            });
          } catch {
            return new ToolMessage({
              content: JSON.stringify({ error: "工具执行失败" }),
              tool_call_id: tc.id ?? "unknown_id",
              name: tc.name
            });
          }
        }));

        return { 
          messages: [
            ...state.messages,
            ...toolMessages.filter(Boolean) // 过滤空值
          ]
        };
      } catch (error) {
        return { 
          messages: [
            ...state.messages,
            new ToolMessage({
              content: "工具执行异常",
              tool_call_id: "error",
              name: "error"
            })
          ]
        };
      }
    })
    .addNode("save_checkpoint", async (state) => {
      // 保存前去重
      const seenIds = new Set<string>();
      const uniqueMessages = state.messages.filter((msg) => {
        const id = msg.id || (msg instanceof ToolMessage ? msg.tool_call_id : null);
        if (!id || seenIds.has(id)) {
          return false;
        }
        seenIds.add(id);
        return true;
      });

      await checkpointer.put(state.sessionId, {
        sessionId: state.sessionId,
        checkpointId: state.checkpointId ?? '',
        messages: uniqueMessages, // 存储去重后的消息
        timestamp: Date.now()
      });
      
      return { ...state, messages: uniqueMessages }; // 返回清理后的状态
    });

    // 连接节点
    graph
      .addEdge(START, "initialize")
      .addEdge("initialize", "load_checkpoint")
      .addEdge("load_checkpoint", "agent")
      .addEdge("agent", "save_checkpoint")
      .addConditionalEdges("save_checkpoint", (state) => {
        const lastMsg = state.messages[state.messages.length - 1];
        const hasPendingToolCalls = (lastMsg as AIMessage)?.tool_calls?.some(tc => 
          !state.messages.some(msg => msg instanceof ToolMessage && msg.tool_call_id === tc.id)
        );
        return hasPendingToolCalls ? "tool_node" : END;
      })
      .addEdge("tool_node", "agent");

    return graph.compile();
}

export async function POST(req: NextRequest) {
  const { message, sessionId } = await req.json();

  // 前置连接检查
  if (redisClient.status === "end") {
    await redisClient.connect();
  }
  const checkpointer = new RedisCheckpointer(redisClient);

  const client = new Client({ apiKey: process.env.LANGSMITH_API_KEY });
  const tracer = new LangChainTracer({
    client,
    projectName: process.env.LANGSMITH_PROJECT,
  });

  const graph = createGraph(sessionId, checkpointer);
  const initialMessages = [new HumanMessage({
    content: message,
    id: uuidv4(), // 生成唯一标识
  })];
  const resultMessages: string[] = [];
  let seenToolMessageIds = new Set<string>();

  try {
    const seenMessageIds = new Set(); // 用于跟踪已处理的消息 ID
  
    for await (const { messages } of await graph.stream(
      { messages: initialMessages },
      { streamMode: "values", callbacks: [tracer] }
    )) {
  
      for (const message of messages) {
        const messageId = message.id || (message instanceof ToolMessage ? message.tool_call_id : null);
  
        // 如果消息 ID 已经存在于 seenMessageIds 中，跳过该消息
        if (!messageId || seenMessageIds.has(messageId)) {
          continue;
        }
  
        // 将消息 ID 添加到 seenMessageIds 中，防止重复处理
        seenMessageIds.add(messageId);
  
        // 根据消息类型进行处理
        if (message instanceof AIMessage) {
          resultMessages.push(`[AI_ANSWER]${message.content}`);
        } else if (message instanceof ToolMessage) {
          const toolCallId = message.tool_call_id || "unknown_id";
          if (!seenToolMessageIds.has(toolCallId)) {
            resultMessages.push(`[TOOL_RESULT]${message.content}`);
            seenToolMessageIds.add(toolCallId);
          }
        }
      }
    }
  } catch (error) {
    console.error("Stream error:", error);
    resultMessages.push("服务暂时中断，请刷新页面重试");
  }

  return NextResponse.json({ 
    text: resultMessages.join('\n'),
    structured: resultMessages.map(msg => ({
      type: msg.startsWith('[AI_ANSWER]') ? 'ai' : 
            msg.startsWith('[TOOL_RESULT]') ? 'tool' : 'error',
      content: msg.replace(/^\[[^\]]+\]/, '')
    }))
  });
}

export async function GET(req: NextRequest) {

  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ 
        success: false,
        error: { code: 'MISSING_SESSION_ID', message: '缺少 sessionId' }
      }, { status: 400 });
    }
    
    // 检查Redis连接状态
    if (redisClient.status !== "ready") {
      await new Promise((resolve) => redisClient.once("ready", resolve));
    }

    const checkpointer = new RedisCheckpointer(redisClient);

    // 获取所有检查点数据
    const allMessages = await checkpointer.list(sessionId);

    if (!allMessages || allMessages.length === 0) {
      return NextResponse.json({
        text: '',
        structured: []
      });
    }

    // 将消息转换为结构化格式
    const structuredMessages = allMessages.map((msg: {
      type: string;
      data: {
        content: string;
        id: string
      };
    }) => ({
      type: msg.type === 'human' ? 'user' : msg.type,
      content: msg.data.content,
      data: msg.data.content
    }));

    return NextResponse.json({ messages: structuredMessages });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "无法获取历史记录" }, { status: 500 });
  }
}
