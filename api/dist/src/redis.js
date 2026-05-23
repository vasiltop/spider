import { Redis } from 'ioredis';
const redis_url = process.env.REDIS_URL || 'redis://:root@localhost:6379';
export const redis = new Redis(redis_url);
