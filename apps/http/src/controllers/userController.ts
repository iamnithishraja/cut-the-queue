import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import "dotenv/config";
import { loginSchema, registerSchema } from "../schemas/userSchemas";
import prisma from "@repo/db/client";
import { generateToken } from "@repo/utils";
import z from "zod";
import {
  INVALID_CREDENTIALS,
  INVALID_GOOGLE_TOKEN,
  INVALID_INPUT,
  SERVER_ERROR,
  USER_ALREADY_EXISTS,
  USER_NOT_REGISTERED,
} from "@repo/constants";
import { CustomRequest } from "../../types/userTypes";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const SALT_ROUNDS = 10;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { firstName, lastName, email, phoneNo, password } =
      registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { phoneNumber: phoneNo }],
      },
    });
    if (existingUser) {
      return res.status(400).json({ message: USER_ALREADY_EXISTS });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNo,
        password: hashedPassword,
      },
    });

    const token = generateToken(newUser.id);
    res.status(201).json({ user: newUser, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: INVALID_INPUT, errors: error.errors });
    } else {
      res.status(500).json({ message: SERVER_ERROR });
    }
  }
};

const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { phoneNumber: email }],
      },
    });
    if (!user || user.password == null) {
      return res.status(400).json({ message: INVALID_CREDENTIALS });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: INVALID_CREDENTIALS });
    }

    const token = generateToken(user.id);
    res.json({ token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: INVALID_INPUT, errors: error.errors });
    } else {
      res.status(500).json({ message: SERVER_ERROR });
    }
  }
};

const googleLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: INVALID_GOOGLE_TOKEN });
    }

    let user = await prisma.user.findFirst({
      where: { email: payload.email },
    });
    if (!user) {
      return res.status(400).json({ message: USER_NOT_REGISTERED });
    }

    await prisma.user.update({
      data: { googleId: token },
      where: { email: payload.email },
    });

    const jwtToken = generateToken(user.id);
    res.json({ token: jwtToken });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR });
  }
};

const getProfile = async (req: CustomRequest, res: Response): Promise<any> => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user?.id,
      },
    });
    if (!user) {
      return res.status(400).json({ message: USER_NOT_REGISTERED });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR });
  }
};

export { register, login, googleLogin, getProfile };
