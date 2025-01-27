# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL and required build dependencies
RUN apt-get update -y && \
    apt-get install -y openssl

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace package files maintaining directory structure
COPY packages/db/package*.json ./packages/db/
COPY packages/*/package*.json ./packages/
COPY apps/consumers/package*.json ./apps/consumers/

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY packages ./packages
COPY apps/consumers ./apps/consumers

# Generate Prisma Client (with explicit Prisma installation)
WORKDIR /app/packages/db
RUN npm install prisma --save-dev
RUN npx prisma generate

# Return to app root and build
WORKDIR /app
RUN npx turbo build --filter=consumers...

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

# Install OpenSSL
RUN apt-get update -y && \
    apt-get install -y openssl

# Copy package files and install production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/consumers/package*.json ./apps/consumers/
RUN npm install

# Copy built assets
COPY --from=builder /app/apps/consumers/dist ./dist
COPY --from=builder /app/packages ./packages

# Generate Prisma Client in production (with explicit Prisma installation)
WORKDIR /app/packages/db
RUN npm install prisma --save-dev
RUN npx prisma generate

# Return to app root
WORKDIR /app

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]