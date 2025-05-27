// src/config/database.ts
import { Sequelize } from "sequelize";

const isProduction = process.env.NODE_ENV === "production";
const isRender = process.env.RENDER === "true"; // Add RENDER=true to your .env if deploying to Render

const sequelize = new Sequelize(
  process.env.POSTGRES_DB as string,
  process.env.POSTGRES_USER as string,
  process.env.POSTGRES_PASSWORD as string,
  {
    host: process.env.POSTGRES_HOST || "localhost",
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
    dialect: "postgres",
    dialectOptions: {
      ssl: (isProduction || isRender) ? {
        require: true,
        rejectUnauthorized: false // Needed for Render.com's self-signed certificate
      } : false
    },
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 5, // Maximum retry attempts
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ESOCKETTIMEDOUT/,
        /EHOSTDOWN/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
    }
  }
);

async function connect(maxRetries = 5, initialDelay = 5000) {
  let retries = 0;
  let currentDelay = initialDelay;

  while (retries < maxRetries) {
    try {
      await sequelize.authenticate();
      await sequelize.sync(); // Optional: Add if you want to sync models automatically
      console.log("Database connection established successfully.");
      return;
    } catch (err) {
      retries++;
      console.error(`Database connection failed (attempt ${retries}/${maxRetries})`);

      if (err instanceof Error) {
        console.error("Error details:", {
          message: err.message,
          name: err.name,
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined
        });
      }

      if (retries === maxRetries) {
        console.error("Maximum retry attempts reached. Exiting...");
        process.exit(1);
      }

      currentDelay = initialDelay * Math.pow(2, retries - 1);
      console.log(`Waiting ${currentDelay / 1000} seconds before next retry...`);
      await new Promise((res) => setTimeout(res, currentDelay));
    }
  }
}

export default sequelize;
export { connect };