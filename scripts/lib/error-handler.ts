#!/usr/bin/env bun
/**
 * Error Handler Utility
 * 
 * Centralized error handling for scripts with:
 * - Consistent error formatting
 * - Error categorization
 * - Stack trace handling
 * - Exit code management
 */

import { logger } from './logger';
import { EXIT_CODES, COLORS, EMOJI } from '../config/constants';
import { config } from '../config/environment';

export class ScriptError extends Error {
  constructor(
    message: string,
    public code: keyof typeof EXIT_CODES = 'GENERAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ScriptError';
  }
}

export class ValidationError extends ScriptError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ConnectionError extends ScriptError {
  constructor(message: string, details?: any) {
    super(message, 'CONNECTION_ERROR', details);
    this.name = 'ConnectionError';
  }
}

export class PermissionError extends ScriptError {
  constructor(message: string, details?: any) {
    super(message, 'PERMISSION_ERROR', details);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends ScriptError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

/**
 * Handle errors consistently
 */
export function handleError(error: unknown): never {
  console.error(''); // Empty line for spacing
  
  if (error instanceof ScriptError) {
    // Handle our custom errors
    logger.error(error.message);
    
    if (error.details) {
      logger.debug('Error details:', error.details);
    }
    
    if (config.isDevelopment && error.stack) {
      console.error(`${COLORS.dim}${error.stack}${COLORS.reset}`);
    }
    
    process.exit(EXIT_CODES[error.code]);
  } else if (error instanceof Error) {
    // Handle standard errors
    logger.error(error.message);
    
    if (config.isDevelopment && error.stack) {
      console.error(`${COLORS.dim}${error.stack}${COLORS.reset}`);
    }
    
    // Try to determine appropriate exit code
    const exitCode = determineExitCode(error);
    process.exit(exitCode);
  } else {
    // Handle unknown errors
    logger.fatal('An unknown error occurred:', error);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

/**
 * Determine exit code based on error type
 */
function determineExitCode(error: Error): number {
  const message = error.message.toLowerCase();
  
  if (message.includes('connect') || message.includes('connection')) {
    return EXIT_CODES.CONNECTION_ERROR;
  }
  
  if (message.includes('permission') || message.includes('denied')) {
    return EXIT_CODES.PERMISSION_ERROR;
  }
  
  if (message.includes('not found') || message.includes('does not exist')) {
    return EXIT_CODES.NOT_FOUND;
  }
  
  if (message.includes('invalid') || message.includes('validation')) {
    return EXIT_CODES.VALIDATION_ERROR;
  }
  
  return EXIT_CODES.GENERAL_ERROR;
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorMessage) {
        logger.error(errorMessage);
      }
      handleError(error);
    }
  }) as T;
}

/**
 * Try-catch wrapper with custom error message
 */
export async function tryOrExit<T>(
  fn: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error(errorMessage);
    handleError(error);
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    onRetry
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(backoffMultiplier, attempt - 1);
        
        if (onRetry) {
          onRetry(attempt, lastError);
        } else {
          logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Ensure cleanup functions run on exit
 */
export function ensureCleanup(cleanupFn: () => void | Promise<void>) {
  const cleanup = async (signal?: string) => {
    if (signal) {
      logger.info(`Received ${signal}, cleaning up...`);
    }
    
    try {
      await cleanupFn();
      logger.debug('Cleanup completed');
    } catch (error) {
      logger.error('Cleanup failed:', error);
    }
    
    if (signal) {
      process.exit(0);
    }
  };
  
  // Handle various exit scenarios
  process.on('exit', () => cleanup());
  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));
  process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught exception:', error);
    cleanup().then(() => process.exit(1));
  });
  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal('Unhandled rejection:', reason);
    cleanup().then(() => process.exit(1));
  });
}

/**
 * Assert condition with custom error
 */
export function assert(
  condition: any,
  message: string,
  code: keyof typeof EXIT_CODES = 'GENERAL_ERROR'
): asserts condition {
  if (!condition) {
    throw new ScriptError(message, code);
  }
}

/**
 * Assert not null/undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  name: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new ValidationError(`${name} is required but was not provided`);
  }
}