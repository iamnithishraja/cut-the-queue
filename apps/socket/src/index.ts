import cors from "cors";
import "dotenv/config";
import express from "express";
import WebSocket, { WebSocketServer } from "ws";
import clientRouter from "./routes/orderRoutes";
import { socketMessageSchema } from "./schemas/validationSchemas";
import { addDevice, removeDevice, setScreenActive } from "./socketManager";
import { verifyAndGetUser } from "@repo/utils";

const app = express();

app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	})
);

app.get("/", () => {
	console.log("Hello World");
});

app.use("/api/v1", clientRouter);

const httpServer = app.listen(process.env.PORT, () => {
	console.log(`Server is running on port ${process.env.PORT}`);
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws: WebSocket) => {
	let userId: string | null = null;
	let userRole: string | null = null;
	let canteenId: string | null = null;

	ws.on("message", async (data: string) => {
		try {
			const parsedData = JSON.parse(data);
			const validatedData = socketMessageSchema.parse(parsedData);

			switch (validatedData.type) {
				case "init": {
					const user = await verifyAndGetUser(validatedData.token);
					userId = user.id;
					userRole = user.role;
					canteenId = validatedData.id;
					
					addDevice(ws, user, canteenId);
					break;
				}
				case "subscribe":
				case "unsubscribe": {
					if (!userId || !canteenId || !userRole) {
						ws.send(JSON.stringify({ error: "Not initialized" }));
						return;
					}
					
					const success = setScreenActive(
						userId,
						validatedData.screen,
						validatedData.type === "subscribe",
						canteenId,
						userRole
					);

					if (!success) {
						ws.send(JSON.stringify({ error: "User not authorized to access" }));
					}
					break;
				}
			}
		} catch (error) {
			console.error(error);
			ws.send(
				JSON.stringify({ error: "Invalid message or authentication failed" })
			);
		}
	});

	// This close handler is also scoped to this specific connection
	ws.on("close", () => {
		if (userId && userRole && canteenId) {
			removeDevice(userId, userRole, canteenId);
		}
	});
});
