import { Redis } from 'ioredis';

export class RedisManager {
  private static instance: RedisManager | null = null;
  private subscriber: Redis;
  private redisClient: Redis;

  private constructor() {
    this.subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || 'default'
    });
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || 'default'
    });
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public clone(): never {
    throw new Error('RedisManager is a singleton and cannot be cloned');
  }

  public getSubscriber(): Redis {
    return this.subscriber; 
  }
  public getRedisClient(): Redis {
    return this.redisClient;
  }
  public async disconnect(): Promise<void> {
    this.subscriber.disconnect();
  }
}
