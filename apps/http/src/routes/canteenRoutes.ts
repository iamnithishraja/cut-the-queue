import { isAuthenticatedUser } from "../middlewares/auth";
import express from "express";
import { getAllCanteen, getAllDishes, calculateAmountForOrder, addMenuItem } from "../controllers/canteenController";

const canteenRoutes = express.Router();

canteenRoutes.get(
  "/getAllDishes/:canteenId",
  isAuthenticatedUser,
  getAllDishes
);
canteenRoutes.get("/getAllCanteen", isAuthenticatedUser, getAllCanteen);
canteenRoutes.post("/calculateAmount", isAuthenticatedUser, calculateAmountForOrder);
canteenRoutes.post("/addMenuItem", isAuthenticatedUser, addMenuItem);

export default canteenRoutes;
