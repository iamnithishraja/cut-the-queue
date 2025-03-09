FROM oven/bun:latest
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

# Copy package files first for better caching
COPY package*.json ./
COPY bun.lock ./
COPY packages/*/package*.json ./packages/
COPY apps/http/package*.json ./apps/http/

COPY packages/ ./packages/

# Install dependencies
RUN bun install

# Copy rest of the source code
COPY apps/http/ ./apps/http/

# Generate Prisma Client
RUN cd packages/db && bunx prisma generate

WORKDIR /app/apps/http
ENV NODE_ENV=production
EXPOSE 80
CMD ["bun", "src/index.ts"]