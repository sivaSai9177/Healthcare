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
    console.log('🐛 Debug mode enabled');
  },
  
  disable: () => {
    debugState.enabled = false;
    console.log('🐛 Debug mode disabled');
  },
  
  setLogLevel: (level: LogLevel | keyof typeof LogLevel) => {
    if (typeof level === 'string') {
      debugState.logLevel = LogLevel[level as keyof typeof LogLevel];
    } else {
      debugState.logLevel = level;
    }
    console.log(`🐛 Log level set to ${LogLevel[debugState.logLevel]}`);
  },
  
  // Module management
  enableModule: (moduleName: string) => {
    debugState.enabledModules.add(moduleName);
    console.log(`🐛 Enabled logging for module: ${moduleName}`);
  },
  
  disableModule: (moduleName: string) => {
    debugState.enabledModules.delete(moduleName);
    console.log(`🐛 Disabled logging for module: ${moduleName}`);
  },
  
  enableAllModules: () => {
    debugState.enabledModules.clear();
    debugState.enabledModules.add('*');
    console.log('🐛 Enabled logging for all modules');
  },
  
  disableAllModules: () => {
    debugState.enabledModules.clear();
    console.log('🐛 Disabled logging for all modules');
  },
  
  listModules: () => {
    const modules = Array.from(moduleLoggers.keys());
    console.log('🐛 Registered modules:', modules);
    return modules;
  },
  
  listEnabledModules: () => {
    const enabled = Array.from(debugState.enabledModules);
    console.log('🐛 Enabled modules:', enabled);
    return enabled;
  },
  
  // Log history
  getHistory: (filter?: Parameters<typeof getLogHistory>[0]) => {
    return getLogHistory(filter);
  },
  
  clearHistory: () => {
    clearLogHistory();
    console.log('🐛 Log history cleared');
  },
  
  exportHistory: () => {
    const logs = exportLogs();
    console.log('🐛 Exporting log history...');
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
    console.log(`
🐛 Debug Logger Help
===================

State Management:
  .enable()              - Enable debug mode
  .disable()             - Disable debug mode
  .setLogLevel(level)    - Set log level (ERROR, WARN, INFO, DEBUG, TRACE)

Module Management:
  .enableModule(name)    - Enable logging for a specific module
  .disableModule(name)   - Disable logging for a specific module
  .enableAllModules()    - Enable logging for all modules
  .disableAllModules()   - Disable logging for all modules
  .listModules()         - List all registered modules
  .listEnabledModules()  - List currently enabled modules

Log History:
  .getHistory(filter?)   - Get filtered log history
  .clearHistory()        - Clear log history
  .exportHistory()       - Export log history as text
  .getErrors()           - Get only error logs
  .getWarnings()         - Get only warning logs
  .getModuleLogs(name)   - Get logs for a specific module

Legacy Access:
  .log                   - Access to base logger (auth, api, store)

Examples:
  window.debugger.enableModule('Auth')
  window.debugger.getModuleLogs('Auth')
  window.debugger.setLogLevel('DEBUG')
  window.debugger.getErrors()
    `);
  },
};

// Expose to window in development or when debug mode is enabled
if (Platform.OS === 'web' && (typeof window !== 'undefined')) {
  if (__DEV__ || process.env.EXPO_PUBLIC_DEBUG_MODE === 'true') {
    (window as any).debugger = windowDebugger;
    
    // Also expose individual module loggers for direct access
    (window as any).getLogger = getModuleLogger;
    
    console.log('🐛 Debug logger exposed to window. Type window.debugger.help() for usage.');
  }
}

// Export for use in modules
export { log } from './logger';
export { createLogger, LogLevel } from './debug-utils';