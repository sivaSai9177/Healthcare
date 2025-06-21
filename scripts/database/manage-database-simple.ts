#!/usr/bin/env bun
/**
 * Simple Database Management Script
 * Handles database reset, migrations, health checks, and info
 */

import { db } from '../../src/db/server-db';
import { sql } from 'drizzle-orm';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

// Simple logger
const log = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.log(msg),
  warn: (msg: string) => console.log(msg),
};

interface DatabaseAction {
  action: 'health' | 'info' | 'tables' | 'reset' | 'migrate' | 'push' | 'seed';
  force?: boolean;
  env?: string;
}

// Parse command line arguments
function parseArgs(): DatabaseAction {
  const args = process.argv.slice(2);
  const action = args[0] as DatabaseAction['action'];
  const force = args.includes('--force') || args.includes('-f');
  const envIndex = args.findIndex(arg => arg === '--env');
  const env = envIndex !== -1 ? args[envIndex + 1] : process.env.APP_ENV || 'development';

  if (!action || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  return { action, force, env };
}

function printHelp() {

}

// Database health check
async function checkHealth() {
  log.info('Checking database health...');
  
  try {
    // Test basic connection
    const result = await db.execute(sql`SELECT 1 as health`);
    log.success('Database connection is healthy');
    
    // Check version
    const version = await db.execute(sql`SELECT version()`);

    // Check connection info
    const connInfo = await db.execute(sql`
      SELECT current_database() as database,
             current_user as user,
             inet_server_addr() as host,
             inet_server_port() as port
    `);
    
    const info = connInfo.rows[0];

    return true;
  } catch (error) {
    log.error(`Database health check failed: ${error}`);
    return false;
  }
}

// Show database info
async function showInfo() {
  log.info('Fetching database information...');
  
  try {
    // Database size
    const sizeResult = await db.execute(sql`
      SELECT pg_database_size(current_database()) as size
    `);
    const sizeMB = (Number(sizeResult.rows[0].size) / 1024 / 1024).toFixed(2);
    
    // Table count
    const tableCount = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    // Connection count
    const connCount = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);

  } catch (error) {
    log.error(`Failed to fetch database info: ${error}`);
  }
}

// List all tables
async function listTables() {
  log.info('Listing all tables...');
  
  try {
    const tables = await db.execute(sql`
      SELECT 
        t.table_name,
        t.table_type,
        obj_description(c.oid) as comment,
        pg_size_pretty(pg_total_relation_size(c.oid)) as size,
        COUNT(a.attname) as columns
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
      WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name, t.table_type, c.oid
      ORDER BY t.table_name
    `);

    for (const table of tables.rows) {
      // Get row count
      const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${table.table_name}"`));
      const rowCount = countResult.rows[0].count;
      
      const name = table.table_name.padEnd(28);
      const cols = String(table.columns).padEnd(8);
      const size = (table.size || '0 B').padEnd(8);

    }

  } catch (error) {
    log.error(`Failed to list tables: ${error}`);
  }
}

// Reset database
async function resetDatabase(force: boolean = false) {
  if (!force) {

    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  log.info('Resetting database...');
  
  try {
    // Drop all tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    for (const { table_name } of tables.rows) {
      log.info(`Dropping table: ${table_name}`);
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table_name}" CASCADE`));
    }
    
    log.success('All tables dropped');
    
    // Run migrations
    await pushSchema();
    
    log.success('Database reset complete!');
  } catch (error) {
    log.error(`Failed to reset database: ${error}`);
  }
}

// Run migrations
async function runMigrations() {
  log.info('Running migrations...');
  
  try {
    execSync('bun run db:migrate', { stdio: 'inherit' });
    log.success('Migrations completed');
  } catch (error) {
    log.error(`Migration failed: ${error}`);
  }
}

// Push schema (development)
async function pushSchema() {
  log.info('Pushing schema changes...');
  
  try {
    execSync('bun run db:push', { stdio: 'inherit' });
    log.success('Schema pushed successfully');
  } catch (error) {
    log.error(`Schema push failed: ${error}`);
  }
}

// Seed database
async function seedDatabase() {
  log.info('Seeding database...');
  
  try {
    // First check if we have the healthcare setup
    const orgCount = await db.execute(sql`SELECT COUNT(*) as count FROM organization`);
    
    if (Number(orgCount.rows[0].count) === 0) {
      log.info('No organizations found, running healthcare setup...');
      execSync('bun scripts/users/manage-users.ts setup-healthcare', { stdio: 'inherit' });
    }
    
    // Add any additional seeding here
    log.success('Database seeded successfully!');
    
    // Show what was created
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM "user"`);
    const alertCount = await db.execute(sql`SELECT COUNT(*) as count FROM alert`);

  } catch (error) {
    log.error(`Seeding failed: ${error}`);
  }
}

// Main execution
async function main() {
  const { action, force, env } = parseArgs();

  // Set environment
  if (env) {
    process.env.APP_ENV = env;
    log.info(`Using environment: ${env}`);
  }
  
  try {
    switch (action) {
      case 'health':
        await checkHealth();
        break;
        
      case 'info':
        await showInfo();
        break;
        
      case 'tables':
        await listTables();
        break;
        
      case 'reset':
        await resetDatabase(force);
        break;
        
      case 'migrate':
        await runMigrations();
        break;
        
      case 'push':
        await pushSchema();
        break;
        
      case 'seed':
        await seedDatabase();
        break;
        
      default:
        log.error(`Unknown action: ${action}`);
        printHelp();
        process.exit(1);
    }
    
    log.success('Database management completed successfully!');
  } catch (error) {
    log.error(`Database operation failed: ${error}`);
    process.exit(1);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run the script
main().catch(error => {
  log.error(`Unexpected error: ${error}`);
  process.exit(1);
});