import { PrismaClient } from "@prisma/client";
import express from "express";
import ws, { WebSocketServer } from "ws";

const app = express();
const PORT = 3000;

const httpServer = app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

const wss = new WebSocketServer({ server: httpServer });

let connectedClients: ws[] = [];

wss.on("connection", (ws) => {
	console.log("A user connected");

	connectedClients.push(ws);

	ws.on("close", () => {
		console.log("A user disconnected");
		connectedClients = connectedClients.filter((client) => client !== ws);
	});
});

const notifyAllClients = (menuItems) => {
	const data = JSON.stringify({
		type: "UPDATE_MENU_ITEMS",
		payload: menuItems.map((item) => ({
			id: item.id,
			name: item.name,
			remainingStock: item.limitPerOrder,
		})),
	});

	connectedClients.forEach((client) => {
		if (client.readyState === 1) {
			client.send(data);
		}
	});
};

const prisma = new PrismaClient();

app.post("/order", async (req, res) => {
	const canteenId = req.body.canteenId;

	try {
		const updatedMenuItems = await prisma.menuItem.findMany({
			where: { canteenId: canteenId },
		});

		if (!updatedMenuItems || updatedMenuItems.length === 0) {
			return res
				.status(404)
				.json({ error: "No menu items found for this canteen" });
		}

		notifyAllClients(updatedMenuItems);

		return res
			.status(200)
			.json({ message: "Order placed and stock updated successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Something went wrong" });
	}
});
