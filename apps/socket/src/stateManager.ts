import { CanteenState, Screen, RedisMessage, CustomWebSocket } from './types/index';
import WebSocket from "ws";
import { UserRole } from "@repo/db/client";
import { RedisManager } from './redisManager';
import { PartnerOrderUpdates } from './schemas';
import { z } from "zod";

export class StateManager {
  private static instance: StateManager | null = null;
  private users: Map<string, WebSocket>;
  private partners: Map<string, WebSocket>;
  private canteenStates: Map<string, CanteenState>;

  private constructor() {
    this.users = new Map();
    this.partners = new Map();
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

  public addUser(userId: string, socket: WebSocket, role: UserRole) {
    if (role === UserRole.USER) {
      this.users.set(userId, socket);
    } else {
      this.partners.set(userId, socket);
    }
  }

  public removeUser(userId: string, role: UserRole) {
    if (role === UserRole.USER) {
      this.users.delete(userId);
    } else {
      this.partners.delete(userId);
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
    try{
      const subscriber = RedisManager.getInstance().getSubscriber();
      subscriber.subscribe(process.env.REDIS_CHANNEL || "sockets");
      subscriber.on("message", (_,message) => {
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
          case 'REDIS_FETCH_TRIGGER':
            this.broadcastOrderUpdatesToPartners(parsedMessage.canteenId as string, parsedMessage);
        }
      });
    }
    catch(error){
      console.error({type: "initialize redis error", error});
    }
  }

  public broadcastMenuItems(canteenId: string, menuItems: any[]) {
    const state = this.canteenStates.get(canteenId);
    if (!state) return;

    const message = JSON.stringify({ type: 'UPDATE_MENU_ITEMS', data: menuItems });

    state.activeMenu.forEach(userId => {
      const userSocket = this.users.get(userId);
      const partnerSocket = this.partners.get(userId);
      if (userSocket) userSocket.send(message);
      if (partnerSocket) partnerSocket.send(message);
    });
  }

  public broadcastOrdersToAdmin(canteenId: string, orders: any[]) {
    const message = JSON.stringify({ type: 'ORDERS_UPDATE_ADMIN', data: orders });
    
    const state = this.canteenStates.get(canteenId);
    if (!state) return;

    state.activeOrder.forEach(partnerId => {
      const partnerSocket = this.partners.get(partnerId);
      if (partnerSocket) partnerSocket.send(message);
    });
}

  public broadcastOrdersToUser(userId: string) {
    const userSocket = this.users.get(userId);
    if (userSocket) {
      const message = JSON.stringify({ type: 'ORDERS_UPDATE_USER' });
      userSocket.send(message);
    }
  }

  public broadcastOrderUpdatesToPartners(canteenId: string, message: any){
    const state = this.canteenStates.get(canteenId);
    if (!state) return;

    state.activeMenu.forEach(userId => {
      const partnerSocket = this.partners.get(userId);
      if (partnerSocket) partnerSocket.send(JSON.stringify({ type: 'PARTNER_ORDER_STATUS_UPDATE', data: message}));
    });
  }
}