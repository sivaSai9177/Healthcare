#!/usr/bin/env bun
/**
 * [Database Script Name]
 * 
 * [Brief description of database operations]
 * 
 * Usage:
 *   bun run scripts/database/[script-name].ts [options]
 * 
 * Options:
 *   --help, -h     Show help
 *   --dry-run      Preview changes without executing
 *   --force        Skip confirmation prompts
 *   --env          Environment (local, development, staging, production)
 */

import { 
  parseArgs, 
  printHelp, 
  logger, 
  handleError, 
  ensureCleanup,
  confirm,
  withSpinner 
} from '../lib';
import { 
  validateEnvironment, 
  config,
  getDatabase,
  closeDatabase,
  waitForDatabase,
  transaction
} from '../config';

// Import schema (adjust based on your setup)
import * as schema from '@/src/db/schema';

interface Options {
  dryRun: boolean;
  force: boolean;
  env: string;
}

async function main() {
  try {
    const args = parseArgs();
    
    if (args.help || args.h) {
      printHelp({
        usage: 'bun run scripts/database/[script-name].ts [options]',
        description: '[Detailed description of database operations]',
        options: [
          { flag: '--help, -h', description: 'Show help' },
          { flag: '--dry-run', description: 'Preview changes without executing' },
          { flag: '--force', description: 'Skip confirmation prompts' },
          { flag: '--env', description: 'Environment', default: 'local' },
        ],
        examples: [
          'bun run scripts/database/[script-name].ts',
          'bun run scripts/database/[script-name].ts --dry-run',
          'bun run scripts/database/[script-name].ts --force --env=production',
        ],
      });
      process.exit(0);
    }
    
    const options: Options = {
      dryRun: Boolean(args['dry-run']),
      force: Boolean(args.force),
      env: String(args.env || config.APP_ENV),
    };
    
    // Validate environment
    await validateEnvironment(['DATABASE_URL']);
    
    // Safety check for production
    if (options.env === 'production' && !options.force) {
      const confirmed = await confirm(
        'This will modify the PRODUCTION database. Are you sure?'
      );
      
      if (!confirmed) {
        logger.info('Operation cancelled');
        process.exit(0);
      }
    }
    
    // Wait for database connection
    await waitForDatabase();
    
    // Execute database operations
    await execute(options);
    
    logger.success('Database script completed successfully');
  } catch (error) {
    handleError(error);
  }
}

async function execute(options: Options) {
  const db = await getDatabase();
  
  logger.info('Executing database operations...');
  logger.info(`Environment: ${options.env}`);
  logger.info(`Database: ${config.databaseUrl}`);
  
  if (options.dryRun) {
    logger.warn('Running in dry-run mode - no changes will be made');
    
    // Preview changes
    await previewChanges(db);
    return;
  }
  
  // Execute in transaction for safety
  await withSpinner('Executing database operations', async () => {
    await transaction(async (tx) => {
      // TODO: Implement your database operations here
      
      // Example: Count records
      const userCount = await tx.select().from(schema.users).count();
      logger.info(`Found ${userCount} users`);
      
      // Example: Update records
      // await tx.update(schema.users)
      //   .set({ updatedAt: new Date() })
      //   .where(eq(schema.users.status, 'active'));
    });
  });
}

async function previewChanges(db: any) {
  logger.info('Previewing changes...');
  
  // TODO: Implement preview logic
  // Show what would be changed without actually changing it
}

// Cleanup handler
ensureCleanup(async () => {
  await closeDatabase();
  logger.debug('Database connection closed');
});

// Run the script
main();