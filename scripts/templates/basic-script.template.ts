#!/usr/bin/env bun
/**
 * [Script Name]
 * 
 * [Brief description of what this script does]
 * 
 * Usage:
 *   bun run scripts/[category]/[script-name].ts [options]
 * 
 * Options:
 *   --help, -h     Show help
 *   --dry-run      Preview changes without executing
 *   --verbose, -v  Enable verbose logging
 */

import { parseArgs, printHelp, logger, handleError, ensureCleanup } from '../lib';
import { validateEnvironment } from '../config';

// Define script options
interface Options {
  dryRun: boolean;
  verbose: boolean;
  // Add your custom options here
}

async function main() {
  try {
    // Parse command-line arguments
    const args = parseArgs();
    
    // Handle help flag
    if (args.help || args.h) {
      printHelp({
        usage: 'bun run scripts/[category]/[script-name].ts [options]',
        description: '[Detailed description of what this script does]',
        options: [
          { flag: '--help, -h', description: 'Show help' },
          { flag: '--dry-run', description: 'Preview changes without executing' },
          { flag: '--verbose, -v', description: 'Enable verbose logging' },
          // Add your custom options here
        ],
        examples: [
          'bun run scripts/[category]/[script-name].ts',
          'bun run scripts/[category]/[script-name].ts --dry-run',
        ],
      });
      process.exit(0);
    }
    
    // Parse options
    const options: Options = {
      dryRun: Boolean(args['dry-run']),
      verbose: Boolean(args.verbose || args.v),
    };
    
    // Set log level based on verbosity
    if (options.verbose) {
      logger.level = 'DEBUG';
    }
    
    // Validate environment
    await validateEnvironment([
      // Add required env vars here
    ]);
    
    // Execute main logic
    await execute(options);
    
    logger.success('Script completed successfully');
  } catch (error) {
    handleError(error);
  }
}

async function execute(options: Options) {
  logger.info('Starting script execution...');
  
  if (options.dryRun) {
    logger.warn('Running in dry-run mode - no changes will be made');
  }
  
  // TODO: Implement your script logic here
  
  logger.debug('Script execution details', { options });
}

// Set up cleanup handlers
ensureCleanup(async () => {
  // Add any cleanup logic here
  logger.debug('Cleanup completed');
});

// Run the script
main();