import Redis from "ioredis";

declare global {
  var _redis: Redis | undefined;
}

export const redis =
  global._redis ??
  new Redis(process.env.REDIS_URL as string, {
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    retryStrategy(times) {
      if (times > 5) return undefined;
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

if (process.env.NODE_ENV !== "production") global._redis = redis;

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  return { success: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 };
}
