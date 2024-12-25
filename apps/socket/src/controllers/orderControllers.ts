import {
	BROADCAST_QUANTITY,
	DISHES_NOT_FOUND,
	ORDER_HANDOVER,
	SERVER_ERROR,
  } from "@repo/constants";
  import prisma from "@repo/db/client";
  import { Request, Response } from "express";
import { StateManager } from "../stateManager";
  
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
	  
	  StateManager.getInstance().broadcastMenuItems(canteenId, updatedMenuItems);
  
	  res.status(200).json({ message: BROADCAST_QUANTITY });
	} catch (e) {
	  console.error(e);
	  res.status(500).json({ message: SERVER_ERROR });
	}
  };
  
//   export const handleOrderHandover = async (
// 	req: Request,
// 	res: Response
//   ): Promise<any> => {
// 	try {
// 	  const result = orderIdSchema.safeParse({ params: req.params });
// 	  if (!result.success) {
// 		return res.status(400).json(result.error);
// 	  }
  
// 	  const orderId = req.params.orderId;
  
// 	  // Get order with its items
// 	  const order = await prisma.order.findUnique({
// 		where: { id: orderId },
// 		include: {
// 		  OrderItem: {
// 			include: { menuItem: true },
// 		  },
// 		},
// 	  });
  
// 	  if (!order) {
// 		return res.status(404).json({ message: "Order not found" });
// 	  }
  
// 	  // Update order items status to SENT
// 	  await prisma.orderItem.updateMany({
// 		where: {
// 		  orderId: orderId,
// 		  status: "WAITING_FOR_PICKUP",
// 		},
// 		data: {
// 		  status: "SENT",
// 		},
// 	  });
  
// 	  // Check if all items in the order are now SENT
// 	  const remainingItems = await prisma.orderItem.count({
// 		where: {
// 		  orderId: orderId,
// 		  status: { not: "SENT" },
// 		},
// 	  });
  
// 	  // If no remaining items, update order status to DONE
// 	  if (remainingItems === 0) {
// 		await prisma.order.update({
// 		  where: { id: orderId },
// 		  data: { orderStatus: "DONE" },
// 		});
// 	  }
  
// 	  // Get updated order for response
// 	  const updatedOrder = await prisma.order.findUnique({
// 		where: { id: orderId },
// 		include: {
// 		  OrderItem: {
// 			include: { menuItem: true },
// 		  },
// 		},
// 	  });
  
// 	  // Send update to specific user
// 	  socketManager.sendToUser(order.userId, order.canteenId, {
// 		type: "ORDER_UPDATE",
// 		payload: updatedOrder
// 	  });
  
// 	  // Broadcast to all partners
// 	  socketManager.broadcastToOrders(order.canteenId, {
// 		type: "ORDER_UPDATE",
// 		payload: updatedOrder
// 	  });
  
// 	  res.status(200).json({
// 		message: ORDER_HANDOVER
// 	  });
// 	} catch (error) {
// 	  console.error(error);
// 	  return res.status(500).json({ message: SERVER_ERROR });
// 	}
//   };
  
//   export const handleItemCooked = async (
// 	req: Request,
// 	res: Response
//   ): Promise<any> => {
// 	try {
// 	  const result = orderItemSchema.safeParse({
// 		params: req.params,
// 		body: req.body
// 	  });
	  
// 	  if (!result.success) {
// 		return res.status(400).json(result.error);
// 	  }
  
// 	  const { order_item_id } = req.params;
// 	  const { user_id } = req.body;
  
// 	  const updatedOrderItem = await prisma.orderItem.update({
// 		where: { id: order_item_id },
// 		data: { status: "WAITING_FOR_PICKUP" },
// 		include: {
// 		  order: {
// 			include: {
// 			  OrderItem: {
// 				include: { menuItem: true },
// 			  },
// 			},
// 		  },
// 		},
// 	  });
  
// 	  if (updatedOrderItem.order) {
// 		socketManager.sendToUser(
// 		  user_id,
// 		  updatedOrderItem.order.canteenId,
// 		  {
// 			type: "ORDER_UPDATE",
// 			payload: updatedOrderItem.order
// 		  }
// 		);
// 	  }
  
// 	  res.status(200).json({ message: "Item marked as cooked successfully" });
// 	} catch (error) {
// 	  console.error(error);
// 	  res.status(500).json({ message: SERVER_ERROR });
// 	}
//   };
  
//   export const handleScanHandover = async (
// 	req: Request,
// 	res: Response
//   ): Promise<any> => {
// 	try {
// 	  const result = orderItemSchema.safeParse({
// 		params: req.params,
// 		body: req.body
// 	  });
	  
// 	  if (!result.success) {
// 		return res.status(400).json(result.error);
// 	  }
  
// 	  const { order_item_id } = req.params;
// 	  const { user_id } = req.body;
  
// 	  const updatedOrderItem = await prisma.orderItem.update({
// 		where: { id: order_item_id },
// 		data: { status: "SENT" },
// 		include: {
// 		  order: {
// 			include: {
// 			  OrderItem: {
// 				include: { menuItem: true }
// 			  }
// 			}
// 		  }
// 		}
// 	  });
  
// 	  if (updatedOrderItem.order) {
// 		socketManager.sendToUser(
// 		  user_id,
// 		  updatedOrderItem.order.canteenId,
// 		  {
// 			type: "ORDER_UPDATE",
// 			payload: updatedOrderItem.order
// 		  }
// 		);
  
// 		res.status(200).json(updatedOrderItem.order);
// 	  } else {
// 		res.status(404).json({ message: "Order not found" });
// 	  }
// 	} catch (error) {
// 	  console.error(error);
// 	  res.status(500).json({ message: SERVER_ERROR });
// 	}
//   };