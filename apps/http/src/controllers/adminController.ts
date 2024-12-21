import { INVALID_INPUT, SERVER_ERROR } from "@repo/constants";
import { Response } from "express";
import { CustomRequest } from "../types/userTypes";
import prisma from "@repo/db/client";
import z from "zod";
import { menuItemSchema } from "../schemas/ordersSchemas";
import items from "razorpay/dist/types/items";

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


export { updateItem }