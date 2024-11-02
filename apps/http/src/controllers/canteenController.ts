import { Request, Response } from "express";
import prisma from "@repo/db/client";
import {
  CANTEENS_NOT_FOUND,
  DISHES_NOT_FOUND,
  SERVER_ERROR,
} from "@repo/constants";
async function getAllDishes(req: Request, res: Response): Promise<any> {
  const canteenId = req.params.canteenId;
  try {
    const items = await prisma.menuItem.findMany({
      where: {
        canteenId: canteenId,
      },
    });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ mesage: SERVER_ERROR });
    console.log(e);
  }
}

async function getAllCanteen(req: Request, res: Response) {
  try {
    const canteens = await prisma.canteen.findMany({
      where: {
        isOpen: true
      }
    });
    res.json({ canteens, length: canteens.length });
  } catch (e) {
    res.status(500).json({ message: SERVER_ERROR });
    console.log(e);
  }
}
export { getAllDishes, getAllCanteen };
