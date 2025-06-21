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
const recentMessages = new Map<string, number>();
const MESSAGE_THROTTLE_MS = 1000; // Throttle duplicate messages for 1 second

// Known connectivity check endpoints that should be suppressed
const CONNECTIVITY_CHECK_URLS = [
  'clients3.google.com/generate_204',
  'connectivitycheck.gstatic.com/generate_204',
  'www.google.com/generate_204',
  'captive.apple.com',
  'connectivity-check.ubuntu.com',
  'nmcheck.gnome.org',
  'network-test.debian.org',
];

// Check if error is a connectivity check
function isConnectivityCheckError(args: any[]): boolean {
  const errorString = args.map(arg => String(arg)).join(' ').toLowerCase();
  
  // Check for connectivity URLs
  const isConnectivityUrl = CONNECTIVITY_CHECK_URLS.some(url => 
    errorString.includes(url.toLowerCase())
  );
  
  // Check for abort errors on connectivity checks
  const isAbortError = errorString.includes('aborterror') || errorString.includes('aborted');
  
  return isConnectivityUrl && isAbortError;
}

// Check if message was recently logged
function shouldLogMessage(message: string): boolean {
  const now = Date.now();
  const lastLogged = recentMessages.get(message);
  
  if (lastLogged && now - lastLogged < MESSAGE_THROTTLE_MS) {
    return false;
  }
  
  recentMessages.set(message, now);
  
  // Clean up old entries
  if (recentMessages.size > 100) {
    const cutoff = now - MESSAGE_THROTTLE_MS;
    for (const [msg, time] of recentMessages.entries()) {
      if (time < cutoff) {
        recentMessages.delete(msg);
      }
    }
  }
  
  return true;
}

// Intercept console methods
export function startConsoleInterception() {
  if (isIntercepting) return;
  
  isIntercepting = true;

  // Override console methods
  console.log = (...args: any[]) => {
    // Check if this is from our unified logger (starts with [CATEGORY])
    const firstArg = args[0];
    const isFromLogger = typeof firstArg === 'string' && 
                        /^\[(AUTH|API|TRPC|STORE|ROUTER|SYSTEM|ERROR|HEALTHCARE)\]/.test(firstArg);
    
    originalConsole.log(...args);
    
    if (isFromLogger) return;
    
    const message = formatArgs(args);
    if (shouldLogMessage(message)) {
      debugLog.info(message, { source: 'console.log' });
    }
  };

  console.error = (...args: any[]) => {
    // Check if this is from our unified logger (starts with [CATEGORY])
    const firstArg = args[0];
    const isFromLogger = typeof firstArg === 'string' && 
                        /^\[(AUTH|API|TRPC|STORE|ROUTER|SYSTEM|ERROR|HEALTHCARE)\]/.test(firstArg);
    
    // Always pass through to original console
    originalConsole.error(...args);
    
    // Skip processing if this is from our logger to avoid double logging
    if (isFromLogger) {
      return;
    }
    
    // Check if this is a connectivity check error
    if (isConnectivityCheckError(args)) {
      const message = formatArgs(args);
      // Log as debug instead of error for connectivity checks
      debugLog.debug(message, { source: 'console.error', type: 'connectivity-check' });
      return;
    }
    
    const message = formatArgs(args);
    // Always log errors, but add source info
    debugLog.error(message, { source: 'console.error', args: args.length > 1 ? args : undefined });
  };

  console.warn = (...args: any[]) => {
    // Check if this is from our unified logger (starts with [CATEGORY])
    const firstArg = args[0];
    const isFromLogger = typeof firstArg === 'string' && 
                        /^\[(AUTH|API|TRPC|STORE|ROUTER|SYSTEM|ERROR|HEALTHCARE)\]/.test(firstArg);
    
    originalConsole.warn(...args);
    
    if (isFromLogger) return;
    
    const message = formatArgs(args);
    if (shouldLogMessage(message)) {
      debugLog.warn(message, { source: 'console.warn' });
    }
  };

  console.info = (...args: any[]) => {
    // Check if this is from our unified logger (starts with [CATEGORY])
    const firstArg = args[0];
    const isFromLogger = typeof firstArg === 'string' && 
                        /^\[(AUTH|API|TRPC|STORE|ROUTER|SYSTEM|ERROR|HEALTHCARE)\]/.test(firstArg);
    
    originalConsole.info(...args);
    
    if (isFromLogger) return;
    
    const message = formatArgs(args);
    if (shouldLogMessage(message)) {
      debugLog.info(message, { source: 'console.info' });
    }
  };

  console.debug = (...args: any[]) => {
    // Check if this is from our unified logger (starts with [CATEGORY])
    const firstArg = args[0];
    const isFromLogger = typeof firstArg === 'string' && 
                        /^\[(AUTH|API|TRPC|STORE|ROUTER|SYSTEM|ERROR|HEALTHCARE)\]/.test(firstArg);
    
    originalConsole.debug(...args);
    
    if (isFromLogger) return;
    
    const message = formatArgs(args);
    if (shouldLogMessage(message)) {
      debugLog.debug(message, { source: 'console.debug' });
    }
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
          // Special handling for Error objects
          if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}\n${arg.stack}`;
          }
          // Try to stringify with a depth limit to avoid circular references
          return JSON.stringify(arg, getCircularReplacer(), 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
}

// Helper to handle circular references in JSON.stringify
function getCircularReplacer() {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular Reference]";
      }
      seen.add(value);
    }
    return value;
  };
}

export function isConsoleIntercepting() {
  return isIntercepting;
}