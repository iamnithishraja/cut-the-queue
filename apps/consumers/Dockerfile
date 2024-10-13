FROM node

WORKDIR /app

COPY ./packages/typescript-config ./node_modules/@repo/typescript-config
COPY ./apps/consumers/package*.json ./
COPY ./apps/consumers/tsconfig.json ./

RUN npm install

COPY ./apps/consumers/src ./src
COPY ./apps/consumers/.env ./

RUN npx tsc --build

CMD ["node", "dist/index.js"]
