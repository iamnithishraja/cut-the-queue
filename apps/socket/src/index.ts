import express from "express";
import WebSocket, { WebSocketServer } from "ws";
import socketManager from "./socketManager";
import clientRouter from "./routes/orderRoutes";
import cors from "cors";
import "dotenv/config";

const app = express();
const socketInstance = socketManager.getInstance();
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
  console.log("A user connected");
  ws.on("message", (data: string) => {
    const parsedData = JSON.parse(data);
    if (parsedData.type === "init") {
      socketInstance.addDevices(ws, parsedData.id);
    }
  });

  ws.on("close", () => {
    const socket = ws;
    socketInstance.removeDevice(socket);
  });
});
