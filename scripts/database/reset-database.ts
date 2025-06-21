#!/usr/bin/env bun
/**
 * Database Reset Script
 * Provides options to reset local or cloud databases with proper safety checks
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { createInterface } from 'readline';
import { initScript, getEnvironmentInfo, getDatabaseUrl } from '../config/utils';
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

const execAsync = promisify(exec);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function resetLocalDatabase() {

  try {
    // Stop and remove containers

    await execAsync('docker-compose -f docker-compose.local.yml down -v');
    
    // Start fresh containers

    await execAsync('docker-compose -f docker-compose.local.yml up -d postgres-local redis-local');
    
    // Wait for database to be ready

    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run migrations

    process.env.APP_ENV = 'local';
    await execAsync('bun drizzle-kit push');

  } catch (error) {
    console.error('❌ Error resetting local database:', error);
    throw error;
  }
}

async function resetCloudDatabase() {

  const confirm = await question('Are you sure? Type "yes" to confirm: ');
  
  if (confirm.toLowerCase() !== 'yes') {

    return;
  }
  
  try {
    // Get list of all tables
    const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    // Drop all tables
    for (const row of tables.rows) {
      const tableName = (row as any).tablename;

      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`));
    }
    
    // Drop custom types

    await db.execute(sql`DROP TYPE IF EXISTS user_role CASCADE`);
    await db.execute(sql`DROP TYPE IF EXISTS alert_type_enum CASCADE`);
    
    // Run migrations

    process.env.APP_ENV = 'development';
    await execAsync('bun drizzle-kit push');

  } catch (error) {
    console.error('❌ Error resetting cloud database:', error);
    throw error;
  }
}

async function main() {

  const env = getEnvironmentInfo();
  Object.entries(env).forEach(([key, value]) => {

  });

  const choice = await question('\nEnter choice [1-4]: ');
  
  switch (choice) {
    case '1':
      await resetLocalDatabase();
      break;
    case '2':
      await resetCloudDatabase();
      break;
    case '3':
      await resetLocalDatabase();

      await resetCloudDatabase();
      break;
    case '4':

      break;
    default:

      process.exit(1);
  }
  
  rl.close();
}

initScript(
  {
    name: 'Database Reset',
    description: 'Reset local or cloud databases with migrations',
    requiresDatabase: true,
  },
  main
);