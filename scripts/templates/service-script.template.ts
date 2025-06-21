#!/usr/bin/env bun
/**
 * [Service Script Name]
 * 
 * [Brief description of service operations]
 * 
 * Usage:
 *   bun run scripts/services/[script-name].ts [options]
 * 
 * Options:
 *   --help, -h     Show help
 *   --services     Comma-separated list of services to manage
 *   --action       Action to perform (start, stop, restart, status)
 *   --wait         Wait for services to be healthy
 *   --logs         Stream logs after starting
 */

import { 
  parseArgs, 
  printHelp, 
  logger, 
  handleError, 
  ensureCleanup,
  select,
  withSpinner 
} from '../lib';
import { 
  validateEnvironment,
  services,
  getEnabledServices,
  buildServiceUrl
} from '../config';
import {
  checkDocker,
  startServices,
  stopServices,
  checkRequiredServices,
  streamLogs,
  waitForPort,
  getComposeStatus
} from '../lib/docker-utils';

interface Options {
  services?: string[];
  action: 'start' | 'stop' | 'restart' | 'status';
  wait: boolean;
  logs: boolean;
}

async function main() {
  try {
    const args = parseArgs();
    
    if (args.help || args.h) {
      printHelp({
        usage: 'bun run scripts/services/[script-name].ts [options]',
        description: '[Detailed description of service operations]',
        options: [
          { flag: '--help, -h', description: 'Show help' },
          { flag: '--services', description: 'Comma-separated list of services' },
          { flag: '--action', description: 'Action to perform', default: 'start' },
          { flag: '--wait', description: 'Wait for services to be healthy' },
          { flag: '--logs', description: 'Stream logs after starting' },
        ],
        examples: [
          'bun run scripts/services/[script-name].ts',
          'bun run scripts/services/[script-name].ts --services=postgres,redis',
          'bun run scripts/services/[script-name].ts --action=status',
        ],
      });
      process.exit(0);
    }
    
    // Parse options
    const options: Options = {
      services: args.services ? String(args.services).split(',') : undefined,
      action: (args.action as any) || 'start',
      wait: Boolean(args.wait),
      logs: Boolean(args.logs),
    };
    
    // Validate Docker is running
    if (!await checkDocker()) {
      throw new Error('Docker is not running. Please start Docker Desktop.');
    }
    
    // Execute service operation
    await execute(options);
    
  } catch (error) {
    handleError(error);
  }
}

async function execute(options: Options) {
  switch (options.action) {
    case 'start':
      await handleStart(options);
      break;
      
    case 'stop':
      await handleStop(options);
      break;
      
    case 'restart':
      await handleRestart(options);
      break;
      
    case 'status':
      await handleStatus();
      break;
      
    default:
      throw new Error(`Unknown action: ${options.action}`);
  }
}

async function handleStart(options: Options) {
  logger.info('Starting services...');
  
  await withSpinner('Starting Docker services', async () => {
    await startServices(options.services);
  });
  
  if (options.wait) {
    await waitForServices(options.services);
  }
  
  if (options.logs) {
    logger.info('Streaming logs (press Ctrl+C to stop)...');
    streamLogs(options.services);
  }
}

async function handleStop(options: Options) {
  logger.info('Stopping services...');
  
  await withSpinner('Stopping Docker services', async () => {
    await stopServices(options.services);
  });
  
  logger.success('Services stopped');
}

async function handleRestart(options: Options) {
  await handleStop(options);
  await handleStart(options);
}

async function handleStatus() {
  logger.info('Checking service status...');
  
  // Check Docker compose status
  const composeStatus = getComposeStatus();
  
  if (composeStatus.length === 0) {
    logger.warn('No services are running');
    return;
  }
  
  // Display status table
  logger.table(
    ['Service', 'State', 'Ports'],
    composeStatus.map(s => [
      s.service,
      s.state,
      s.ports.join(', ')
    ])
  );
  
  // Check required services
  const { healthy, services: serviceChecks } = await checkRequiredServices();
  
  if (!healthy) {
    logger.warn('Some required services are not running:');
    serviceChecks
      .filter(s => !s.running)
      .forEach(s => logger.error(`  - ${s.name}: ${s.error}`));
  } else {
    logger.success('All required services are healthy');
  }
}

async function waitForServices(serviceNames?: string[]) {
  const servicesToWait = serviceNames 
    ? serviceNames.map(name => services[name as keyof typeof services]).filter(Boolean)
    : getEnabledServices();
  
  logger.info('Waiting for services to be ready...');
  
  for (const service of servicesToWait) {
    if ('port' in service && service.port) {
      await waitForPort(service.port);
    }
    
    if ('healthEndpoint' in service && service.healthEndpoint) {
      await withSpinner(`Checking ${service.name}`, async () => {
        const url = buildServiceUrl(service.name as any, service.healthEndpoint);
        
        // Wait for health endpoint
        for (let i = 0; i < 30; i++) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              break;
            }
          } catch {
            // Service not ready yet
          }
          
          if (i < 29) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      });
    }
  }
  
  logger.success('All services are ready');
}

// Cleanup handler
ensureCleanup(async () => {
  // Add any cleanup logic here
});

// Run the script
main();