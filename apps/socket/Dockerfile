# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl

# Copy package files for all workspaces
COPY package*.json ./
COPY turbo.json ./
COPY packages/db/package*.json ./packages/db/
COPY packages/*/package*.json ./packages/
COPY apps/socket/package*.json ./apps/socket/

# Install dependencies
RUN npm install

# Copy all packages and app source code
COPY packages ./packages
COPY apps/socket ./apps/socket

# Generate Prisma Client
WORKDIR /app/packages/db
RUN npm install prisma --save-dev
RUN npx prisma generate

# Build the project
WORKDIR /app
RUN npx turbo build

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl

# Copy package files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/socket/package*.json ./

# Install production dependencies
RUN npm install

# Copy built assets and packages
COPY --from=builder /app/apps/socket/dist ./dist
COPY --from=builder /app/packages ./packages

# Generate Prisma Client in production
WORKDIR /app/packages/db
RUN npm install prisma --save-dev
RUN npx prisma generate

WORKDIR /app

ENV NODE_ENV=production
EXPOSE 80

CMD ["node", "dist/index.js"]