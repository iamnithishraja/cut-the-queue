import express from "express";
import {
	broadcastMenuItems,
	updateUserOrders,
	updateCanteenOrders
} from "../controllers/orderControllers";

const clientRouter = express.Router();

clientRouter.get("/brodcastMenuItems/:canteenId", broadcastMenuItems);
clientRouter.get("/updateUserOrders/:userId", updateUserOrders);
clientRouter.get("/updateCanteenOrders/:canteenId", updateCanteenOrders);

export default clientRouter;
