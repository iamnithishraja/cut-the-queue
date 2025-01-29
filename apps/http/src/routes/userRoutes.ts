import express from "express";
import {
  forgetPassword,
  getProfile,
  googleLogin,
  login,
  logout,
  register,
  registerPartner,
  requestOtp,
  changePassword,
  submitOtp,
  updateFcmToken,
  verifyOtpAndResetPassword,
} from "../controllers/userController";
import { isAuthenticatedUser } from "../middlewares/auth";

const userRoute = express.Router();

userRoute.post("/register", register);
userRoute.post("/login", login);
userRoute.post("/google", googleLogin);
userRoute.post("/otp", requestOtp);
userRoute.post("/submitOtp", submitOtp);
userRoute.get("/profile", isAuthenticatedUser, getProfile);
userRoute.post("/updateFcmToken", isAuthenticatedUser, updateFcmToken);
userRoute.get("/logout", isAuthenticatedUser, logout);

// Password reset flow
userRoute.post("/password/forgetPassword", forgetPassword);
userRoute.post("/password/reset/:otp", verifyOtpAndResetPassword);
userRoute.post("/password/change", isAuthenticatedUser, changePassword);

// partner routes
userRoute.post("/registerPartner", isAuthenticatedUser, registerPartner);

export default userRoute;
