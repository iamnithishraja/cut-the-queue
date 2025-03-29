import {
	CHECKOUT_FAILED,
	INVALID_INPUT,
	INVALID_SIGNATURE,
	INVALID_WEBHOOK_PAYLOAD,
	ITEMS_UNAVAILABLE,
	MISSING_SIGNATURE,
	ORDER_NOT_FOUND,
	PAYMENT_ACKNOWLEDGED,
	PAYMENT_ALREADY_PROCESSED,
	PAYMENT_PROCESSED,
	QUANTITY_EXCEEDS_LIMIT,
	SERVER_ERROR,
} from "@repo/constants";
import prisma, { MenuItemType, OrderItemStatus } from "@repo/db/client";
import crypto from "crypto";
import { Response } from "express";
import z from "zod";
import { razorpayInstance } from "..";
import { KafkaPublisher } from "../publisher/kafka";
import { CheckoutInputSchema } from "../schemas/ordersSchemas";
import { CustomRequest } from "../types/userTypes";
import { broadcastMenuItems, updateCanteenOrders } from "../utils/redisHelpers";

// TODO: modify to process one order at a time by locking the transactions if multithread machine is used.
async function checkout(req: CustomRequest, res: Response): Promise<any> {
	try {
		const validatedInput = CheckoutInputSchema.parse(req.body);
		const { items, canteenId } = validatedInput;

		// Fetch menu items to verify prices and availability
		const menuItemIds = items.map((item) => item.menuItemId);
		const menuItems = await prisma.menuItem.findMany({
			where: {
				id: { in: menuItemIds },
				status: "AVAILABLE",
			},
		});

		// Verify all items exist and are available
		if (menuItems.length !== menuItemIds.length) {
			return res.status(400).json({
				error: ITEMS_UNAVAILABLE,
			});
		}

		// Calculate total and verify quantities
		let total = 0;
		const orderItems = items.map((item) => {
			const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
			if (!menuItem) throw new Error("Item not found");

			if (menuItem.avilableLimit && item.quantity > menuItem.avilableLimit) {
				throw new Error(QUANTITY_EXCEEDS_LIMIT);
			}

			total += menuItem.price * item.quantity;
			return {
				menuItemId: item.menuItemId,
				quantity: item.quantity,
				status:
					menuItem.type == MenuItemType.Instant
						? OrderItemStatus.WAITING_FOR_PICKUP
						: OrderItemStatus.COOKING,
			};
		});

		const razorpayOptions = {
			amount: Math.round(total * 100),
			currency: "INR",
		};

		const razorpayOrder = await razorpayInstance.orders.create(razorpayOptions);
		// Create order in database
		const order = await prisma.order.create({
			data: {
				userId: req.user!.id,
				canteenId,
				paymentToken: razorpayOrder.id,
				isPaid: false,
				OrderItem: {
					createMany: {
						data: orderItems,
					},
				},
			},
			include: {
				OrderItem: {
					include: {
						menuItem: true,
					},
				},
			},
		});

		res.status(200).json({
			order,
			paymentOrder: razorpayOrder,
		});
	} catch (error) {
		console.error("Checkout error:", error);

		if (error instanceof z.ZodError) {
			return res.status(400).json({
				error: INVALID_INPUT,
				details: error.errors,
			});
		}

		res.status(500).json({
			error: CHECKOUT_FAILED,
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

async function paymentVerification(
	req: CustomRequest,
	res: Response
): Promise<any> {
	try {
		const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
		const signature = req.headers["x-razorpay-signature"];

		if (!signature) {
			return res.status(400).json({
				success: false,
				error: MISSING_SIGNATURE,
			});
		}

		const shasum = crypto.createHmac("sha256", webhookSecret);
		shasum.update(JSON.stringify(req.body));
		const digest = shasum.digest("hex");

		if (digest !== signature) {
			return res.status(400).json({
				success: false,
				error: INVALID_SIGNATURE,
			});
		}

		// Extract payment details
		const { payload } = req.body;
		if (!payload || !payload.payment || !payload.payment.entity) {
			return res.status(400).json({
				success: false,
				error: INVALID_WEBHOOK_PAYLOAD,
			});
		}

		const {
			payment: { entity },
		} = payload;
		const razorpay_payment_id = entity.id;
		const razorpay_order_id = entity.order_id;

		// First, check if the order exists and if it's already paid
		const existingOrder = await prisma.order.findFirst({
			where: { paymentToken: razorpay_order_id },
		});

		if (!existingOrder) {
			return res.status(200).json({
				success: true,
				message: ORDER_NOT_FOUND,
			});
		}

		if (existingOrder.isPaid) {
			// If the order is already marked as paid, consider this a success
			// This handles duplicate webhook calls from Razorpay
			return res.status(200).json({
				success: true,
				message: PAYMENT_ALREADY_PROCESSED,
				orderId: existingOrder.id,
			});
		}

		// Simply mark the order as paid - this is the critical step
		const updatedOrder = await prisma.order.update({
			where: { id: existingOrder.id },
			data: {
				isPaid: true,
				paymentId: razorpay_payment_id,
			},
			include: {
				customer: {
					select: {
						fcmToken: true,
					},
				},
			},
		});

		// Handle non-critical operations separately and don't let them affect the response
		setTimeout(async () => {
			try {
				// Handle inventory updates in a separate, non-blocking process
				await prisma.$transaction(async (prismaClient) => {
					const orderWithItems = await prismaClient.order.findUnique({
						where: { id: updatedOrder.id },
						include: {
							OrderItem: {
								include: {
									menuItem: true,
								},
							},
						},
					});

					if (orderWithItems) {
						for (const orderItem of orderWithItems.OrderItem) {
							const menuItem = orderItem.menuItem;

							// Skip if item has unlimited stock
							if (menuItem.avilableLimit === null) continue;

							// Update inventory status separately
							await prismaClient.menuItem.update({
								where: { id: menuItem.id },
								data: {
									avilableLimit: {
										decrement: orderItem.quantity,
									},
									status:
										menuItem.avilableLimit - orderItem.quantity <= 0
											? "UNAVAILABLE"
											: "AVAILABLE",
								},
							});
						}
					}
				});

				// Send notification
				if (updatedOrder.customer?.fcmToken) {
					const kafkaPublisher = KafkaPublisher.getInstance();
					await kafkaPublisher.publishToKafka("notification", {
						firebaseToken: updatedOrder.customer.fcmToken,
						title: `Your Payment is Successful ✅`,
						body: `Thank You for choosing CutTheQ`,
					});
				}
				// Broadcast menu updates
				await broadcastMenuItems(updatedOrder.canteenId);
				await updateCanteenOrders(updatedOrder.canteenId);
			} catch (error) {
				// Just log the error, don't affect the main process
				console.error("Error in post-payment processing:", error);

				// Send notification
				if (updatedOrder.customer?.fcmToken) {
					const kafkaPublisher = KafkaPublisher.getInstance();
					await kafkaPublisher.publishToKafka("notification", {
						firebaseToken: updatedOrder.customer.fcmToken,
						title: `Your Payment is Successful ✅`,
						body: `Thank You for choosing CutTheQ`,
					});
				}
				// Broadcast menu updates
				await broadcastMenuItems(updatedOrder.canteenId);
				await updateCanteenOrders(updatedOrder.canteenId);
			}
		}, 0);

		// Always return success for the payment
		return res.status(200).json({
			success: true,
			message: PAYMENT_PROCESSED,
			orderId: updatedOrder.id,
		});
	} catch (error) {
		console.error("Webhook processing error:", error);

		return res.status(200).json({
			success: true,
			message: PAYMENT_ACKNOWLEDGED,
		});
	}
}

const getAllOrders = async (req: CustomRequest, res: Response) => {
	try {
		const items = await prisma.order.findMany({
			where: {
				userId: req.user?.id,
				orderStatus: "PROCESSING",
				isPaid: true,
			},
			include: {
				OrderItem: {
					include: {
						menuItem: true,
					},
				},
			},
		});
		res.json({ items });
	} catch (e) {
		res.status(500).json({ message: SERVER_ERROR });
		console.log(e);
	}
};

export { checkout, getAllOrders, paymentVerification };
