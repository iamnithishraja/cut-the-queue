import { Response } from "express";
import { CustomRequest } from "../types/userTypes";
import { razorpayInstance } from "..";
import prisma, { MenuItemType, OrderItemStatus } from "@repo/db/client";
import z from "zod";
import { CheckoutInputSchema } from "../schemas/ordersSchemas";
import crypto from "crypto";


async function checkout(req: CustomRequest, res: Response): Promise<any> {
    try {
        const validatedInput = CheckoutInputSchema.parse(req.body);
        const { items, userId, canteenId } = validatedInput;

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
                userId,
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
        // Extract the payment details from the request body
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify the payment signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Find the order in the database
            const order = await prisma.order.findFirst({
                where: { paymentToken: razorpay_order_id },
                include: { OrderItem: true }
            });

            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }

            // Update the order status
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    isPaid: true,
                    paymentId: razorpay_payment_id
                }
            });
            
            // TODO: do api call to ws server.
            res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                orderId: order.id
            });
        } else {
            res.status(400).json({
                success: false,
                error: "Invalid signature"
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify payment',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}


export { checkout, paymentVerification };