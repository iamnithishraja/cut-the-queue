import { Redis } from 'ioredis';

export class RedisManager {
  private static instance: RedisManager | null = null;
  private subscriber: Redis;
  private publisher: Redis; 

  private constructor() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'redis',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      }
    };
  
    this.subscriber = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);
  
    // Enhanced error handlers with more details
    this.subscriber.on('error', (err) => {
      console.error('Redis Subscriber Error:', err);
    });
  
    this.publisher.on('error', (err) => {
      console.error('Redis Publisher Error:', err);
    });

    this.subscriber.on('connect', () => {
      console.log('Redis Subscriber connected');
    });

    this.publisher.on('connect', () => {
      console.log('Redis Publisher connected');
    });
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public getSubscriber(): Redis {
    return this.subscriber;
  }

  public getPublisher(): Redis {
    return this.publisher;
  }

  public async disconnect(): Promise<void> {
    await this.subscriber.disconnect();
    await this.publisher.disconnect();
  }
}