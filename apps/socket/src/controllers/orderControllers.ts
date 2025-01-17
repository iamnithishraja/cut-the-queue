import {
	BROADCAST_QUANTITY,
	DISHES_NOT_FOUND,
	SERVER_ERROR,
} from "@repo/constants";
import prisma from "@repo/db/client";
import { Request, Response } from "express";
import { StateManager } from "../stateManager";
import { orderItemSchema } from "../schemas";
import { z } from "zod";
import {RedisServer} from '../redisServer';
export const broadcastMenuItems = async (
	req: Request,
	res: Response
): Promise<any> => {
	try {
		const canteenId = req.params.canteenId;
		if (!canteenId) {
			res.status(400).json({ message: "Canteen ID is required" });
			return;
		}

		const updatedMenuItems = await prisma.menuItem.findMany({
			where: { canteenId },
		});

		if (!updatedMenuItems || updatedMenuItems.length === 0) {
			res.status(404).json({ message: DISHES_NOT_FOUND });
			return;
		}
        //publish to redis over here
		RedisServer.getInstance().publish(JSON.stringify({type:'all',canteenId:canteenId,updatedMenuItems:updatedMenuItems}));
		// StateManager.getInstance().broadcastMenuItems(canteenId, updatedMenuItems);


		res.status(200).json({ message: BROADCAST_QUANTITY });
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: SERVER_ERROR });
	}
};


export const updateUserOrders = async (
	req: Request,
	res: Response
): Promise<any> => {
	try {
		const userId = req.params.userId;
		if (!userId) {
			res.status(400).json({ message: "userId is required" });
			return;
		}
		RedisServer.getInstance().publish(JSON.stringify({type:'user',userId:userId}));
		res.status(200).json({ message: "Notified User Successfully" });
	} catch (error) {
		res.status(500).json({ message: SERVER_ERROR });
	}
};

export const updateCanteenOrders = async (
	req: Request,
	res: Response
): Promise<any> => {
	try {
		const canteenId = req.params.canteenId;
		if (!canteenId) {
			res.status(400).json({ message: "OrderId is required" });
			return;
		}

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
        RedisServer.getInstance().publish(JSON.stringify({'type':'canteen',canteenId:canteenId,orders:orders}));
		res.status(200).json({ message: "Notified User Successfully" });
	} catch (error) {
		res.status(500).json({ message: SERVER_ERROR });
	}
};