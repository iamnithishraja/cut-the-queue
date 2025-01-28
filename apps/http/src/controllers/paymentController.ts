import { Response } from "express";
import { CustomRequest } from "../types/userTypes";
import { razorpayInstance } from "..";
import prisma, { MenuItemType, OrderItemStatus } from "@repo/db/client";
import z from "zod";
import { CheckoutInputSchema, PaymentVerificationSchema } from "../schemas/ordersSchemas";
import crypto from "crypto";
import { SERVER_ERROR, USER_NOT_AUTHORISED } from "@repo/constants";
import KafkaProducer from "../publisher/kafka";
import {PaymentSuccessResponse,PaymentOrderResponse} from "../types/types"

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

        // Verify webhook signature
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

        // Start transaction
        const result = await prisma.$transaction(async (prismaClient) => {
            // Find order with FOR UPDATE using raw query if PostgreSQL
            let order;
            if (process.env.DATABASE_URL?.includes('postgresql')) {
                const orders = await prismaClient.$queryRaw<Array<any>>`
                    SELECT o.*, c.fcmToken 
                    FROM "orders" o
                    LEFT JOIN "users" c ON o."userId" = c.id
                    WHERE o."paymentToken" = ${razorpay_order_id}
                    FOR UPDATE NOWAIT
                `;
                
                if (orders.length > 0) {
                    order = orders[0];
                }
            } else {
                order = await prismaClient.order.findFirst({
                    where: { paymentToken: razorpay_order_id },
                    include: {
                        OrderItem: {
                            include: {
                                menuItem: true
                            }
                        },
                        customer: {
                            select: {
                                fcmToken: true
                            }
                        }
                    }
                });
            }

            if (!order) {
                throw new Error("Order not found");
            }

            if (order.isPaid) {
                const response: PaymentSuccessResponse = {
                    status: 200,
                    data: {
                        success: true,
                        message: "Payment already processed",
                        orderId: order.id
                    }
                };
                return response;
            }

            // Process menu items
            const orderItems = await prismaClient.orderItem.findMany({
                where: { orderId: order.id },
                include: { menuItem: true }
            });

            for (const orderItem of orderItems) {
                const menuItem = orderItem.menuItem;
                
                if (menuItem.avilableLimit !== null) {
                    if (menuItem.avilableLimit < orderItem.quantity) {
                        throw new Error(`Insufficient inventory for menu item: ${menuItem.name}`);
                    }

                    // Update inventory with raw query if PostgreSQL
                    if (process.env.DATABASE_URL?.includes('postgresql')) {
                        await prismaClient.$executeRaw`
                            UPDATE "menu_items"
                            SET "avilableLimit" = "avilableLimit" - ${orderItem.quantity},
                                status = CASE 
                                    WHEN "avilableLimit" - ${orderItem.quantity} <= 0 THEN 'UNAVAILABLE'::text
                                    ELSE 'AVAILABLE'::text
                                END
                            WHERE id = ${menuItem.id}
                            AND "avilableLimit" >= ${orderItem.quantity}
                        `;
                    } else {
                        await prismaClient.menuItem.update({
                            where: { id: menuItem.id },
                            data: {
                                avilableLimit: {
                                    decrement: orderItem.quantity
                                },
                                status: menuItem.avilableLimit - orderItem.quantity <= 0
                                    ? 'UNAVAILABLE'
                                    : 'AVAILABLE'
                            }
                        });
                    }
                }
            }

            // Update order status
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

            const response: PaymentOrderResponse = {
                status: 200,
                data: {
                    ...updatedOrder,
                    customer: {
                        fcmToken: updatedOrder.customer?.fcmToken || null
                    }
                }
            };
            return response;

        }, {
            timeout: 10000,
            isolationLevel: 'Serializable' as const
        });

        try {
            if ('canteenId' in result.data) {
                await fetch(`${process.env.WS_URL}/brodcastMenuItems/${result.data.canteenId}`);
                await fetch(`${process.env.WS_URL}/updateCanteenOrders/${result.data.canteenId}`);
                
                if (result.data.customer?.fcmToken) {
                    const kafkaProducer = new KafkaProducer(process.env.KAFKA_CLIENT_ID || "");
                    await kafkaProducer.publishToKafka("notification", {
                        firebaseToken: result.data.customer.fcmToken,
                        title: `Your Payment is Successful ✅`,
                        body: `Thank You for choosing CutTheQ`
                    });
                }
            }
            
            if ('customer' in result.data && result.data.customer.fcmToken) {
                const kafkaProducer = new KafkaProducer(process.env.KAFKA_CLIENT_ID || "");
                await kafkaProducer.publishToKafka("notification", {
                    firebaseToken: result.data.customer.fcmToken,
                    title: `Your Payment is Successful ✅`,
                    body: `Thank You for choosing CutTheQ`
                });
            }
        } catch (error) {
            console.error('Post-transaction operations error:', error);
        }

        return res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Payment verification error:', error);

        if (error instanceof Error && error.message.includes("Insufficient inventory")) {
            return res.status(400).json({
                success: false,
                error: 'Inventory Error',
                message: error.message
            });
        }

        if (error instanceof Error && error.message.includes('Transaction timeout')) {
            return res.status(409).json({
                success: false,
                error: 'Transaction timeout',
                message: 'Please try again'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to process payment verification',
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