import jwt, { JwtPayload } from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { CustomRequest } from "../../types/userTypes";
import prisma from "@repo/db/client";
import "dotenv/config";
import { SERVER_ERROR, USER_ALREADY_EXISTS, USER_NOT_REGISTERED } from "@repo/constants";

export async function isAuthenticatedUser(
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.token;
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

    req.user = user;
    next();
  } catch (e: unknown) {
    console.error(e);
    res.status(500).json({ message: SERVER_ERROR });
  }
}