import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    // 1️⃣ 存储数据
    await redis.set('test-key', 'Hello, Upstash Redis!');

    // 2️⃣ 读取数据
    const value = await redis.get('test-key');

    return NextResponse.json({ success: true, value }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// import { NextResponse } from "next/server";
// import { redis } from "@/libs/redis";

// const SESSION_EXPIRY = 60 * 60 * 24; // 24小时过期

// export async function POST(req: Request) {
//   try {
//     const { sessionId, userMessage } = await req.json();

//     if (!sessionId) {
//       return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
//     }

//     // 1️⃣ 获取历史对话
//     const history = await redis.lrange(`chat:${sessionId}`, 0, -1);

//     // 2️⃣ 处理 AI 响应 (假设用 OpenAI API)
//     const botResponse = `AI Response for: ${userMessage}`; // 这里替换为你的 AI 处理逻辑

//     // 3️⃣ 记录对话历史
//     await redis.rpush(`chat:${sessionId}`, JSON.stringify({ user: userMessage, bot: botResponse }));
//     await redis.expire(`chat:${sessionId}`, SESSION_EXPIRY); // 设置过期时间

//     return NextResponse.json({ success: true, history: [...history, { user: userMessage, bot: botResponse }] });
//   } catch (error) {
//     return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
//   }
// }
