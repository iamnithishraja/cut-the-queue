import { UserType } from "@repo/db/client";
import { WebSocket } from "ws";
import { CanteenSockets, Screen } from "./types/socketTypes";

export const canteens: Map<string, CanteenSockets> = new Map();

function getOrCreateCanteen(canteenId: string): CanteenSockets {
	if (!canteens.has(canteenId)) {
		canteens.set(canteenId, {
			consumers: new Map(),
			admins: new Map(),
			activeMenu: new Set(),
			activeOrders: new Set(),
		});
	}
	return canteens.get(canteenId)!;
}

export function addDevice(ws: WebSocket, user: UserType, canteenId: string) {
	const canteen = getOrCreateCanteen(canteenId);
	if (user.role === "ADMIN") {
		canteen.admins.set(user.id, ws);
	} else {
		canteen.consumers.set(user.id, ws);
	}
}

export function removeDevice(userId: string, role: string, canteenId: string) {
	const canteen = canteens.get(canteenId);
	if (!canteen) return;

	if (role === "ADMIN") {
		canteen.admins.delete(userId);
		canteen.activeOrders.delete(userId);
	} else {
		canteen.consumers.delete(userId);
		canteen.activeMenu.delete(userId);
	}
}

export function setScreenActive(
	userId: string,
	screen: Screen,
	active: boolean,
	canteenId: string
) {
	const canteen = canteens.get(canteenId);
	if (!canteen) return;

	const targetSet =
		screen === Screen.MENU ? canteen.activeMenu : canteen.activeOrders;
	if (active) {
		targetSet.add(userId);
	} else {
		targetSet.delete(userId);
	}
}

export function getActiveMenuSockets(canteenId: string): WebSocket[] {
	const canteen = canteens.get(canteenId);
	if (!canteen) return [];

	return Array.from(canteen.activeMenu)
		.map((id) => canteen.consumers.get(id))
		.filter((socket): socket is WebSocket => socket !== undefined);
}

export function getActiveOrderSockets(canteenId: string): WebSocket[] {
	const canteen = canteens.get(canteenId);
	if (!canteen) return [];

	return Array.from(canteen.activeOrders)
		.map((id) => canteen.admins.get(id))
		.filter((socket): socket is WebSocket => socket !== undefined);
}

export default {
	addDevice,
	removeDevice,
	setScreenActive,
	getActiveMenuSockets,
	getActiveOrderSockets,
};
