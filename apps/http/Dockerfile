#has some errors

# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /monorepo

# Install global dependencies
RUN npm install -g pnpm typescript

# Copy root configuration files
COPY ../../package.json ./
COPY ../../pnpm-*.yaml ./
COPY ../../tsconfig.json ./

# Copy the entire packages and apps directory (this includes all workspaces)
COPY ../../packages ./packages
COPY ../../apps ./apps

# Install dependencies for all packages (in a single step)
# Build all packages
RUN pnpm --filter ./packages/** build
RUN pnpm --filter ./apps/http install
RUN pnpm --filter ./apps/http build

# Stage 2: Final Image
FROM node:20-slim

WORKDIR /app

# Copy the built files and node_modules from the builder stage
COPY --from=builder /monorepo/apps/http/dist ./dist
COPY --from=builder /monorepo/node_modules ./node_modules

# Ensure the required environment variables are set
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the app
ENTRYPOINT ["node", "dist/index.js"]
