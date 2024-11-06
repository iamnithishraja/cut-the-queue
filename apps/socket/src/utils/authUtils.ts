import { USER_NOT_REGISTERED, USER_NOT_VERIFIED } from "@repo/constants";
import prisma from "@repo/db/client";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export function verifyToken(token: string): string {
	if (!token) {
		throw new Error(USER_NOT_REGISTERED);
	}

	const decoded_data = jwt.verify(token, JWT_SECRET) as JwtPayload;

	if (!decoded_data.userId) {
		throw new Error(USER_NOT_REGISTERED);
	}

	return decoded_data.userId;
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
