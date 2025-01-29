import { createClient, RedisClientType } from 'redis';

export class RedisManager {
  private static instance: RedisManager | null = null;
  private publisher: RedisClientType;

  private constructor() {
    const redisUrl = process.env.REDIS_PUB_SUB_URL;

    if (!redisUrl) {
      throw new Error('REDIS_PUB_SUB_URL environment variable is not defined.');
    }
    this.publisher = createClient({ url: redisUrl });
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

  public async getPublisher(): Promise<RedisClientType> {
    if (!this.publisher.isOpen) {
      await this.publisher.connect();
    }
    return this.publisher;
  }


  public async disconnect(): Promise<void> {
    if (this.publisher.isOpen) {
      await this.publisher.disconnect();
    }
  }
}
