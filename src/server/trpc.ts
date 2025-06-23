import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { getSessionWithBearer } from '@/lib/auth/get-session-with-bearer';
import type { Session, User } from 'better-auth';
import { logger } from '@/lib/core/debug/server-logger';
import { trpcLogger } from '@/lib/core/debug/trpc-logger-enhanced';
import { createRateLimitMiddleware } from './middleware/rate-limiter';
import { hasPermission as checkPermission } from '@/lib/auth/permissions';

// Base context type for tRPC procedures
export interface Context {
  session: {
    session: Session;
    user: User;
  } | null;
  req: Request;
  res?: Response;
}

// Enhanced context type for protected procedures
export interface AuthenticatedContext extends Context {
  session: {
    session: Session;
    user: User;
  };
  user: User;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hospitalContext?: {
    userHospitalId?: string;
    userOrganizationId?: string;
  };
}

// Create context function
export async function createContext(req: Request): Promise<Context> {
  try {
    // Use enhanced session retrieval that handles Bearer tokens
    const sessionData = await getSessionWithBearer(req.headers);

    // Log session status for debugging
    if (sessionData) {
      logger.auth.debug('Session found in tRPC context', {
        userId: sessionData.user?.id,
        sessionId: sessionData.session?.id,
        userAgent: req.headers.get('user-agent'),
        authMethod: req.headers.get('authorization') ? 'bearer' : 'cookie',
      });
    } else {
      logger.auth.debug('No session found in tRPC context', {
        hasAuthHeader: !!req.headers.get('authorization'),
        hasCookieHeader: !!req.headers.get('cookie'),
        userAgent: req.headers.get('user-agent'),
        url: req.url,
      });
    }

    return {
      session: sessionData as any,
      req,
    };
  } catch (err) {
    // If session fetch fails, return null session
    logger.auth.error('Session fetch error in tRPC context', err);
    return {
      session: null,
      req,
    };
  }
}

// Initialize tRPC with superjson for proper Date serialization
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
export const transformer = superjson;

// Enhanced logging middleware with structured logging
const loggingMiddleware = t.middleware(async ({ path, type, next, ctx, input }) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  // Log request start using advanced logger
  trpcLogger.logRequestStart(path, type, ctx, input, requestId);
  
  try {
    const result = await next();
    const durationMs = Date.now() - start;
    
    // Log successful response using advanced logger
    trpcLogger.logRequestSuccess(path, type, result, durationMs, requestId);
    
    return result;
  } catch (error) {
    const durationMs = Date.now() - start;
    
    // Log error response using advanced logger
    trpcLogger.logRequestError(path, type, error, durationMs, requestId);
    
    throw error;
  }
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
      severity: 'INFO' as any,
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
      severity: 'WARNING' as any,
      alertGenerated: error instanceof TRPCError && error.code === 'UNAUTHORIZED',
    }, context);
    
    throw error;
  }
});

// Performance monitoring middleware
const performanceMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = performance.now();
  
  try {
    const result = await next();
    const duration = performance.now() - start;
    
    // Log slow requests (over 1 second)
    if (duration > 1000) {
      logger.warn('Slow tRPC request detected', 'SYSTEM', {
        path,
        type,
        duration: Math.round(duration),
        threshold: 1000,
      });
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    // Log performance data even for failed requests
    logger.debug('tRPC request performance', 'SYSTEM', {
      path,
      type,
      duration: Math.round(duration),
      failed: true,
    });
    
    throw error;
  }
});

// Rate limiting middleware
const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  // Use our rate limiting middleware
  const middleware = createRateLimitMiddleware();
  return middleware({ ctx, next });
});

// Enhanced authentication middleware following tRPC best practices
const authMiddleware = t.middleware(async ({ ctx, next, path }) => {
  if (!ctx.session) {
    trpcLogger.logAuthEvent('unauthorized_access', path, ctx);
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }
  
  trpcLogger.logAuthEvent('authenticated_access', path, ctx);
  
  // Get user's hospital context from database
  let hospitalContext: AuthenticatedContext['hospitalContext'];
  try {
    const { db } = await import('@/src/db');
    const { user: userTable } = await import('@/src/db/schema');
    const { healthcareUsers } = await import('@/src/db/healthcare-schema');
    const { eq } = await import('drizzle-orm');
    
    // First try to get from users table
    const [dbUser] = await db
      .select({
        defaultHospitalId: userTable.defaultHospitalId,
        organizationId: userTable.organizationId,
        role: userTable.role,
      })
      .from(userTable)
      .where(eq(userTable.id, ctx.session.user.id))
      .limit(1);
    
    let hospitalId = dbUser?.defaultHospitalId;
    
    // If user is a healthcare role but has no defaultHospitalId, check healthcare_users table
    const healthcareRoles = ['nurse', 'doctor', 'healthcare_admin', 'head_nurse', 'head_doctor', 'operator'];
    if (dbUser && healthcareRoles.includes(dbUser.role) && !hospitalId) {
      const [healthcareUser] = await db
        .select({
          hospitalId: healthcareUsers.hospitalId,
        })
        .from(healthcareUsers)
        .where(eq(healthcareUsers.userId, ctx.session.user.id))
        .limit(1);
      
      if (healthcareUser?.hospitalId) {
        hospitalId = healthcareUser.hospitalId;
        logger.info('Hospital context found in healthcare_users table', 'TRPC', {
          userId: ctx.session.user.id,
          hospitalId,
          role: dbUser.role,
        });
      }
    }
    
    if (dbUser) {
      hospitalContext = {
        userHospitalId: hospitalId || undefined,
        userOrganizationId: dbUser.organizationId || undefined,
      };
      
      logger.debug('Hospital context resolved', 'TRPC', {
        userId: ctx.session.user.id,
        hospitalId: hospitalContext.userHospitalId,
        organizationId: hospitalContext.userOrganizationId,
        role: dbUser.role,
      });
    }
  } catch (error) {
    logger.warn('Failed to fetch hospital context', 'TRPC', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: ctx.session.user.id,
    });
  }
  
  // Enhance context with type-safe user data
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
      hospitalContext,
      // Add helper functions for authorization checks
      hasRole: (role: string) => (ctx.session.user as any).role === role,
      hasPermission: (permission: string) => {
        const userRole = (ctx.session.user as any).role || 'user';
        return checkPermission(userRole, permission as any);
      },
    },
  });
});

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure
  .use(rateLimitMiddleware)
  .use(performanceMiddleware)
  .use(loggingMiddleware)
  .use(auditMiddleware)
  .use(authMiddleware);

