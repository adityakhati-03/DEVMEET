import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.redisUrl, {
  // Prevent application from crashing if Redis is down initially (development fallback)
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      console.warn('[Redis] Max retries reached. Giving up.');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

export const redisSubscriber = redis.duplicate();

redis.on('connect', () => {
  // console.log('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  if (env.nodeEnv === 'development') {
    console.warn(`[Redis] Connection error: ${err.message}. Rate limiting might be disabled.`);
  } else {
    console.error(`[Redis] Connection error: ${err.message}`);
  }
});

// Explicitly connect to trigger the connection logic but without crashing the main process on failure
redis.connect().catch((err) => {
  if (env.nodeEnv !== 'test') {
    console.warn(`[Redis] Failed to initialize connection: ${err.message}`);
  }
});

redisSubscriber.connect().catch(() => {});
