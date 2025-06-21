#!/usr/bin/env bun
/**
 * Database Configuration and Connection Management
 * 
 * Provides:
 * - Centralized database connection handling
 * - Connection pooling and retry logic
 * - Database health checks
 * - Schema validation helpers
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from './environment';
import * as schema from '@/src/db/schema';
import * as healthcareSchema from '@/src/db/healthcare-schema';

// Database connection options
const connectionOptions = {
  max: config.isProduction ? 25 : 5, // Connection pool size
  idle_timeout: config.isProduction ? 20 : 10,
  connect_timeout: 10,
  prepare: false, // Required for some edge runtime environments
};

// Create database connection
let sql: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create database connection
 */
export async function getDatabase() {
  if (!db) {
    sql = postgres(config.databaseUrl, connectionOptions);
    db = drizzle(sql, { 
      schema: { ...schema, ...healthcareSchema },
      logger: config.isDevelopment && !config.isTest
    });
  }
  return db;
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (sql) {
    await sql.end();
    sql = null;
    db = null;
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const db = await getDatabase();
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Wait for database to be ready
 */
export async function waitForDatabase(maxRetries = 30, retryDelay = 1000) {

  for (let i = 0; i < maxRetries; i++) {
    if (await testConnection()) {

      return true;
    }
    
    if (i < maxRetries - 1) {

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw new Error('Failed to connect to database after maximum retries');
}

/**
 * Get database info
 */
export async function getDatabaseInfo() {
  const db = await getDatabase();
  
  const result = await sql`
    SELECT 
      current_database() as database,
      current_user as user,
      version() as version,
      pg_size_pretty(pg_database_size(current_database())) as size
  `;
  
  return result[0];
}

/**
 * Check if tables exist
 */
export async function checkTables() {
  const db = await getDatabase();
  
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
  
  return tables.map(t => t.table_name);
}

/**
 * Database transaction helper
 */
export async function transaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const db = await getDatabase();
  return await db.transaction(callback);
}

/**
 * Reset database (DANGEROUS - for testing only)
 */
export async function resetDatabase() {
  if (config.isProduction) {
    throw new Error('Cannot reset database in production!');
  }

  const db = await getDatabase();
  
  // Get all tables
  const tables = await sql`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  `;
  
  // Drop all tables
  for (const { tablename } of tables) {
    await sql`DROP TABLE IF EXISTS ${sql(tablename)} CASCADE`;
  }

}

/**
 * Run migrations
 */
export async function runMigrations() {
  // This would integrate with your migration tool
  // For now, we'll use drizzle-kit push as example
  const { execSync } = await import('child_process');

  try {
    execSync('bun drizzle-kit push', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: config.databaseUrl
      }
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Database health check
 */
export async function healthCheck() {
  const checks = {
    connection: false,
    tables: false,
    version: '',
    size: ''
  };
  
  try {
    // Test connection
    checks.connection = await testConnection();
    
    // Get database info
    const info = await getDatabaseInfo();
    checks.version = info.version;
    checks.size = info.size;
    
    // Check tables exist
    const tables = await checkTables();
    checks.tables = tables.length > 0;
    
    return {
      healthy: checks.connection && checks.tables,
      checks
    };
  } catch (error) {
    return {
      healthy: false,
      checks,
      error: error.message
    };
  }
}

// Cleanup on exit
if (!config.isTest) {
  process.on('beforeExit', closeDatabase);
  process.on('SIGINT', closeDatabase);
  process.on('SIGTERM', closeDatabase);
}

// Export types
export type Database = NonNullable<typeof db>;
export { schema, healthcareSchema };