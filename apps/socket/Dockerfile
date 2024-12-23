#stage 1
FROM node:20-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/socket/package.json pnpm-lock.yaml ./socket/
COPY packages/*/package.json pnpm-lock.yaml ./packages/

RUN pnpm --filter @cut-the-queue/socket install

COPY packages ./packages
COPY apps/socket ./socket

RUN pnpm --filter @cut-the-queue/socket build

#stage 2
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/socket/dist .

ENV NODE_ENV=production

ENTRYPOINT ["node", "index.js"]s