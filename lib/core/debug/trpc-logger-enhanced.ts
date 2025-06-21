/**
 * Enhanced tRPC Logger with External Logging Service Integration
 * Sends logs to both local logger and external logging service
 */

import { logger } from './logger';
import { loggingConfig, isExternalLoggingEnabled, retryWithBackoff, type LoggingConfig } from './logging-config';

// Import debugLog from components to avoid circular deps
let debugLog: any;
try {
  debugLog = require('@/components/blocks/debug/utils/logger').debugLog;
} catch (e) {
  // Fallback if components aren't available
  debugLog = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.debug,
  };
}

class EnhancedTRPCLogger {
  private logQueue: any[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private retryCount: Map<string, number> = new Map();

  constructor() {
    if (isExternalLoggingEnabled()) {
      this.startBatchTimer();
    }
  }

  // Send log to external service
  private async sendToLoggingService(event: any): Promise<void> {
    if (!isExternalLoggingEnabled()) return;

    const config = loggingConfig.getConfig();
    
    // Add metadata
    const enrichedEvent = {
      ...event,
      environment: process.env.NODE_ENV || 'development',
      logLevel: config.logLevel,
      clientVersion: '1.0.0',
    };

    this.logQueue.push(enrichedEvent);

    if (this.logQueue.length >= config.batchSize) {
      await this.flushLogs();
    }
  }

  // Flush logs to external service with retry logic
  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const logs = [...this.logQueue];
    this.logQueue = [];
    const batchId = crypto.randomUUID();
    const config = loggingConfig.getConfig();

    const result = await retryWithBackoff(async () => {
      const response = await fetch(`${config.serviceUrl}/log/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Batch-ID': batchId,
          'X-Retry-Count': String(this.retryCount.get(batchId) || 0),
        },
        body: JSON.stringify({ events: logs }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Logging service returned ${response.status}`);
      }

      return response.json();
    });

    if (!result) {
      // Re-add logs to queue on complete failure
      this.logQueue.unshift(...logs);
      if (config.consoleOutput) {
        console.error('[TRPC_LOGGER] Failed to send logs after retries');
      }
    } else {
      // Clear retry count on success
      this.retryCount.delete(batchId);
    }
  }

  // Start batch timer
  private startBatchTimer(): void {
    const config = loggingConfig.getConfig();
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, config.flushInterval);
  }

  // Stop batch timer
  public stopBatchTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // Flush remaining logs
    this.flushLogs();
  }

  // Enhanced logging methods
  logRequestStart(path: string, type: string, ctx: any, input: any, requestId: string): void {
    const config = loggingConfig.getConfig();
    
    // Local logging
    if (config.enableTRPCLogging) {
      logger.trpc.request(path, type, input, requestId);
      
      // Log auth context if available
      if (ctx.session?.user?.id) {
        logger.debug(`Request with auth context`, 'TRPC', {
          userId: ctx.session.user.id,
          userRole: (ctx.session.user as any)?.role,
        });
      }
    }

    // Send to external service
    this.sendToLoggingService({
      type: 'trpc',
      procedure: path,
      input,
      userId: ctx.session?.user?.id,
      organizationId: ctx.session?.user?.organizationId,
      hospitalId: ctx.hospitalContext?.userHospitalId,
      traceId: requestId,
      timestamp: new Date().toISOString(),
      metadata: {
        userRole: (ctx.session?.user as any)?.role,
        requestType: type,
      },
    });
  }

  logRequestSuccess(path: string, type: string, result: any, durationMs: number, requestId: string): void {
    const config = loggingConfig.getConfig();
    
    // Local logging
    if (config.enableTRPCLogging) {
      logger.trpc.success(path, type, durationMs, requestId);
    }

    // Send to external service
    this.sendToLoggingService({
      type: 'trpc',
      procedure: path,
      output: result,
      duration: durationMs,
      success: true,
      traceId: requestId,
      timestamp: new Date().toISOString(),
    });
  }

  logRequestError(path: string, type: string, error: any, durationMs: number, requestId: string): void {
    const config = loggingConfig.getConfig();
    
    // Local logging
    if (config.enableTRPCLogging) {
      logger.trpc.error(path, type, error, durationMs, requestId);
    }

    // Send to external service
    this.sendToLoggingService({
      type: 'trpc',
      procedure: path,
      error: {
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      duration: durationMs,
      success: false,
      traceId: requestId,
      timestamp: new Date().toISOString(),
    });
  }

  logAuthEvent(event: string, path: string, ctx: any, details?: any): void {
    const config = loggingConfig.getConfig();
    
    // Local logging
    if (config.enableAuthLogging) {
      logger.auth.debug(`Auth event: ${event}`, {
        path,
        event,
        userId: ctx.session?.user?.id,
        userRole: (ctx.session?.user as any)?.role,
        ...details
      });
    }

    // Send to external service
    this.sendToLoggingService({
      type: 'auth',
      service: 'trpc',
      category: 'auth-event',
      message: `Auth event: ${event}`,
      level: 'info',
      metadata: {
        event,
        path,
        userId: ctx.session?.user?.id,
        userRole: (ctx.session?.user as any)?.role,
        ...details,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Performance logging
  logPerformance(path: string, duration: number, metadata?: any): void {
    // Send performance metrics
    this.sendToLoggingService({
      type: 'performance',
      name: `trpc.${path}`,
      value: duration,
      unit: 'ms',
      tags: {
        procedure: path,
        ...metadata,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Backward compatibility methods
  logRequest(path: string, input: any): void {
    debugLog.debug(`[TRPC] QUERY ${path}`, { hasInput: !!input });
  }
  
  logResponse(path: string, result: any, duration: number): void {
    debugLog.debug(`[TRPC] QUERY ${path} completed (${duration}ms)`);
  }
  
  logError(path: string, error: any): void {
    debugLog.error(`[TRPC] QUERY ${path} failed`, {
      error: error?.message || error,
      code: error?.code,
    });
  }
}

// Create singleton instance
export const trpcLogger = new EnhancedTRPCLogger();

// Export type for external use
export type TRPCLogger = typeof trpcLogger;

export default trpcLogger;