import { redisClient } from '~/components/redis-client';
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { isEmpty } from 'lodash';

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
    const pipeline = this.client
      .multi()
      .hset(key, {
        ...data,
        messages: JSON.stringify(
          data.messages.map((m) => ({
            ...m.toDict(),
            // 添加唯一标识
            uid: `${sessionId}_${checkpointId}_${m.id ?? (m instanceof ToolMessage ? m.tool_call_id : '')}`,
          }))
        ),
      })
      .expire(key, this.ttl)
      .lpush(this.genKey(sessionId), checkpointId)
      // 保持最多5个检查点版本
      .ltrim(this.genKey(sessionId), 0, 4);

    await pipeline.exec();

    return checkpointId;
  }

  async get(sessionId: string, checkpointId: string) {
    const data = await this.client.hgetall(
      this.genKey(sessionId, checkpointId)
    );
    if (!data || isEmpty(data)) return null;

    return {
      ...data,
      messages: JSON.parse(data.messages ?? '[]')
        .map((m: any) => {
          // 根据唯一标识过滤重复
          if (m.uid && this.seenUids.has(m.uid)) {
            return null;
          }
          this.seenUids.add(m.uid);

          switch (m.type) {
            case 'human':
              return new HumanMessage(m);
            case 'ai':
              return new AIMessage(m);
            case 'tool':
              return new ToolMessage(m);
            default:
              throw new Error('未知消息类型');
          }
        })
        .filter(Boolean),
      checkpointId,
    } as CheckpointData;
  }

  async getLatest(sessionId: string) {
    const [checkpointId] = await this.client.lrange(
      this.genKey(sessionId),
      0,
      0
    );
    return checkpointId ? this.get(sessionId, checkpointId) : null;
  }

  async list(sessionId: string) {
    const messages = await this.client.hget(sessionId, 'messages');
    try {
      const parsedMessages = messages ? JSON.parse(messages) : [];
      return parsedMessages;
    } catch (error) {
      console.error('Error parsing messages:', error);
      return [];
    }
  }
}

export default RedisCheckpointer;
