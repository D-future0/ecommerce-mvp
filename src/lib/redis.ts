import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
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

/**
 * Fixed-window rate limiter.
 * Returns { success, remaining, resetAt } — call at the top of any route
 * you want to protect (login, checkout, review submission, search, etc).
 *
 * Example: await rateLimit(`login:${ip}`, 5, 60) -> 5 requests per 60s
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  try {
    const redisKey = `ratelimit:${key}`;
    const current = await redis.incr(redisKey);

    if (current === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    const ttl = await redis.ttl(redisKey);
    const resetAt = Date.now() + Math.max(ttl, 0) * 1000;

    return {
      success: current <= limit,
      remaining: Math.max(limit - current, 0),
      resetAt,
    };
  } catch {
    // Fail open — allow the request if Redis is unavailable.
    return { success: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 };
  }
}
