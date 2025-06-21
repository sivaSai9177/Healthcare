#!/usr/bin/env bun
/**
 * Unified Start Script
 * Starts the application with various modes and configurations
 */

import { spawn, ChildProcess , exec } from 'child_process';
import { initScript, killPort, isPortInUse, setupCleanupHandler, getEnvironmentInfo } from '../config/utils';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

type StartMode = 'network' | 'local' | 'tunnel' | 'oauth' | 'healthcare' | 'healthcare-network';

interface StartOptions {
  mode: StartMode;
  skipHealthcareSetup?: boolean;
}

// Child processes to track for cleanup
const childProcesses: ChildProcess[] = [];

async function checkDependencies() {

  const missingDeps: string[] = [];
  
  try {
    await execAsync('bun --version');
  } catch {
    missingDeps.push('bun');
  }
  
  try {
    await execAsync('docker --version');
  } catch {
    missingDeps.push('docker');
  }
  
  try {
    await execAsync('expo --version');
  } catch {
    missingDeps.push('expo-cli');
  }
  
  if (missingDeps.length > 0) {
    console.error(`❌ Missing required dependencies: ${missingDeps.join(', ')}`);
    process.exit(1);
  }

}

async function checkDocker() {
  try {
    await execAsync('docker info');
    return true;
  } catch {
    console.error('❌ Docker is not running. Please start Docker Desktop first.');
    return false;
  }
}

async function getLocalIp(): Promise<string> {
  const interfaces = os.networkInterfaces();
  
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

async function cleanupPorts() {

  await killPort(8081);
  await killPort(3001);
  await killPort(3002);
}

async function startLocalDatabase() {

  try {
    await execAsync('docker-compose -f docker-compose.local.yml up -d postgres-local redis-local');

    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ Failed to start database:', error);
    throw error;
  }
}

async function setupHealthcare() {

  try {
    const { spawn } = await import('child_process');
    const setupProcess = spawn('bun', ['scripts/setup/healthcare/setup-healthcare-local.ts'], {
      env: { ...process.env, APP_ENV: 'local' },
      stdio: 'inherit',
    });
    
    await new Promise((resolve, reject) => {
      setupProcess.on('exit', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Healthcare setup failed with code ${code}`));
        }
      });
    });

  } catch (error) {
    console.error('❌ Healthcare setup failed:', error);
  }
}

function startService(command: string, args: string[], name: string, logFile?: string): ChildProcess {

  const child = spawn(command, args, {
    env: process.env,
    stdio: logFile ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    detached: false,
  });
  
  if (logFile) {
    const fs = require('fs');
    const logStream = fs.createWriteStream(`logs/${logFile}`, { flags: 'a' });
    child.stdout?.pipe(logStream);
    child.stderr?.pipe(logStream);
  }
  
  childProcesses.push(child);
  return child;
}

async function startMode(options: StartOptions) {
  const { mode } = options;
  const localIp = await getLocalIp();
  
  // Set common environment variables
  process.env.APP_ENV = 'local';
  process.env.DATABASE_URL = 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';
  
  switch (mode) {
    case 'network':
    case 'healthcare-network':

      process.env.EXPO_PUBLIC_API_URL = `http://${localIp}:8081`;
      process.env.EXPO_PUBLIC_AUTH_URL = 'http://localhost:8081';
      process.env.AUTH_URL = 'http://localhost:8081';
      process.env.BETTER_AUTH_URL = 'http://localhost:8081';
      
      if (mode === 'healthcare-network') {
        await setupHealthcare();
        
        // Start email server if configured
        if (process.env.EMAIL_HOST) {
          startService('bun', ['scripts/services/individual/start-email-server.ts'], 'Email Server', 'email-server.log');
        }
        
        // Start WebSocket server
        startService('bun', ['scripts/services/individual/start-websocket-standalone.ts'], 'WebSocket Server', 'websocket-server.log');

      }
      
      // Start Expo
      startService('expo', ['start', '--host', 'lan', '--go'], 'Expo');
      break;
      
    case 'local':

      process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8081';
      process.env.EXPO_PUBLIC_AUTH_URL = 'http://localhost:8081';
      process.env.AUTH_URL = 'http://localhost:8081';
      process.env.BETTER_AUTH_URL = 'http://localhost:8081';
      
      // Start Expo
      startService('expo', ['start', '--host', 'localhost', '--go'], 'Expo');
      break;
      
    case 'tunnel':

      process.env.APP_ENV = 'development';
      process.env.DATABASE_URL = process.env.NEON_DATABASE_URL || '';
      
      // Start Expo with tunnel
      process.env.NODE_ENV = 'development';
      startService('expo', ['start', '--tunnel', '--go'], 'Expo');
      break;
      
    case 'oauth':

      await setupHealthcare();
      
      process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8081';
      process.env.EXPO_PUBLIC_AUTH_URL = 'http://localhost:8081';
      process.env.AUTH_URL = 'http://localhost:8081';
      process.env.BETTER_AUTH_URL = 'http://localhost:8081';
      process.env.EXPO_PUBLIC_OAUTH_REDIRECT_PROXY_URL = 'http://localhost:8081/api/auth/oauth-redirect-proxy';
      
      // Start services
      if (process.env.EMAIL_HOST) {
        startService('bun', ['scripts/services/individual/start-email-server.ts'], 'Email Server', 'email-server.log');
      }
      startService('bun', ['scripts/services/individual/start-websocket-standalone.ts'], 'WebSocket Server', 'websocket-server.log');

      // Start Expo
      startService('expo', ['start', '--host', 'localhost', '--go'], 'Expo');
      break;
      
    case 'healthcare':

      // Redirect to healthcare script
      const healthcareProcess = spawn('bun', ['scripts/services/startup/start-with-healthcare.sh'], {
        stdio: 'inherit',
      });
      healthcareProcess.on('exit', process.exit);
      break;
      
    default:
      console.error(`❌ Unknown mode: ${mode}`);

      process.exit(1);
  }
}

async function main() {
  const mode = (process.argv[2] || 'network') as StartMode;

  // Show environment info

  const env = getEnvironmentInfo();
  Object.entries(env).forEach(([key, value]) => {

  });

  // Pre-flight checks
  await checkDependencies();
  await cleanupPorts();
  
  // Check Docker for modes that need it
  if (['network', 'local', 'oauth', 'healthcare-network'].includes(mode)) {
    const dockerOk = await checkDocker();
    if (!dockerOk) {
      process.exit(1);
    }
    await startLocalDatabase();
  }
  
  // Create logs directory
  try {
    await execAsync('mkdir -p logs');
  } catch {
    // Directory might already exist
  }
  
  // Setup cleanup handler
  setupCleanupHandler(async () => {

    childProcesses.forEach(child => {
      try {
        child.kill('SIGTERM');
      } catch {
        // Process might already be dead
      }
    });
    
    // Cleanup ports
    await cleanupPorts();
  });
  
  // Start the selected mode
  await startMode({ mode });
}

initScript(
  {
    name: 'Unified Start',
    description: 'Start the application with various modes',
  },
  main
);