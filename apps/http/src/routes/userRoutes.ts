import express from "express";
import {
  register,
  login,
  googleLogin,
  getProfile,
} from "../controllers/userController";
import { isAuthenticatedUser } from "../middlewares/auth";

const userRoute = express.Router();

userRoute.post("/register", register);
userRoute.post("/login", login);
userRoute.post("/google", googleLogin);
userRoute.get("/profile", isAuthenticatedUser, getProfile);

export default userRoute;
