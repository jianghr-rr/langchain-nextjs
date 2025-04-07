import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from "@langchain/openai";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { text, sessionId } = await request.json();
        
        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });

        const indexName = process.env.PINECONE_INDEX_NAME!;
        const namespace = sessionId; // 使用 sessionId 作为命名空间
        const index = pinecone.index(indexName);
        
        // 清空当前命名空间的数据
        // 获取当前索引的统计信息
        const stats = await index.describeIndexStats();

        const hasNamespace = stats.namespaces?.[namespace] !== undefined;
        const vectorCount = stats.namespaces?.[namespace]?.recordCount ?? 0;

        if (hasNamespace && vectorCount > 0) {
            console.log(`Deleting ${vectorCount} vectors in namespace: ${namespace}`);
            await index.namespace(namespace).deleteAll();
        } else {
            console.log(`Namespace ${namespace} is empty or does not exist, skip deleteAll.`);
        }


        const maxChars = 1000; // 设置每段的最大字符数
        const segments = [];

        for (let start = 0; start < text.length; start += maxChars) {
            const end = Math.min(start + maxChars, text.length);
            const segment = text.slice(start, end);
            segments.push(segment);
        }

        const embeddings = new OpenAIEmbeddings({
            configuration: {
                baseURL: process.env.OPENAI_API_BASE_URL,
            },
            apiKey: process.env.OPENAI_API_KEY!,
        });

        // 存储每个分段
        for (const segment of segments) {
            const vector = await embeddings.embedQuery(segment);
            await index.namespace(namespace).upsert([
                {
                    id: `pdf-id-${uuidv4()}`,
                    values: vector,
                    metadata: { text: segment },
                },
            ]);
        }

        return NextResponse.json({ message: 'Text successfully processed and stored' });
    } catch (error) {
        console.error('Error processing text:', error);
        return NextResponse.json({ error: 'Error processing text' }, { status: 500 });
    }
}
