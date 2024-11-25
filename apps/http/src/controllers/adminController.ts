import { INVALID_INPUT, SERVER_ERROR } from "@repo/constants";
import { Response } from "express";
import { CustomRequest } from "../types/userTypes";
import { toogleSchema, updateQuantitySchema } from "../schemas/ordersSchemas";
import prisma from "@repo/db/client";
import z from "zod";

async function changeItemStatus(req: CustomRequest, res: Response) {
    try {
        const { menuItemId, status } = toogleSchema.parse(req.body);
        const menuItem = prisma.menuItem.update({
            where: {
                id: menuItemId
            },
            data: {
                status: status ? "AVAILABLE" : "UNAVAILABLE"
            }
        });
        if (!menuItem) {
            res.status(400).json({ message: INVALID_INPUT });
            return;
        }
        const items = prisma.menuItem.findMany({
            where: {
                id: menuItemId
            }
        })
        // TODO: brodacst menu items.
        res.json({ items });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: INVALID_INPUT, errors: error.errors });
        } else {
            res.status(500).json({ message: SERVER_ERROR });
        }
    }
}

async function changeItemQuantity(req: CustomRequest, res: Response) {
    try {
        const { menuItemId, quantity } = updateQuantitySchema.parse(req.body);
        const menuItem = prisma.menuItem.update({
            where: {
                id: menuItemId
            },
            data: {
                avilableLimit: quantity
            }
        });
        if (!menuItem) {
            res.status(400).json({ message: INVALID_INPUT });
            return;
        }
        const items = prisma.menuItem.findMany({
            where: {
                id: menuItemId
            }
        })
        // TODO: brodacst menu items.
        res.json({ items });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: INVALID_INPUT, errors: error.errors });
        } else {
            res.status(500).json({ message: SERVER_ERROR });
        }
    }
}

export { changeItemStatus, changeItemQuantity }