import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";

let pineconeStore: PineconeStore | null = null;

export const initPinecone = async () => {
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
      }
    );
  }
  return pineconeStore;
};