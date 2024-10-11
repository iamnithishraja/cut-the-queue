import jwt, { JwtPayload } from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { CustomRequest } from "../types/userTypes";
import prisma from "@repo/db/client";
import "dotenv/config";
import {
  SERVER_ERROR,
  USER_ALREADY_EXISTS,
  USER_NOT_REGISTERED,
  USER_NOT_VERIFIED,
} from "@repo/constants";

export async function isAuthenticatedUser(
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: USER_NOT_REGISTERED });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: USER_NOT_REGISTERED });
      return;
    }

    const decoded_data = jwt.verify(
      token,
      process.env.JWT_SECRET || ""
    ) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: {
        id: decoded_data.id,
      },
    });

    if (!user) {
      res.status(404).json({ message: USER_ALREADY_EXISTS });
      return;
    }
    if (!user.isVerified) {
      res.status(408).json({ message: USER_NOT_VERIFIED });
      return;
    }

    req.user = user;
    next();
  } catch (e: unknown) {
    console.error(e);
    res.status(500).json({ message: SERVER_ERROR });
  }
}
