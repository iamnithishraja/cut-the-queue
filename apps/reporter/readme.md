# Reporter

## Overview
The `reporter` project allows you to fetch and process data within a specified date range. It is designed to work seamlessly with a Prisma client connected to your database, and it outputs the necessary data based on the range you provide. The project utilizes several dependencies to run, including `node-cron` for scheduling, `xlsx` for data export, and `decimal.js` for precise numerical operations.

Before running this, ensure the following steps are completed:

## Setup Instructions

1. **Generate Prisma Client for Database:**
   - First, navigate to the `packages` folder and run the appropriate commands to generate the Prisma client for your database. This is essential for the reporter to fetch data from the database.
   - Example: 
     ```bash
     npx prisma generate
     ```

2. **Load `.env` File:**
   - Ensure that the `.env` file is correctly set up and loaded in the database folder (or in any other folder required by the project). This file should contain the necessary environment variables for database connection and other configurations.

3. **Install Dependencies:**
   - To install the required dependencies, run:
     ```bash
     npm install
     ```

4. **Check Database Connection:**
   - Verify that your database is connected properly and accessible to the reporter service. The application relies on data from the connected database to generate the reports.

## Available Scripts

These are the predefined scripts available in this project. Do **not** add or modify any scripts apart from these:

- **dev**: 
  - Starts the application in development mode using `nodemon` to auto-restart the application when files are changed.
  ```bash
  npm run dev
  ```

- **start**: 
  - Runs the built application in production mode.
  ```bash
  npm run start
  ```

- **build**: 
  - Builds the application by compiling the TypeScript files into JavaScript.
  ```bash
  npm run build
  ```

## Dependencies

### Dev Dependencies:
- **@repo/db**: Used for the database connection.
- **@repo/typescript-config**: TypeScript configuration for the project.
- **@types/node**: Provides TypeScript types for Node.js.
- **nodemon**: A utility that monitors for file changes and automatically restarts the server.
- **typescript**: TypeScript compiler for building the application.

### Dependencies:
- **decimal.js**: A library for precise decimal arithmetic.
- **node-cron**: A cron-like job scheduler for Node.js, useful for automating tasks.
- **xlsx**: A library for parsing and writing Excel files (XLSX format).

## How It Works

- The `reporter` is responsible for fetching data from the database within a given range of days. You will need to provide the date range as input when using the reporter.
- The data will be processed, and you can choose to output it in the desired format (such as an Excel sheet).

## Troubleshooting

- **Error: Prisma client not generated**
  - Ensure you have run `npx prisma generate` in the `packages` folder to generate the necessary Prisma client.
  
- **Error: Environment variables not set**
  - Ensure the `.env` file is properly loaded, containing the correct database connection settings.

## Conclusion
The `reporter` project helps you fetch and process data between specified date ranges, leveraging Prisma for database access and other libraries for data manipulation and output. By following the setup instructions and running the available scripts, you'll be able to generate the required reports efficiently.

If you have any issues or questions, please refer to the troubleshooting section or reach out for support.