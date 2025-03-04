import { UserRole } from "@repo/db/client";
import express from "express";
import {
	addMenuItem,
	calculateAmountForOrder,
	editMenuItem,
	getAllCanteen,
	getAllDishes,
	toggleCanteenAvailability,
} from "../controllers/canteenController";
import { checkRole, isAuthenticatedUser } from "../middlewares/auth";

const canteenRoutes = express.Router();

canteenRoutes.get("/getAllDishes/:canteenId", getAllDishes);
canteenRoutes.get("/getAllCanteen", getAllCanteen);
canteenRoutes.post("/calculateAmount", calculateAmountForOrder);
canteenRoutes.get(
	"/toggleCanteenAvailability/:canteenId",
	isAuthenticatedUser,
	(req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]),
	toggleCanteenAvailability
);

canteenRoutes.post(
	"/menuItems",
	isAuthenticatedUser,
	(req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]),
	addMenuItem
);

canteenRoutes.put(
	"/menuItems/:menuItemId",
	isAuthenticatedUser,
	(req, res, next) => checkRole(req, res, next, [UserRole.PARTNER]),
	editMenuItem
);

export default canteenRoutes;
