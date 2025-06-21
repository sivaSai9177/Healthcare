/**
 * Server-safe logger for use in auth-server.ts
 * No React Native dependencies
 */

export const serverLogger = {
  auth: {
    info: (message: string, data?: any) => {
      console.log(`[AUTH] ${message}`, data ? JSON.stringify(data) : '');
    },
    error: (message: string, error?: any) => {
      console.error(`[AUTH] ${message}`, error);
    },
    warn: (message: string, data?: any) => {
      console.warn(`[AUTH] ${message}`, data ? JSON.stringify(data) : '');
    },
    debug: (message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUTH DEBUG] ${message}`, data ? JSON.stringify(data) : '');
      }
    },
  },
  system: {
    info: (message: string, data?: any) => {
      console.log(`[SYSTEM] ${message}`, data ? JSON.stringify(data) : '');
    },
    error: (message: string, error?: any) => {
      console.error(`[SYSTEM] ${message}`, error);
    },
    warn: (message: string, data?: any) => {
      console.warn(`[SYSTEM] ${message}`, data ? JSON.stringify(data) : '');
    },
  },
  store: {
    debug: (storeName: string, action: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[STORE DEBUG] ${storeName}.${action}`, data ? JSON.stringify(data) : '');
      }
    },
  },
};

// Add generic methods to logger for compatibility
const loggerWithGenericMethods = {
  ...serverLogger,
  // Support both 2 and 3 parameter calls
  info: (message: string, contextOrData?: any, data?: any) => {
    if (data !== undefined) {
      // 3 params: message, context, data
      console.log(`[${contextOrData}] ${message}`, data ? JSON.stringify(data) : '');
    } else {
      // 2 params: message, data
      console.log(`[INFO] ${message}`, contextOrData ? JSON.stringify(contextOrData) : '');
    }
  },
  error: (message: string, contextOrError?: any, error?: any) => {
    if (error !== undefined) {
      // 3 params: message, context, error
      console.error(`[${contextOrError}] ${message}`, error);
    } else {
      // 2 params: message, error
      console.error(`[ERROR] ${message}`, contextOrError);
    }
  },
  warn: (message: string, contextOrData?: any, data?: any) => {
    if (data !== undefined) {
      // 3 params: message, context, data
      console.warn(`[${contextOrData}] ${message}`, data ? JSON.stringify(data) : '');
    } else {
      // 2 params: message, data
      console.warn(`[WARN] ${message}`, contextOrData ? JSON.stringify(contextOrData) : '');
    }
  },
  debug: (message: string, contextOrData?: any, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      if (data !== undefined) {
        // 3 params: message, context, data
        console.log(`[${contextOrData}] ${message}`, data ? JSON.stringify(data) : '');
      } else {
        // 2 params: message, data
        console.log(`[DEBUG] ${message}`, contextOrData ? JSON.stringify(contextOrData) : '');
      }
    }
  },
};

// Export as logger for compatibility
export const logger = loggerWithGenericMethods;

// Export log object for db compatibility
export const log = {
  info: (message: string, context?: string, data?: any) => {
    console.log(`[${context || 'INFO'}] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, context?: string, error?: any) => {
    console.error(`[${context || 'ERROR'}] ${message}`, error);
  },
  warn: (message: string, context?: string, data?: any) => {
    console.warn(`[${context || 'WARN'}] ${message}`, data ? JSON.stringify(data) : '');
  },
  debug: (message: string, context?: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${context || 'DEBUG'}] ${message}`, data ? JSON.stringify(data) : '');
    }
  },
  auth: serverLogger.auth,
};