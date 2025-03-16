import { UserRole } from "@repo/db/client";
import express from "express";
import {
  addMenuItem,
  calculateAmountForOrder,
  editMenuItem,
  getAllCanteen,
  getAllDishes,
  getCanteenAvilabality,
  toggleCanteenAvailability,
} from "../controllers/canteenController";
import { checkRole, isAuthenticatedUser } from "../middlewares/auth";
import { getOrderAnalysis } from "../controllers/canteenController";

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
canteenRoutes.get("/getCanteenAvilabality/:canteenId", getCanteenAvilabality);

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

canteenRoutes.get("/getOrderAnalysis/",isAuthenticatedUser, (req,res,next)=>checkRole(req,res,next,[UserRole.PARTNER]), getOrderAnalysis);

export default canteenRoutes;
