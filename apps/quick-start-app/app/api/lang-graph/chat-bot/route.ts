import { metadata } from './../../../[locale]/layout';
import { NextResponse, NextRequest } from 'next/server';
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { BaseMessage } from "@langchain/core/messages";
import { tavily } from '@tavily/core';
import "@langchain/langgraph/zod";
import { LangChainTracer } from 'langchain/callbacks';
import { Client } from 'langsmith';
import { z } from "zod";

export async function POST(req: NextRequest) {
    const body = await req.json();

    const client = new Client({
        apiKey: process.env.LANGSMITH_API_KEY,
    });

    // 创建 LangSmith Tracer
    const tracer = new LangChainTracer({
        client: client,
        projectName: process.env.LANGSMITH_PROJECT, // 动态 project
    });

    const llm = new ChatOpenAI({
        modelName: process.env.OPENAI_MODEL_NAME,
        temperature: 0.5,
        openAIApiKey: process.env.OPENAI_API_KEY,
        configuration: {
            baseURL: process.env.OPENAI_API_BASE_URL,
        },
        maxRetries: 4,
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

    // 定义聊天机器人的节点函数
    const chatbot = async (state: any) => {
        const responses = await Promise.all(state.messages.map((msg: string) => llm.invoke(msg, {
            callbacks: [tracer],
        })));
        return { messages: responses.map((response: any) => response.text) };
    };
      
    const graph_builder = new StateGraph(AgentState)
        .addNode('chatbot', chatbot)
        .addEdge(START, 'chatbot')
        .addEdge('chatbot', END)
  
    const graph = graph_builder.compile();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            let previousLength = 1; 
            for await (const { messages } of await graph.stream(
                { messages: [body.message] },
                { streamMode: "values", callbacks: [tracer], }
            )) {
                // 获取当前新增的 message
                const newMessages = messages.slice(previousLength);
                previousLength = messages.length;
                console.log('newMessages', newMessages);
                const str = newMessages[0]
                const chunk = typeof str === 'string' ? str : (str?.content ?? '');

                // 推送这段内容到客户端
                // controller.enqueue(encoder.encode(chunk));
                // 🔥 一个字一个字推送
                for (const char of chunk) {
                    controller.enqueue(encoder.encode(char));
                    await new Promise((resolve) => setTimeout(resolve, 30)); // 可调速度
                }
            }
            controller.close(); // ✅ 关闭流
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache',
        }
    });
}
  
