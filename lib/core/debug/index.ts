/**
 * Debug utilities exports
 */

// Export specific items to avoid conflicts
export { log, logger, LogCategory, UnifiedLogEntry } from './logger';
export * from './router-debug';
// export * from './trpc-logger'; // Removed to avoid duplicate export with trpc-logger-enhanced
export * from './trpc-logger-enhanced';
export { 
  LogLevel as DebugLogLevel,
  createLogger,
  setupNetworkDebugging,
  createAuthLogger,
  exportLogs
} from './debug-utils';
export { 
  getModuleLogger,
  windowDebugger
} from './window-logger';
// Don't re-export from unified-logger as it conflicts with logger exports
export * from './logging-config';