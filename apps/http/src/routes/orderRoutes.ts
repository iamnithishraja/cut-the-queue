import { checkRole, isAuthenticatedUser } from "../middlewares/auth";
import express, { NextFunction, Response } from "express";
import { checkout, getAllOrders, paymentVerification } from "../controllers/paymentController";
import { UserRole } from "@repo/db/client";
import { updateItem, chageToPickup, getAllOrdersByCanteenId, finishOrder, updateCounter,getOrderDetailsByDay } from "../controllers/adminController";
import { CustomRequest } from "../types/userTypes";
const orderRouter = express.Router();
orderRouter.route("/checkout").post(isAuthenticatedUser, checkout);
orderRouter.get("/getAllOrders", isAuthenticatedUser, getAllOrders);
orderRouter.route("/paymentverification").post(paymentVerification);

// admin routes
orderRouter.get("/getAllOrdersAdmin", isAuthenticatedUser, (req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]), getAllOrdersByCanteenId)
orderRouter.get("/changeToPickup/:orderId", isAuthenticatedUser, (req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]), chageToPickup)
orderRouter.post("/updateItem", isAuthenticatedUser, (req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]), updateItem);
orderRouter.get("/finishOrder/:orderId", isAuthenticatedUser, (req: CustomRequest, res: Response, next: NextFunction) => checkRole(req, res, next, [UserRole.PARTNER]), finishOrder);
orderRouter.put("/updateCounter/:counter", isAuthenticatedUser, (req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]), updateCounter);
orderRouter.get("/getOrderDetailsByDay/:date/:type", isAuthenticatedUser, (req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]), getOrderDetailsByDay);
export default orderRouter;