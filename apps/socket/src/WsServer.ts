import { WebSocketServer } from 'ws';
import { WSManager } from './socketManager';

export class WsServer {
  private static instance: WsServer| null = null;
  private wss: WebSocketServer | null = null;
  private wsManager: WSManager;
  
  private constructor() {
    this.wsManager = WSManager.getInstance();
  }

  public static getInstance(): WsServer {
    if (!WsServer.instance) {
      WsServer.instance = new WsServer();
    }
    return WsServer.instance;
  }

  // Prevent cloning
  public clone(): never {
    throw new Error('WsServer is a singleton and cannot be cloned');
  }

  public start() {
    const port = process.env.PORT || 3000;
    this.wss = new WebSocketServer({ port: Number(port) },()=>{
      console.log(`WsServer started on port ${port}`);
    });
    this.wss.on('connection', (socket) => {
      this.wsManager.handleConnection(socket);
    });

    return this.wss;
  }

  public getWsServer() {
    return this.wss;
  }

  public async disconnect(): Promise<void> {
    if (this.wss) {
      for (const client of this.wss.clients) {
        client.terminate();
      }
      this.wss.close();
      this.wss = null;
    }
  }
}
