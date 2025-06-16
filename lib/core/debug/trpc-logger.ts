/**
 * tRPC Logging Middleware
 * Uses unified logger for consistent logging
 */

import { logger } from './logger';

export const trpcLogger = {
  // Basic logging methods
  logRequest: (path: string, input: any) => {
    logger.trpc.request(path, 'query', input);
  },
  
  logResponse: (path: string, result: any, duration: number) => {
    logger.trpc.success(path, 'query', duration);
  },
  
  logError: (path: string, error: any) => {
    logger.trpc.error(path, 'query', error);
  },

  // Enhanced logging methods expected by middleware
  logRequestStart: (path: string, type: string, ctx: any, input: any, requestId: string) => {
    logger.trpc.request(path, type, input, requestId);
    
    // Log auth context if available
    if (ctx.session?.user?.id) {
      logger.debug(`TRPC request with auth context`, 'TRPC', {
        userId: ctx.session.user.id,
        userRole: (ctx.session.user as any)?.role,
      });
    }
  },

  logRequestSuccess: (path: string, type: string, result: any, durationMs: number, requestId: string) => {
    logger.trpc.success(path, type, durationMs, requestId);
  },

  logRequestError: (path: string, type: string, error: any, durationMs: number, requestId: string) => {
    logger.trpc.error(path, type, error, durationMs, requestId);
  },

  // Auth event logging
  logAuthEvent: (event: string, path: string, ctx: any, details?: any) => {
    logger.auth.debug(`Auth event: ${event}`, {
      path,
      event,
      userId: ctx.session?.user?.id,
      userRole: (ctx.session?.user as any)?.role,
      ...details
    });
  }
};

export default trpcLogger;