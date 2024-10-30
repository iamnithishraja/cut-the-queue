import { WebSocket } from "ws";

class socketManager {
  private static instance: socketManager;
  public connectedDevices: Record<string, WebSocket> = {};

  private constructor() {
    this.connectedDevices = {};
  }

  public static getInstance() {
    if (!socketManager.instance) {
      socketManager.instance = new socketManager();
    }
    return socketManager.instance;
  }
  public getAllSockets() {
    const sockets = Object.values(this.connectedDevices);
    return sockets;
  }

  public async addDevices(ws: WebSocket, id: string) {
    this.connectedDevices[id] = ws;
  }

  public removeDevice(ws: WebSocket) {
    for (const [key, value] of Object.entries(this.connectedDevices)) {
      if (value.CLOSED) {
        delete this.connectedDevices[key];
        break;
      }
    }
  }
}

export default socketManager;
