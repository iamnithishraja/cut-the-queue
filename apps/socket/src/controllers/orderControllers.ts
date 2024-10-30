import { Request, Response } from "express";
import prisma from "@repo/db/client";
import {
  DISHES_NOT_FOUND,
  BROADCAST_QUANTITY,
  SERVER_ERROR,
} from "@repo/constants";
import socketManager from "../socketManager";

export const broadcastQuantity = async (
  req: Request,
  res: Response
): Promise<any> => {
  const canteenId = req.params.canteenId;
  try {
    const updatedMenuItems = await prisma.menuItem.findMany({
      where: {
        canteenId: canteenId,
      },
    });

    if (!updatedMenuItems || updatedMenuItems.length === 0) {
      res.status(404).json({ message: DISHES_NOT_FOUND });
      return;
    }
    const data = JSON.stringify({
      type: "UPDATE_MENU_ITEMS",
      payload: updatedMenuItems,
    });
    const socketInstance = socketManager.getInstance();
    const connectedDevices = socketInstance.getAllSockets();
    connectedDevices.forEach((device) => {
      device.send(data);
    });
    res.status(200).json({ message: BROADCAST_QUANTITY });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: SERVER_ERROR });
  }
};
