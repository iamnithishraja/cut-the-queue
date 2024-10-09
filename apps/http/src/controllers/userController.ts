import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import "dotenv/config";
import { loginSchema, registerSchema } from "../schemas/userSchemas";
import prisma from "@repo/db/client";
import { generateToken } from "@repo/utils";
import z from "zod";
import "dotenv/config";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
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
        OR: [
          {
            email: email,
          },
          { phoneNumber: phoneNo },
        ],
      },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNo,
        password: hashedPassword,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

async function login(req: Request, res: Response): Promise<any> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: email,
          },
          { phoneNumber: email },
        ],
      },
    });
    if (!user || user.password == null) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id);

    res.json({ token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
}

async function googleLogin(req: Request, res: Response): Promise<any> {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    let user = await prisma.user.findFirst({
      where: {
        email: payload.email,
      },
    });
    if (!user) {
      return res.status(400).json({
        message: "User not registered",
      });
    }
    await prisma.user.update({
      data: {
        googleId: token,
      },
      where: {
        email: payload.email,
      },
    });

    const jwtToken = generateToken(user.id);

    res.json({ token: jwtToken });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export { register, login, googleLogin };
