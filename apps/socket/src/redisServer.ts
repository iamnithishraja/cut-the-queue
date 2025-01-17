import { createClient } from "redis";
import { StateManager } from "./stateManager";

export class RedisServer {
  private static instance: RedisServer | null = null;
  publisher: ReturnType<typeof createClient>;
  private subscriber: ReturnType<typeof createClient>;
  constructor() {
    this.publisher = createClient({ url: process.env.REDIS_SERVER_URL });
    this.subscriber = createClient({ url: process.env.REDIS_SERVER_URL });
    this.connectClients();
  }
   static getInstance(): RedisServer {
    if (!RedisServer.instance) {
      return new RedisServer();
    } else {
      return RedisServer.instance;
    }
  } 
  async connectClients(){
    await this.publisher.connect();
    await this.subscriber.connect();
    this.subscriber.subscribe('chat', (message) => {
      
      const finalMessage = JSON.parse(message);

      switch (finalMessage.type) {
        case 'all':
          StateManager.getInstance().broadcastMenuItems(
            finalMessage.canteenId,
            finalMessage.updatedMenuItems
          );
          break;
    
        case 'user':
          StateManager.getInstance().broadcastOrdersToUser(finalMessage.userId);
          break;
    
        case 'canteen':
          StateManager.getInstance().broadcastOrdersToAdmin(
            finalMessage.canteenId,
            finalMessage.orders
          );
          break;

        default:
          console.error("Invalid message type");
          break;
      }
    
      console.log(message);
    });
  }
  publish(message){
    this.publisher.publish('chat',message);

  }
}
