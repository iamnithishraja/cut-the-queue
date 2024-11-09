import { z } from 'zod';
import { WebSocket } from 'ws';

export enum Screen {
  MENU = 'MENU',
  ORDERS = 'ORDERS'
}

export type CanteenSockets = {
  consumers: Map<string, WebSocket>;
  admins: Map<string, WebSocket>;
  activeMenu: Set<string>;
  activeOrders: Set<string>;
};

export type SocketMessage = {
  type: 'init' | 'subscribe' | 'unsubscribe';
  token?: string;
  id?: string;
  screen?: Screen;
};