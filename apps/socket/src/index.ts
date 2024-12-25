import { HttpServer } from './server';
import dotenv from 'dotenv';
dotenv.config();

const server = HttpServer.getInstance();
server.start();