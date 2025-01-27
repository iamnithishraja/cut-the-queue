import { INVALID_INPUT, SERVER_ERROR } from "@repo/constants";
import prisma from "@repo/db/client";
import { Request, Response } from "express";
import z from "zod";
import { calculateAmountSchema } from "../schemas/userSchemas";

async function getAllDishes(req: Request, res: Response) {
	const canteenId = req.params.canteenId;
	try {
		const items = await prisma.menuItem.findMany({
			where: { canteenId: canteenId },
		});
		res.json({ items });
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: SERVER_ERROR });
	}
}

const getAllCanteen = async (req: Request, res: Response): Promise<any> => {
	try {
		const canteens = await prisma.canteen.findMany();
		res.json({ canteens, length: canteens.length });
	} catch (error) {
		res.status(500).json({ message: SERVER_ERROR });
	}
};

const calculateAmountForOrder = async (req: Request, res: Response) => {
	try {
		const orderItemList = calculateAmountSchema.parse(req.body);
		const ids = orderItemList.map((item) => item.id);
		const orderItemMap = new Map();
		for (const order of orderItemList) {
			orderItemMap.set(order.id, order.quantity);
		}

		const dishes = await prisma.menuItem.findMany({
			where: { id: { in: ids } },
		});

		if (dishes.length <= 0) {
			res.status(404).json({ message: INVALID_INPUT });
			return;
		}

		if (dishes.length != orderItemList.length) {
			res.status(404).json({ message: "mismatch" });
			return;
		}

		let totalAmount = 0;
		dishes.forEach((dish) => {
			const quantity = orderItemMap.get(dish?.id);
			if (dish) {
				totalAmount += quantity * dish.price;
			}
		});

		res.status(200).json({ total: totalAmount });
	} catch (e) {
		if (e instanceof z.ZodError) {
			res.status(400).json({ message: INVALID_INPUT, errors: e.errors });
		} else {
			console.error(e);
			res.status(500).json({ message: SERVER_ERROR });
		}
	}
};

const toggleCanteenAvailability = async (req: Request, res: Response) => {
	try {
		const canteenId = req.params.canteenId;
		const canteen = await prisma.canteen.findUnique({
			where: { id: canteenId },
			select: { isOpen: true },
		});

		if (!canteen) {
			res.status(404).json({
				success: false,
				message: "Canteen not found",
			});
			return;
		}

		const newStatus = !canteen.isOpen;

		await prisma.canteen.update({
			where: { id: canteenId },
			data: { isOpen: newStatus },
		});

		try {
			await fetch(`${process.env.WS_URL}/brodcastMenuItems/${canteenId}`);
		} catch (error) {
			console.error("Failed to broadcast status update:", error);
		}

		res.status(200).json({
			success: true,
			message: `Canteen is now ${newStatus ? "open" : "closed"}`,
			isOpen: newStatus,
		});
	} catch (error) {
		console.error("Toggle canteen availability error:", error);
		res.status(500).json({
			success: false,
			message: SERVER_ERROR,
		});
	}
};

export {
	calculateAmountForOrder,
	getAllCanteen,
	getAllDishes,
	toggleCanteenAvailability,
};
