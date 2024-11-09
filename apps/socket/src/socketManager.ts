import { WebSocket } from "ws";
import { UserType } from "@repo/db/client";
import { Screen } from "./types/screen";

const consumerSockets: Map<string, WebSocket> = new Map();
const adminSockets: Map<string, WebSocket> = new Map();
const activeMenuUsers: Set<string> = new Set();
const activeOrderAdmins: Set<string> = new Set();

export function getConsumerSockets() {
  return Array.from(consumerSockets.values());
}

export function getAdminSockets() {
  return Array.from(adminSockets.values());
}

export function addDevice(ws: WebSocket, user: UserType) {
  if (user.role === 'ADMIN') {
    adminSockets.set(user.id, ws);
  } else {
    consumerSockets.set(user.id, ws);
  }
}

export function removeDevice(userId: string, role: string) {
  if (role === 'ADMIN') {
    adminSockets.delete(userId);
    activeOrderAdmins.delete(userId);
  } else {
    consumerSockets.delete(userId);
    activeMenuUsers.delete(userId);
  }
}

export function setScreenActive(userId: string, screen: Screen, active: boolean) {
  if (screen === 'MENU') {
    if (active) activeMenuUsers.add(userId);
    else activeMenuUsers.delete(userId);
  } else {
    if (active) activeOrderAdmins.add(userId);
    else activeOrderAdmins.delete(userId);
  }
}

export function getActiveMenuSockets(): WebSocket[] {
  return Array.from(activeMenuUsers)
    .map(id => consumerSockets.get(id))
    .filter((socket): socket is WebSocket => socket !== undefined);
}

export function getActiveOrderSockets(): WebSocket[] {
  return Array.from(activeOrderAdmins)
    .map(id => adminSockets.get(id))
    .filter((socket): socket is WebSocket => socket !== undefined);
}

export default {
  getConsumerSockets,
  getAdminSockets,
  addDevice,
  removeDevice,
  setScreenActive,
  getActiveMenuSockets,
  getActiveOrderSockets
};
