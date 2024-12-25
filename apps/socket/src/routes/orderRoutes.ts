import express from "express";
import {
	broadcastMenuItems
} from "../controllers/orderControllers";

const clientRouter = express.Router();

clientRouter.get("/brodcastMenuItems/:canteenId", broadcastMenuItems);
// clientRouter.post("/handover/:orderId", handleOrderHandover);
// clientRouter.post("/itemCooked/:order_item_id", handleItemCooked);
// clientRouter.post("/scan-handover/:order_item_id", handleScanHandover);

export default clientRouter;
