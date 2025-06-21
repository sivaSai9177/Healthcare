import { z } from 'zod';
import { 
  router, 
  publicProcedure, 
  protectedProcedure, 
  publicProcedureWithLogging,
  adminProcedure,
  managerProcedure,
  viewAnalyticsProcedure
} from '../trpc';
import { auth } from '@/lib/auth/auth-server';
import { TRPCError } from '@trpc/server';
import { log, logger } from '@/lib/core/debug/server-logger';
import { getCachedSession, setCachedSession, clearCachedSession } from '@/lib/auth/session-cache';

// Import comprehensive server-side validation schemas
import {
  SignInInputSchema,
  SignUpInputSchema,
  CompleteProfileInputSchema,
  ListUsersInputSchema,
  UpdateUserRoleInputSchema,
  AnalyticsInputSchema,
  UserRoleSchema,
  UserResponseSchema,
  AuthResponseSchema,
  SessionResponseSchema,
  SelectHospitalInputSchema,
  HospitalResponseSchema,
  validateUserRole
} from '@/lib/validations/server';
import { authExtensions } from './auth-extensions';

// Security helpers
const sanitizeInput = {
  text: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  },
  email: (input: string): string => {
    const cleaned = input.toLowerCase().trim();
    if (cleaned.includes('..') || cleaned.includes('--') || cleaned.includes('/*')) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid email format'
      });
    }
    return cleaned;
  }
};

// Rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (identifier: string, maxRequests: number, windowMs: number) => {
  const now = Date.now();
  const current = rateLimitStore.get(identifier);
  
  if (!current || current.resetTime < now) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return;
  }
  
  if (current.count >= maxRequests) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`
    });
  }
  
  current.count++;
};

// Server-side validation utilities are available via imports

export const authRouter = router({
  // Sign in with email - with comprehensive server-side validation
  signIn: publicProcedureWithLogging
    .input(SignInInputSchema)
    .output(AuthResponseSchema)
    .mutation(async ({ input, ctx }): Promise<z.infer<typeof AuthResponseSchema>> => {
      // Rate limiting: 5 attempts per minute per IP
      const clientIp = ctx.req.headers.get('x-forwarded-for')?.split(',')[0] || 
                       ctx.req.headers.get('x-real-ip') || 'unknown';
      checkRateLimit(`signin:${clientIp}`, 5, 60000);
      
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput.email(input.email);
      
      const { auditService, auditHelpers, AuditAction, AuditOutcome } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req);
      
      try {
        const response = await auth.api.signInEmail({
          body: {
            email: sanitizedEmail,
            password: input.password,
          },
        });

        if (!response) {
          // Log failed login attempt
          await auditService.logAuth(
            AuditAction.LOGIN_FAILED,
            AuditOutcome.FAILURE,
            { ...context, userEmail: input.email },
            { reason: 'Invalid credentials' }
          );
          
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          });
        }

        // Debug: Log the raw response from Better Auth
        log.info('[AUTH] Raw Better Auth signin response:', 'COMPONENT', {});

        // Query the database directly to get the complete user data with custom fields
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq } = await import('drizzle-orm');
        
        const [dbUser] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, response.user.id))
          .limit(1);
        
        log.info('[AUTH] Database user data:', 'COMPONENT', {});

        // Log successful login
        await auditService.logAuth(
          AuditAction.LOGIN,
          AuditOutcome.SUCCESS,
          { 
            ...context, 
            userId: response.user.id,
            userEmail: response.user.email,
            userName: response.user.name,
            userRole: (response.user as any).role || 'user'
          }
        );

        // Ensure we return the complete user object with custom fields from database
        const completeUser = {
          ...response.user,
          role: dbUser?.role || (response.user as any).role || 'user',
          organizationId: dbUser?.organizationId || (response.user as any).organizationId || undefined,
          needsProfileCompletion: dbUser?.needsProfileCompletion ?? (response.user as any).needsProfileCompletion ?? false,
          contactPreferences: dbUser?.contactPreferences 
            ? (typeof dbUser.contactPreferences === 'string' 
              ? JSON.parse(dbUser.contactPreferences) 
              : dbUser.contactPreferences)
            : { email: true, push: true, sms: false },
        };

        log.info('[AUTH] Complete user object being returned:', 'COMPONENT', {});
        
        // Validate user through schema to ensure proper format
        const validatedUser = UserResponseSchema.parse({
          ...completeUser,
          status: 'active',
          isEmailVerified: dbUser?.emailVerified ?? false,
          createdAt: dbUser?.createdAt || response.user.createdAt || new Date(),
          updatedAt: dbUser?.updatedAt || response.user.updatedAt || new Date(),
        });

        return {
          success: true,
          user: validatedUser,
          token: response.token,
        };
      } catch (error) {
        // Log failed login if not already logged
        if (!(error instanceof TRPCError)) {
          await auditService.logAuth(
            AuditAction.LOGIN_FAILED,
            AuditOutcome.FAILURE,
            { ...context, userEmail: input.email },
            { reason: error.message || 'System error' }
          );
        }
        
        logger.auth.error('Sign in error', error);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message || 'Failed to sign in',
        });
      }
    }),

  // Sign up with email - with comprehensive validation and organization handling
  signUp: publicProcedureWithLogging
    .input(SignUpInputSchema)
    .output(AuthResponseSchema)
    .mutation(async ({ input, ctx }): Promise<z.infer<typeof AuthResponseSchema>> => {
      // Rate limiting: 3 signups per 5 minutes per IP
      const clientIp = ctx.req.headers.get('x-forwarded-for')?.split(',')[0] || 
                       ctx.req.headers.get('x-real-ip') || 'unknown';
      checkRateLimit(`signup:${clientIp}`, 3, 300000);
      
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput.email(input.email);
      const sanitizedName = sanitizeInput.text(input.name);
      const sanitizedOrgName = input.organizationName ? 
        sanitizeInput.text(input.organizationName) : undefined;
      
      // Additional security checks
      if (input.password.toLowerCase().includes(input.email.split('@')[0].toLowerCase())) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Password cannot contain your email address'
        });
      }
      
      try {
        log.info('[AUTH] Processing signup with input:', 'COMPONENT', {
          email: sanitizedEmail,
          role: input.role,
          hasOrgCode: !!input.organizationCode,
          hasOrgName: !!sanitizedOrgName,
          acceptTerms: input.acceptTerms,
          acceptPrivacy: input.acceptPrivacy
        });
        
        // First, create the user account with Better Auth
        const signUpResponse = await auth.api.signUpEmail({
          body: {
            email: sanitizedEmail,
            password: input.password,
            name: sanitizedName,
            // role and needsProfileCompletion will be set via database update
          },
          headers: ctx.req.headers,
        });

        if (!signUpResponse) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Failed to create account',
          });
        }

        log.info('[AUTH] User created successfully:', 'COMPONENT', {});

        // Immediately update user with role and other fields in database
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq } = await import('drizzle-orm');
        
        // Healthcare roles and guest users need profile completion
        const healthcareRoles = ['doctor', 'nurse', 'head_doctor', 'operator'];
        const needsProfileCompletion = healthcareRoles.includes(input.role) || input.role === 'guest';
        
        await db.update(userTable)
          .set({ 
            role: input.role,
            phoneNumber: input.phoneNumber,
            department: input.department as any, // Department enum is validated by Zod schema
            needsProfileCompletion: needsProfileCompletion,
            contactPreferences: '{"email": true, "push": true, "sms": false}', // Ensure default is set
            updatedAt: new Date()
          })
          .where(eq(userTable.id, signUpResponse.user.id));
          
        // Create a session for the user after signup
        let token = signUpResponse.token;
        let session = signUpResponse.session;
        
        // If no session/token returned from signUpEmail, sign them in to create one
        if (!token || !session) {
          const signInResponse = await auth.api.signInEmail({
            body: {
              email: sanitizedEmail,
              password: input.password,
            },
            headers: ctx.req.headers,
          });
          
          token = signInResponse.token;
          session = signInResponse.session;
        }

        // Handle organization creation/joining based on role
        if (input.role === 'manager' || input.role === 'admin') {
          if (sanitizedOrgName) {
            log.info('[AUTH] Organization creation will be handled post-signup', 'COMPONENT', {
              name: sanitizedOrgName,
              role: input.role
            });
            
            // Store organization name in user record for later creation
            // The actual organization will be created via the organization router
            // after profile completion to avoid partial data
          }
        } else if (input.organizationCode) {
          // Healthcare roles and regular users can join by organization code
          log.info('[AUTH] Organization joining by code will be handled in profile completion', 'COMPONENT', {
            role: input.role,
            code: input.organizationCode
          });
          // Store the code for later use during profile completion
          await db.update(userTable)
            .set({ 
              organizationName: input.organizationCode, // Temporarily store code in organizationName field
              updatedAt: new Date()
            })
            .where(eq(userTable.id, signUpResponse.user.id));
        }
        
        // Fetch the updated user from database to ensure all fields are present
        const [updatedUser] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, signUpResponse.user.id))
          .limit(1);

        if (!updatedUser) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch created user',
          });
        }

        // Update user data - organization will be created later if needed
        const completeUser = {
          ...signUpResponse.user,
          ...updatedUser,
          role: updatedUser.role || input.role,
          organizationId: updatedUser.organizationId || null,
          organizationName: sanitizedOrgName || updatedUser.organizationName || null,
          needsProfileCompletion: updatedUser.needsProfileCompletion ?? needsProfileCompletion,
        };

        // Validate and return properly typed response
        const validatedUser = UserResponseSchema.parse({
          ...completeUser,
          role: validateUserRole(completeUser.role),
          status: 'active',
          needsProfileCompletion: completeUser.needsProfileCompletion,
          isEmailVerified: false, // New signups are not email verified yet
          createdAt: updatedUser.createdAt || new Date(),
          updatedAt: updatedUser.updatedAt || new Date(),
          contactPreferences: updatedUser.contactPreferences 
            ? (typeof updatedUser.contactPreferences === 'string' 
              ? JSON.parse(updatedUser.contactPreferences) 
              : updatedUser.contactPreferences)
            : { email: true, push: true, sms: false },
        });

        return AuthResponseSchema.parse({
          success: true,
          user: validatedUser,
          token: token || undefined,
        });
      } catch (error: any) {
        logger.auth.error('Sign up error', error);
        logger.auth.error('Error details', {
          message: error.message,
          stack: error.stack,
          code: error.code,
          status: error.status,
        });
        
        // Check if it's a validation error
        if (error.name === 'ZodError' || error.issues) {
          logger.auth.error('Validation error', error.issues || error.errors);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Validation failed: ' + (error.message || 'Invalid input data'),
          });
        }
        
        // Check if it's a Better Auth error
        if (error.message?.includes('email') && error.message?.includes('exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'An account with this email already exists',
          });
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to create account',
        });
      }
    }),


  // Get current session with comprehensive validation
  getSession: publicProcedure
    .output(SessionResponseSchema.nullable())
    .query(async ({ ctx }): Promise<z.infer<typeof SessionResponseSchema> | null> => {
      try {
        // Enhanced logging for OAuth debugging
        logger.auth.debug('getSession called', {
          hasSession: !!ctx.session,
          sessionUserId: ctx.session?.user?.id,
          sessionUserEmail: ctx.session?.user?.email,
          sessionKeys: ctx.session ? Object.keys(ctx.session) : [],
          userKeys: ctx.session?.user ? Object.keys(ctx.session.user) : [],
          timestamp: new Date().toISOString()
        });
        
        // Return null early if no session exists
        if (!ctx.session || !ctx.session.user || !ctx.session.session) {
          logger.auth.debug('No valid session found, returning null', {
            hasCtxSession: !!ctx.session,
            hasUser: !!ctx.session?.user,
            hasSessionObj: !!ctx.session?.session
          });
          return null;
        }
      
      // Check session cache first
      const sessionToken = ctx.session.session.token;
      const cachedData = getCachedSession(sessionToken);
      
      if (cachedData) {
        logger.auth.debug('Returning cached session data', {
          userId: cachedData.user.id,
          cached: true
        });
        return cachedData;
      }
      
      // Fetch fresh user data from database to ensure we have latest data
      let dbUser = null;
      let healthcareHospitalId = null;
      try {
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { healthcareUsers } = await import('@/src/db/healthcare-schema');
        const { eq } = await import('drizzle-orm');
        
        const [user] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, ctx.session.user.id))
          .limit(1);
        
        dbUser = user;
        
        // If user is a healthcare role but has no defaultHospitalId, check healthcare_users table
        const healthcareRoles = ['nurse', 'doctor', 'healthcare_admin', 'head_nurse', 'head_doctor'];
        if (dbUser && healthcareRoles.includes(dbUser.role) && !dbUser.defaultHospitalId) {
          const [healthcareUser] = await db
            .select({
              hospitalId: healthcareUsers.hospitalId,
            })
            .from(healthcareUsers)
            .where(eq(healthcareUsers.userId, ctx.session.user.id))
            .limit(1);
          
          if (healthcareUser?.hospitalId) {
            healthcareHospitalId = healthcareUser.hospitalId;
            logger.auth.debug('Found hospital assignment in healthcare_users', {
              userId: dbUser.id,
              hospitalId: healthcareHospitalId,
              role: dbUser.role
            });
          }
        }
        
        logger.auth.debug('Database user query result', {
          id: dbUser?.id,
          email: dbUser?.email,
          role: dbUser?.role,
          needsProfileCompletion: dbUser?.needsProfileCompletion,
          hasDbUser: !!dbUser,
          organizationId: dbUser?.organizationId,
          defaultHospitalId: dbUser?.defaultHospitalId,
          healthcareHospitalId: healthcareHospitalId,
          timestamp: new Date().toISOString()
        });
        
        log.auth.debug('getSession - DB user data', {
          id: dbUser?.id,
          email: dbUser?.email,
          role: dbUser?.role,
          needsProfileCompletion: dbUser?.needsProfileCompletion,
          hasDbUser: !!dbUser
        });

        // Check if this is a new OAuth user who needs profile completion
        // If user has no role, guest role, or the default 'user' role with needsProfileCompletion, they need to complete their profile
        // Healthcare roles without organization or hospital also need profile completion
        const healthcareRolesCheck = ['doctor', 'nurse', 'head_doctor', 'operator'];
        const isHealthcareWithoutSetup = dbUser && healthcareRolesCheck.includes(dbUser.role) && (!dbUser.organizationId || (!dbUser.defaultHospitalId && !healthcareHospitalId));
        
        const isIncompleteProfile = dbUser && (
          !dbUser.role || 
          dbUser.role === 'guest' || 
          (dbUser.role === 'user' && dbUser.needsProfileCompletion) ||
          isHealthcareWithoutSetup
        );
        
        if (isIncompleteProfile) {
          logger.auth.debug('User has incomplete profile', {
            id: dbUser.id,
            role: dbUser.role,
            needsProfileCompletion: dbUser.needsProfileCompletion,
            isGuest: dbUser.role === 'guest',
            organizationId: dbUser.organizationId
          });
          
          log.info('[AUTH] Detected user with incomplete profile:', 'COMPONENT', {
            id: dbUser.id,
            role: dbUser.role,
            needsProfileCompletion: dbUser.needsProfileCompletion,
            hasName: !!dbUser.name,
            hasEmail: !!dbUser.email,
            organizationId: dbUser.organizationId
          });
          
          // If they haven't been marked for profile completion yet, do it now
          if (!dbUser.needsProfileCompletion) {
            logger.auth.debug('Marking user for profile completion in DB');
            log.info('[AUTH] Marking user for profile completion', 'COMPONENT', {});
            
            const [updatedUser] = await db
              .update(userTable)
              .set({ 
                needsProfileCompletion: true,
                updatedAt: new Date()
              })
              .where(eq(userTable.id, ctx.session.user.id))
              .returning();
            
            dbUser = updatedUser;
            logger.auth.debug('User marked for profile completion', {
              id: dbUser.id,
              needsProfileCompletion: dbUser.needsProfileCompletion
            });
            
            log.info('[AUTH] Updated user for profile completion:', 'COMPONENT', {
              id: dbUser.id,
              role: dbUser.role,
              needsProfileCompletion: dbUser.needsProfileCompletion
            });
          }
        }
        
      } catch (dbError) {
        logger.auth.error('Database query failed in getSession', dbError);
        // Log more details about the error
        logger.auth.error('Database error details', {
          message: dbError instanceof Error ? dbError.message : 'Unknown error',
          stack: dbError instanceof Error ? dbError.stack : undefined,
          userId: ctx.session.user.id
        });
        // Continue with session data only, but set dbUser to null explicitly
        dbUser = null;
      }
      
      try {
        // Check if this is a healthcare role without proper setup BEFORE building userData
        const healthcareRolesCheck = ['doctor', 'nurse', 'head_doctor', 'operator'];
        const isHealthcareWithoutSetup = dbUser && healthcareRolesCheck.includes(dbUser.role) && (!dbUser.organizationId || (!dbUser.defaultHospitalId && !healthcareHospitalId));
        
        if (isHealthcareWithoutSetup) {
          logger.auth.debug('Healthcare user without proper setup detected', {
            userId: dbUser.id,
            role: dbUser.role,
            hasOrganization: !!dbUser.organizationId,
            hasDefaultHospital: !!dbUser.defaultHospitalId,
            hasHealthcareHospital: !!healthcareHospitalId,
            willSetNeedsProfileCompletion: true
          });
        }
        
        // Ensure dates are properly handled
        const parseDate = (date: any): Date => {
          if (date instanceof Date) return date;
          if (typeof date === 'string') return new Date(date);
          return new Date();
        };
        
        // Build user data carefully with proper defaults and null safety
        const userData = {
          id: ctx.session.user.id || '',
          email: ctx.session.user.email || '',
          name: ctx.session.user.name || 'Unknown User',
          role: validateUserRole(dbUser?.role || (ctx.session.user as any).role || 'guest'),
          organizationId: dbUser?.organizationId || (ctx.session.user as any).organizationId || null,
          organizationName: dbUser?.organizationName || null,
          phoneNumber: dbUser?.phoneNumber || null,
          department: dbUser?.department || null,
          jobTitle: dbUser?.jobTitle || null,
          bio: dbUser?.bio || null,
          contactPreferences: dbUser?.contactPreferences 
            ? (typeof dbUser.contactPreferences === 'string' 
              ? JSON.parse(dbUser.contactPreferences) 
              : dbUser.contactPreferences)
            : { email: true, push: true, sms: false },
          needsProfileCompletion: isHealthcareWithoutSetup ? true : (dbUser?.needsProfileCompletion ?? (ctx.session.user as any).needsProfileCompletion ?? false),
          status: 'active' as const,
          createdAt: parseDate(ctx.session.user.createdAt),
          updatedAt: parseDate(ctx.session.user.updatedAt),
          isEmailVerified: dbUser?.emailVerified ?? ctx.session.user.emailVerified ?? false,
          lastLoginAt: new Date(), // Current session indicates recent login
          defaultHospitalId: dbUser?.defaultHospitalId || healthcareHospitalId || null,
        };
        
        // Log the user data before validation
        logger.auth.debug('User data before validation', {
          userId: userData.id,
          role: userData.role,
          hasOrganizationId: !!userData.organizationId,
          needsProfileCompletion: userData.needsProfileCompletion,
          createdAt: userData.createdAt.toISOString(),
          updatedAt: userData.updatedAt.toISOString()
        });

        // Validate user data with Zod - this will transform date strings if needed
        const validatedUser = UserResponseSchema.parse(userData);
        
        // Build session response with date handling
        const sessionResponse = {
          session: {
            id: ctx.session.session.id,
            userId: ctx.session.session.userId,
            expiresAt: parseDate(ctx.session.session.expiresAt),
            createdAt: parseDate(ctx.session.session.createdAt),
            token: (ctx.session.session as any).token || undefined, // Include token if available
          },
          user: validatedUser,
        };
        
        // Log session data before final validation
        logger.auth.debug('Session response before validation', {
          sessionId: sessionResponse.session.id,
          userId: sessionResponse.user.id,
          expiresAt: sessionResponse.session.expiresAt.toISOString(),
          createdAt: sessionResponse.session.createdAt.toISOString()
        });
        
        logger.auth.debug('Returning session response', {
          userId: validatedUser.id,
          userRole: validatedUser.role,
          needsProfileCompletion: validatedUser.needsProfileCompletion,
          isGuest: validatedUser.role === 'guest',
          shouldRedirectToProfile: validatedUser.needsProfileCompletion || validatedUser.role === 'guest',
          timestamp: new Date().toISOString()
        });

        const validatedResponse = SessionResponseSchema.parse(sessionResponse);
        
        // Cache the session data for subsequent requests
        setCachedSession(sessionToken, validatedResponse);
        
        return validatedResponse;
        
      } catch (error) {
        logger.auth.error('Session validation error in getSession', error);
        logger.auth.error('Detailed validation error', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          hasSession: !!ctx.session,
          userId: ctx.session?.user?.id,
          dbUser: !!dbUser,
          errorType: error?.constructor?.name,
          zodErrors: (error as any)?.errors || (error as any)?.issues,
        });
        
        // Return null on validation errors to allow graceful fallback
        return null;
      }
      } catch (outerError) {
        // Catch any unexpected errors at the top level
        logger.auth.error('Unexpected error in getSession endpoint', outerError);
        logger.auth.error('Outer error details', {
          message: outerError instanceof Error ? outerError.message : 'Unknown error',
          stack: outerError instanceof Error ? outerError.stack : undefined,
          type: outerError?.constructor?.name,
        });
        
        // Return null on error to prevent "headers already sent" error
        // This is consistent with the endpoint's return type: SessionResponseSchema.nullable()
        return null;
      }
    }),

  // Get current user (protected)
  getMe: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        ...ctx.user,
        role: (ctx.user as any).role || 'user',
        organizationId: (ctx.user as any).organizationId,
      };
    }),
    
  // Debug endpoint to check user data
  debugUserData: protectedProcedure
    .query(async ({ ctx }) => {
      // Get fresh user data from database
      const { db } = await import('@/src/db');
      const { user: users } = await import('@/src/db/schema');
      const { eq } = await import('drizzle-orm');
      
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      
      return {
        contextUser: ctx.user,
        databaseUser: dbUser,
        comparison: {
          organizationIdMatch: (ctx.user as any).organizationId === dbUser?.organizationId,
          contextOrgId: (ctx.user as any).organizationId,
          dbOrgId: dbUser?.organizationId,
          contextOrgIdType: typeof (ctx.user as any).organizationId,
          dbOrgIdType: typeof dbUser?.organizationId,
        },
      };
    }),

  // Handle social (OAuth) sign-in for first-time users
  socialSignIn: publicProcedureWithLogging
    .input(z.object({
      provider: z.enum(['google', 'apple', 'microsoft', 'github']),
      token: z.string().optional(), // OAuth token if available
      userInfo: z.object({
        email: z.string().email(),
        name: z.string(),
        picture: z.string().url().optional(),
        verified: z.boolean().optional(),
      }).optional(),
      deviceInfo: z.object({
        userAgent: z.string().max(500).optional(),
        platform: z.enum(['ios', 'android', 'web']).optional(),
      }).optional(),
    }))
    .output(z.object({
      success: z.literal(true),
      user: UserResponseSchema,
      needsProfileCompletion: z.boolean(),
      token: z.string().optional(),
      isNewUser: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Rate limiting: 10 social sign-ins per minute per IP
      const clientIp = ctx.req.headers.get('x-forwarded-for')?.split(',')[0] || 
                       ctx.req.headers.get('x-real-ip') || 'unknown';
      checkRateLimit(`social:${clientIp}`, 10, 60000);

      const { auditService, AuditAction, AuditOutcome, AuditSeverity, auditHelpers } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req);

      try {
        log.info('[AUTH] Social sign-in initiated', 'COMPONENT', {
          provider: input.provider,
          hasToken: !!input.token,
          hasUserInfo: !!input.userInfo,
          platform: input.deviceInfo?.platform
        });

        // Check if user already exists by email
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq } = await import('drizzle-orm');

        let existingUser = null;
        if (input.userInfo?.email) {
          const [user] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.email, input.userInfo.email))
            .limit(1);
          existingUser = user;
        }

        // If user exists, return their current state
        if (existingUser) {
          log.info('[AUTH] Existing social user found:', 'COMPONENT', {
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.role,
            needsProfileCompletion: existingUser.needsProfileCompletion
          });

          // Log existing user sign-in
          await auditService.log({
            action: AuditAction.LOGIN,
            outcome: AuditOutcome.SUCCESS,
            entityType: 'user',
            entityId: existingUser.id,
            description: `User signed in via ${input.provider} OAuth`,
            metadata: { 
              provider: input.provider,
              isNewUser: false
            },
            severity: AuditSeverity.INFO,
          }, { 
            ...context, 
            userId: existingUser.id,
            userEmail: existingUser.email
          });

          // Validate and return existing user
          const validatedUser = UserResponseSchema.parse({
            ...existingUser,
            role: validateUserRole(existingUser.role),
            status: 'active',
            isEmailVerified: true, // OAuth users are considered verified
            contactPreferences: existingUser.contactPreferences 
              ? (typeof existingUser.contactPreferences === 'string' 
                ? JSON.parse(existingUser.contactPreferences) 
                : existingUser.contactPreferences)
              : { email: true, push: true, sms: false },
          });

          return {
            success: true as const,
            user: validatedUser,
            needsProfileCompletion: existingUser.needsProfileCompletion || false,
            isNewUser: false,
          };
        }

        // Create new OAuth user with temporary guest role
        if (!input.userInfo) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User information is required for new social sign-in',
          });
        }

        log.info('[AUTH] Creating new social user:', 'COMPONENT', {
          email: input.userInfo.email,
          name: input.userInfo.name,
          provider: input.provider
        });

        // Use Better Auth to create the OAuth user
        try {
          // For new OAuth users, we'll create them directly in the database
          // since Better Auth OAuth creation is handled by the OAuth callback
          const newUserId = crypto.randomUUID();
          
          const [newUser] = await db
            .insert(userTable)
            .values({
              id: newUserId,
              email: input.userInfo.email,
              name: input.userInfo.name,
              role: 'guest', // Temporary role until profile completion
              needsProfileCompletion: true, // Must complete profile
              emailVerified: true, // OAuth users are verified
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          log.info('[AUTH] New social user created:', 'COMPONENT', {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            needsProfileCompletion: newUser.needsProfileCompletion
          });

          // Log new user creation
          await auditService.log({
            action: AuditAction.LOGIN,
            outcome: AuditOutcome.SUCCESS,
            entityType: 'user',
            entityId: newUser.id,
            description: `New user created via ${input.provider} OAuth`,
            metadata: { 
              provider: input.provider,
              isNewUser: true
            },
            severity: AuditSeverity.INFO,
          }, { 
            ...context, 
            userId: newUser.id,
            userEmail: newUser.email
          });

          // Validate and return new user
          const validatedUser = UserResponseSchema.parse({
            ...newUser,
            role: validateUserRole(newUser.role),
            status: 'active',
            isEmailVerified: true,
            contactPreferences: newUser.contactPreferences 
              ? (typeof newUser.contactPreferences === 'string' 
                ? JSON.parse(newUser.contactPreferences) 
                : newUser.contactPreferences)
              : { email: true, push: true, sms: false },
          });

          return {
            success: true as const,
            user: validatedUser,
            needsProfileCompletion: true,
            isNewUser: true,
          };

        } catch (dbError) {
          logger.auth.error('Failed to create OAuth user', dbError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create user account',
          });
        }

      } catch (error) {
        // Log failed social sign-in
        await auditService.log({
          action: AuditAction.LOGIN_FAILED,
          outcome: AuditOutcome.FAILURE,
          entityType: 'user',
          entityId: input.userInfo?.email || 'unknown',
          description: `Social sign-in failed via ${input.provider}`,
          metadata: { 
            provider: input.provider,
            reason: error.message || 'Social sign-in failed'
          },
          severity: AuditSeverity.WARNING,
        }, context);

        logger.auth.error('Social sign-in error', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Social sign-in failed',
        });
      }
    }),

  // Complete profile for new OAuth users with comprehensive validation
  completeProfile: protectedProcedure
    .input(CompleteProfileInputSchema)
    .output(z.object({ success: z.literal(true), user: UserResponseSchema, organizationId: z.string().optional(), hospitalId: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      log.info('[AUTH] completeProfile called with input:', 'COMPONENT', input);
      log.info('[AUTH] completeProfile user context:', 'COMPONENT', {
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        currentRole: (ctx.user as any).role,
        currentOrganizationId: (ctx.user as any).organizationId,
        currentHospitalId: (ctx.user as any).defaultHospitalId,
        needsProfileCompletion: (ctx.user as any).needsProfileCompletion
      });

      const { auditService, auditHelpers, AuditAction, AuditOutcome } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req, ctx.session);
      
      // Capture before state for audit
      const beforeState = {
        name: ctx.user.name,
        role: (ctx.user as any).role,
        organizationId: (ctx.user as any).organizationId,
        needsProfileCompletion: (ctx.user as any).needsProfileCompletion,
      };
      
      try {
        // Update user directly in database to ensure all fields are saved
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq, and, sql } = await import('drizzle-orm');
        
        // Handle organization logic based on role
        let finalOrganizationId = input.organizationId;
        const healthcareRoles = ['doctor', 'nurse', 'head_doctor', 'operator'];
        
        if (input.role === 'manager' || input.role === 'admin') {
          if (input.organizationName) {
            // Create new organization
            log.info('[AUTH] Creating new organization:', 'COMPONENT', {});
            const { organization, organizationMember, organizationSettings } = await import('@/src/db/organization-schema');
            
            // Create slug from name
            const createSlug = (name: string): string => {
              return name
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 50);
            };
            
            const baseSlug = createSlug(input.organizationName);
            // Add timestamp to make slug unique
            const slug = `${baseSlug}-${Date.now()}`;
            
            // Create organization in transaction
            const result = await db.transaction(async (tx) => {
              // Create organization
              const [newOrg] = await tx
                .insert(organization)
                .values({
                  name: input.organizationName,
                  slug,
                  type: 'business',
                  size: 'small',
                  createdBy: ctx.user.id,
                  status: 'active',
                })
                .returning();
              
              // Add creator as owner
              await tx.insert(organizationMember).values({
                organizationId: newOrg.id,
                userId: ctx.user.id,
                role: 'owner',
                status: 'active',
              });
              
              // Create default settings
              await tx.insert(organizationSettings).values({
                organizationId: newOrg.id,
              });
              
              return newOrg;
            });
            
            finalOrganizationId = result.id;
            log.info('[AUTH] Organization created:', 'COMPONENT', { organizationId: result.id });
          }
        } else if (input.role === 'user' && input.organizationCode) {
          // Join organization by code
          log.info('[AUTH] Looking up organization by code:', 'COMPONENT', { code: input.organizationCode });
          const { organizationCode, organization, organizationMember } = await import('@/src/db/organization-schema');
          
          const [codeData] = await db
            .select({
              code: organizationCode,
              org: organization,
            })
            .from(organizationCode)
            .innerJoin(organization, eq(organizationCode.organizationId, organization.id))
            .where(
              and(
                eq(organizationCode.code, input.organizationCode),
                eq(organizationCode.isActive, true),
                eq(organization.status, 'active')
              )
            )
            .limit(1);
          
          if (codeData) {
            // Check if code is valid
            if (codeData.code.expiresAt && codeData.code.expiresAt < new Date()) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Organization code has expired',
              });
            }
            
            if (codeData.code.maxUses && codeData.code.currentUses >= codeData.code.maxUses) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Organization code usage limit reached',
              });
            }
            
            // Add user as member
            await db.transaction(async (tx) => {
              await tx.insert(organizationMember).values({
                organizationId: codeData.org.id,
                userId: ctx.user.id,
                role: codeData.code.type || 'member',
                status: 'active',
              });
              
              // Increment usage count
              await tx
                .update(organizationCode)
                .set({
                  currentUses: sql`${organizationCode.currentUses} + 1`,
                  updatedAt: new Date(),
                })
                .where(eq(organizationCode.id, codeData.code.id));
            });
            
            finalOrganizationId = codeData.org.id;
            log.info('[AUTH] User joined organization by code:', 'COMPONENT', { organizationId: codeData.org.id });
          } else {
            log.warn('[AUTH] Invalid organization code provided:', 'COMPONENT', { code: input.organizationCode });
            // Don't throw error, just proceed without organization
          }
        } else if (input.role === 'user' && !input.organizationCode) {
          // Create personal workspace
          log.info('[AUTH] Creating personal workspace for user', 'COMPONENT', {});
          const { organization, organizationMember, organizationSettings } = await import('@/src/db/organization-schema');
          
          const result = await db.transaction(async (tx) => {
            // Create personal organization
            const [newOrg] = await tx
              .insert(organization)
              .values({
                name: `${input.name}'s Workspace`,
                slug: `${ctx.user.id.slice(0, 8)}-workspace`,
                type: 'personal',
                size: 'solo',
                createdBy: ctx.user.id,
                status: 'active',
              })
              .returning();
            
            // Add user as owner
            await tx.insert(organizationMember).values({
              organizationId: newOrg.id,
              userId: ctx.user.id,
              role: 'owner',
              status: 'active',
            });
            
            // Create default settings
            await tx.insert(organizationSettings).values({
              organizationId: newOrg.id,
            });
            
            return newOrg;
          });
          
          finalOrganizationId = result.id;
          log.info('[AUTH] Personal workspace created:', 'COMPONENT', { organizationId: result.id });
        } else if (healthcareRoles.includes(input.role) && input.organizationName && !finalOrganizationId) {
          // Create healthcare organization
          log.info('[AUTH] Creating healthcare organization', 'COMPONENT', {});
          const { organization, organizationMember, organizationSettings } = await import('@/src/db/organization-schema');
          
          const createSlug = (name: string): string => {
            return name
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 50);
          };
          
          const baseSlug = createSlug(input.organizationName);
          // Add timestamp to make slug unique
          const slug = `${baseSlug}-${Date.now()}`;
          
          const result = await db.transaction(async (tx) => {
            // Create healthcare organization
            const [newOrg] = await tx
              .insert(organization)
              .values({
                name: input.organizationName,
                slug,
                type: 'healthcare',
                size: 'medium',
                createdBy: ctx.user.id,
                status: 'active',
              })
              .returning();
            
            // Add user as member (not owner, since doctors shouldn't own hospitals)
            await tx.insert(organizationMember).values({
              organizationId: newOrg.id,
              userId: ctx.user.id,
              role: 'member',
              status: 'active',
            });
            
            // Create default settings
            await tx.insert(organizationSettings).values({
              organizationId: newOrg.id,
            });
            
            return newOrg;
          });
          
          finalOrganizationId = result.id;
          log.info('[AUTH] Healthcare organization created:', 'COMPONENT', { organizationId: result.id });
        }
        
        // Handle hospital assignment for healthcare roles
        let hospitalId = input.defaultHospitalId;
        
        if (healthcareRoles.includes(input.role) && finalOrganizationId) {
          // If no hospital ID provided, check if organization has a default hospital
          if (!hospitalId) {
            const { hospitals } = await import('@/src/db/healthcare-schema');
            const [defaultHospital] = await db
              .select()
              .from(hospitals)
              .where(
                and(
                  eq(hospitals.organizationId, finalOrganizationId),
                  eq(hospitals.isDefault, true)
                )
              )
              .limit(1);
            
            if (defaultHospital) {
              hospitalId = defaultHospital.id;
              log.info('[AUTH] Using default hospital for organization', 'COMPONENT', {
                hospitalId: defaultHospital.id,
                hospitalName: defaultHospital.name,
              });
            } else {
              // Create a default hospital for the organization
              const [newHospital] = await db
                .insert(hospitals)
                .values({
                  organizationId: finalOrganizationId,
                  name: `${input.organizationName || 'Default'} Hospital`,
                  code: `HOSP-${Date.now().toString(36).toUpperCase()}`,
                  isDefault: true,
                  isActive: true,
                })
                .returning();
              
              hospitalId = newHospital.id;
              log.info('[AUTH] Created default hospital for organization', 'COMPONENT', {
                hospitalId: newHospital.id,
                hospitalName: newHospital.name,
              });
            }
          } else {
            // Validate that the provided hospital belongs to the organization
            const { hospitals } = await import('@/src/db/healthcare-schema');
            const [hospital] = await db
              .select()
              .from(hospitals)
              .where(
                and(
                  eq(hospitals.id, hospitalId),
                  eq(hospitals.organizationId, finalOrganizationId)
                )
              )
              .limit(1);
            
            if (!hospital) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid hospital selection. Hospital must belong to your organization.',
              });
            }
          }
          
          // Create healthcare user profile
          const { healthcareUsers } = await import('@/src/db/healthcare-schema');
          await db
            .insert(healthcareUsers)
            .values({
              userId: ctx.user.id,
              hospitalId: hospitalId,
              department: input.department as any, // Department enum is validated by Zod schema
            })
            .onConflictDoUpdate({
              target: healthcareUsers.userId,
              set: {
                hospitalId: hospitalId,
                department: input.department as any, // Department enum is validated by Zod schema
              },
            });
        }
        
        // Check if healthcare role has proper hospital assignment
        const needsHospitalAssignment = healthcareRoles.includes(input.role) && !hospitalId;
        
        // Prepare update data
        const updateData: any = {
          name: input.name,
          role: input.role,
          organizationId: finalOrganizationId,
          organizationName: input.organizationName,
          phoneNumber: input.phoneNumber,
          department: input.department,
          jobTitle: input.jobTitle,
          bio: input.bio,
          defaultHospitalId: hospitalId,
          // Healthcare roles without hospital still need profile completion
          needsProfileCompletion: needsHospitalAssignment,
          updatedAt: new Date(),
        };
        
        if (needsHospitalAssignment) {
          log.warn('[AUTH] Healthcare user completing profile without hospital assignment', 'COMPONENT', {
            userId: ctx.user.id,
            role: input.role,
            organizationId: finalOrganizationId,
            hospitalId: hospitalId
          });
        }
        
        // Update in database
        const updatedUsers = await db
          .update(userTable)
          .set(updateData)
          .where(eq(userTable.id, ctx.user.id))
          .returning();
        
        if (updatedUsers.length === 0) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update user in database',
          });
        }
        
        const updatedUser = updatedUsers[0];
        log.info('[AUTH] Profile completed for user:', 'COMPONENT', {
          id: updatedUser.id,
          role: updatedUser.role,
          organizationId: updatedUser.organizationId,
          needsProfileCompletion: updatedUser.needsProfileCompletion
        });
        
        // Also update in Better Auth for session consistency
        try {
          await auth.api.updateUser({
            headers: ctx.req.headers,
            body: updateData,
          });
          log.info('[AUTH] Better Auth user updated', 'COMPONENT', {});
        } catch (authError) {
          logger.auth.warn('Better Auth update failed, but database was updated', authError);
        }

        // Log successful profile completion
        await auditService.logUserManagement(
          AuditAction.USER_UPDATED,
          AuditOutcome.SUCCESS,
          ctx.user.id,
          context,
          beforeState,
          { ...beforeState, ...updateData }
        );

        // Validate and return properly typed response
        const validatedUser = UserResponseSchema.parse({
          ...updatedUser,
          role: validateUserRole(updatedUser.role),
          status: 'active',
          isEmailVerified: updatedUser.emailVerified ?? false,
          contactPreferences: updatedUser.contactPreferences 
            ? (typeof updatedUser.contactPreferences === 'string' 
              ? JSON.parse(updatedUser.contactPreferences) 
              : updatedUser.contactPreferences)
            : { email: true, push: true, sms: false },
        });
        
        return {
          success: true as const,
          user: validatedUser,
          organizationId: finalOrganizationId,
          hospitalId: hospitalId,
        };
      } catch (error) {
        // Log failed profile completion
        await auditService.logUserManagement(
          AuditAction.USER_UPDATED,
          AuditOutcome.FAILURE,
          ctx.user.id,
          context,
          beforeState,
          null
        );
        
        logger.auth.error('Complete profile error', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to complete profile',
        });
      }
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100).optional(),
      role: z.enum(['admin', 'manager', 'user', 'guest']).optional(),
      organizationId: z.string().optional(),
      organizationName: z.string().optional(),
      phoneNumber: z.string().optional(),
      department: z.string().optional(),
      jobTitle: z.string().optional(),
      bio: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { auditService, auditHelpers, AuditAction, AuditOutcome } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req, ctx.session);
      
      // Capture before state for audit
      const beforeState = {
        name: ctx.user.name,
        role: (ctx.user as any).role,
        organizationId: (ctx.user as any).organizationId,
        phoneNumber: (ctx.user as any).phoneNumber,
        department: (ctx.user as any).department,
      };
      
      try {
        // Update user directly in database to ensure all fields are saved
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq } = await import('drizzle-orm');
        
        // Prepare update data
        const updateData: any = { ...input };
        
        // If role is being updated, mark profile as complete
        if (input.role) {
          updateData.needsProfileCompletion = false;
          log.info('[AUTH] Profile completion - setting needsProfileCompletion: false', 'COMPONENT', {});
        }
        
        updateData.updatedAt = new Date();
        
        // Update in database
        const updatedUsers = await db
          .update(userTable)
          .set(updateData)
          .where(eq(userTable.id, ctx.user.id))
          .returning();
        
        if (updatedUsers.length === 0) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update user in database',
          });
        }
        
        const updatedUser = updatedUsers[0];
        log.info('[AUTH] User updated in database:', 'COMPONENT', {
          id: updatedUser.id,
          role: updatedUser.role,
          needsProfileCompletion: updatedUser.needsProfileCompletion
        });
        
        // Also update in Better Auth for session consistency
        try {
          await auth.api.updateUser({
            headers: ctx.req.headers,
            body: updateData,
          });
          log.info('[AUTH] Better Auth user updated', 'COMPONENT', {});
        } catch (authError) {
          logger.auth.warn('Better Auth update failed, but database was updated', authError);
        }

        // Log successful profile update
        await auditService.logUserManagement(
          input.role && input.role !== beforeState.role ? AuditAction.USER_ROLE_CHANGED : AuditAction.USER_UPDATED,
          AuditOutcome.SUCCESS,
          ctx.user.id,
          context,
          beforeState,
          { ...beforeState, ...input }
        );

        return {
          success: true,
          user: updatedUser,
        };
      } catch (error) {
        // Log failed profile update
        await auditService.logUserManagement(
          AuditAction.USER_UPDATED,
          AuditOutcome.FAILURE,
          ctx.user.id,
          context,
          beforeState,
          null
        );
        
        logger.auth.error('Update profile error', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to update profile',
        });
      }
    }),

  // Sign out - protected endpoint
  signOut: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { auditService, auditHelpers, AuditAction, AuditOutcome } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req, ctx.session);
      
      try {
        // Clear session cache first if we have a session token
        if (ctx.session?.session?.token) {
          clearCachedSession(ctx.session.session.token);
          logger.auth.debug('Cleared session cache on sign out', {
            userId: ctx.session.user.id
          });
        }
        
        // Use Better Auth API to sign out
        await auth.api.signOut({
          headers: ctx.req.headers,
        });

        // Log successful logout
        await auditService.logAuth(
          AuditAction.LOGOUT,
          AuditOutcome.SUCCESS,
          context,
          { reason: 'user_initiated' }
        );

        log.info('[AUTH] User signed out successfully:', 'COMPONENT', {});
        
        return { success: true };
      } catch (error) {
        // Log failed logout attempt (use LOGOUT with FAILURE outcome)
        await auditService.logAuth(
          AuditAction.LOGOUT,
          AuditOutcome.FAILURE,
          context,
          { reason: error instanceof Error ? error.message : 'Unknown error' }
        );
        
        logger.auth.error('Sign out error', error);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sign out',
        });
      }
    }),

  // Check if email exists (for registration form)
  // DEPRECATED: Use checkEmailExists mutation instead
  // This endpoint is kept for backward compatibility but always returns false
  checkEmail: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .query(async ({ input }) => {
      logger.auth.warn('DEPRECATED: checkEmail query called. Use checkEmailExists mutation instead.');
      // Always return false to avoid breaking existing code
      // The real implementation is in checkEmailExists mutation
      return {
        exists: false,
        available: true,
      };
    }),

  // Enhanced procedures for healthcare compliance
  
  // Enable Two-Factor Authentication
  enableTwoFactor: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Two-factor authentication would be implemented here
      // Better Auth doesn't have built-in 2FA support yet
      log.info('[SECURITY] 2FA requested for user:', 'COMPONENT', {});
      
      // In production, you would:
      // 1. Generate a secret for the user
      // 2. Create a QR code for authenticator apps
      // 3. Store the secret securely
      // 4. Return the QR code to the client
      
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Two-factor authentication is not yet implemented',
      });
    }),

  // Verify Two-Factor Authentication
  verifyTwoFactor: protectedProcedure
    .input(z.object({
      code: z.string().min(6).max(6),
    }))
    .mutation(async ({ input, ctx }) => {
      // Two-factor verification would be implemented here
      log.info('[SECURITY] 2FA verification attempted for user:', 'COMPONENT', {});
      
      // In production, you would:
      // 1. Retrieve the user's 2FA secret
      // 2. Verify the code against the secret
      // 3. Mark the session as 2FA verified
      
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Two-factor authentication is not yet implemented',
      });
    }),

  // Get audit logs for compliance (admin only)
  getAuditLogs: adminProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      userId: z.string().optional(),
      action: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      // Authorization is handled by adminProcedure middleware
      log.info('[AUDIT] Audit logs requested by:', 'COMPONENT', {});
      
      return {
        logs: [], // Would return actual audit logs from database
        total: 0,
      };
    }),

  // Force password reset (admin only)
  forcePasswordReset: adminProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string().min(1, 'Reason is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      // Authorization is handled by adminProcedure middleware
      log.info('[SECURITY] Password reset forced by:', 'COMPONENT', {});
      
      // In production, implement actual password reset logic
      return { success: true };
    }),

  // Session management for compliance
  getActiveSessions: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // In production, query session table for user's active sessions
        log.info('[SESSION] Active sessions requested for user:', 'COMPONENT', {});
        
        return {
          sessions: [], // Would return actual sessions from database
          count: 0,
        };
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve sessions',
        });
      }
    }),

  // Revoke specific session
  revokeSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Better Auth's revokeSession expects a token, not sessionId
        // In a real implementation, you would look up the session by ID
        // and then revoke it using the token
        log.info('[SECURITY] Session revoke requested by user:', 'COMPONENT', {});
        
        // In production, you would:
        // 1. Query the database for the session by ID
        // 2. Verify it belongs to the current user
        // 3. Delete the session from the database
        // 4. Invalidate any cached sessions
        
        // For now, this is a placeholder
        return { success: true };
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to revoke session',
        });
      }
    }),

  // New procedures demonstrating tRPC authorization middleware

  // List all users with comprehensive filtering and validation
  listUsers: managerProcedure
    .input(ListUsersInputSchema)
    .output(z.object({
      users: z.array(UserResponseSchema),
      total: z.number(),
      hasMore: z.boolean(),
      nextCursor: z.string().optional()
    }))
    .query(async ({ input, ctx }) => {
      // Authorization is handled by managerProcedure middleware
      log.info('[USERS] User list requested by:', 'COMPONENT', {});
      
      try {
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { like, eq, desc } = await import('drizzle-orm');
        
        // Build where conditions
        const { and } = await import('drizzle-orm');
        const whereConditions = [];
        
        if (input.search) {
          whereConditions.push(like(userTable.name, `%${input.search}%`));
        }
        
        if (input.role) {
          whereConditions.push(eq(userTable.role, input.role));
        }
        
        // Execute query with proper Drizzle ORM chaining
        const baseQuery = db.select({
          id: userTable.id,
          email: userTable.email,
          name: userTable.name,
          role: userTable.role,
          organizationId: userTable.organizationId,
          organizationName: userTable.organizationName,
          department: userTable.department,
          createdAt: userTable.createdAt,
          updatedAt: userTable.updatedAt,
          contactPreferences: userTable.contactPreferences,
        }).from(userTable);
        
        // Apply filters and execute
        const users = await (whereConditions.length > 0 
          ? baseQuery.where(and(...whereConditions))
          : baseQuery
        )
          .limit(input.limit)
          .offset(input.offset)
          .orderBy(desc(userTable.createdAt));
        
        // Validate and transform users to match schema
        const validatedUsers = users.map(user => UserResponseSchema.parse({
          ...user,
          role: validateUserRole(user.role),
          status: 'active' as const,
          isEmailVerified: false, // Would come from actual field
          contactPreferences: user.contactPreferences 
            ? (typeof user.contactPreferences === 'string' 
              ? JSON.parse(user.contactPreferences) 
              : user.contactPreferences)
            : { email: true, push: true, sms: false },
        }));
        
        return {
          users: validatedUsers,
          total: validatedUsers.length,
          hasMore: validatedUsers.length === input.limit,
          nextCursor: validatedUsers.length === input.limit ? 
            validatedUsers[validatedUsers.length - 1].id : undefined,
        };
      } catch (error) {
        logger.error('Failed to list users', 'API', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve users',
        });
      }
    }),

  // Update user role with comprehensive validation (admin only)
  updateUserRole: adminProcedure
    .input(UpdateUserRoleInputSchema)
    .output(z.object({ success: z.literal(true), user: UserResponseSchema }))
    .mutation(async ({ input, ctx }) => {
      // Authorization is handled by adminProcedure middleware
      log.info('[ADMIN] Role change requested by:', 'COMPONENT', {});
      
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot change your own role',
        });
      }
      
      try {
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq } = await import('drizzle-orm');
        
        const updatedUsers = await db
          .update(userTable)
          .set({ 
            role: input.newRole,
            updatedAt: new Date(),
          })
          .where(eq(userTable.id, input.userId))
          .returning();
        
        if (updatedUsers.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }
        
        const { auditService, auditHelpers, AuditAction, AuditOutcome } = await import('../services/audit');
        const context = auditHelpers.extractContext(ctx.req, ctx.session);
        
        // Log role change
        await auditService.logUserManagement(
          AuditAction.USER_ROLE_CHANGED,
          AuditOutcome.SUCCESS,
          input.userId,
          context,
          { role: 'previous' }, // Would get from database
          { role: input.newRole, reason: input.reason }
        );
        
        // Validate and return properly typed response
        const validatedUser = UserResponseSchema.parse({
          ...updatedUsers[0],
          role: validateUserRole(updatedUsers[0].role),
          status: 'active',
          isEmailVerified: false, // Would come from actual field
          contactPreferences: updatedUsers[0].contactPreferences 
            ? (typeof updatedUsers[0].contactPreferences === 'string' 
              ? JSON.parse(updatedUsers[0].contactPreferences) 
              : updatedUsers[0].contactPreferences)
            : { email: true, push: true, sms: false },
        });
        
        return {
          success: true as const,
          user: validatedUser,
        };
      } catch (error) {
        logger.error('Failed to update user role', 'API', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user role',
        });
      }
    }),

  // Get analytics data with comprehensive validation (manager and admin only)
  getAnalytics: viewAnalyticsProcedure
    .input(AnalyticsInputSchema)
    .output(z.object({
      metric: z.string(),
      data: z.record(z.any()),
      generatedAt: z.date(),
      userRole: UserRoleSchema,
      period: z.object({
        start: z.date().optional(),
        end: z.date().optional(),
        granularity: z.string()
      })
    }))
    .query(async ({ input, ctx }) => {
      // Authorization is handled by viewAnalyticsProcedure middleware
      log.info('[ANALYTICS] Analytics requested by:', 'COMPONENT', {});
      
      // Mock analytics data - in production, this would query actual metrics
      const mockData = {
        users: {
          total: 150,
          active: 120,
          newThisMonth: 25,
          growth: 15.2,
        },
        logins: {
          today: 45,
          thisWeek: 280,
          thisMonth: 1150,
          avgPerDay: 38.3,
        },
        activity: {
          totalSessions: 2400,
          avgSessionDuration: 24.5,
          bounceRate: 12.3,
          peakHours: ['9:00', '14:00', '16:00'],
        },
      };
      
      // Validate user role and return properly typed response
      const validatedUserRole = validateUserRole((ctx.user as any).role || 'user');
      
      return {
        metric: input.metric,
        data: mockData[input.metric],
        generatedAt: new Date(),
        userRole: validatedUserRole,
        period: {
          start: input.startDate,
          end: input.endDate,
          granularity: input.granularity,
        }
      };
    }),

  // Check if email exists in database (for validation)
  // Using mutation instead of query since it's called imperatively with debounce
  checkEmailExists: publicProcedure
    .input(z.object({
      email: z.string().min(3).refine((val) => {
        // Basic email validation - must have @ and .
        return val.includes('@') && val.includes('.');
      }, {
        message: 'Invalid email format'
      }),
    }))
    .output(z.object({
      exists: z.boolean(),
      isAvailable: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Rate limiting for email checks: 20 per minute per IP
      const clientIp = ctx.req.headers.get('x-forwarded-for')?.split(',')[0] || 
                       ctx.req.headers.get('x-real-ip') || 'unknown';
      checkRateLimit(`email-check:${clientIp}`, 20, 60000);
      
      const sanitizedEmail = sanitizeInput.email(input.email);
      
      try {
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq } = await import('drizzle-orm');
        
        logger.auth.debug('Checking email existence', { email: sanitizedEmail });
        
        const [existingUser] = await db
          .select({ id: userTable.id })
          .from(userTable)
          .where(eq(userTable.email, sanitizedEmail))
          .limit(1);
        
        const result = {
          exists: !!existingUser,
          isAvailable: !existingUser,
        };
        
        logger.auth.debug('Email check result', { 
          email: sanitizedEmail, 
          exists: result.exists 
        });
        
        return result;
      } catch (error) {
        logger.auth.error('Error checking email existence', error);
        // Return safe default on error - assume email is available
        // This prevents blocking registration due to database errors
        return {
          exists: false,
          isAvailable: true,
        };
      }
    }),

  // Change password
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    }))
    .mutation(async ({ input, ctx }) => {
      const { auditService, auditHelpers, AuditAction, AuditOutcome } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req, ctx.session);
      
      try {
        // Verify current password first
        const signInResponse = await auth.api.signInEmail({
          body: {
            email: ctx.user.email,
            password: input.currentPassword,
          },
        });

        if (!signInResponse) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
          });
        }

        // Change password using Better Auth
        await auth.api.changePassword({
          headers: ctx.req.headers,
          body: {
            currentPassword: input.currentPassword,
            newPassword: input.newPassword,
          },
        });

        // Log successful password change
        await auditService.logUserManagement(
          AuditAction.PASSWORD_CHANGED,
          AuditOutcome.SUCCESS,
          ctx.user.id,
          context,
          null,
          { passwordChangedAt: new Date() }
        );

        log.info('[AUTH] Password changed successfully', 'AUTH', {
          userId: ctx.user.id,
          email: ctx.user.email,
        });

        return {
          success: true,
          message: 'Password changed successfully',
        };
      } catch (error: any) {
        // Log failed password change attempt
        await auditService.logUserManagement(
          AuditAction.PASSWORD_CHANGED,
          AuditOutcome.FAILURE,
          ctx.user.id,
          context,
          null,
          { error: error.message }
        );

        if (error instanceof TRPCError) throw error;

        log.error('[AUTH] Password change failed', 'AUTH', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change password',
        });
      }
    }),

  // Get two-factor authentication status
  getTwoFactorStatus: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq } = await import('drizzle-orm');
        
        const [user] = await db
          .select({
            twoFactorEnabled: userTable.twoFactorEnabled,
          })
          .from(userTable)
          .where(eq(userTable.id, ctx.user.id))
          .limit(1);
        
        return {
          enabled: user?.twoFactorEnabled || false,
        };
      } catch (error) {
        log.error('[AUTH] Failed to get 2FA status', 'AUTH', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get two-factor authentication status',
        });
      }
    }),

  // Send magic link for two-factor authentication
  sendMagicLink: protectedProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { auditService, auditHelpers } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req, ctx.session);
      
      try {
        // Verify email matches user's email
        if (input.email !== ctx.user.email) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Email does not match your account',
          });
        }

        // Send magic link using Better Auth
        await auth.api.sendMagicLink({
          body: {
            email: input.email,
            callbackURL: `${process.env.BETTER_AUTH_BASE_URL}/verify-2fa`,
          },
        });

        // Log magic link sent
        await auditService.log({
          userId: ctx.user.id,
          action: 'TWO_FACTOR_MAGIC_LINK_SENT' as any,
          outcome: 'SUCCESS' as any,
          entityType: 'user',
          entityId: ctx.user.id,
          description: 'Magic link sent for two-factor authentication',
          metadata: { email: input.email },
          ...context
        });

        log.info('[AUTH] Magic link sent for 2FA', 'AUTH', {
          userId: ctx.user.id,
          email: input.email,
        });

        return {
          success: true,
          message: 'Magic link sent to your email',
        };
      } catch (error: any) {
        // Log failed attempt
        await auditService.log({
          userId: ctx.user.id,
          action: 'TWO_FACTOR_MAGIC_LINK_FAILED' as any,
          outcome: 'FAILURE' as any,
          entityType: 'user',
          entityId: ctx.user.id,
          description: 'Failed to send magic link for two-factor authentication',
          metadata: { error: error.message },
          ...context
        });

        if (error instanceof TRPCError) throw error;

        log.error('[AUTH] Failed to send magic link', 'AUTH', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send magic link',
        });
      }
    }),

  // Enable two-factor authentication with audit logging
  enableTwoFactorWithAudit: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { auditService, auditHelpers, AuditAction, AuditOutcome } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req, ctx.session);
      
      try {
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq } = await import('drizzle-orm');
        
        // Update user to enable 2FA
        await db
          .update(userTable)
          .set({
            twoFactorEnabled: true,
            updatedAt: new Date(),
          })
          .where(eq(userTable.id, ctx.user.id));

        // Log 2FA enabled
        await auditService.logUserManagement(
          AuditAction.TWO_FACTOR_ENABLED,
          AuditOutcome.SUCCESS,
          ctx.user.id,
          context,
          null,
          { twoFactorEnabled: true }
        );

        log.info('[AUTH] Two-factor authentication enabled', 'AUTH', {
          userId: ctx.user.id,
          email: ctx.user.email,
        });

        return {
          success: true,
          message: 'Two-factor authentication enabled',
        };
      } catch (error: any) {
        // Log failed attempt
        await auditService.logUserManagement(
          AuditAction.TWO_FACTOR_ENABLED,
          AuditOutcome.FAILURE,
          ctx.user.id,
          context,
          null,
          { error: error.message }
        );

        log.error('[AUTH] Failed to enable 2FA', 'AUTH', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to enable two-factor authentication',
        });
      }
    }),

  // Disable two-factor authentication
  disableTwoFactor: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { auditService, auditHelpers, AuditAction, AuditOutcome } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req, ctx.session);
      
      try {
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq } = await import('drizzle-orm');
        
        // Update user to disable 2FA
        await db
          .update(userTable)
          .set({
            twoFactorEnabled: false,
            updatedAt: new Date(),
          })
          .where(eq(userTable.id, ctx.user.id));

        // Log 2FA disabled
        await auditService.logUserManagement(
          AuditAction.TWO_FACTOR_DISABLED,
          AuditOutcome.SUCCESS,
          ctx.user.id,
          context,
          null,
          { twoFactorDisabled: true }
        );

        log.info('[AUTH] Two-factor authentication disabled', 'AUTH', {
          userId: ctx.user.id,
          email: ctx.user.email,
        });

        return {
          success: true,
          message: 'Two-factor authentication disabled',
        };
      } catch (error: any) {
        // Log failed attempt
        await auditService.logUserManagement(
          AuditAction.TWO_FACTOR_DISABLED,
          AuditOutcome.FAILURE,
          ctx.user.id,
          context,
          null,
          { error: error.message }
        );

        log.error('[AUTH] Failed to disable 2FA', 'AUTH', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to disable two-factor authentication',
        });
      }
    }),

  // Select/switch hospital for healthcare users
  selectHospital: protectedProcedure
    .input(SelectHospitalInputSchema)
    .output(z.object({ 
      success: z.literal(true), 
      hospital: HospitalResponseSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const healthcareRoles = ['doctor', 'nurse', 'head_doctor', 'operator'];
      const userRole = (ctx.user as any).role;
      
      // Verify user has healthcare role
      if (!healthcareRoles.includes(userRole)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only healthcare staff can select hospitals',
        });
      }
      
      // Verify hospital exists and user has access
      const { db } = await import('@/src/db');
      const { user: users } = await import('@/src/db/schema');
      const { hospitals, healthcareUsers } = await import('@/src/db/healthcare-schema');
      const { eq, and } = await import('drizzle-orm');
      
      const [hospital] = await db
        .select()
        .from(hospitals)
        .where(
          and(
            eq(hospitals.id, input.hospitalId),
            eq(hospitals.organizationId, (ctx.user as any).organizationId),
            eq(hospitals.isActive, true)
          )
        )
        .limit(1);
      
      if (!hospital) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Hospital not found or you do not have access',
        });
      }
      
      // Update user's default hospital
      await db
        .update(users)
        .set({ 
          defaultHospitalId: input.hospitalId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));
      
      // Update healthcare user profile
      await db
        .update(healthcareUsers)
        .set({
          hospitalId: input.hospitalId,
        })
        .where(eq(healthcareUsers.userId, ctx.user.id));
      
      // Log the change
      log.info('[AUTH] User switched hospital', 'COMPONENT', {
        userId: ctx.user.id,
        previousHospitalId: (ctx.user as any).defaultHospitalId,
        newHospitalId: input.hospitalId,
        hospitalName: hospital.name,
      });
      
      return {
        success: true,
        hospital: HospitalResponseSchema.parse(hospital),
      };
    }),


  // Import and spread auth extensions
  ...authExtensions,
});