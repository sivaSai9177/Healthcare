/**
 * Common utilities for scripts
 * Provides consistent error handling, logging, and environment setup
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });

// Use script-specific logger to avoid React Native dependencies
export { log } from './script-logger';

export interface ScriptOptions {
  name: string;
  description?: string;
  requiresDatabase?: boolean;
  requiresAuth?: boolean;
}

/**
 * Initialize a script with proper error handling and logging
 */
export async function initScript(options: ScriptOptions, fn: () => Promise<void>) {
  const { name, description } = options;

  if (description) {

  }

  try {
    await fn();

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ ${name} failed:`, error);
    process.exit(1);
  }
}

/**
 * Wait for a service to be available
 */
export async function waitForService(url: string, maxAttempts = 30, delayMs = 1000): Promise<boolean> {

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {

        return true;
      }
    } catch (error) {
      // Service not ready yet
    }
    
    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

/**
 * Check if a port is in use
 */
export async function isPortInUse(port: number): Promise<boolean> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const result = await execAsync(`lsof -i:${port}`);
    return !!result.stdout;
  } catch {
    return false;
  }
}

/**
 * Kill processes on a port
 */
export async function killPort(port: number): Promise<void> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    await execAsync(`lsof -ti:${port} | xargs kill -9`);

  } catch {
    // No processes to kill
  }
}

/**
 * Get environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    APP_ENV: process.env.APP_ENV || 'development',
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Not set',
    API_URL: process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || 'Not set',
    AUTH_URL: process.env.AUTH_URL || process.env.BETTER_AUTH_URL || 'Not set',
  };
}

/**
 * Ensure required environment variables are set
 */
export function validateEnvironment(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n💡 Make sure you have a .env.local file with these variables set');
    process.exit(1);
  }
}

/**
 * Format JSON for pretty printing
 */
export function prettyJson(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

/**
 * Create a cleanup handler for graceful shutdown
 */
export function setupCleanupHandler(cleanup: () => Promise<void> | void) {
  const handler = async () => {

    try {
      await cleanup();

    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
    process.exit(0);
  };
  
  process.on('SIGINT', handler);
  process.on('SIGTERM', handler);
  process.on('exit', handler);
}