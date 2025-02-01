import { createClient, RedisClientType } from 'redis';

export class RedisManager {
  private static instance: RedisManager | null = null;
  private subscriber: RedisClientType;

  private constructor() {
    const redisUrl = process.env.REDIS_PUB_SUB_URL;

    if (!redisUrl) {
      throw new Error('REDIS_PUB_SUB_URL environment variable is not defined.');
    }

    this.subscriber = createClient({ url: redisUrl, password: process.env.REDIS_PASSWORD });
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

  public async getSubscriber(): Promise<RedisClientType> {
    if (!this.subscriber.isOpen) {
      await this.subscriber.connect();
    }
    return this.subscriber;
  }

  public async disconnect(): Promise<void> {
    if (this.subscriber.isOpen) {
      await this.subscriber.disconnect();
    }
  }
}
