import express, { Router} from "express";
import { broadcastQuantity, handleOrderHandover } from "../controllers/orderControllers";

const clientRouter: Router = express.Router();

clientRouter.get("/notifyQuantity/:canteenId", broadcastQuantity);
clientRouter.post("/handover/:orderId", handleOrderHandover);

export default clientRouter;
