import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { WSManager } from './socketManager';
import clientRouter from './routes/orderRoutes';

export class HttpServer {
  private static instance: HttpServer | null = null;
  private app: express.Application;
  private wsManager: WSManager;
  private server: any;

  private constructor() {
    this.app = express();
    this.wsManager = WSManager.getInstance();
    this.setupMiddleware();
    this.setupRoutes();
  }

  public static getInstance(): HttpServer {
    if (!HttpServer.instance) {
      HttpServer.instance = new HttpServer();
    }
    return HttpServer.instance;
  }

  // Prevent cloning
  public clone(): never {
    throw new Error('HttpServer is a singleton and cannot be cloned');
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes() {
    this.app.use("/api/v1", clientRouter);
  }

  public start() {
    const port = process.env.PORT || 3000;
    this.server = this.app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    const wss = new WebSocketServer({ server: this.server });

    wss.on('connection', (socket) => {
      this.wsManager.handleConnection(socket);
    });

    return this.server;
  }

  public getServer() {
    return this.server;
  }

  public getApp() {
    return this.app;
  }
}
