import { getActiveMenuSockets, getActiveOrderSockets } from "../socketManager";

export const broadcastMenuUpdate = (payload: any): void => {
  const data = JSON.stringify({ type: "UPDATE_MENU_ITEMS", payload });
  const activeSockets = getActiveMenuSockets();
  activeSockets.forEach((socket) => {
    socket.send(data);
  });
};

export const broadcastOrderUpdate = (payload: any): void => {
  const data = JSON.stringify({ type: "ORDER_UPDATE", payload });
  const activeSockets = getActiveOrderSockets();
  activeSockets.forEach((socket) => {
    socket.send(data);
  });
};
