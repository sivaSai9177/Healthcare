#!/usr/bin/env bun
/**
 * Unified Start Script
 * 
 * Orchestrates the startup of all services with different modes
 * 
 * Usage:
 *   bun run scripts/services/start-unified-optimized.ts [mode] [options]
 * 
 * Modes:
 *   local       - Local development with Docker services
 *   network     - Network mode with IP binding
 *   tunnel      - Tunnel mode with ngrok
 *   oauth       - OAuth mode with proper redirect URLs
 *   healthcare  - Healthcare demo mode
 * 
 * Options:
 *   --help, -h           Show help
 *   --skip-checks        Skip dependency checks
 *   --skip-setup         Skip database setup
 *   --services           Comma-separated list of additional services
 *   --port               Custom port for Expo (default: 8081)
 *   --no-open           Don't open browser automatically
 */

import { 
  parseArgs, 
  printHelp, 
  logger, 
  handleError, 
  ensureCleanup,
  select,
  withSpinner,
  measureTime
} from '../lib';
import { 
  config,
  validateEnvironment,
  services,
  getServiceGroup,
  buildServiceUrl
} from '../config';
import {
  checkDocker,
  startServices,
  checkRequiredServices,
  waitForPort,
  streamLogs
} from '../lib/docker-utils';
import { spawn, ChildProcess } from 'child_process';
import { networkInterfaces } from 'os';
import { existsSync, mkdirSync } from 'fs';

type StartMode = 'local' | 'network' | 'tunnel' | 'oauth' | 'healthcare';

interface Options {
  mode?: StartMode;
  skipChecks: boolean;
  skipSetup: boolean;
  services?: string[];
  port: number;
  noOpen: boolean;
}

// Track child processes for cleanup
const childProcesses: Map<string, ChildProcess> = new Map();

async function main() {
  try {
    const args = parseArgs();
    
    if (args.help || args.h) {
      printHelp({
        usage: 'bun run scripts/services/start-unified-optimized.ts [mode] [options]',
        description: 'Start the application with all required services',
        options: [
          { flag: 'mode', description: 'Startup mode (local, network, tunnel, oauth, healthcare)' },
          { flag: '--help, -h', description: 'Show help' },
          { flag: '--skip-checks', description: 'Skip dependency checks' },
          { flag: '--skip-setup', description: 'Skip database setup' },
          { flag: '--services', description: 'Additional services to start' },
          { flag: '--port', description: 'Expo port', default: 8081 },
          { flag: '--no-open', description: "Don't open browser" },
        ],
        examples: [
          'bun run scripts/services/start-unified-optimized.ts local',
          'bun run scripts/services/start-unified-optimized.ts network --services=email,logging',
          'bun run scripts/services/start-unified-optimized.ts healthcare --skip-setup',
        ],
      });
      process.exit(0);
    }
    
    // Parse options
    const mode = args._[0] as StartMode || args.mode as StartMode;
    const options: Options = {
      mode,
      skipChecks: Boolean(args['skip-checks']),
      skipSetup: Boolean(args['skip-setup']),
      services: args.services ? String(args.services).split(',') : [],
      port: Number(args.port) || 8081,
      noOpen: Boolean(args['no-open']),
    };
    
    // Select mode if not provided
    if (!options.mode) {
      options.mode = await select(
        'Select startup mode:',
        ['local', 'network', 'tunnel', 'oauth', 'healthcare'],
        0
      ) as StartMode;
    }
    
    // Validate environment
    await validateEnvironment();
    
    // Create logs directory
    if (!existsSync('logs')) {
      mkdirSync('logs');
    }
    
    // Execute startup
    await execute(options);
    
  } catch (error) {
    handleError(error);
  }
}

