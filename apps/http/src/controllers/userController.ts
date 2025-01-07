import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import "dotenv/config";
import {
  loginSchema,
  registerSchema,
  requestOtpSchema,
  submitOtpSchema,
} from "../schemas/userSchemas";
import prisma from "@repo/db/client";
import {
  createVerificationMessage,
  generateOTP,
  generateToken,
} from "@repo/utils";
import z from "zod";
import {
  INVALID_CREDENTIALS,
  INVALID_GOOGLE_TOKEN,
  INVALID_INPUT,
  SERVER_ERROR,
  USER_ALREADY_EXISTS,
  USER_NOT_REGISTERED,
  INVALID_OTP,
  OTP_VERIFICATION_SUCCESSFUL,
  OTP_SENT,
} from "@repo/constants";
import { CustomRequest } from "../types/userTypes";
import KafkaProducer from "../publisher/kafka";

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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userProfile: true,
        email: true,
        phoneNumber: true,
        isVerified: true,
        role: true,
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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userProfile: true,
        email: true,
        phoneNumber: true,
        isVerified: true,
        role: true,
        password: true,
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
    user.password = null;
    res.status(200).json({ user, token });
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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userProfile: true,
        email: true,
        phoneNumber: true,
        isVerified: true,
        role: true,
      },
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

const requestOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { number } = requestOtpSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: {
        phoneNumber: number,
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      res.status(400).json({ message: USER_NOT_REGISTERED });
      return;
    }

    const otp = generateOTP();
    await prisma.user.update({
      where: {
        phoneNumber: number,
      },
      data: {
        otp: otp,
      },
    });
    const message = createVerificationMessage(otp);
    const kafkaProducer = new KafkaProducer(process.env.KAFKA_CLIENT_ID || "");
    await kafkaProducer.publishToKafka("email", {
      to: user.email,
      subject: "Your OTP for verification",
      content: message,
    });
    res.status(200).json({ message: OTP_SENT });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      console.error("Error in requestOtp:", error);
      res.status(500).json({ message: SERVER_ERROR });
    }
  }
};

const submitOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { number, otp } = submitOtpSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: {
        phoneNumber: number,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userProfile: true,
        email: true,
        phoneNumber: true,
        isVerified: true,
        role: true,
        otp: true,
      },
    });
    if (!user) {
      return res.status(400).json({ message: USER_NOT_REGISTERED });
    }
    if (user.otp !== otp) {
      return res.status(401).json({ message: INVALID_OTP });
    }
    const updatedUser = await prisma.user.update({
      where: {
        phoneNumber: number,
      },
      data: {
        isVerified: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userProfile: true,
        email: true,
        phoneNumber: true,
        isVerified: true,
        role: true,
      },
    });
    res.status(200).json(updatedUser);
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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userProfile: true,
        canteenId: true,
        email: true,
        phoneNumber: true,
        isVerified: true,
        role: true,
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

const registerPartner = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { canteenId, canteenPassword } = req.body;
    if (!canteenId || !canteenPassword) {
      return res.status(400).json({ message: INVALID_CREDENTIALS });
    }
    const canteen = await prisma.canteen.findUnique({
      where: {
        id: canteenId
      }
    });

    if (!canteen) {
      return res.status(400).json({ message: INVALID_CREDENTIALS });
    }
    const isPasswordValid = await bcrypt.compare(canteenPassword, canteen.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: INVALID_CREDENTIALS });
    }
    const user = await prisma.user.update({
      where: {
        id: req.user!.id
      },
      data: {
        canteenId: canteen.id,
        role: "PARTNER"
      }
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: SERVER_ERROR });
  }
}

const logout = async (req: CustomRequest, res: Response): Promise<any> => {
  try {
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR });
  }
};
const updateFcmToken = async (req: CustomRequest, res: Response) => {
  const { fcmToken } = req.body;
  const userId = req.user!.id; 
  await prisma.user.update({
    where: { id: userId },
    data: { fcmToken }
  });
  res.json({ success: true });
}

export { register, login, googleLogin, getProfile, requestOtp, submitOtp, registerPartner, logout, updateFcmToken };
