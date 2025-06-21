import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from 'pg';
import { log } from '@/lib/core/debug/server-logger';

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

// Only log initialization once
let hasLoggedInit = false;
if (!hasLoggedInit) {
  hasLoggedInit = true;
  log.info('Initializing database connection', 'DB', { 
    environment: process.env.APP_ENV || 'development',
    isLocal,
    isProduction 
  });
}

// Create pool with settings optimized for Better Auth
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: !isLocal && isProduction ? { rejectUnauthorized: false } : false,
  max: 20, // Increased from 10 to handle Better Auth + app queries
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 10000, // 10 seconds
  // Add statement timeout to prevent long-running queries
  statement_timeout: 30000, // 30 seconds
  // Keep connections alive to avoid reconnection overhead
  allowExitOnIdle: false,
});

// Handle pool errors
pool.on('error', (err) => {
  log.error('Unexpected error on idle client', 'DB', err);
});

// Monitor pool status (disabled to reduce log clutter)
// Uncomment for debugging connection issues
/*
pool.on('connect', () => {
  log.debug('Pool connection established', 'DB', {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  });
});

pool.on('acquire', () => {
  log.debug('Connection acquired from pool', 'DB', {
    idle: pool.idleCount,
    total: pool.totalCount,
    waiting: pool.waitingCount,
  });
});

pool.on('release', () => {
  log.debug('Connection released to pool', 'DB', {
    idle: pool.idleCount,
    total: pool.totalCount,
  });
});
*/

// Log pool status periodically in development (disabled to reduce log clutter)
// Uncomment for debugging connection issues
/*
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    };
    
    // Warn if connection pool is under pressure
    if (stats.waiting > 0 || stats.total >= 18) {
      log.warn('Connection pool pressure detected', 'DB', stats);
    } else {
      log.debug('Pool status', 'DB', stats);
    }
  }, 10000); // Every 10 seconds for better monitoring
}
*/

// Create drizzle instance
const db = drizzlePg(pool);

// Export the pool for Better Auth to use
export { db, pool };

// Only log initialization once
if (!hasLoggedInit) {
  log.info('Database client initialized', 'DB');
}

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