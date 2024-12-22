import { INVALID_INPUT, SERVER_ERROR, USER_NOT_AUTHORISED } from "@repo/constants";
import { Response } from "express";
import { CustomRequest } from "../types/userTypes";
import prisma from "@repo/db/client";
import z from "zod";
import { menuItemSchema } from "../schemas/ordersSchemas";

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
                orderStatus: "PROCESSING"
            },
            include: {
                OrderItem: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });
        res.json({ items: orders });
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
        // TODO: brodacst menu items.
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
        }
        const orderItem = await prisma.orderItem.findUnique({
            where: {
                id
            }
        });

        if (!orderItem || orderItem.status != "COOKING") {
            res.status(400).json({ message: INVALID_INPUT });
        }
        await prisma.orderItem.update({
            where: {
                id
            },
            data: {
                status: "WAITING_FOR_PICKUP"
            }
        });
        // TODO: notify the person who ordered the item through msg, vibration or some sort of trigger.
        getAllOrdersByCanteenId(req, res)
    } catch (error) {
        res.status(500).json({ message: SERVER_ERROR });
    }
}

export { updateItem, chageToPickup, getAllOrdersByCanteenId }