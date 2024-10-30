import express from "express";
import { broadcastQuantity } from "../controllers/orderControllers";

const clientRouter = express.Router();

clientRouter.get("/notifyQuantity/:canteenId", broadcastQuantity);

export default clientRouter;
