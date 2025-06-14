// Global debug logger utility
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface DebugLog {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

// Global log storage
const MAX_LOGS = 100;
let DEBUG_LOGS: DebugLog[] = [];

// Listeners for log updates
const listeners = new Set<(logs: DebugLog[]) => void>();

// Add a log
function addLog(level: LogLevel, message: string, data?: any) {
  const log: DebugLog = {
    timestamp: new Date(),
    level,
    message,
    data,
    source: getCallSource(),
  };

  DEBUG_LOGS.unshift(log);
  
  // Keep only the last MAX_LOGS
  if (DEBUG_LOGS.length > MAX_LOGS) {
    DEBUG_LOGS = DEBUG_LOGS.slice(0, MAX_LOGS);
  }

  // Notify listeners
  listeners.forEach(listener => listener(DEBUG_LOGS));
}

// Get the source of the log call
function getCallSource(): string {
  const error = new Error();
  const stack = error.stack?.split('\n');
  // Skip first 4 lines (Error, addLog, debugLog method, caller)
  const callerLine = stack?.[4];
  if (callerLine) {
    const match = callerLine.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
    if (match) {
      return `${match[1]} (${match[2].split('/').pop()}:${match[3]})`;
    }
  }
  return 'unknown';
}

// Debug log API
export const debugLog = {
  error: (message: string, data?: any) => addLog('error', message, data),
  warn: (message: string, data?: any) => addLog('warn', message, data),
  info: (message: string, data?: any) => addLog('info', message, data),
  debug: (message: string, data?: any) => addLog('debug', message, data),
  
  // Get all logs
  getLogs: () => [...DEBUG_LOGS],
  
  // Clear all logs
  clear: () => {
    DEBUG_LOGS = [];
    listeners.forEach(listener => listener(DEBUG_LOGS));
  },
  
  // Subscribe to log updates
  subscribe: (listener: (logs: DebugLog[]) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  
  // Get error count
  getErrorCount: () => DEBUG_LOGS.filter(log => log.level === 'error').length,
};

// Export logs as text
export function exportLogs(logs: DebugLog[]): string {
  return logs
    .map(log => {
      const timestamp = log.timestamp.toISOString();
      const level = log.level.toUpperCase().padEnd(5);
      const data = log.data ? ` | ${JSON.stringify(log.data)}` : '';
      const source = log.source ? ` | ${log.source}` : '';
      return `[${timestamp}] ${level} | ${log.message}${data}${source}`;
    })
    .join('\n');
}