async function execute(options: Options) {
  const { mode, skipChecks, skipSetup } = options;
  
  logger.box(`Starting in ${mode?.toUpperCase()} mode`);
  
  // Run pre-flight checks
  if (!skipChecks) {
    await runPreflightChecks();
  }
  
  // Clean up any existing processes
  await cleanupExistingProcesses();
  
  // Start Docker services
  await startDockerServices(options);
  
  // Setup database if needed
  if (!skipSetup && ['local', 'healthcare'].includes(mode!)) {
    await setupDatabase(mode === 'healthcare');
  }
  
  // Get startup configuration
  const startupConfig = getStartupConfig(mode!);
  
  // Start auxiliary services
  await startAuxiliaryServices(options);
  
  // Start main Expo process
  await startExpo(startupConfig, options);
  
  // Show startup summary
  showStartupSummary(mode!, startupConfig);
  
  // Keep process alive and handle logs
  await handleProcessLifecycle();
}

async function runPreflightChecks() {
  await withSpinner('Running pre-flight checks', async () => {
    // Check Docker
    if (!await checkDocker()) {
      throw new Error('Docker is not running. Please start Docker Desktop.');
    }
    
    // Check required commands
    const requiredCommands = ['bun', 'expo', 'docker-compose'];
    for (const cmd of requiredCommands) {
      try {
        await import('child_process').then(({ execSync }) => 
          execSync(`which ${cmd}`, { stdio: 'ignore' })
        );
      } catch {
        throw new Error(`Missing required command: ${cmd}`);
      }
    }
    
    // Check ports
    const portsToCheck = [8081, 3000, 3001, 3002];
    for (const port of portsToCheck) {
      if (await isPortInUse(port)) {
        logger.warn(`Port ${port} is already in use`);
      }
    }
  });
}

async function cleanupExistingProcesses() {
  await withSpinner('Cleaning up existing processes', async () => {
    const { execSync } = await import('child_process');
    
    // Kill common ports
    const ports = [8081, 3000, 3001, 3002];
    for (const port of ports) {
      try {
        execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
      } catch {
        // Port not in use
      }
    }
  });
}

async function startDockerServices(options: Options) {
  const servicesToStart = ['postgres', 'redis'];
  
  if (options.services?.includes('websocket')) {
    servicesToStart.push('websocket');
  }
  
  await withSpinner('Starting Docker services', async () => {
    await startServices(servicesToStart, { 
      detached: true,
      build: false 
    });
    
    // Wait for services to be healthy
    const healthChecks = await checkRequiredServices();
    if (!healthChecks.healthy) {
      throw new Error('Some required services failed to start');
    }
  });
}

async function setupDatabase(includeHealthcare: boolean) {
  await withSpinner('Setting up database', async () => {
    // Run migrations
    const { execSync } = await import('child_process');
    execSync('bun drizzle-kit push', {
      env: { ...process.env, APP_ENV: 'local' },
      stdio: 'ignore'
    });
    
    // Setup healthcare data if needed
    if (includeHealthcare) {
      const setupProcess = spawn('bun', [
        'scripts/setup/healthcare/setup-healthcare-local.ts'
      ], {
        env: { ...process.env, APP_ENV: 'local' },
        stdio: 'inherit'
      });
      
      await new Promise((resolve, reject) => {
        setupProcess.on('exit', (code) => {
          if (code === 0) resolve(true);
          else reject(new Error(`Healthcare setup failed with code ${code}`));
        });
      });
    }
  });
}

async function startAuxiliaryServices(options: Options) {
  const auxServices = options.services || [];
  
  for (const service of auxServices) {
    if (service === 'email') {
      startBackgroundService('email', [
        'scripts/services/individual/start-email-server.ts'
      ]);
    } else if (service === 'logging') {
      startBackgroundService('logging', [
        'scripts/services/individual/start-logging-service.sh'
      ]);
    } else if (service === 'websocket') {
      startBackgroundService('websocket', [
        'scripts/websocket-server/start.ts'
      ]);
    }
  }
}

