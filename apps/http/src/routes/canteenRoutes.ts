import { isAuthenticatedUser } from "../middlewares/auth";
import express from 'express';
import { getAllCanteen, getAllDishes } from "../controllers/canteenController";

const canteenRoutes=express.Router();

canteenRoutes.get('/getAllDishes/:canteenId',getAllDishes);
canteenRoutes.get('/getAllCanteen',getAllCanteen);
//didnt add isauthenticated as u said
 
export default canteenRoutes