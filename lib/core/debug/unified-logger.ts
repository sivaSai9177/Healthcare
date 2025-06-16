/**
 * Unified Logger System
 * Centralizes all logging and integrates with DebugPanel
 */

import { debugLog as debugPanel } from '@/components/blocks/debug/utils/logger';
import type { LogLevel, DebugLog } from '@/components/blocks/debug/utils/logger';

export type LogCategory = 'AUTH' | 'API' | 'TRPC' | 'STORE' | 'ROUTER' | 'SYSTEM' | 'ERROR';

interface UnifiedLogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  source?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
}

class UnifiedLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isDebugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';
  private enabledCategories: Set<LogCategory> = new Set(['AUTH', 'API', 'TRPC', 'ERROR']);

  constructor() {
    // Load enabled categories from debug store if available
    if (typeof window !== 'undefined') {
      import('@/lib/stores/debug-store').then(({ useDebugStore }) => {
        const store = useDebugStore.getState();
        if (store.enableAuthLogging) this.enabledCategories.add('AUTH');
        if (store.enableTRPCLogging) this.enabledCategories.add('TRPC');
        if (store.enableRouterLogging) this.enabledCategories.add('ROUTER');
      });
    }
  }

  private shouldLog(category: LogCategory, level: LogLevel): boolean {
    // Always log errors
    if (level === 'error') return true;
    
    // Check if category is enabled
    if (!this.enabledCategories.has(category)) return false;
    
    // In production, only log warnings and errors
    if (!this.isDevelopment && level === 'debug') return false;
    
    return true;
  }

  private formatMessage(entry: UnifiedLogEntry): string {
    const { category, message, userId, sessionId, requestId, duration } = entry;
    let formatted = `[${category}] ${message}`;
    
    if (userId) formatted += ` (User: ${userId})`;
    if (sessionId) formatted += ` (Session: ${sessionId})`;
    if (requestId) formatted += ` (Req: ${requestId})`;
    if (duration !== undefined) formatted += ` (${duration}ms)`;
    
    return formatted;
  }

  private log(entry: Omit<UnifiedLogEntry, 'timestamp'>): void {
    const fullEntry: UnifiedLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Check if we should log
    if (!this.shouldLog(entry.category, entry.level)) return;

    // Send to DebugPanel
    const formattedMessage = this.formatMessage(fullEntry);
    const debugLogEntry: DebugLog = {
      timestamp: fullEntry.timestamp,
      level: fullEntry.level,
      message: formattedMessage,
      data: fullEntry.data,
      source: fullEntry.source || fullEntry.category,
    };

    // Use appropriate DebugPanel method
    switch (entry.level) {
      case 'error':
        debugPanel.error(formattedMessage, entry.data);
        break;
      case 'warn':
        debugPanel.warn(formattedMessage, entry.data);
        break;
      case 'info':
        debugPanel.info(formattedMessage, entry.data);
        break;
      case 'debug':
        debugPanel.debug(formattedMessage, entry.data);
        break;
    }

    // Also log to console in development
    if (this.isDevelopment) {
      const consoleData = { ...entry.data, category: entry.category };
      switch (entry.level) {
        case 'error':
          console.error(formattedMessage, consoleData);
          break;
        case 'warn':
          console.warn(formattedMessage, consoleData);
          break;
        case 'info':
          console.info(formattedMessage, consoleData);
          break;
        case 'debug':
          if (this.isDebugMode) {
            console.debug(formattedMessage, consoleData);
          }
          break;
      }
    }
  }

  // Category-specific logging methods
  auth = {
    info: (message: string, data?: any) => this.log({ 
      level: 'info', 
      category: 'AUTH', 
      message, 
      data 
    }),
    error: (message: string, error?: any) => this.log({ 
      level: 'error', 
      category: 'AUTH', 
      message, 
      data: error 
    }),
    warn: (message: string, data?: any) => this.log({ 
      level: 'warn', 
      category: 'AUTH', 
      message, 
      data 
    }),
    debug: (message: string, data?: any) => this.log({ 
      level: 'debug', 
      category: 'AUTH', 
      message, 
      data 
    }),
    // Specific auth events
    login: (userId: string, method: string, data?: any) => this.log({
      level: 'info',
      category: 'AUTH',
      message: `User login via ${method}`,
      data: { ...data, method },
      userId,
    }),
    logout: (userId: string, data?: any) => this.log({
      level: 'info',
      category: 'AUTH',
      message: 'User logout',
      data,
      userId,
    }),
    sessionRefresh: (userId: string, sessionId: string) => this.log({
      level: 'debug',
      category: 'AUTH',
      message: 'Session refreshed',
      userId,
      sessionId,
    }),
  };

  api = {
    request: (method: string, path: string, data?: any) => this.log({
      level: 'debug',
      category: 'API',
      message: `${method} ${path}`,
      data: { method, path, ...data },
    }),
    response: (method: string, path: string, status: number, duration?: number) => this.log({
      level: 'debug',
      category: 'API',
      message: `${method} ${path} → ${status}`,
      data: { method, path, status },
      duration,
    }),
    error: (method: string, path: string, error: any, duration?: number) => this.log({
      level: 'error',
      category: 'API',
      message: `${method} ${path} failed`,
      data: { method, path, error: error?.message || error },
      duration,
    }),
  };

  trpc = {
    request: (procedure: string, type: string, input?: any, requestId?: string) => this.log({
      level: 'debug',
      category: 'TRPC',
      message: `${type.toUpperCase()} ${procedure}`,
      data: { procedure, type, hasInput: !!input },
      requestId,
    }),
    success: (procedure: string, type: string, duration: number, requestId?: string) => this.log({
      level: 'debug',
      category: 'TRPC',
      message: `${type.toUpperCase()} ${procedure} completed`,
      data: { procedure, type },
      duration,
      requestId,
    }),
    error: (procedure: string, type: string, error: any, duration?: number, requestId?: string) => this.log({
      level: 'error',
      category: 'TRPC',
      message: `${type.toUpperCase()} ${procedure} failed`,
      data: { 
        procedure, 
        type, 
        error: error?.message || error,
        code: error?.code,
      },
      duration,
      requestId,
    }),
  };

  store = {
    update: (storeName: string, action: string, data?: any) => this.log({
      level: 'debug',
      category: 'STORE',
      message: `${storeName}.${action}`,
      data,
    }),
    error: (storeName: string, action: string, error: any) => this.log({
      level: 'error',
      category: 'STORE',
      message: `${storeName}.${action} failed`,
      data: { error: error?.message || error },
    }),
  };

  router = {
    navigate: (from: string, to: string, params?: any) => this.log({
      level: 'debug',
      category: 'ROUTER',
      message: `Navigate: ${from} → ${to}`,
      data: { from, to, params },
    }),
    error: (path: string, error: any) => this.log({
      level: 'error',
      category: 'ROUTER',
      message: `Navigation error: ${path}`,
      data: { path, error: error?.message || error },
    }),
  };

  system = {
    info: (message: string, data?: any) => this.log({
      level: 'info',
      category: 'SYSTEM',
      message,
      data,
    }),
    error: (message: string, error?: any) => this.log({
      level: 'error',
      category: 'SYSTEM',
      message,
      data: error,
    }),
    warn: (message: string, data?: any) => this.log({
      level: 'warn',
      category: 'SYSTEM',
      message,
      data,
    }),
  };

  // Generic logging methods
  info = (message: string, category: LogCategory = 'SYSTEM', data?: any) => 
    this.log({ level: 'info', category, message, data });
  
  error = (message: string, category: LogCategory = 'ERROR', error?: any) => 
    this.log({ level: 'error', category, message, data: error });
  
  warn = (message: string, category: LogCategory = 'SYSTEM', data?: any) => 
    this.log({ level: 'warn', category, message, data });
  
  debug = (message: string, category: LogCategory = 'SYSTEM', data?: any) => 
    this.log({ level: 'debug', category, message, data });

  // Enable/disable categories
  enableCategory(category: LogCategory) {
    this.enabledCategories.add(category);
  }

  disableCategory(category: LogCategory) {
    this.enabledCategories.delete(category);
  }

  setCategories(categories: LogCategory[]) {
    this.enabledCategories = new Set(categories);
  }
}

// Export singleton instance
export const logger = new UnifiedLogger();

// Export for backward compatibility
export const log = {
  info: (message: string, context?: string, data?: any) => 
    logger.info(message, (context as LogCategory) || 'SYSTEM', data),
  error: (message: string, context?: string, error?: any) => 
    logger.error(message, (context as LogCategory) || 'ERROR', error),
  warn: (message: string, context?: string, data?: any) => 
    logger.warn(message, (context as LogCategory) || 'SYSTEM', data),
  debug: (message: string, context?: string, data?: any) => 
    logger.debug(message, (context as LogCategory) || 'SYSTEM', data),
  auth: logger.auth,
  api: logger.api,
  store: logger.store,
};

// Export types
export type { UnifiedLogEntry, UnifiedLogger };