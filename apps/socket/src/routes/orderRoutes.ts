import express from "express";
import { broadcastQuantity, handleOrderHandover } from "../controllers/orderControllers";

const clientRouter = express.Router();

clientRouter.get("/notifyQuantity/:canteenId", broadcastQuantity);
clientRouter.post("/handover/:orderId", handleOrderHandover);

export default clientRouter;
