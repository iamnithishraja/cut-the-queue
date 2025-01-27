# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL and pnpm 
RUN apt-get update -y && apt-get install -y openssl
RUN npm install -g pnpm

# Copy package files for all workspaces
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY turbo.json ./
COPY packages/db/package*.json ./packages/db/
COPY packages/*/package*.json ./packages/ 
COPY apps/http/package*.json ./apps/http/

# Install dependencies
RUN pnpm install

# Copy all packages 
COPY packages ./packages

#Create builds for all the packages
WORKDIR /app/packages/constants
RUN pnpm run build

WORKDIR /app/packages/db
RUN pnpm add prisma --save-dev
RUN npx prisma generate
RUN pnpm run build

WORKDIR /app/packages/utils
RUN pnpm run build

WORKDIR /app
RUN pnpm install

#Copy app source code
COPY apps/http ./apps/http

# Build the project
RUN npx turbo build

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

# Install OpenSSL and pnpm
RUN apt-get update -y && apt-get install -y openssl
RUN npm install -g pnpm

# Copy package files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/http/package*.json ./

# Install production dependencies
RUN pnpm install --prod

# Copy built assets and packages
COPY --from=builder /app/apps/http/dist ./dist
COPY --from=builder /app/packages ./packages

# Generate Prisma Client in production
WORKDIR /app/packages/db
RUN pnpm add prisma --save-dev
RUN npx prisma generate

WORKDIR /app

ENV NODE_ENV=production
EXPOSE 80

CMD ["node", "dist/index.js"]