import { Response } from "express";
import { CustomRequest } from "../types/userTypes";
import { razorpayInstance } from "..";
import prisma, { MenuItemType, OrderItemStatus } from "@repo/db/client";
import z from "zod";
import { CheckoutInputSchema } from "../schemas/ordersSchemas";
import crypto from "crypto";
import { SERVER_ERROR, USER_NOT_AUTHORISED } from "@repo/constants";
import { KafkaPublisher } from "../publisher/kafka";
import { OrderResult } from "../types/types"
import { broadcastMenuItems, updateCanteenOrders } from "../utils/redisHelpers";

// TODO: modify to process one order at a time by locking the transactions if multithread machine is used. 
async function checkout(req: CustomRequest, res: Response): Promise<any> {
    try {
        const validatedInput = CheckoutInputSchema.parse(req.body);
        const { items, canteenId } = validatedInput;

        // Fetch menu items to verify prices and availability
        const menuItemIds = items.map(item => item.menuItemId);
        const menuItems = await prisma.menuItem.findMany({
            where: {
                id: { in: menuItemIds },
                status: 'AVAILABLE'
            }
        });

        // Verify all items exist and are available
        if (menuItems.length !== menuItemIds.length) {
            return res.status(400).json({
                error: 'Some items are not available or do not exist'
            });
        }

        // Calculate total and verify quantities
        let total = 0;
        const orderItems = items.map(item => {
            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
            if (!menuItem) throw new Error('Item not found');

            if (menuItem.avilableLimit && item.quantity > menuItem.avilableLimit) {
                throw new Error(`Quantity exceeds available limit for ${menuItem.name}`);
            }

            total += menuItem.price * item.quantity;
            return {
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                status: menuItem.type == MenuItemType.Instant ? OrderItemStatus.WAITING_FOR_PICKUP : OrderItemStatus.COOKING
            };
        });


        const razorpayOptions = {
            amount: Math.round(total * 100),
            currency: "INR"
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
                        data: orderItems
                    }
                }
            },
            include: {
                OrderItem: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });

        res.status(200).json({
            order,
            paymentOrder: razorpayOrder
        });

    } catch (error) {
        console.error('Checkout error:', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Invalid input',
                details: error.errors
            });
        }

        res.status(500).json({
            error: 'Failed to process checkout',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}


async function paymentVerification(req: CustomRequest, res: Response): Promise<any> {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
        const signature = req.headers['x-razorpay-signature'];

        if (!signature) {
            return res.status(400).json({
                success: false,
                error: 'Missing signature'
            });
        }

        const shasum = crypto.createHmac('sha256', webhookSecret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest !== signature) {
            return res.status(400).json({
                success: false,
                error: 'Invalid signature'
            });
        }

        const { payload } = req.body;
        const { payment: { entity } } = payload;
        const razorpay_payment_id = entity.id;
        const razorpay_order_id = entity.order_id;

        interface OrderResult {
            id: string;
            canteenId: string;
            customer: {
                fcmToken: string | null;
            };
        }

        const result = await prisma.$transaction(async (prismaClient) => {
            const order = await prismaClient.order.findFirst({
                where: { paymentToken: razorpay_order_id },
                include: {
                    OrderItem: {
                        include: {
                            menuItem: true
                        }
                    }
                }
            });

            if (!order) {
                throw new Error("Order not found");
            }

            if (order.isPaid) {
                return res.status(200).json({
                    success: true,
                    message: "Payment already processed",
                    orderId: order.id
                });
            }

            // Process each order item with atomic updates
            for (const orderItem of order.OrderItem) {
                const menuItem = orderItem.menuItem;
                
                // Skip if item has unlimited stock
                if (menuItem.avilableLimit === null) continue;

                // Atomic update with inventory check using raw SQL
                const query = `
                    UPDATE "menu_items"
                    SET 
                        "avilableLimit" = "avilableLimit" - $1,
                        "status" = CASE 
                            WHEN ("avilableLimit" - $1) <= 0 THEN 'UNAVAILABLE'::"AvailabilityStatus"
                            ELSE 'AVAILABLE'::"AvailabilityStatus"
                        END
                    WHERE 
                        id = $2 AND
                        "avilableLimit" >= $1;
                `;
                const params = [orderItem.quantity, menuItem.id];
                
                // Execute the raw update query
                const updateCount = await prismaClient.$executeRawUnsafe(query, ...params);
                
                // Check if the update was successful
                if (updateCount === 0) {
                    throw new Error(`Insufficient inventory for menu item: ${menuItem.name}`);
                }
            }

            // Update the order status
            const updatedOrder = await prismaClient.order.update({
                where: { id: order.id },
                data: {
                    isPaid: true,
                    paymentId: razorpay_payment_id
                },
                include: {
                    customer: {
                        select: {
                            fcmToken: true
                        }
                    }
                }
            });

            return updatedOrder;
        });

        // Broadcast updates
        const typedResult = result as OrderResult;
        await broadcastMenuItems(typedResult.canteenId);
        await updateCanteenOrders(typedResult.canteenId);

        // Send notification
        const kafkaPublisher = KafkaPublisher.getInstance();
        if (typedResult.customer.fcmToken) {
            await kafkaPublisher.publishToKafka("notification", {
                firebaseToken: typedResult.customer.fcmToken,
                title: `Your Payment is Successful ✅`,
                body: `Thank You for choosing CutTheQ`
            });
        }

        res.status(200).json({
            success: true,
            message: "Webhook processed successfully",
        });

    } catch (error) {
        console.error('Webhook processing error:', error);

        // Handle specific error cases
        if (error instanceof Error && error.message.includes("Insufficient inventory")) {
            return res.status(400).json({
                success: false,
                error: 'Inventory Error',
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to process webhook',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

const getAllOrders = async (req: CustomRequest, res: Response) => {
    try {
        const items = await prisma.order.findMany({
            where: {
                userId: req.user?.id,
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
        res.json({ items });
    } catch (e) {
        res.status(500).json({ mesage: SERVER_ERROR });
        console.log(e);
    }
}

export { checkout, paymentVerification, getAllOrders };