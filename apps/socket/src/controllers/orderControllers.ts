import {
	BROADCAST_QUANTITY,
	DISHES_NOT_FOUND,
	SERVER_ERROR,
} from "@repo/constants";
import prisma from "@repo/db/client";
import { Request, Response } from "express";
import { broadcastToConnectedDevices } from "../utils/socketUtils";

export const broadcastQuantity = async (
	req: Request,
	res: Response
): Promise<any> => {
	const canteenId = req.params.canteenId;
	try {
		const updatedMenuItems = await prisma.menuItem.findMany({
			where: {
				canteenId: canteenId,
			},
		});

		if (!updatedMenuItems || updatedMenuItems.length === 0) {
			res.status(404).json({ message: DISHES_NOT_FOUND });
			return;
		}

		broadcastToConnectedDevices("UPDATE_MENU_ITEMS", updatedMenuItems);
		res.status(200).json({ message: BROADCAST_QUANTITY });
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: SERVER_ERROR });
	}
};

export const handleOrderHandover = async (
	req: Request,
	res: Response
): Promise<any> => {
	const orderId = req.params.orderId;

	try {
		// Get order with its items
		const order = await prisma.orders.findUnique({
			where: { id: orderId },
			include: {
				OrderItem: {
					include: { menuItem: true },
				},
			},
		});

		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}

		// Update order items status to SENT
		const updatedItems = await prisma.orderItem.updateMany({
			where: {
				orderId: orderId,
				status: "WAITING_FOR_PICKUP",
			},
			data: {
				status: "SENT",
			},
		});

		// Check if all items in the order are now SENT
		const remainingItems = await prisma.orderItem.count({
			where: {
				orderId: orderId,
				status: { not: "SENT" },
			},
		});

		// If no remaining items, update order status to DONE
		if (remainingItems === 0) {
			await prisma.order.update({
				where: { id: orderId },
				data: { orderStatus: "DONE" },
			});
		}

		// Get updated order for response
		const updatedOrder = await prisma.order.findUnique({
			where: { id: orderId },
			include: {
				OrderItem: {
					include: { menuItem: true },
				},
			},
		});

		broadcastToConnectedDevices("ORDER_HANDOVER", updatedOrder);

		// Send response to canteen
		return res.status(200).json({
			message: "Order items updated successfully",
			order: updatedOrder,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: SERVER_ERROR });
	}
};
