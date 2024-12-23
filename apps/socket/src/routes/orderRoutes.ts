import {
	broadcastQuantity,
	handleItemCooked,
	handleOrderHandover,
	handleScanHandover,
} from "../controllers/orderControllers";
import express, { Router} from "express";

const clientRouter: Router = express.Router();

clientRouter.get("/notifyQuantity/:canteenId", broadcastQuantity);
clientRouter.post("/handover/:orderId", handleOrderHandover);
clientRouter.post("/itemCooked/:order_item_id", handleItemCooked);
clientRouter.post("/scan-handover/:order_item_id", handleScanHandover);

export default clientRouter;
