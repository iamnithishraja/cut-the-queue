import { UserRole } from '@repo/db/client';
import { WebSocket } from 'ws';

export interface CustomWebSocket extends WebSocket {
  userId?: string;
  userRole?: UserRole;
}

export enum Screen {
  MENU = 'MENU',
  ORDERS = 'ORDERS'
}

export enum MessageType {
  INIT = 'INIT',
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  PING = 'PING'
}

export interface CanteenState {
  activeMenu: Set<string>;
  activeOrder: Set<string>;
}

export enum RedisMessageType {
  UPDATE_MENU_ITEMS = 'UPDATE_MENU_ITEMS',
  ORDERS_UPDATE_USER = 'ORDERS_UPDATE_USER',
  ORDERS_UPDATE_ADMIN = 'ORDERS_UPDATE_ADMIN',
  
}
export interface RedisMessage {
  type: RedisMessageType;
  userId?: string;
  canteenId?: string;
  menuItems?: any[];
  orders?: any[];
}