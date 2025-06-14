// Console interceptor utility
import { debugLog } from './logger';

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

let isIntercepting = false;

// Intercept console methods
export function startConsoleInterception() {
  if (isIntercepting) return;
  
  isIntercepting = true;

  // Override console methods
  console.log = (...args: any[]) => {
    originalConsole.log(...args);
    debugLog.info(formatArgs(args), { args });
  };

  console.error = (...args: any[]) => {
    originalConsole.error(...args);
    debugLog.error(formatArgs(args), { args });
  };

  console.warn = (...args: any[]) => {
    originalConsole.warn(...args);
    debugLog.warn(formatArgs(args), { args });
  };

  console.info = (...args: any[]) => {
    originalConsole.info(...args);
    debugLog.info(formatArgs(args), { args });
  };

  console.debug = (...args: any[]) => {
    originalConsole.debug(...args);
    debugLog.debug(formatArgs(args), { args });
  };
}

// Stop intercepting console methods
export function stopConsoleInterception() {
  if (!isIntercepting) return;
  
  isIntercepting = false;

  // Restore original methods
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
}

// Format arguments for display
function formatArgs(args: any[]): string {
  return args
    .map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
}

export function isConsoleIntercepting() {
  return isIntercepting;
}