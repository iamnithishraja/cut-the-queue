import express from "express";
import { register, login, googleLogin } from "../controllers/userController";

const userRoute = express.Router();

userRoute.post("/register", register);
userRoute.post("/login", login);
userRoute.post("/google", googleLogin);

export default userRoute;