// Role-based procedure factory
export const createRoleProcedure = (allowedRoles: string[]) => {
  return protectedProcedure.use(async ({ ctx, next, path }) => {
    const userRole = (ctx.session.user as any).role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      trpcLogger.logAuthEvent('insufficient_permissions', path, ctx, {
        userRole,
        requiredRoles: allowedRoles,
      });
      
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }
    
    trpcLogger.logAuthEvent('role_authorized', path, ctx, {
      userRole,
      allowedRoles,
    });
    
    return next({ ctx });
  });
};

// Public procedure with logging and audit
export const publicProcedureWithLogging = t.procedure
  .use(performanceMiddleware)
  .use(loggingMiddleware)
  .use(auditMiddleware);

// Specific role-based procedures
export const adminProcedure = createRoleProcedure(['admin']);
export const managerProcedure = createRoleProcedure(['admin', 'manager']);
export const userProcedure = createRoleProcedure(['admin', 'manager', 'user']);

// Permission-based procedure factory (more granular than roles)
export const createPermissionProcedure = (requiredPermission: string) => {
  return protectedProcedure.use(async ({ ctx, next, path }) => {
    if (!ctx.hasPermission(requiredPermission)) {
      trpcLogger.logAuthEvent('insufficient_permissions', path, ctx, {
        userRole: (ctx.session.user as any).role,
        requiredPermission,
      });
      
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied. Required permission: ${requiredPermission}`
      });
    }
    
    trpcLogger.logAuthEvent('permission_authorized', path, ctx, {
      userRole: (ctx.session.user as any).role,
      requiredPermission,
    });
    
    return next({ ctx });
  });
};

// Common permission-based procedures
export const viewContentProcedure = createPermissionProcedure('view_content');

// Hospital-specific procedure that requires hospital context
export const hospitalProcedure = protectedProcedure.use(async ({ ctx, next, path }) => {
  if (!ctx.hospitalContext?.userHospitalId) {
    trpcLogger.logAuthEvent('no_hospital_assigned', path, ctx);
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Hospital assignment required. Please complete your profile.'
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      userHospitalId: ctx.hospitalContext.userHospitalId,
      userOrganizationId: ctx.hospitalContext.userOrganizationId,
    },
  });
});

// Healthcare-specific procedure (doctor, nurse, operator, head_doctor)
export const healthcareProcedure = hospitalProcedure.use(async ({ ctx, next, path }) => {
  const userRole = (ctx.session.user as any).role || 'user';
  const healthcareRoles = ['doctor', 'nurse', 'operator', 'head_doctor'];
  
  if (!healthcareRoles.includes(userRole)) {
    trpcLogger.logAuthEvent('non_healthcare_role', path, ctx, { userRole });
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Healthcare role required'
    });
  }
  
  return next();
});
export const manageUsersProcedure = createPermissionProcedure('manage_users');
export const viewAnalyticsProcedure = createPermissionProcedure('view_analytics');
export const manageContentProcedure = createPermissionProcedure('manage_content');

// Healthcare-specific procedures
export const viewPatientsProcedure = createPermissionProcedure('view_patients');
export const managePatientsProcedure = createPermissionProcedure('manage_patients');
export const viewHealthcareDataProcedure = createPermissionProcedure('view_healthcare_data');
export const createAlertsProcedure = createPermissionProcedure('create_alerts');
export const acknowledgeAlertsProcedure = createPermissionProcedure('acknowledge_alerts');
export const resolveAlertsProcedure = createPermissionProcedure('resolve_alerts');

// Organization procedures
export const viewOrganizationProcedure = createPermissionProcedure('view_organization');
export const manageOrganizationProcedure = createPermissionProcedure('manage_organization');
export const inviteMembersProcedure = createPermissionProcedure('invite_members');
export const manageMembersProcedure = createPermissionProcedure('manage_members');

// Admin procedures
export const viewAuditLogsProcedure = createPermissionProcedure('view_activity_logs');
export const manageSystemSettingsProcedure = createPermissionProcedure('manage_system_settings');

// Team/Shift procedures
export const viewTeamProcedure = createPermissionProcedure('view_team');
export const manageTeamProcedure = createPermissionProcedure('manage_team');
export const manageScheduleProcedure = createPermissionProcedure('manage_schedule');