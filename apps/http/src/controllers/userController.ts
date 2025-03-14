import {
  INVALID_CREDENTIALS,
  INVALID_GOOGLE_TOKEN,
  INVALID_INPUT,
  INVALID_OTP,
  OTP_SENT,
  SERVER_ERROR,
  USER_ALREADY_EXISTS,
  USER_NOT_REGISTERED,
} from "@repo/constants";
import prisma from "@repo/db/client";
import {
  createVerificationMessage,
  generateOTP,
  generateToken,
} from "@repo/utils";
import bcrypt from "bcrypt";
import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import z from "zod";
import { KafkaPublisher } from "../publisher/kafka";
import {
  changePasswordSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  requestOtpSchema,
  submitOtpSchema,
  verifyOtpAndResetPasswordSchema,
  getAllOrdersSchema
} from "../schemas/userSchemas";
import { CustomRequest } from "../types/userTypes";
import { generateRandomStringWithRandomLength, hashString } from "../utils";
import { parse } from "path";

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
        canteenId: true,
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
    const kafkaPublisher = KafkaPublisher.getInstance();
    await kafkaPublisher.publishToKafka("sms", {
      to: "+91" + number,
      content: `${otp}`,
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
        counter: true,
        role: true,
      },
    });
    if (!user) {
      return res.status(400).json({ message: USER_NOT_REGISTERED });
    }
    if (user.role === "PARTNER" && !user.counter) {
      const updatedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          counter: 1,
        },
      });
      user.counter = updatedUser.counter;
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
        id: canteenId,
      },
    });

    if (!canteen) {
      return res.status(400).json({ message: INVALID_CREDENTIALS });
    }
    const isPasswordValid = await bcrypt.compare(
      canteenPassword,
      canteen.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: INVALID_CREDENTIALS });
    }
    const user = await prisma.user.update({
      where: {
        id: req.user!.id,
      },
      data: {
        canteenId: canteen.id,
        role: "PARTNER",
      },
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: SERVER_ERROR });
  }
};

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
    data: { fcmToken },
  });
  res.json({ success: true });
};

async function forgetPassword(req: Request, res: Response): Promise<any> {
  try {
    const { phoneNo } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { phoneNumber: phoneNo },
      select: { id: true, phoneNumber: true, email: true },
    });

    if (!user) {
      return res.status(400).json({ message: USER_NOT_REGISTERED });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: otp,
        expire: otpExpiry,
      },
    });

    const kafkaPublisher = KafkaPublisher.getInstance();
    await kafkaPublisher.publishToKafka("sms", {
      to: "+91" + user.phoneNumber,
      content: `${otp}`,
    });

    return res.json({
      success: true,
      message: OTP_SENT,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: INVALID_INPUT, errors: error.errors });
    }
    return res.status(500).json({ message: SERVER_ERROR });
  }
}

async function resetPassword(req: Request, res: Response): Promise<any> {
  try {
    const { phoneNo, password, confirmPassword } =
      verifyOtpAndResetPasswordSchema.parse(req.body);
    const token = req.params.token;
    if (password !== confirmPassword || !token) {
      return res.status(400).json({ message: "Passwords don't match" });
    }
    const hashedToken = await hashString(token);

    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: phoneNo,
        resetPasswordToken: hashedToken,
        expire: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        isVerified: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: INVALID_OTP });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        expire: null,
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

    const authToken = generateToken(user.id); // renamed from token to authToken
    return res.json({
      token: authToken,
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: INVALID_INPUT, errors: error.errors });
    }
    return res.status(500).json({ message: SERVER_ERROR });
  }
}

