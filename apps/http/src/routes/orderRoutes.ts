import { isAuthenticatedUser } from "../middlewares/auth";
import express from "express";
import { checkout, getAllOrders, paymentVerification } from "../controllers/paymentController";

const orderRouter = express.Router();
orderRouter.route("/checkout").post(isAuthenticatedUser, checkout);
orderRouter.get("/getAllOrders/:canteenId",isAuthenticatedUser,getAllOrders);
orderRouter.route("/paymentverification").post(paymentVerification);

export default orderRouter;