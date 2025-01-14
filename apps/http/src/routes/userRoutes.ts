import express from "express";
import {
  register,
  login,
  googleLogin,
  getProfile,
  requestOtp,
  registerPartner,
  submitOtp,
  logout,
  updateFcmToken,
  forgetPassword,
  resetPassword
} from "../controllers/userController";
import { isAuthenticatedUser } from "../middlewares/auth";

const userRoute = express.Router();

userRoute.post("/register", register);
userRoute.post("/login", login);
userRoute.post("/google", googleLogin);
userRoute.post("/otp", requestOtp);
userRoute.post("/submitOtp", submitOtp);
userRoute.get("/profile", isAuthenticatedUser, getProfile);
userRoute.post('/updateFcmToken', isAuthenticatedUser, updateFcmToken);
userRoute.get("/logout", isAuthenticatedUser,logout);
userRoute.put("/password/reset/:token",resetPassword);
userRoute.put('/password/forgetPassword',forgetPassword);

// partner routes
userRoute.post("/registerPartner", isAuthenticatedUser, registerPartner);


export default userRoute;
