import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import { USER_NOT_REGISTERED, USER_NOT_VERIFIED } from "@repo/constants";
import prisma from "@repo/db/client";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
interface OtpRequestType {
	otp: string;
	reqType: "verification" | "passwordReset";
}

export function generateToken(userId: string): string {
	return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "365d" });
}

export function generateOTP(): string {
	return Math.floor(1000 + Math.random() * 9000).toString();
}

export function createVerificationMessage({otp,reqType}:OtpRequestType): string {
	if(reqType === "verification"){
		return `Cut the Q: Verify yourself with this OTP: ${otp}. Skip the wait, join the revolution!`;
	}
	else if(reqType === "passwordReset"){
		return `Cut the Q: Reset your password with this OTP: ${otp}.`;
	}
	else{
		return `Cut the Q: Message type unknown, OTP ${otp}.`;
	}
}
