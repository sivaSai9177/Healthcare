import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@/lib/auth';
import type { Session, User } from 'better-auth';

// Context type for tRPC procedures
export interface Context {
  session: {
    session: Session;
    user: User;
  } | null;
  req: Request;
}

// Create context function
export async function createContext(req: Request): Promise<Context> {
  try {
    // Get session from Better Auth
    const sessionData = await auth.api.getSession({
      headers: req.headers,
    });

    return {
      session: sessionData,
      req,
    };
  } catch (err) {
    // If session fetch fails, return null session
    console.error('[TRPC] Session fetch error:', err);
    return {
      session: null,
      req,
    };
  }
}

// Initialize tRPC
const t = initTRPC.context<Context>().create();

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Logging middleware
const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;
  
  console.log(`[TRPC] ${type} ${path} - ${durationMs}ms`);
  
  return result;
});

// Audit middleware for compliance and security
const auditMiddleware = t.middleware(async ({ path, type, ctx, next }) => {
  const start = Date.now();
  
  try {
    const result = await next();
    const durationMs = Date.now() - start;
    
    // Import audit service dynamically to avoid circular dependencies
    const { auditService, AuditAction, AuditOutcome, auditHelpers } = await import('./services/audit');
    const context = auditHelpers.extractContext(ctx.req, ctx.session);
    
    // Log successful API access
    await auditService.log({
      action: AuditAction.API_ACCESS,
      outcome: AuditOutcome.SUCCESS,
      entityType: 'api_endpoint',
      entityId: path,
      description: `${type.toUpperCase()} ${path} completed successfully`,
      metadata: {
        type,
        path,
        durationMs,
        resultSize: typeof result === 'object' ? JSON.stringify(result).length : 0,
      },
      severity: 'INFO',
    }, context);
    
    return result;
  } catch (error) {
    const durationMs = Date.now() - start;
    
    // Import audit service dynamically
    const { auditService, AuditAction, AuditOutcome, auditHelpers } = await import('./services/audit');
    const context = auditHelpers.extractContext(ctx.req, ctx.session);
    
    // Log failed API access
    await auditService.log({
      action: AuditAction.API_ACCESS,
      outcome: AuditOutcome.FAILURE,
      entityType: 'api_endpoint',
      entityId: path,
      description: `${type.toUpperCase()} ${path} failed`,
      metadata: {
        type,
        path,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof TRPCError ? error.code : 'UNKNOWN',
      },
      severity: 'WARNING',
      alertGenerated: error instanceof TRPCError && error.code === 'UNAUTHORIZED',
    }, context);
    
    throw error;
  }
});

// Rate limiting middleware (basic implementation)
const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  // In production, implement proper rate limiting with Redis
  // This is a basic example for the starter template
  return next();
});

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure
  .use(loggingMiddleware)
  .use(auditMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ 
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }
    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        user: ctx.session.user,
      },
    });
  });

// Role-based procedure factory
export const createRoleProcedure = (allowedRoles: string[]) => {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const userRole = (ctx.session.user as any).role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }
    
    return next({ ctx });
  });
};

// Public procedure with logging and audit
export const publicProcedureWithLogging = t.procedure
  .use(loggingMiddleware)
  .use(auditMiddleware);

// Admin-only procedure
export const adminProcedure = createRoleProcedure(['admin']);