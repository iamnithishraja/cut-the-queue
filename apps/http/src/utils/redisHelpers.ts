import {
	BROADCAST_QUANTITY,
	DISHES_NOT_FOUND,
	SERVER_ERROR,
} from "@repo/constants";
import prisma from "@repo/db/client";
import { RedisManager } from "../publisher/redis";

const broadcastMenuItems = async (canteenId: string): Promise<any> => {
	try {
		const updatedMenuItems = await prisma.menuItem.findMany({
			where: { canteenId },
		});

		if (!updatedMenuItems || updatedMenuItems.length === 0) {
			throw new Error(DISHES_NOT_FOUND);
		}
		const redisMessage = {
			type: 'UPDATE_MENU_ITEMS',
			canteenId: canteenId,
			menuItems: updatedMenuItems,
		};
		const publisher = RedisManager.getInstance().getPublisher();
		await publisher.publish(process.env.REDIS_CHANNEL || "sockets", JSON.stringify(redisMessage));
        console.log({ message: BROADCAST_QUANTITY });
	} catch (error) {
		console.error({ message: SERVER_ERROR, error });
	}
};


const updateUserOrders = async (userId: string): Promise<any> => {
	try {
		const redisMessage = {
			type: 'ORDERS_UPDATE_USER',
			userId: userId,
		};
		const publisher = RedisManager.getInstance().getPublisher();
		await publisher.publish(process.env.REDIS_CHANNEL || "sockets", JSON.stringify(redisMessage));
		console.log({ message: "Notified User Successfully" });
	} catch (error) {
		console.error({ message: SERVER_ERROR, error });
	}
};

const updateCanteenOrders = async (canteenId: string): Promise<any> => {
	try {
		const orders = await prisma.order.findMany({
			where: {
				canteenId: canteenId,
				orderStatus: "PROCESSING",
				isPaid: true
			},
			include: {
				OrderItem: {
					include: {
						menuItem: true
					}
				}
			}
		});
		const redisMessage = {
			type: 'ORDERS_UPDATE_ADMIN',
			canteenId: canteenId,
			orders: orders
		};
		const publisher = RedisManager.getInstance().getPublisher();
		await publisher.publish(process.env.REDIS_CHANNEL || "sockets", JSON.stringify(redisMessage));
		console.log({ message: "Notified User Successfully" });
	} catch (error) {
		console.error({ message: SERVER_ERROR, error });
	}
};

export { broadcastMenuItems, updateUserOrders, updateCanteenOrders };