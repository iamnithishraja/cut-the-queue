import express from "express";
import {
	broadcastMenuItems,
	handleItemCooked
} from "../controllers/orderControllers";

const clientRouter = express.Router();

clientRouter.get("/brodcastMenuItems/:canteenId", broadcastMenuItems);
// clientRouter.post("/handover/:orderId", handleOrderHandover);
clientRouter.get("/itemCooked/:userId", handleItemCooked);
// clientRouter.post("/scan-handover/:order_item_id", handleScanHandover);

export default clientRouter;
