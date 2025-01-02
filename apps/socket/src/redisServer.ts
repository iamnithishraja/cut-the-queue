import { createClient } from 'redis';
export class redis{
    private static instance:redis | null=null;
    private publisher: ReturnType<typeof createClient>
   private subscriber: ReturnType <typeof createClient>
    constructor(){
     this.publisher=createClient();
     this.subscriber=createClient();
    }
    public static getInstance():redis{
        if(!redis.instance){
            return new redis();
        }
        else{
            return redis.instance;
        }
    }
    
}