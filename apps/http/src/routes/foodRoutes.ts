import express from "express";
import {
  register,
  login,
  googleLogin,
  getProfile,
} from "../controllers/userController";
import { isAuthenticatedUser } from "../middlewares/auth";

const food = express.Router();
