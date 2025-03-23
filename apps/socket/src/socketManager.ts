import { MessageSchema, InitMessageSchema, SubscribeMessageSchema, UnsubscribeMessageSchema, PartnerOrderUpdates } from "./schemas";
import { StateManager } from "./stateManager";
import { z } from 'zod';
import { CustomWebSocket, MessageType } from "./types";
import { verifyAndGetUser } from "./utils";
import { RedisManager } from "./redisManager";

export class WSManager {
  private static instance: WSManager | null = null;
  private stateManager: StateManager;

  private constructor() {
    this.stateManager = StateManager.getInstance();
  }

  public static getInstance(): WSManager {
    if (!WSManager.instance) {
      WSManager.instance = new WSManager();
    }
    return WSManager.instance;
  }

  // Prevent cloning
  public clone(): never {
    throw new Error('WSManager is a singleton and cannot be cloned');
  }

  public async handleConnection(socket: CustomWebSocket) {
    socket.on('message', async (message: string) => {
      try {
        const parsedMessage = JSON.parse(message);
        const validatedMessage = MessageSchema.parse(parsedMessage);

        await this.handleMessage(socket, validatedMessage);
      } catch (error) {
        socket.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message format' }));
      }
    });
  }

  private async handleMessage(socket: CustomWebSocket, message: z.infer<typeof MessageSchema>) {
    switch (message.type) {
      case MessageType.INIT:
        await this.handleInit(socket, message);
        break;
      case MessageType.SUBSCRIBE:
        await this.handleSubscribe(socket, message);
        break;
      case MessageType.UNSUBSCRIBE:
        await this.handleUnsubscribe(socket, message);
        break;
      case MessageType.PARTNER_ORDER_STATUS_UPDATE:
        await this.handlePartnerOrderStatusUpdate(socket, message);
        break;
      case MessageType.PING:
        socket.send(JSON.stringify({ type: 'PONG' }))
        break;
    }
  }

  private async handleInit(socket: CustomWebSocket, message: z.infer<typeof InitMessageSchema>) {
    try {
      console.log('Init message', message);
      
      const user = await verifyAndGetUser(message.token);

      this.stateManager.addUser(user.id, socket, user.role);
      socket.userId = user.id;
      socket.userRole = user.role;

      socket.send(JSON.stringify({ type: 'INIT_SUCCESS' }));
      
      await this.deliverPendingMessages(user.id, socket);
      
    } catch (error) {
      // @ts-ignore
      socket.send(JSON.stringify({ type: 'ERROR', message: error.message}));
    }
  }

  private async deliverPendingMessages(userId: string, socket: CustomWebSocket) {
    const redis = RedisManager.getInstance().getPublisher();
    const pendingKey = `pending:${userId}`;
    
    const messages = await redis.lrange(pendingKey, 0, -1);
    
    if (messages.length > 0) {
      console.log(`Delivering ${messages.length} pending messages to user ${userId}`);
      
      for (const messageStr of messages) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(messageStr);
        }
      }
      
      await redis.del(pendingKey);
    }
  }

  public async broadcastOrdersToUser(userId: string) {
    const userSocket = this.stateManager.getUserSocket(userId);
    const message = { type: 'ORDERS_UPDATE_USER' };
    const messageStr = JSON.stringify(message);
    
    if (userSocket && userSocket.readyState === WebSocket.OPEN) {
      userSocket.send(messageStr);
    } else {
      // Store message in Redis with expiration
      const redis = RedisManager.getInstance().getPublisher();
      const pendingKey = `pending:${userId}`;
      
      // Add message to list
      await redis.rpush(pendingKey, messageStr);
      
      // Set expiration (2 hours = 7200 seconds)
      await redis.expire(pendingKey, 7200);
      
      console.log(`User ${userId} offline, message queued in Redis for later delivery`);
    }
  }

  private async handleSubscribe(socket: CustomWebSocket, message: z.infer<typeof SubscribeMessageSchema>) {
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'ERROR', message: 'Not initialized' }));
      return;
    }

    this.stateManager.addSubscription(message.canteenId, message.screen, socket.userId);
    socket.send(JSON.stringify({ type: 'SUBSCRIBE_SUCCESS' }));
    if(socket.userRole === 'PARTNER'){
      const redis = RedisManager.getInstance().getPublisher();
      const redis_data = await redis.hgetall(message.canteenId);
      if(Object.keys(redis_data).length){
        socket.send(JSON.stringify({ type: 'PARTNER_ORDER_STATUS_UPDATE', data: redis_data}))
      }
    }
  }

  private async handleUnsubscribe(socket: CustomWebSocket, message: z.infer<typeof UnsubscribeMessageSchema>) {
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'ERROR', message: 'Not initialized' }));
      return;
    }

    this.stateManager.removeSubscription(message.canteenId, message.screen, socket.userId);
    socket.send(JSON.stringify({ type: 'UNSUBSCRIBE_SUCCESS' }));
  }

  private async handlePartnerOrderStatusUpdate(socket: CustomWebSocket, message: z.infer<typeof PartnerOrderUpdates>) {
    try{
      const redis = RedisManager.getInstance().getPublisher();
      if(!message.canteenId){
        socket.send(JSON.stringify({ type: 'ERROR', message: 'CanteenId not provided'}));
      }
      await redis.hmset(message.canteenId, message);
      await redis.publish(process.env.REDIS_CHANNEL || "sockets",JSON.stringify({type: 'REDIS_FETCH_TRIGGER', canteenId: message.canteenId}));
    }catch(error){
      console.error({type:"handlePartnerOrderStatusUpdate", error});
    }
  }
   
}