import express from "express";
import {
	broadcastQuantity,
	handleItemCooked,
	handleOrderHandover,
	handleScanHandover,
} from "../controllers/orderControllers";

const clientRouter = express.Router();

clientRouter.get("/notifyQuantity/:canteenId", broadcastQuantity);
clientRouter.post("/handover/:orderId", handleOrderHandover);
clientRouter.post("/itemCooked/:order_item_id", handleItemCooked);
clientRouter.post("/scan-handover/:order_item_id", handleScanHandover);

export default clientRouter;
