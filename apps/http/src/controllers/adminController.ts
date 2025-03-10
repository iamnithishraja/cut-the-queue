import { INVALID_INPUT, SERVER_ERROR, USER_NOT_AUTHORISED } from "@repo/constants";
import { Response } from "express";
import { CustomRequest } from "../types/userTypes";
import prisma from "@repo/db/client";
import z from "zod";
import { menuItemSchema } from "../schemas/ordersSchemas";
import { KafkaPublisher } from "../publisher/kafka";
import { broadcastMenuItems, updateCanteenOrders, updateUserOrders } from "../utils/redisHelpers";

const orderNotifyIntervals = new Map<string, NodeJS.Timeout>();

const getAllOrdersByCanteenId = async (req: CustomRequest, res: Response) => {
    try {
        const canteenId = req.user!.canteenId;
        if (!canteenId) {
            res.status(405).json({ message: USER_NOT_AUTHORISED });
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
                },
                customer: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                    }
                }
            }
        });
        res.json(orders);
    }
    catch (e) {
        res.status(500).json({ mesage: SERVER_ERROR });
        console.log(e);
    }
}

async function updateItem(req: CustomRequest, res: Response) {
    try {
        const parsedMenuItem = menuItemSchema.parse(req.body);
        await prisma.menuItem.update({
            where: {
                id: parsedMenuItem.id
            },
            data: parsedMenuItem
        })
        const items = await prisma.menuItem.findMany({
            where: {
                canteenId: parsedMenuItem.canteenId
            }
        })
        await broadcastMenuItems(parsedMenuItem.canteenId);
        res.json({
            canteenId: parsedMenuItem.id,
            items
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: INVALID_INPUT, errors: error.errors });
        } else {
            res.status(500).json({ message: SERVER_ERROR });
        }
    }
}
async function chageToPickup(req: CustomRequest, res: Response) {
    try {
        const id = req.params.orderId;
        if (!id) {
            res.status(400).json({ message: INVALID_INPUT });
            return;
        }
        const orderItem = await prisma.orderItem.findUnique({
            where: {
                id
            },
            include: {
                menuItem: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!orderItem || orderItem.status != "COOKING") {
            res.status(400).json({ message: INVALID_INPUT });
            return;
        }
        await prisma.orderItem.update({
            where: {
                id
            },
            data: {
                status: "WAITING_FOR_PICKUP"
            }
        });
        const order = await prisma.order.findUnique({
            where: {
                id: orderItem.orderId
            },
            include: {
                customer: {
                    select: {
                        fcmToken: true
                    }
                },
                canteen: {
                    select: {
                        name: true
                    }
                }
            }
        });
        if (!order || !order.customer || !order.userId) {
            res.status(400).json({ message: INVALID_INPUT });
            return;
        }

        // TODO: notify the person who ordered the item through msg, vibration or some sort of trigger.
        //notify immediately
        const kafkaPublisher = KafkaPublisher.getInstance();
        if (order.customer.fcmToken) {
            await kafkaPublisher.publishToKafka("notification", {
                firebaseToken: order.customer.fcmToken,
                title: `Your ${orderItem.menuItem.name} is ready.`,
                body: `Show the QR Code before collecting the order from ${order.canteen.name}`
            });
        }
        //notify in every 2 minutes
        const intervalId = setInterval(async () => {
            try {
                const updatedOrderItem = await prisma.orderItem.findUnique({
                    where: { id },
                    include: {
                        menuItem: { select: { name: true } }
                    }
                });

                if (!updatedOrderItem || updatedOrderItem.status !== "WAITING_FOR_PICKUP") {
                    clearInterval(intervalId);
                    orderNotifyIntervals.delete(id);
                    return;
                }

                // Resend the notification
                if (order.customer && order.customer.fcmToken) {
                    await kafkaPublisher.publishToKafka("notification", {
                        firebaseToken: order.customer.fcmToken,
                        title: `Your ${updatedOrderItem.menuItem.name} is ready.`,
                        body: `Show the QR Code before collecting the order from ${order.canteen.name}`
                    });
                }
            } catch (error) {
                console.error("Failed to check order status or send notification:", error);
            }
        }, 2 * 60 * 1000);

        await updateUserOrders(order.userId);
        await updateCanteenOrders(order.canteenId);
        return getAllOrdersByCanteenId(req, res);
    } catch (error) {
        res.status(500).json({ message: SERVER_ERROR });
    }
}


async function finishOrder(req: CustomRequest, res: Response): Promise<void> {
    const id = req.params.orderId;
    const counter = req.user?.counter;

    if (!id || !counter) {
        res.status(400).json({ message: INVALID_INPUT });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const itemsToUpdate = await tx.orderItem.findMany({
                where: {
                    orderId: id,
                    status: "WAITING_FOR_PICKUP",
                    menuItem: {
                        counter: (counter as number)
                    }
                },
                include: {
                    menuItem: true
                }
            });

            if (itemsToUpdate.length === 0) {
                throw new Error("No valid order items found");
            }

            // Update these specific items
            await tx.orderItem.updateMany({
                where: {
                    id: {
                        in: itemsToUpdate.map(item => item.id)
                    }
                },
                data: {
                    status: "SENT"
                }
            });

            const order = await tx.order.findUnique({
                where: { id, isPaid: true },
                include: {
                    OrderItem: true
                }
            });

            if (!order || order.isPaid === false) {
                throw new Error("Order not found");
            }

            const allItemsSent = order.OrderItem.every(item => item.status === "SENT");

            if (allItemsSent) {
                await tx.order.update({
                    where: { id },
                    data: { orderStatus: "DONE" }
                });
            }

            return { itemsToUpdate, order };
        });

        clearInterval(orderNotifyIntervals.get(id!));
        orderNotifyIntervals.delete(id!);

        // TODO: reflect the updated orders in user's app.
        // @ts-ignore
        await updateUserOrders(result.order.userId);
        await updateCanteenOrders(result.order.canteenId);
        res.json(result.itemsToUpdate);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : SERVER_ERROR;
        const statusCode = errorMessage === "No valid order items found" ? 400 : 500;

        res.status(statusCode).json({
            message: statusCode === 400 ? INVALID_INPUT : SERVER_ERROR,
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function updateCounter(req: CustomRequest, res: Response) {
    try {
        let counter = req.params.counter;
        if (!counter || isNaN(parseInt(counter))) {
            res.status(400).json({ message: INVALID_INPUT });
            return;
        }
        const updatedUser = await prisma.user.update({
            where: {
                id: req.user!.id,
            },
            data: {
                counter: parseInt(counter),
            },
        });
        req.user = updatedUser;
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: SERVER_ERROR });
    }
}

export { updateItem, chageToPickup, getAllOrdersByCanteenId, finishOrder, updateCounter }