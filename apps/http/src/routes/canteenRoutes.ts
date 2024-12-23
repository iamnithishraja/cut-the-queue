import { isAuthenticatedUser } from "../middlewares/auth";
import express, { Router } from "express";
import { getAllCanteen, getAllDishes } from "../controllers/canteenController";

const canteenRoutes: Router = express.Router();

canteenRoutes.get(
  "/getAllDishes/:canteenId",
  isAuthenticatedUser,
  getAllDishes
);
canteenRoutes.get("/getAllCanteen", isAuthenticatedUser, getAllCanteen);

export default canteenRoutes;
