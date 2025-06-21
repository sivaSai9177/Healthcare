/**
 * Simple logger for scripts that doesn't depend on React Native
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: any) => void;
}

const colors = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m'
};

function formatMessage(level: LogLevel, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  let output = `${colors[level]}${prefix} ${message}${colors.reset}`;
  
  if (data !== undefined) {
    if (typeof data === 'object') {
      output += '\n' + JSON.stringify(data, null, 2);
    } else {
      output += ` ${data}`;
    }
  }
  
  return output;
}

export const log: Logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {

    }
  },
  
  info: (message: string, data?: any) => {

  },
  
  warn: (message: string, data?: any) => {
    console.warn(formatMessage('warn', message, data));
  },
  
  error: (message: string, error?: any) => {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(formatMessage('error', message, errorData));
  }
};