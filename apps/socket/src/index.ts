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

	ws.on("message", async (data: string) => {
		try {
			const parsedData = JSON.parse(data);
			const validatedData = socketMessageSchema.parse(parsedData);

			switch (validatedData.type) {
				case "init": {
					const user = await verifyAndGetUser(validatedData.token);
					userId = user.id;
					userRole = user.role;
					addDevice(ws, user);
					break;
				}
				case "subscribe": {
					if (!userId) {
						ws.send(JSON.stringify({ error: "Not initialized" }));
						return;
					}
					setScreenActive(userId, validatedData.screen, true);
					break;
				}
				case "unsubscribe": {
					if (!userId) {
						ws.send(JSON.stringify({ error: "Not initialized" }));
						return;
					}
					setScreenActive(userId, validatedData.screen, false);
					break;
				}
			}
		} catch (error) {
			ws.send(
				JSON.stringify({ error: "Invalid message or authentication failed" })
			);
		}
	});

	ws.on("close", () => {
		if (userId && userRole) {
			removeDevice(userId, userRole);
		}
	});
});
