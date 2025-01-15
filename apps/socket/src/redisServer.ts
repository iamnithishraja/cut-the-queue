import { createClient } from "redis";
import { StateManager } from "./stateManager";

export class redis {
  private static instance: redis | null = null;
  publisher: ReturnType<typeof createClient>;
  private subscriber: ReturnType<typeof createClient>;
  constructor() {
    this.publisher = createClient({ url: process.env.REDIS_SERVER_URL });
    this.subscriber = createClient({ url: process.env.REDIS_SERVER_URL });
    this.connectClients();
  }
   static getInstance(): redis {
    if (!redis.instance) {
      return new redis();
    } else {
      return redis.instance;
    }
  } 
  async connectClients(){
    await this.publisher.connect();
    await this.subscriber.connect();
    this.subscriber.subscribe('chat',(message)=>{
     //do computation here
     console.log(message);
   });
  }
  publish(message){
    this.publisher.publish('chat',JSON.stringify(message))
  }
}
