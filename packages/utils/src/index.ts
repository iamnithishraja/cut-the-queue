import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import { USER_NOT_REGISTERED, USER_NOT_VERIFIED } from "@cut-the-queue/constants";
import prisma from "@cut-the-queue/db/client";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export function generateToken(userId: string): string {
	return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "365d" });
}

export function generateOTP(): string {
	return Math.floor(1000 + Math.random() * 9000).toString();
}

export function createVerificationMessage(otp: string): string {
	return `Cut the Q: Verify yourself with this OTP: ${otp}. Skip the wait, join the revolution!`;
}

export function verifyToken(token: string): string {
	if (!token) {
		throw new Error(USER_NOT_REGISTERED);
	}

	const decodedData = jwt.verify(token, JWT_SECRET) as JwtPayload;

	if (!decodedData.userId) {
		throw new Error(USER_NOT_REGISTERED);
	}

	return decodedData.userId;
}

export async function getVerifiedUser(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		throw new Error(USER_NOT_REGISTERED);
	}
	if (!user.isVerified) {
		throw new Error(USER_NOT_VERIFIED);
	}

	return user;
}

export async function verifyAndGetUser(token: string) {
	const userId = verifyToken(token);
	return await getVerifiedUser(userId);
}
