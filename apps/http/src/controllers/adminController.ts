import { INVALID_INPUT, SERVER_ERROR, USER_NOT_AUTHORISED } from "@repo/constants";
import { Response } from "express";
import { CustomRequest } from "../types/userTypes";
import prisma from "@repo/db/client";
import z from "zod";
import { menuItemSchema } from "../schemas/ordersSchemas";
import { KafkaPublisher } from "../publisher/kafka";
import { broadcastMenuItems, updateUserOrders } from "../utils/redisHelpers";

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
        if (!order) {
            res.status(400).json({ message: INVALID_INPUT });
            return;
        }

        // TODO: notify the person who ordered the item through msg, vibration or some sort of trigger.
        const kafkaPublisher = KafkaPublisher.getInstance();
        if (order.customer.fcmToken) {
            await kafkaPublisher.publishToKafka("notification", {
                firebaseToken: order.customer.fcmToken,
                title: `Your ${orderItem.menuItem.name} is ready.`,
                body:  `Show the QR Code before collecting the order from ${order.canteen.name}`
            });
        }
        await updateUserOrders(order.userId);
        return getAllOrdersByCanteenId(req, res);
    } catch (error) {
        res.status(500).json({ message: SERVER_ERROR });
    }
}


async function finishOrder(req: CustomRequest, res: Response): Promise<void> {
    const id = req.params.orderId;

    if (!id) {
        res.status(400).json({ message: INVALID_INPUT });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const itemsToUpdate = await tx.orderItem.findMany({
                where: {
                    orderId: id,
                    status: "WAITING_FOR_PICKUP"
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

        // TODO: reflect the updated orders in user's app.
        await updateUserOrders(result.order.userId);
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

export { updateItem, chageToPickup, getAllOrdersByCanteenId, finishOrder }