import { Redis } from 'ioredis';

export class RedisManager {
  private static instance: RedisManager | null = null;
  private publisher: Redis;

  private constructor() {
    this.publisher = new Redis({
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

  public getPublisher(): Redis {
    return this.publisher; 
  }
 
  public async disconnect(): Promise<void> {
    this.publisher.disconnect();
  }
}
