import express from "express";
import {
	broadcastQuantity,
	handleItemCooked,
	handleOrderHandover,
} from "../controllers/orderControllers";

const clientRouter = express.Router();

clientRouter.get("/notifyQuantity/:canteenId", broadcastQuantity);
clientRouter.post("/handover/:orderId", handleOrderHandover);
clientRouter.post("/itemCooked/:order_item_id", handleItemCooked);

export default clientRouter;
