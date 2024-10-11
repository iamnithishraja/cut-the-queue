import { isAuthenticatedUser } from "../middlewares/auth";
import express from 'express';
import { getAllDishes } from "../controllers/canteenController";

const canteenRoutes=express.Router();

canteenRoutes.get('/getAllDishes/:canteenId',getAllDishes);
//didnt add isauthenticated as u said
 
export default canteenRoutes