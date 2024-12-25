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
  UNSUBSCRIBE = 'UNSUBSCRIBE'
}

export interface CanteenState {
  activeMenu: Set<string>;
  activeOrder: Set<string>;
}
