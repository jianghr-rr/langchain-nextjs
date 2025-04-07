import { NextResponse, NextRequest } from 'next/server';
import { RedisChatMessageHistory } from "@langchain/community/stores/message/ioredis";
import { BufferWindowMemory } from "langchain/memory";
import { ChatOpenAI } from "@langchain/openai";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { redisClient } from '~/components/redis-client';

// 初始化 Pinecone（带缓存）
let pineconeStore: PineconeStore | null = null;
const initPinecone = async (sessionId: string) => {
  if (!pineconeStore) {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    
    pineconeStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
        configuration: {
          baseURL: process.env.OPENAI_API_BASE_URL,
        }
      }),
      {
        pineconeIndex: pinecone.Index(process.env.PINECONE_INDEX_NAME!),
        namespace: sessionId,
      }
    );
  }
  return pineconeStore;
};

// 核心问答处理逻辑
export async function POST(req: NextRequest) {
  try {
    const { question, sessionId } = await req.json();
    
    // 并行初始化组件
    const [vectorStore, llm] = await Promise.all([
      initPinecone(sessionId),
      new ChatOpenAI({
        modelName: process.env.OPENAI_CHAT_MODEL_NAME,
        temperature: 0.5,
        openAIApiKey: process.env.OPENAI_CHAT_API_KEY,
        configuration: {
          baseURL: process.env.OPENAI_CHAT_API_BASE_URL,
        },
        maxRetries: 4,
      }),
    ]);

    // 前置连接检查
    if (redisClient.status === "end") {
      await redisClient.connect();
    }

    // 初始化聊天历史（适配 @upstash/redis）
    const messageHistory = new RedisChatMessageHistory({
      sessionId,
      client: redisClient,
      config: {
        keyPrefix: "chat_history", // 统一键前缀
      },
      sessionTTL: 3600,
    });

    // 记忆系统配置
    const memory = new BufferWindowMemory({
      memoryKey: "chat_history",
      chatHistory: messageHistory,
      k: 10, // 保留最近10轮对话
      returnMessages: true,
    });

    // 处理历史对话上下文，使问题独立
    const contextualizeQSystemPrompt = `
      Given a chat history and the latest user question
      which might reference context in the chat history,
      formulate a standalone question which can be understood
      without the chat history. Do NOT answer the question, just
      reformulate it if needed and otherwise return it as is.`;
    
    const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
      ["system", contextualizeQSystemPrompt],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    const historyAwareRetriever = await createHistoryAwareRetriever({
      llm,
      retriever: vectorStore.asRetriever({
        k: 10,
      }),
      rephrasePrompt: contextualizeQPrompt,
    });

    // 生成回答的 QA Chain
    const qaSystemPrompt = `
      作为专业助手，请基于以下上下文和最多10轮历史对话回答问题：
      =========
      上下文：{context}
      =========
      历史对话：{chat_history}
      =========
      当前问题：{input}
      
      要求：
      1. 用中文回答
      2. 简洁明了（不超过500字）
      3. 如果无法确定答案，请说明原因`;

    const qaPrompt = ChatPromptTemplate.fromMessages([
      ["system", qaSystemPrompt],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    const questionAnswerChain = await createStuffDocumentsChain({
      llm,
      prompt: qaPrompt,
    });

    // 组合检索器和 QA Chain，构建 RAG 流程
    const ragChain = await createRetrievalChain({
      retriever: historyAwareRetriever,
      combineDocsChain: questionAnswerChain,
    });

    // 执行问答
    const start = Date.now();
    const memoryVariables = await memory.loadMemoryVariables({});
    const chatHistory = memoryVariables.chat_history ?? [];
    console.log(`历史对话：${chatHistory.length} 条`);

    const response = await ragChain.invoke({
      chat_history: chatHistory,
      input: question,
    });
    console.log(`问答耗时：${Date.now() - start}ms`);

    // 显式保存对话记录
    await memory.saveContext(
      { input: question },
      { answer: response.answer }
    );    

    return NextResponse.json({
      success: true,
      data: {
        answer: response.answer || response.text,
        sessionId,
        sources: Array.isArray(response.sourceDocuments)
          ? [...new Set(response.sourceDocuments.map((doc: any) => doc.metadata?.source))]
          : [],
      }
    });
  } catch (error) {
    console.error('问答错误:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : '未知错误',
        code: 'CHAT_API_ERROR',
      }
    }, { status: 500 });
  }
}

// 获取聊天历史记录
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
    // 直接通过 RedisChatMessageHistory 获取历史
    const messageHistory = new RedisChatMessageHistory({
      sessionId,
      client: redisClient,
      config: { keyPrefix: "chat_history" }
    });

    const chatMessages = await messageHistory.getMessages();

    // 格式化历史消息
    const formattedHistory = chatMessages.map((msg) => ({
      type: msg._getType() === 'human' ? 'user' : 'bot',
      content: msg.content,
      timestamp: Date.now() // 可根据实际需要添加时间戳
    }));

    return NextResponse.json({
      success: true,
      data: formattedHistory,
    });
  } catch (error) {
    console.error('获取聊天记录错误:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'HISTORY_FETCH_FAILED',
        message: error instanceof Error ? error.message : '未知错误',
      }
    }, { status: 500 });
  }
}

