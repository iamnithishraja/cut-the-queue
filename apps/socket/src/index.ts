import dotenv from "dotenv";
import "dotenv/config";
import { HttpServer } from "./server";
dotenv.config();

const server = HttpServer.getInstance();
server.start();
