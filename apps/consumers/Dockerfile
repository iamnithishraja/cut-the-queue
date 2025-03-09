FROM oven/bun:latest
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

# Copy package files first for better caching
COPY package*.json ./
COPY bun.lock ./
COPY packages/*/package*.json ./packages/
COPY apps/consumers/package*.json ./apps/consumers/

COPY packages/ ./packages/

# Install dependencies
RUN bun install

# Copy rest of the source code
COPY apps/consumers/ ./apps/consumers/

# Generate Prisma Client
RUN cd packages/db && bunx prisma generate

WORKDIR /app/apps/consumers
ENV NODE_ENV=production
CMD ["bun", "src/index.ts"]