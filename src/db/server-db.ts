/**
 * Server-side database connection without React Native dependencies
 * Used by Docker services (email, websocket, etc.)
 */

import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Simple console logger for server environment
const log = {
  info: (message: string, context?: string, data?: any) => {

  },
  error: (message: string, context?: string, error?: any) => {
    console.error(`[ERROR] [${context || 'DB'}] ${message}`, error || '');
  },
  debug: (message: string, context?: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {

    }
  }
};

if (!process.env.DATABASE_URL) {
  throw new Error("[DB] DATABASE_URL environment variable is not set");
}

// Get database URL based on environment
const getDatabaseUrl = () => {
  const appEnv = process.env.APP_ENV || 'development';
  
  switch (appEnv) {
    case 'test':
      return process.env.TEST_DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_test';
    case 'production':
      return process.env.PROD_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_prod';
    default:
      return process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';
  }
};

const DATABASE_URL = getDatabaseUrl();
const isLocal = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
const isProduction = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';

log.info('Connecting to database', 'DB', { 
  environment: process.env.APP_ENV || 'development',
  isLocal,
  isProduction 
});

let db: any;

// Always use node-postgres for now to avoid Neon serverless issues
log.info('Using PostgreSQL driver', 'DB');
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: !isLocal && isProduction ? { rejectUnauthorized: false } : false,
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
  log.error('Unexpected error on idle client', 'DB', err);
  // Don't exit the process, just log the error
});

// Monitor pool status (disabled to reduce log clutter)
// Uncomment for debugging connection issues
/*
let lastPoolCheck = Date.now();
pool.on('connect', (client) => {
  const now = Date.now();
  if (now - lastPoolCheck > 60000) { // Log every minute
    log.info('Pool status', 'DB', {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    });
    lastPoolCheck = now;
  }
});
*/

// Log when connections are acquired/released in development (disabled to reduce log clutter)
// Uncomment for debugging connection issues
/*
if (process.env.NODE_ENV === 'development') {
  pool.on('acquire', () => {
    log.debug('Connection acquired from pool', 'DB', {
      idle: pool.idleCount,
      total: pool.totalCount,
    });
  });
  
  pool.on('remove', () => {
    log.debug('Connection removed from pool', 'DB', {
      idle: pool.idleCount,
      total: pool.totalCount,
    });
  });
}
*/

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
log.info('Database client initialized', 'DB');

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