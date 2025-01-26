import { UserRole } from "@repo/db/client";
import express from "express";
import {
	calculateAmountForOrder,
	getAllCanteen,
	getAllDishes,
	toggleCanteenAvailability,
} from "../controllers/canteenController";
import { checkRole, isAuthenticatedUser } from "../middlewares/auth";

const canteenRoutes = express.Router();

canteenRoutes.get(
	"/getAllDishes/:canteenId",
	isAuthenticatedUser,
	getAllDishes
);
canteenRoutes.get("/getAllCanteen", isAuthenticatedUser, getAllCanteen);
canteenRoutes.post(
	"/calculateAmount",
	isAuthenticatedUser,
	calculateAmountForOrder
);
canteenRoutes.get(
	"/toggleCanteenAvailability/:canteenId",
	isAuthenticatedUser,
	(req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]),
	toggleCanteenAvailability
);

export default canteenRoutes;
