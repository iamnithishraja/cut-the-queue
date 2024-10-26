import express from "express";
import socketManager from "../utils/socketManager";
import { Request, Response } from "express";

const socketInstance = socketManager.getInstance();
const clientRouter = express.Router();

clientRouter.get(
  "/updateQuantity/:canteenId",
  (req: Request, res: Response) => {
    socketInstance.broadcastQuantity(req, res);
  }
);

export default clientRouter;
