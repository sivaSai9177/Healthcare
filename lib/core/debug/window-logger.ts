/**
 * Window-exposed Debug Logger
 * This module enhances the existing logger with window exposure for browser debugging
 * and module-wise debug capabilities
 */

import { Platform } from 'react-native';
import { log as baseLogger } from './logger';
import { createLogger, getLogHistory, clearLogHistory, exportLogs, LogLevel } from './debug-utils';

// Module-specific loggers registry
const moduleLoggers = new Map<string, ReturnType<typeof createLogger>>();

// Debug state
interface DebugState {
  enabled: boolean;
  logLevel: LogLevel;
  enabledModules: Set<string>;
  logToConsole: boolean;
  logToStorage: boolean;
}

const debugState: DebugState = {
  enabled: __DEV__ || process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  logLevel: LogLevel.DEBUG,
  enabledModules: new Set(['*']), // '*' means all modules
  logToConsole: true,
  logToStorage: true,
};

// Enhanced module logger factory
export function getModuleLogger(moduleName: string) {
  if (!moduleLoggers.has(moduleName)) {
    const logger = createLogger(moduleName);
    
    // Wrap logger methods to check if module is enabled
    const wrappedLogger = {
      error: (message: string, error?: Error | any) => {
        if (isModuleEnabled(moduleName)) {
          logger.error(message, error);
        }
      },
      warn: (message: string, data?: any) => {
        if (isModuleEnabled(moduleName)) {
          logger.warn(message, data);
        }
      },
      info: (message: string, data?: any) => {
        if (isModuleEnabled(moduleName)) {
          logger.info(message, data);
        }
      },
      debug: (message: string, data?: any) => {
        if (isModuleEnabled(moduleName)) {
          logger.debug(message, data);
        }
      },
      trace: (message: string, data?: any) => {
        if (isModuleEnabled(moduleName)) {
          logger.trace(message, data);
        }
      },
      time: (label: string) => logger.time(label),
      timeEnd: (label: string) => logger.timeEnd(label),
      group: (label: string) => logger.group(label),
      groupEnd: () => logger.groupEnd(),
    };
    
    moduleLoggers.set(moduleName, wrappedLogger);
  }
  
  return moduleLoggers.get(moduleName)!;
}

// Check if a module is enabled for logging
function isModuleEnabled(moduleName: string): boolean {
  if (!debugState.enabled) return false;
  if (debugState.enabledModules.has('*')) return true;
  return debugState.enabledModules.has(moduleName);
}

// Window debug API
export const windowDebugger = {
  // State management
  enable: () => {
    debugState.enabled = true;

  },
  
  disable: () => {
    debugState.enabled = false;

  },
  
  setLogLevel: (level: LogLevel | keyof typeof LogLevel) => {
    if (typeof level === 'string') {
      debugState.logLevel = LogLevel[level as keyof typeof LogLevel];
    } else {
      debugState.logLevel = level;
    }

  },
  
  // Module management
  enableModule: (moduleName: string) => {
    debugState.enabledModules.add(moduleName);

  },
  
  disableModule: (moduleName: string) => {
    debugState.enabledModules.delete(moduleName);

  },
  
  enableAllModules: () => {
    debugState.enabledModules.clear();
    debugState.enabledModules.add('*');

  },
  
  disableAllModules: () => {
    debugState.enabledModules.clear();

  },
  
  listModules: () => {
    const modules = Array.from(moduleLoggers.keys());

    return modules;
  },
  
  listEnabledModules: () => {
    const enabled = Array.from(debugState.enabledModules);

    return enabled;
  },
  
  // Log history
  getHistory: (filter?: Parameters<typeof getLogHistory>[0]) => {
    return getLogHistory(filter);
  },
  
  clearHistory: () => {
    clearLogHistory();

  },
  
  exportHistory: () => {
    const logs = exportLogs();

    return logs;
  },
  
  // Quick filters
  getErrors: () => {
    return getLogHistory({ level: LogLevel.ERROR });
  },
  
  getWarnings: () => {
    return getLogHistory({ level: LogLevel.WARN });
  },
  
  getModuleLogs: (moduleName: string) => {
    return getLogHistory({ component: moduleName });
  },
  
  // Legacy logger access
  log: baseLogger,
  
  // Print help
  help: () => {

  },
};

// Expose to window in development or when debug mode is enabled
if (Platform.OS === 'web' && (typeof window !== 'undefined')) {
  if (__DEV__ || process.env.EXPO_PUBLIC_DEBUG_MODE === 'true') {
    (window as any).debugger = windowDebugger;
    
    // Also expose individual module loggers for direct access
    (window as any).getLogger = getModuleLogger;

  }
}

// Export for use in modules
export { log } from './logger';
export { createLogger, LogLevel } from './debug-utils';