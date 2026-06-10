import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/rbhms';
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
  dialectOptions: process.env.DATABASE_URL ? {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  } : {},
});

const redactedDbUrl = databaseUrl.replace(/:\/\/[^:]+:[^@]+@/, '://<user>:<password>@');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDB = async (maxRetries = 5) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      console.log(`Attempting PostgreSQL connection (${attempt}/${maxRetries}) to`, redactedDbUrl);
      await sequelize.authenticate();
      console.log('PostgreSQL Connected via Sequelize.');
      return;
    } catch (error) {
      lastError = error;
      console.error(`PostgreSQL connection attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        const waitMs = attempt * 3000;
        console.log(`Retrying in ${waitMs / 1000}s...`);
        await sleep(waitMs);
      }
    }
  }

  throw lastError;
};

export default sequelize;
