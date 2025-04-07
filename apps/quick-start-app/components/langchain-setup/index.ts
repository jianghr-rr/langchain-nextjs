// apps/quick-start-app/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// 创建 Redis 客户端
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 定义聊天历史的 Redis 键
const CHAT_HISTORY_KEY = 'chat-history';

// 处理 POST 请求以存储聊天消息
export async function POST(req: Request) {
  try {
    const { message, sender }: { message: string; sender: string } = await req.json();

    if (!message || !sender) {
      return NextResponse.json({ error: 'Message and sender are required.' }, { status: 400 });
    }

    // 获取当前的聊天历史
    const chatHistory = await redis.lrange(CHAT_HISTORY_KEY, 0, -1);
    const newMessage = `${sender}: ${message}`;
    // 将新消息添加到聊天历史中，最多保持 100 条记录
    await redis.lpush(CHAT_HISTORY_KEY, newMessage);
    await redis.ltrim(CHAT_HISTORY_KEY, 0, 99); // 保证 Redis 中最多只存储 100 条记录

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// 处理 GET 请求以获取聊天历史
export async function GET() {
  try {
    // 获取聊天历史
    const chatHistory = await redis.lrange(CHAT_HISTORY_KEY, 0, -1);

    return NextResponse.json({ success: true, chatHistory });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
