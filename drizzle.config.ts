import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Determine which database URL to use based on APP_ENV
const APP_ENV = process.env.APP_ENV || 'development';

let DATABASE_URL: string;

switch (APP_ENV) {
  case 'test':
    DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_test';
    break;
  case 'production':
    DATABASE_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_prod';
    break;
  case 'development':
  case 'local':
  default:
    // development/local
    DATABASE_URL = process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';
}

// TODO: Replace with structured logging - console.log(`📦 Drizzle Kit Configuration`);
// TODO: Replace with structured logging - console.log(`🌍 Environment: ${APP_ENV}`);
// TODO: Replace with structured logging - console.log(`📊 Database: PostgreSQL`);

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/combined-schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
