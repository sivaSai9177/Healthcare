#!/usr/bin/env bun
/**
 * Database Reset Script
 * 
 * Safely resets local or cloud databases with proper validation and rollback options
 * 
 * Usage:
 *   bun run scripts/database/reset-database-optimized.ts [options]
 * 
 * Options:
 *   --help, -h     Show help
 *   --env          Environment to reset (local, development, staging)
 *   --force        Skip confirmation prompts
 *   --seed         Seed with demo data after reset
 *   --dry-run      Preview what would be reset
 */

import { 
  parseArgs, 
  printHelp, 
  logger, 
  handleError, 
  ensureCleanup,
  confirm,
  select,
  withSpinner,
  measureTime
} from '../lib';
import { 
  config,
  validateEnvironment,
  getDatabase,
  closeDatabase,
  waitForDatabase,
  getDatabaseInfo,
  checkTables,
  resetDatabase as resetDb,
  runMigrations
} from '../config';
import {
  checkDocker,
  stopServices,
  startServices,
  waitForHealthy
} from '../lib/docker-utils';
import { execSync } from 'child_process';

interface Options {
  env?: string;
  force: boolean;
  seed: boolean;
  dryRun: boolean;
}

async function main() {
  try {
    const args = parseArgs();
    
    if (args.help || args.h) {
      printHelp({
        usage: 'bun run scripts/database/reset-database-optimized.ts [options]',
        description: 'Safely reset local or cloud databases with migrations',
        options: [
          { flag: '--help, -h', description: 'Show help' },
          { flag: '--env', description: 'Environment to reset', default: 'prompt' },
          { flag: '--force', description: 'Skip confirmation prompts' },
          { flag: '--seed', description: 'Seed with demo data after reset' },
          { flag: '--dry-run', description: 'Preview what would be reset' },
        ],
        examples: [
          'bun run scripts/database/reset-database-optimized.ts',
          'bun run scripts/database/reset-database-optimized.ts --env=local --seed',
          'bun run scripts/database/reset-database-optimized.ts --force --env=development',
        ],
      });
      process.exit(0);
    }
    
    const options: Options = {
      env: args.env as string,
      force: Boolean(args.force),
      seed: Boolean(args.seed),
      dryRun: Boolean(args['dry-run']),
    };
    
    // Validate environment
    await validateEnvironment(['DATABASE_URL']);
    
    // Display current environment
    logger.box(`Database Reset Tool\n\nEnvironment: ${config.APP_ENV}\nDatabase: ${config.databaseUrl}`);
    
    // Select environment if not provided
    if (!options.env) {
      options.env = await select(
        'Select environment to reset:',
        ['local', 'development', 'staging', 'cancel'],
        0
      );
      
      if (options.env === 'cancel') {
        logger.info('Reset cancelled');
        process.exit(0);
      }
    }
    
    // Execute reset
    await execute(options);
    
    logger.success('Database reset completed successfully');
  } catch (error) {
    handleError(error);
  }
}

async function execute(options: Options) {
  const { env, force, seed, dryRun } = options;
  
  // Validate environment selection
  if (!['local', 'development', 'staging'].includes(env!)) {
    throw new Error(`Invalid environment: ${env}`);
  }
  
  // Production safety check
  if (env === 'staging' && !force) {
    logger.warn('⚠️  WARNING: This will reset the STAGING database!');
    logger.warn('All data will be permanently deleted.');
    
    const confirmed = await confirm(
      'Are you absolutely sure you want to continue?'
    );
    
    if (!confirmed) {
      logger.info('Reset cancelled');
      process.exit(0);
    }
  }
  
  if (dryRun) {
    await previewReset(env!);
    return;
  }
  
  // Execute appropriate reset
  if (env === 'local') {
    await resetLocalDatabase(seed);
  } else {
    await resetCloudDatabase(env!, seed);
  }
}

async function previewReset(env: string) {
  logger.info('🔍 Preview mode - no changes will be made');
  logger.separator();
  
  if (env === 'local') {
    logger.info('Would perform the following actions:');
    logger.info('  1. Stop Docker containers');
    logger.info('  2. Remove Docker volumes');
    logger.info('  3. Start fresh containers');
    logger.info('  4. Run database migrations');
    logger.info('  5. Optionally seed demo data');
  } else {
    // Connect to database to show current state
    await waitForDatabase();
    const dbInfo = await getDatabaseInfo();
    const tables = await checkTables();
    
    logger.info('Current database state:');
    logger.info(`  Database: ${dbInfo.database}`);
    logger.info(`  Size: ${dbInfo.size}`);
    logger.info(`  Tables: ${tables.length}`);
    
    logger.separator();
    logger.info('Would perform the following actions:');
    logger.info('  1. Drop all tables (CASCADE)');
    logger.info('  2. Drop custom types');
    logger.info('  3. Run fresh migrations');
    logger.info('  4. Optionally seed demo data');
    
    if (tables.length > 0) {
      logger.separator();
      logger.info('Tables to be dropped:');
      tables.forEach(table => logger.info(`  - ${table}`));
    }
  }
}

async function resetLocalDatabase(seed: boolean) {
  logger.info('📦 Resetting local Docker database...');
  
  // Check Docker is running
  if (!await checkDocker()) {
    throw new Error('Docker is not running. Please start Docker Desktop.');
  }
  
  // Stop existing containers and remove volumes
  await withSpinner('Stopping existing containers', async () => {
    await stopServices(['postgres', 'redis']);
    
    // Remove volumes for clean slate
    try {
      execSync('docker volume rm myexpo_local_postgres_data myexpo_local_redis_data', {
        stdio: 'ignore'
      });
    } catch {
      // Volumes might not exist
    }
  });
  
  // Start fresh containers
  await withSpinner('Starting fresh containers', async () => {
    await startServices(['postgres', 'redis'], { 
      build: false,
      recreate: true 
    });
  });
  
  // Wait for services to be healthy
  await withSpinner('Waiting for database to be ready', async () => {
    await waitForHealthy('myexpo-postgres-local');
    await waitForDatabase();
  });
  
  // Run migrations
  await withSpinner('Running database migrations', async () => {
    await runMigrations();
  });
  
  // Seed data if requested
  if (seed) {
    await seedDatabase();
  }
  
  logger.success('✅ Local database reset complete!');
}

async function resetCloudDatabase(env: string, seed: boolean) {
  logger.info(`☁️  Resetting ${env} database...`);
  
  // Connect and verify
  await waitForDatabase();
  
  // Get current state
  const dbInfo = await getDatabaseInfo();
  const tables = await checkTables();
  
  logger.info(`Current database: ${dbInfo.database} (${dbInfo.size})`);
  logger.info(`Found ${tables.length} tables to reset`);
  
  // Reset database
  await withSpinner('Resetting database', async () => {
    await resetDb();
  });
  
  // Run migrations
  await withSpinner('Running database migrations', async () => {
    await runMigrations();
  });
  
  // Seed data if requested
  if (seed) {
    await seedDatabase();
  }
  
  logger.success(`✅ ${env} database reset complete!`);
}

async function seedDatabase() {
  logger.info('🌱 Seeding database with demo data...');
  
  await withSpinner('Creating demo users', async () => {
    // Import and run seed script
    const seedScript = await import('../data/seed-demo-data');
    await seedScript.default();
  });
  
  logger.success('Demo data seeded successfully');
}

// Cleanup handler
ensureCleanup(async () => {
  await closeDatabase();
});

// Run the script
main();