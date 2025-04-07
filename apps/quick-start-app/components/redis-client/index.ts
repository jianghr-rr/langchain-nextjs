import Redis from "ioredis";

class RedisSingleton {
  private static instance: Redis;
  
  private constructor() {}

  public static getInstance(): Redis {
    if (!RedisSingleton.instance) {
      RedisSingleton.instance = new Redis({
        host: "quality-cattle-46537.upstash.io",
        port: 6379,
        password: process.env.UPSTASH_REDIS_REST_TOKEN,
        tls: {},
        enableAutoPipelining: true, // 启用自动管道
        maxRetriesPerRequest: 1,    // 限制重试次数
        reconnectOnError: () => false // 禁用自动重连
      });

      // 添加连接状态监听
      RedisSingleton.instance
        .on("connect", () => console.log("Redis connected"))
        .on("ready", () => console.log("Redis ready"))
        .on("error", (e) => console.error("Redis error:", e))
        .on("close", () => console.log("Redis connection closed"));
    }
    return RedisSingleton.instance;
  }
}

export const redisClient = RedisSingleton.getInstance();