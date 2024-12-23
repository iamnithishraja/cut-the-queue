import express, { Router } from "express";
import {
  register,
  login,
  googleLogin,
  getProfile,
  requestOtp,
  registerPartner,
  submitOtp,
} from "../controllers/userController";
import { isAuthenticatedUser } from "../middlewares/auth";

const userRoute:Router = express.Router();

userRoute.post("/register", register);
userRoute.post("/login", login);
userRoute.post("/google", googleLogin);
userRoute.post("/otp", requestOtp);
userRoute.post("/submitOtp", submitOtp);
userRoute.get("/profile", isAuthenticatedUser, getProfile);


// partner routes
userRoute.post("/registerPartner", isAuthenticatedUser, registerPartner);

export default userRoute;
