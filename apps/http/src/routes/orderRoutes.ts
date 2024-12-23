import { checkRole, isAuthenticatedUser } from "../middlewares/auth";
import express, {NextFunction, Response} from "express";
import { checkout, getAllOrders, paymentVerification } from "../controllers/paymentController";
import { UserRole } from "@repo/db/client";
import { updateItem,chageToPickup, getAllOrdersByCanteenId,finishOrder } from "../controllers/adminController";
import { CustomRequest } from "../types/userTypes";

const orderRouter = express.Router();
orderRouter.route("/checkout").post(isAuthenticatedUser, checkout);
orderRouter.get("/getAllOrders", isAuthenticatedUser, getAllOrders);
orderRouter.route("/paymentverification").post(paymentVerification);

// admin routes
orderRouter.get("/getAllOrdersAdmin", isAuthenticatedUser, (req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]), getAllOrdersByCanteenId)
orderRouter.get("/changeToPickup/:orderId",isAuthenticatedUser, (req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]),chageToPickup)
orderRouter.post("/updateItem", isAuthenticatedUser, (req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]), updateItem);
orderRouter.get("/finishOrder/:orderId",isAuthenticatedUser, (req:CustomRequest, res:Response, next:NextFunction) => checkRole(req, res, next, [UserRole.PARTNER]), finishOrder);
export default orderRouter;