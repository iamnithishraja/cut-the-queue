import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { CustomRequest } from "../types/userTypes";
import prisma, { UserRole } from "@repo/db/client";
import "dotenv/config";
import {
  SERVER_ERROR,
  USER_ALREADY_EXISTS,
  USER_NOT_AUTHORISED,
  USER_NOT_REGISTERED,
  USER_NOT_VERIFIED,
} from "@repo/constants";
import dotenv from "dotenv";
dotenv.config();

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

    if (!decoded_data.userId) {
      res.status(404).json({
        message: USER_ALREADY_EXISTS,
      });
      return;
    }
    const user = await prisma.user.findUnique({
      where: {
        id: decoded_data.userId,
      },
    });

    if (!user) {
      res.status(404).json({ message: USER_ALREADY_EXISTS });
      return;
    }
    if (!user.isVerified) {
      res.status(408).json({ message: USER_NOT_VERIFIED, user: user });
      return;
    }

    req.user = user;
    next();
  } catch (e) {
    if (e instanceof JsonWebTokenError) {
      res.status(404).json({
        message: USER_ALREADY_EXISTS,
      });
    } else {
      console.log(e);
    }
  }
}

export async function checkRole(
  req: CustomRequest,
  res: Response,
  next: NextFunction,
  roles: UserRole[]
) {
  if (!req.user) {
    res.status(401).json({ message: USER_NOT_REGISTERED });
    return;
  }
  let isAuthorised = false;
  for (let i = 0; i < roles.length; i++) {
    const role = roles[i]
    if (role === req.user.role) {
      isAuthorised = true;
    }
  }
  if (!isAuthorised) {
    res.status(405).json({ message: USER_NOT_AUTHORISED });
    return;
  }
  next();
}

export async function canRequestOtp(req: CustomRequest, res: Response, next: NextFunction) {
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
    const decoded_data = jwt.verify(token, process.env.JWT_SECRET || "") as JwtPayload;
    if (!decoded_data.userId) {
      res.status(401).json({ message: USER_NOT_REGISTERED });
      return;
    }
    const user = await prisma.user.findUnique({
      where: {
        id: decoded_data.userId,
      },
    });
    if (!user) {
      res.status(401).json({ message: USER_NOT_REGISTERED });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR });
  }
}
