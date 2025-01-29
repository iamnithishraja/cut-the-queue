import { createClient, RedisClientType } from 'redis';

export class RedisManager {
  private static instance: RedisManager | null = null;
  private publisher: RedisClientType;
  private subscriber: RedisClientType;

  private constructor() {
    const redisUrl = process.env.REDIS_PUB_SUB_URL;

    if (!redisUrl) {
      throw new Error('REDIS_PUB_SUB_URL environment variable is not defined.');
    }

    this.publisher = createClient({ url: redisUrl });
    this.subscriber = this.publisher.duplicate();
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

  public async getSubscriber(): Promise<RedisClientType> {
    if (!this.subscriber.isOpen) {
      await this.subscriber.connect();
    }
    return this.subscriber;
  }

  public async disconnect(): Promise<void> {
    if (this.publisher.isOpen) {
      await this.publisher.disconnect();
    }
    if (this.subscriber.isOpen) {
      await this.subscriber.disconnect();
    }
  }
}
