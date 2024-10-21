import { isAuthenticatedUser } from "../middlewares/auth";
import express from "express";
import { checkout, paymentVerification } from "../controllers/paymentController";

const paymentRouter = express.Router();
paymentRouter.route("/checkout").post(isAuthenticatedUser, checkout);

paymentRouter.route("/paymentverification").post(isAuthenticatedUser, paymentVerification);

export default paymentRouter;