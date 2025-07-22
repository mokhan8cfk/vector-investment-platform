import { Redis } from '@upstash/redis';

let redis: Redis;

try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    retry: {
      retries: 3,
      backoff: (retryCount) => Math.min(retryCount * 100, 5000),
    },
  });
  console.log('Redis connected successfully');
} catch (err) {
  console.error('Redis connection failed:', err);
  process.exit(1);
}

export { redis };