const verifyOtp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { phoneNo, otp } = req.body;
    if (!phoneNo || !otp) {
      res.status(400).json({ success: false });
      return;
    }
    const user = await prisma.user.findUnique({
      where: {
        phoneNumber: phoneNo,
        otp: otp,
      },
    });
    if (!user) {
      return res.status(401).json({ message: INVALID_OTP });
    }
    const token = generateRandomStringWithRandomLength();
    const hashedToken = await hashString(token);
    await prisma.user.update({
      where: {
        phoneNumber: phoneNo,
      },
      data: {
        resetPasswordToken: hashedToken,
      },
    });
    res.json({ token });
  } catch (error) {
    return res.status(500).json({ message: SERVER_ERROR });
  }
};
async function changePassword(req: CustomRequest, res: Response): Promise<any> {
  try {
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return res.status(400).json({ message: INVALID_CREDENTIALS });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: INVALID_CREDENTIALS });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: INVALID_INPUT, errors: error.errors });
    }
    return res.status(500).json({ message: SERVER_ERROR });
  }
}

const updatePhoneNumber = async (
  req: CustomRequest,
  res: Response
): Promise<any> => {
  try {
    const { phoneNumber } = req.body;

    // Validate phone number format
    const phoneNumberRegex = /^[0-9]{10}$/;
    if (!phoneNumber || !phoneNumberRegex.test(phoneNumber)) {
      return res.status(400).json({
        message: INVALID_INPUT,
        details: "Phone number must be 10 digits",
      });
    }

    // Ensure user exists and get their current data
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!currentUser) {
      return res.status(404).json({ message: USER_NOT_REGISTERED });
    }

    // Check if phone number is already in use
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber },
    });
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ message: USER_ALREADY_EXISTS });
    }

    const otp = generateOTP();

    // Update user with new phone number and OTP
    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber,
        otp,
        isVerified: false, // Reset verification status for new number
      },
    });

    // Send OTP via Kafka
    try {
      const kafkaPublisher = KafkaPublisher.getInstance();
      await kafkaPublisher.publishToKafka("sms", {
        to: "+91" + phoneNumber,
        content: `${otp}`,
      });
    } catch (kafkaError) {
      console.error("Kafka publishing error:", kafkaError);
      // Rollback the phone number update
      await prisma.user.update({
        where: { id: userId },
        data: {
          phoneNumber: currentUser.phoneNumber,
          otp: null,
          isVerified: currentUser.isVerified,
        },
      });
      throw new Error("Failed to send OTP");
    }

    return res.status(200).json({ message: OTP_SENT });
  } catch (error) {
    console.error("Update phone number error:", error);
    return res.status(500).json({
      message: SERVER_ERROR,
      details:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

const deleteAccount = async (
  req: CustomRequest,
  res: Response
): Promise<any> => {
  try {
    const { password } = deleteAccountSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, password: true },
    });

    if (!user) {
      return res.status(400).json({ message: USER_NOT_REGISTERED });
    }

    if (!user.password) {
      return res.status(400).json({ message: INVALID_CREDENTIALS });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: INVALID_CREDENTIALS });
    }

    await prisma.user.delete({
      where: { id: req.user!.id },
    });

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: INVALID_INPUT, errors: error.errors });
    }
    return res.status(500).json({ message: SERVER_ERROR });
  }
};

const getAllOrders = async (
  req: CustomRequest,
  res: Response
): Promise<any> => {
  try {
    const { page } = getAllOrdersSchema.parse(req.params);
	if(!page){
		return res.status(400).json({ message: "Invalid page number" });
	}
    const pageNum = parseInt(page , 10);
    const id = req.user?.canteenId;
    if (!id) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ message: "Invalid page number" });
    }
    const transactions = await prisma.order.findMany({
      where: {
        userId: id,
      },
      take: 5+5,
      skip: 5 * (pageNum - 1),
      orderBy: {
        createdAt: "desc",
      },
	 
    });
	const isMore= transactions.length>5;
	const paginatedOrders=transactions.slice(0,5);
	res.status(200).json({transactions:paginatedOrders,hasNext:isMore});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: SERVER_ERROR });
  }
};

export {
  changePassword,
  deleteAccount,
  forgetPassword,
  getProfile,
  googleLogin,
  login,
  logout,
  register,
  registerPartner,
  requestOtp,
  resetPassword,
  submitOtp,
  updateFcmToken,
  updatePhoneNumber,
  verifyOtp,
  getAllOrders ,
};
