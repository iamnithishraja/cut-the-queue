import {
	USER_ALREADY_EXISTS,
	USER_NOT_REGISTERED,
	USER_NOT_VERIFIED,
} from "@repo/constants";
import prisma from "@repo/db/client";
import { NextFunction, Response } from "express";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import { CustomRequest } from "../types/userTypes";

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
