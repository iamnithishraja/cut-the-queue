import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import { USER_NOT_REGISTERED, USER_NOT_VERIFIED } from "@repo/constants";
import prisma from "@repo/db/client";
dotenv.config();

export function verifyToken(token: string): string {
	if (!token) {
		throw new Error(USER_NOT_REGISTERED);
	}
    
	const decodedData = jwt.verify(token, process.env.JWT_SECRET || "your-secret") as JwtPayload;
	if (!decodedData.userId) {
		throw new Error(USER_NOT_REGISTERED);
	}

	return decodedData.userId;
}

export async function getVerifiedUser(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});
	const allusrs = await prisma.user.findMany();
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
