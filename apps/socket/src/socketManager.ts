import { WebSocket } from "ws";

const connectedDevices: Record<string, WebSocket> = {};

export function getAllSockets() {
  return Object.values(connectedDevices);
}

export function addDevices(ws: WebSocket, id: string) {
  connectedDevices[id] = ws;
}

export function removeDevice(ws: WebSocket) {
  for (const [key, value] of Object.entries(connectedDevices)) {
    if (value.CLOSED) {
      delete connectedDevices[key];
      break;
    }
  }
}

export default {
  getAllSockets,
  addDevices,
  removeDevice
};