function startBackgroundService(name: string, args: string[]): void {
  logger.info(`Starting ${name} service...`);
  
  const child = spawn('bun', args, {
    env: { ...process.env, APP_ENV: config.APP_ENV },
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Log to file
  const fs = require('fs');
  const logFile = `logs/${name}-${new Date().toISOString().split('T')[0]}.log`;
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  child.stdout?.pipe(logStream);
  child.stderr?.pipe(logStream);
  
  childProcesses.set(name, child);
  
  child.on('exit', (code) => {
    logger.error(`${name} service exited with code ${code}`);
    childProcesses.delete(name);
  });
}

function getStartupConfig(mode: StartMode): Record<string, string> {
  const localIp = getLocalIpAddress();
  
  const configs: Record<StartMode, Record<string, string>> = {
    local: {
      EXPO_PUBLIC_API_URL: 'http://localhost:8081',
      WS_URL: 'ws://localhost:3002',
      HOST: 'localhost',
    },
    network: {
      EXPO_PUBLIC_API_URL: `http://${localIp}:8081`,
      WS_URL: `ws://${localIp}:3002`,
      HOST: localIp,
    },
    tunnel: {
      EXPO_PUBLIC_API_URL: 'TUNNEL_URL_PLACEHOLDER',
      WS_URL: 'TUNNEL_WS_PLACEHOLDER',
      HOST: 'tunnel',
    },
    oauth: {
      EXPO_PUBLIC_API_URL: 'http://localhost:8081',
      WS_URL: 'ws://localhost:3002',
      HOST: 'localhost',
      BETTER_AUTH_URL: 'http://localhost:8081',
    },
    healthcare: {
      EXPO_PUBLIC_API_URL: 'http://localhost:8081',
      WS_URL: 'ws://localhost:3002',
      HOST: 'localhost',
      ENABLE_HEALTHCARE: 'true',
    },
  };
  
  return configs[mode];
}

async function startExpo(envConfig: Record<string, string>, options: Options) {
  logger.info('🚀 Starting Expo...');
  
  const expoArgs = ['start', '--port', String(options.port)];
  
  if (options.mode === 'network') {
    expoArgs.push('--host', 'lan');
  } else if (options.mode === 'tunnel') {
    expoArgs.push('--tunnel');
  }
  
  if (!options.noOpen) {
    expoArgs.push('--web');
  }
  
  const expoProcess = spawn('expo', expoArgs, {
    env: {
      ...process.env,
      ...envConfig,
      EXPO_GO: '1',
      APP_ENV: 'local',
    },
    stdio: 'inherit'
  });
  
  childProcesses.set('expo', expoProcess);
  
  expoProcess.on('exit', (code) => {
    logger.error(`Expo exited with code ${code}`);
    cleanup();
    process.exit(code || 1);
  });
}

function getLocalIpAddress(): string {
  const interfaces = networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  
  return '127.0.0.1';
}

function showStartupSummary(mode: StartMode, config: Record<string, string>) {
  logger.separator('=', 60);
  logger.success('🎉 Application started successfully!');
  logger.separator('-', 60);
  
  logger.info('Access URLs:');
  logger.info(`  Expo DevTools: http://localhost:${8081}`);
  logger.info(`  API URL: ${config.EXPO_PUBLIC_API_URL}`);
  
  if (config.WS_URL) {
    logger.info(`  WebSocket: ${config.WS_URL}`);
  }
  
  logger.separator('-', 60);
  logger.info('Available commands:');
  logger.info('  Press "w" to open web browser');
  logger.info('  Press "a" to open Android emulator');
  logger.info('  Press "i" to open iOS simulator');
  logger.info('  Press "r" to reload app');
  logger.info('  Press "m" to toggle menu');
  logger.info('  Press "Ctrl+C" to stop all services');
  logger.separator('=', 60);
}

async function handleProcessLifecycle() {
  // Keep the process alive
  await new Promise(() => {
    // Process will stay alive until interrupted
  });
}

async function isPortInUse(port: number): Promise<boolean> {
  try {
    await waitForPort(port, 'localhost', 1, 100);
    return true;
  } catch {
    return false;
  }
}

function cleanup() {
  logger.info('\n🧹 Cleaning up...');
  
  // Kill all child processes
  for (const [name, process] of childProcesses) {
    logger.debug(`Stopping ${name}...`);
    process.kill('SIGTERM');
  }
  
  // Clear the map
  childProcesses.clear();
}

// Setup cleanup handlers
ensureCleanup(cleanup);

// Run the script
main();