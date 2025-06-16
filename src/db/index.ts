import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("[DB] DATABASE_URL environment variable is not set");
}

const DATABASE_URL = process.env.DATABASE_URL;
const isLocal = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');

// TODO: Replace with structured logging - console.log("[DB] Connecting to database...");
// TODO: Replace with structured logging - console.log(`[DB] Database type: ${isLocal ? 'Local PostgreSQL' : 'PostgreSQL'}`);

let db: any;

// Always use node-postgres for now to avoid Neon serverless issues
// TODO: Replace with structured logging - console.log("[DB] Using PostgreSQL driver");
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: !isLocal && process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pool configuration
  max: 30, // Maximum number of clients in the pool (increased from 20)
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection
  // Add statement timeout to prevent long-running queries
  statement_timeout: 30000, // 30 seconds
  // Allow some clients to be created without waiting
  allowExitOnIdle: true
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
  // Don't exit the process, just log the error
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

db = drizzlePg(pool);

export { db };
// TODO: Replace with structured logging - console.log("[DB] Database client initialized");

// Export all schemas
export * from './schema';
export * from './healthcare-schema';
// Export organization schemas with explicit names to avoid conflicts
export {
  organization,
  organizationMember,
  organizationCode,
  organizationSettings,
  organizationActivityLog,
  organizationInvitation,
} from './organization-schema';