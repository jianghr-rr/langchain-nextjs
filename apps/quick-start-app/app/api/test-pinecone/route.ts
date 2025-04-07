import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 初始化 Pinecone 客户端
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    // 获取索引
    const indexes = await pinecone.listIndexes();
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    const stats = await index.describeIndexStats();
    console.log("Index stats:", stats);

    return NextResponse.json({ success: true, indexes }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
