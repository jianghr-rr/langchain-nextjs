import { redisClient } from '~/components/redis-client';

export const ensureRedisConnection = async () => {
  if (redisClient.status !== "ready") {
    await redisClient.connect();
  }
};
