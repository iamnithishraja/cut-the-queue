# Socket Folder - Real-Time Updates Using WebSockets and Redis Pub/Sub

## Overview

The `socket` folder is responsible for managing real-time updates in your application using WebSockets. It achieves scalability and message distribution across multiple instances using Redis Pub/Sub. This folder provides an efficient and scalable way to handle real-time communication, ensuring that updates are pushed to all connected clients instantly.

## Key Features
- **Real-Time Updates**: The WebSocket protocol is used to push real-time updates to clients.
- **Scalability with Redis**: To ensure scalability and to handle a large number of clients, Redis Pub/Sub is used to propagate messages across multiple instances of the server.
- **Environment Setup**: The environment variables must be properly loaded to ensure smooth operation.

## Setup and Requirements

### 1. Build Constants
Before running the server, you must first build the constants that are located in the `packages` folder. These constants contain configuration and environment values required for the operation of the WebSocket server.

```bash
# Navigate to the `packages` folder and build constants
# This ensures that all necessary constants are available for the socket server.
npm run build --workspace @repo/constants
```

### 2. Generate Prisma Client
The Prisma client is required for interacting with the database. You need to generate the Prisma client before starting the server.

```bash
# Generate the Prisma client
npx prisma generate
```

### 3. Ensure Environment Variables are Loaded
Make sure that all necessary environment variables are correctly loaded before running the server. This includes configurations for Redis, WebSocket, and other services. The `.env` file should be present in the root of your project.

### 4. Install Dependencies

Make sure all the dependencies are installed by running the following command:

```bash
npm install
```

## Available Scripts

The `socket` folder includes several npm scripts for different stages of development and production:

### 1. `npm run dev`
This script will run the WebSocket server in development mode. It uses `nodemon` to automatically restart the server on file changes.

```bash
npm run dev
```

### 2. `npm run start`
This script will start the production build of the WebSocket server. Make sure you have already built the server using `npm run build`.

```bash
npm run start
```

### 3. `npm run build`
This script will compile TypeScript files and output them to the `dist` folder.

```bash
npm run build
```

### 4. `npm run test`
This script is a placeholder for testing. Currently, no test setup is defined.

```bash
npm run test
```

## Dependencies

This project relies on the following dependencies:

- **@repo/constants**: Contains configuration constants used throughout the project.
- **@repo/db**: Database-related functionalities.
- **@repo/typescript-config**: Shared TypeScript configurations.
- **@repo/utils**: Utility functions used across the project.
- **@types/jsonwebtoken**: TypeScript definitions for JWT.
- **@types/redis**: TypeScript definitions for Redis.
- **dotenv**: Loads environment variables from a `.env` file.
- **jsonwebtoken**: For encoding and decoding JWT tokens.
- **ws**: WebSocket library used for real-time communication.
- **zod**: Type validation library.

### Development Dependencies:
- **@types/dotenv**: TypeScript definitions for the `dotenv` library.
- **@types/ws**: TypeScript definitions for the `ws` WebSocket library.

## How It Works

1. **WebSocket Connections**: The server listens for WebSocket connections. When a client connects, the server starts a WebSocket communication channel to send and receive messages in real time.

2. **Redis Pub/Sub for Scalability**: Redis Pub/Sub is used to broadcast messages across multiple instances of the WebSocket server. When a message is received, it is published to a Redis channel, and other instances of the server that are subscribed to the channel will receive and broadcast the message to their connected clients.

3. **Environment Configuration**: The WebSocket server requires the proper environment variables (such as Redis configurations, JWT secrets, etc.) to be loaded from the `.env` file.

## Notes

- Ensure that Redis is properly set up and running in your environment, as it plays a crucial role in message distribution.
- Always check that the necessary environment variables are correctly set before starting the server.

---

By following these instructions, you should be able to run and scale the real-time WebSocket server with Redis Pub/Sub efficiently.