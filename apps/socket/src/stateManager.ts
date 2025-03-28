import { CanteenState, Screen, RedisMessage, CustomWebSocket } from './types/index';
import WebSocket from "ws";
import { UserRole } from "@repo/db/client";
import { RedisManager } from './redisManager';
import { PartnerOrderUpdates } from './schemas';
import { z } from "zod";

export class StateManager {
  private static instance: StateManager | null = null;
  private users: Map<string, WebSocket[]>;
  private canteenPartners: Map<string, string[]>;
  private canteenStates: Map<string, CanteenState>;

  private constructor() {
    this.users = new Map();
    this.canteenPartners = new Map();
    this.canteenStates = new Map();
    this.initializeRedis();
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  // Prevent cloning
  public clone(): never {
    throw new Error('StateManager is a singleton and cannot be cloned');
  }

  public addUser(userId: string, socket: WebSocket, role: UserRole, canteenId?: string) {
    // Initialize user's socket array if doesn't exist
    if (!this.users.has(userId)) {
      this.users.set(userId, []);
    }

    const userSockets = this.users.get(userId)!;
    userSockets.push(socket);

    // If user is a partner, add them to canteenPartners
    if (role === UserRole.PARTNER && canteenId) {
      if (!this.canteenPartners.has(canteenId)) {
        this.canteenPartners.set(canteenId, []);
      }
      const partners = this.canteenPartners.get(canteenId)!;
      if (!partners.includes(userId)) {
        partners.push(userId);
      }
    }
  }

  public removeUser(userId: string, socket: WebSocket, role: UserRole, canteenId?: string) {
    const userSockets = this.users.get(userId);
    if (userSockets) {
      const index = userSockets.indexOf(socket);
      if (index > -1) {
        userSockets.splice(index, 1);
      }
      // Remove user entry if no sockets left
      if (userSockets.length === 0) {
        this.users.delete(userId);

        // Remove from canteenPartners if partner
        if (role === UserRole.PARTNER && canteenId) {
          const partners = this.canteenPartners.get(canteenId);
          if (partners) {
            const partnerIndex = partners.indexOf(userId);
            if (partnerIndex > -1) {
              partners.splice(partnerIndex, 1);
            }
            // Remove canteen entry if no partners left
            if (partners.length === 0) {
              this.canteenPartners.delete(canteenId);
            }
          }
        }
      }
    }
  }

  public addSubscription(canteenId: string, screen: Screen, userId: string) {
    let state = this.canteenStates.get(canteenId);
    if (!state) {
      state = { activeMenu: new Set(), activeOrder: new Set() };
      this.canteenStates.set(canteenId, state);
    }

    if (screen === Screen.MENU) {
      state.activeMenu.add(userId);
    } else {
      state.activeOrder.add(userId);
    }
  }

  public removeSubscription(canteenId: string, screen: Screen, userId: string) {
    const state = this.canteenStates.get(canteenId);
    if (!state) return;

    if (screen === Screen.MENU) {
      state.activeMenu.delete(userId);
    } else {
      state.activeOrder.delete(userId);
    }
  }

  public async initializeRedis() {
    try {
      const subscriber = RedisManager.getInstance().getSubscriber();
      subscriber.subscribe(process.env.REDIS_CHANNEL || "sockets");
      subscriber.on("message", (_, message) => {
        const parsedMessage = JSON.parse(message) as RedisMessage;
        switch (parsedMessage.type) {
          case 'UPDATE_MENU_ITEMS':
            this.broadcastMenuItems(parsedMessage.canteenId as string, parsedMessage.menuItems as any[]);
            break;
          case 'ORDERS_UPDATE_ADMIN':
            this.broadcastOrdersToAdmin(parsedMessage.canteenId as string, parsedMessage.orders as any[]);
            break;
          case 'ORDERS_UPDATE_USER':
            this.broadcastOrdersToUser(parsedMessage.userId as string);
            break;
          case 'UPDATE_CANTEEN_STATUS':
            this.broadcastCanteenStatus(parsedMessage.canteenId as string, parsedMessage.isOpen as boolean);
            break;
          case 'REDIS_FETCH_TRIGGER':
            this.broadcastOrderUpdatesToPartners(parsedMessage.canteenId as string, parsedMessage);
        }
      });
    }
    catch (error) {
      console.error({ type: "initialize redis error", error });
    }
  }

  public broadcastCanteenStatus(canteenId: string, isOpen: boolean) {
    const partnerSockets = this.getCanteenPartnerSockets(canteenId);
    const userSockets = this.users.values();
    const message = JSON.stringify({ type: 'UPDATE_CANTEEN_STATUS', data: { canteenId, isOpen } });
    for (const socket of partnerSockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
    for (const sockets of userSockets) {
      for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(message);
        }
      }
    }

  }
  public broadcastMenuItems(canteenId: string, menuItems: any[]) {
    const state = this.canteenStates.get(canteenId);
    if (!state) return;

    const message = JSON.stringify({ type: 'UPDATE_MENU_ITEMS', data: menuItems });

    state.activeMenu.forEach(userId => {
      const userSockets = this.users.get(userId);
      if (userSockets) {
        userSockets.forEach(socket => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
          }
        });
      }
    });
  }

  public broadcastOrdersToAdmin(canteenId: string, orders: any[]) {
    const message = JSON.stringify({ type: 'ORDERS_UPDATE_ADMIN', data: orders });

    // Get all partners for this canteen
    const partnerIds = this.canteenPartners.get(canteenId);
    if (!partnerIds) return;

    // Send to all sockets of all partners
    partnerIds.forEach(partnerId => {
      const partnerSockets = this.users.get(partnerId);
      if (partnerSockets) {
        partnerSockets.forEach(socket => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
          }
        });
      }
    });
  }

  public broadcastOrdersToUser(userId: string) {
    const userSockets = this.users.get(userId);
    if (userSockets) {
      const message = JSON.stringify({ type: 'ORDERS_UPDATE_USER' });
      userSockets.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(message);
        }
      });
    }
  }

  public broadcastOrderUpdatesToPartners(canteenId: string, message: any) {
    const state = this.canteenStates.get(canteenId);
    if (!state) return;

    state.activeMenu.forEach(userId => {
      const partnerSockets = this.users.get(userId);
      if (partnerSockets) {
        partnerSockets.forEach(socket => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'PARTNER_ORDER_STATUS_UPDATE', data: message }));
          }
        });
      }
    });
  }
  public getUserSocket(userId: string): WebSocket[] | undefined {
    return this.users.get(userId);
  }

  public getCanteenPartnerSockets(canteenId: string): WebSocket[] {
    const partnerIds = this.canteenPartners.get(canteenId);
    if (!partnerIds) return [];

    // Collect all sockets for all partners of this canteen
    const sockets: WebSocket[] = [];
    partnerIds.forEach(partnerId => {
      const partnerSockets = this.users.get(partnerId);
      if (partnerSockets) {
        sockets.push(...partnerSockets);
      }
    });
    return sockets;
  }

  // Helper method to broadcast to all partner sockets of a canteen
  private broadcastToCanteenPartners(canteenId: string, message: string) {
    const partnerSockets = this.getCanteenPartnerSockets(canteenId);
    partnerSockets.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    });
  }
}