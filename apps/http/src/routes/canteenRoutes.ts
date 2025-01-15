import { checkRole, isAuthenticatedUser } from "../middlewares/auth";
import express from "express";
import { getAllCanteen, getAllDishes, calculateAmountForOrder,toggleCanteenAvailability } from "../controllers/canteenController";
import { UserRole } from "@repo/db/client";


const canteenRoutes = express.Router();

canteenRoutes.get(
  "/getAllDishes/:canteenId",
  isAuthenticatedUser,
  getAllDishes
);
canteenRoutes.get("/getAllCanteen", isAuthenticatedUser, getAllCanteen);
canteenRoutes.post("/calculateAmount", isAuthenticatedUser, calculateAmountForOrder);
canteenRoutes.get('/toggleCanteenAvailability/:canteenId',isAuthenticatedUser,(req,res,next)=>checkRole(req,res,next,[UserRole.PARTNER ]),toggleCanteenAvailability);

export default canteenRoutes;
