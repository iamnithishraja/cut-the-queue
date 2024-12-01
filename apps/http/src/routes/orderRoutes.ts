import { checkRole, isAuthenticatedUser } from "../middlewares/auth";
import express from "express";
import { checkout, getAllOrders, getAllOrdersByCanteenId, paymentVerification } from "../controllers/paymentController";
import { UserRole } from "@repo/db/client";
import { changeItemQuantity, changeItemStatus } from "../controllers/adminController";

const orderRouter = express.Router();
orderRouter.route("/checkout").post(isAuthenticatedUser, checkout);
orderRouter.get("/getAllOrders", isAuthenticatedUser, getAllOrders);
orderRouter.route("/paymentverification").post(paymentVerification);

// admin routes
orderRouter.get("/getAllOrdersAdmin", isAuthenticatedUser, (req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]), getAllOrdersByCanteenId)
orderRouter.get("/toogleQuantity", isAuthenticatedUser, (req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]), changeItemStatus);
orderRouter.get("/toogleQuantity", isAuthenticatedUser, (req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]), changeItemQuantity);

export default orderRouter;