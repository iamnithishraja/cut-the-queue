import { devices, menuItemType } from "../types/type";
import { Request, Response } from "express";
import WebSocket from "ws";
import prisma from "@repo/db/client";
import { MenuItemType } from "@repo/db/client";

import {
  DISHES_NOT_FOUND,
  SERVER_ERROR,
  BROADCAST_QUANTITY,
} from "@repo/constants";
class socketManager {
  private static instance: socketManager;
  public connectedDevices: devices[] = [];

  private constructor() {
    this.connectedDevices = [];
  }

  public static getInstance() {
    if (!socketManager.instance) {
      socketManager.instance = new socketManager();
    }
    return socketManager.instance;
  }

  public async addDevices(ws: WebSocket, id: string) {
    this.connectedDevices.push({ socket: ws, id: id });
  }

  public removeDevice(ws: WebSocket) {
    const index = this.connectedDevices.findIndex((d) => d.socket === ws);
    if (index !== -1) {
      this.connectedDevices.splice(index, 1);
    } else {
      console.log("not found");
    }
  }

  public async broadcastQuantity(req: Request, res: Response) {
    const canteenId = req.params.canteenId;
    try {
      const updatedMenuItems = await prisma.menuItem.findMany({
        where: {
          canteenId: canteenId,
        },
      });

      if (!updatedMenuItems || updatedMenuItems.length === 0) {
        res.status(404).json({ message: DISHES_NOT_FOUND });
      } else {
        const data = JSON.stringify({
          type: "UPDATE_MENU_ITEMS",
          payload: updatedMenuItems.map((item: menuItemType) => ({
            //here i did not use the type(MenuItemType) from @repo/db/client coz there is some extra stuff thats giving error
            id: item.id,
            name: item.name,
            remainingStock: item.avilableLimit,
          })),
        });
        if (this.connectedDevices.length > 0) {
          this.connectedDevices.forEach((device) => {
            device.socket.send(data);
          });
          res.status(200).json({ message: BROADCAST_QUANTITY });
        }
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: SERVER_ERROR });
    }
  }
}

export default socketManager;
