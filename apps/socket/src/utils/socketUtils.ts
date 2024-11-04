import { getAllSockets } from "../socketManager";

export const broadcastToConnectedDevices = (
  type: string,
  payload: any
): void => {
  const data = JSON.stringify({ type, payload });
  const connectedDevices = getAllSockets();
  connectedDevices.forEach((device) => {
    device.send(data);
  });
};
