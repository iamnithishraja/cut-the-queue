import {
	canteens,
	getActiveMenuSockets,
	getActiveOrderSockets,
} from "../socketManager";

export const broadcastMenuUpdate = (payload: any, canteenId: string): void => {
	const data = JSON.stringify({ type: "UPDATE_MENU_ITEMS", payload });
	const activeSockets = getActiveMenuSockets(canteenId);
	activeSockets.forEach((socket) => {
		socket.send(data);
	});
};

export const sendUpdatedOrderToUser = (payload: any, canteenId: string): void => {
	const data = JSON.stringify({ type: "ORDER_UPDATE", payload });

	const canteen = canteens.get(canteenId);
	const userSocket = canteen?.consumers.get(payload.userId);
	if (userSocket) {
		userSocket.send(data);
	}
};

export const broadcastOrderUpdate = (payload: any, canteenId: string): void => {
	const data = JSON.stringify({ type: "ORDER_UPDATE", payload });

	const activeSockets = getActiveOrderSockets(canteenId);
	activeSockets.forEach((socket) => {
		socket.send(data);
	});
};
