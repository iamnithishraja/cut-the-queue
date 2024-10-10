import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { CustomRequest } from "../types/userTypes";
import prisma from "@repo/db/client";
import "dotenv/config";

export async function isAuthenticatedUser(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.json({ success: false, message: "please login" });
    } else {
      const decoded_data = jsonwebtoken.verify(
        token,
        process.env.JWT_SECRET || ""
      ) as JwtPayload;
      req.user = await prisma.user.findUnique({
        where: {
          id: decoded_data.id,
        },
      });
      if (!req.user) {
        res.json({ success: false, message: "please login" });
      }
      next();
    }
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
}
