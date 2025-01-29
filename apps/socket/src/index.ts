import { WsServer } from './WsServer';
import dotenv from 'dotenv';
dotenv.config();

const server = WsServer.getInstance();
server.start();