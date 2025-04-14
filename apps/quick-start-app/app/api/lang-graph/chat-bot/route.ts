// pages/api/lang-graph/chat-bot/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, START, END } from '@langchain/langgraph';
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from '@langchain/core/tools';
import { tavily } from '@tavily/core';
import { LangChainTracer } from 'langchain/callbacks';
import { Client } from 'langsmith';
import { z } from "zod";
import "@langchain/langgraph/zod";

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

const AgentState = z.object({
  messages: z
    .array(z.string())
    .default(() => [])
    .langgraph.reducer(
      (a, b) => a.concat(Array.isArray(b) ? b : [b]),
      z.union([z.string(), z.array(z.string())])
    )
});

const llm = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL_NAME,
  temperature: 0.5,
  openAIApiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_API_BASE_URL,
  },
  maxRetries: 4,
}).bind({
  tools: [tavilyTool],
  tool_choice: "auto",
});

function createGraph() {
  const graph = new StateGraph(AgentState)
    .addNode("agent", async (state: z.TypeOf<typeof AgentState>) => {
      try {
        const messages = state.messages;
        const lastMessage = messages[messages.length - 1];
        if ((lastMessage as unknown as ToolMessage) instanceof ToolMessage) {
          const llmResponse = await llm.invoke(messages);
          return { messages: [llmResponse] };
        }

        const response = await llm.invoke(messages);
        const toolCalls = response.tool_calls || [];

        if (toolCalls.length > 0) {
          const toolMessages = await Promise.all(toolCalls.map(async (tc) => {
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
          return { messages: [response, ...toolMessages] };
        }

        return { messages: [response] };
      } catch (error) {
        console.error("Agent error:", error);
        return { messages: [new AIMessage("服务暂时不可用，请稍后再试")] };
      }
    });

  graph.addEdge(START, "agent");
  graph.addConditionalEdges("agent", (state) => {
    const lastMsg = state.messages[state.messages.length - 1];
    return lastMsg && (lastMsg as unknown as AIMessage)?.tool_calls?.length ? "agent" : END;
  });

  return graph.compile();
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const client = new Client({ apiKey: process.env.LANGSMITH_API_KEY });
  const tracer = new LangChainTracer({
    client,
    projectName: process.env.LANGSMITH_PROJECT,
  });

  const graph = createGraph();

  const initialMessages = [new HumanMessage(message)];
  const resultMessages: string[] = [];

  try {
    for await (const { messages } of await graph.stream(
      { messages: initialMessages.map(msg => String(msg.content)) },
      { streamMode: "values", callbacks: [tracer] }
    )) {
      const valid = messages.filter(
        (msg: any) => msg instanceof AIMessage || msg instanceof ToolMessage
      );
      valid.forEach((msg: any) => resultMessages.push(msg?.content ?? ''));
    }
  } catch (error) {
    console.error("Stream error:", error);
    resultMessages.push("服务暂时中断，请刷新页面重试");
  }

  return NextResponse.json({ text: resultMessages.join('\n') });
}
