# Use the official Node.js image
FROM node

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

# Copy the source code
COPY ./src ./src

# Compile TypeScript files
RUN npx tsc --build

# Command to run the service
CMD ["node", "dist/index.js"]
