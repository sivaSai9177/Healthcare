import { drizzle } from "drizzle-orm/neon-http";

if (!process.env.DATABASE_URL) {
  throw new Error("[DB] DATABASE_URL environment variable is not set");
}

console.log("[DB] Connecting to database...");
export const db = drizzle(process.env.DATABASE_URL);
console.log("[DB] Database client initialized");

