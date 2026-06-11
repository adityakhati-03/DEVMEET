import { redis } from '../config/redis';
import { env } from '../config/env';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

/**
 * Checks the rate limit using Redis.
 * If rate limiting is disabled via env or Redis is down, it fails open (allows request).
 */
export async function rateLimit({ key, limit, windowSeconds }: RateLimitOptions): Promise<RateLimitResult> {
  const defaultResult: RateLimitResult = {
    allowed: true,
    limit,
    remaining: limit,
    resetAt: Date.now() + windowSeconds * 1000,
  };

  if (!env.rateLimitEnabled) {
    return defaultResult;
  }

  if (redis.status !== 'ready') {
    if (env.nodeEnv === 'development') {
      console.warn(`[RateLimit] Redis not ready. Bypassing limit for key: ${key}`);
    }
    return defaultResult;
  }

  try {
    const multi = redis.multi();
    multi.incr(key);
    multi.ttl(key);
    
    const results = await multi.exec();
    if (!results) {
      throw new Error('Redis transaction failed');
    }

    const currentCount = results[0][1] as number;
    let ttl = results[1][1] as number;

    // If TTL is -1, it means the key doesn't have an expiration set. Set it now.
    if (ttl === -1) {
      await redis.expire(key, windowSeconds);
      ttl = windowSeconds;
    }

    const remaining = Math.max(0, limit - currentCount);
    const resetAt = Date.now() + ttl * 1000;

    return {
      allowed: currentCount <= limit,
      limit,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error(`[RateLimit] Error checking limit for key ${key}:`, error);
    // Fail open in case of Redis errors to prevent taking down the entire service
    return defaultResult;
  }
}
