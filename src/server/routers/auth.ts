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
import { auth } from '@/lib/auth';
import { TRPCError } from '@trpc/server';

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
  validateUserRole
} from '@/lib/validations/server';

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
      
      const { auditService, AuditAction, AuditOutcome, auditHelpers } = await import('../services/audit');
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
        console.log('[AUTH] Raw Better Auth signin response:', JSON.stringify(response, null, 2));

        // Query the database directly to get the complete user data with custom fields
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq } = await import('drizzle-orm');
        
        const [dbUser] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, response.user.id))
          .limit(1);
        
        console.log('[AUTH] Database user data:', dbUser);

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
        };

        console.log('[AUTH] Complete user object being returned:', completeUser);

        return {
          success: true,
          user: completeUser,
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
        
        console.error('[AUTH] Sign in error:', error);
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
        console.log('[AUTH] Processing signup with input:', {
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

        console.log('[AUTH] User created successfully:', signUpResponse.user.id);

        // Immediately update user with role and other fields in database
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq } = await import('drizzle-orm');
        
        await db.update(userTable)
          .set({ 
            role: input.role,
            phoneNumber: input.phoneNumber,
            department: input.department,
            needsProfileCompletion: false,
            updatedAt: new Date()
          })
          .where(eq(userTable.id, signUpResponse.user.id));

        let organization = null;
        
        // Handle organization creation/joining based on role
        if (input.role === 'manager' || input.role === 'admin') {
          if (sanitizedOrgName) {
            console.log('[AUTH] Creating organization placeholder for:', sanitizedOrgName);
            
            // For now, create a simple organization ID until Better Auth organization tables are set up
            const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            
            // Update user with organization info directly in database (reuse imports)
            
            await db.update(userTable)
              .set({ 
                organizationId: orgId,
                organizationName: sanitizedOrgName 
              })
              .where(eq(userTable.id, signUpResponse.user.id));
            
            organization = {
              id: orgId,
              name: sanitizedOrgName,
              slug: sanitizedOrgName.toLowerCase().replace(/\s+/g, '-')
            };
            
            console.log('[AUTH] Organization placeholder created:', orgId);
            
            // TODO: Implement proper organization creation with Better Auth after database migration
            // try {
            //   const orgResponse = await auth.api.createOrganization(...);
            // } catch (orgError) {
            //   console.error('[AUTH] Better Auth organization creation failed:', orgError);
            // }
          }
        } else if (input.role === 'user' && input.organizationCode) {
          // TODO: Implement organization joining by code
          console.log('[AUTH] Organization joining by code not yet implemented');
          // For now, just continue without organization
        }
        
        // Update user data with organization info if created
        const completeUser = {
          ...signUpResponse.user,
          role: input.role,
          organizationId: organization?.id,
          organizationName: organization?.name,
          needsProfileCompletion: false,
        };

        // Validate and return properly typed response
        const validatedUser = UserResponseSchema.parse({
          ...completeUser,
          role: validateUserRole(completeUser.role),
          status: 'active',
        });

        return AuthResponseSchema.parse({
          success: true,
          user: validatedUser,
          token: signUpResponse.token,
        });
      } catch (error: any) {
        console.error('[AUTH] Sign up error:', error);
        console.error('[AUTH] Error details:', {
          message: error.message,
          stack: error.stack,
          code: error.code,
          status: error.status,
        });
        
        // Check if it's a validation error
        if (error.name === 'ZodError' || error.issues) {
          console.error('[AUTH] Validation error:', error.issues || error.errors);
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
      // Return null early if no session exists
      if (!ctx.session) {
        return null;
      }
      
      // Fetch fresh user data from database to ensure we have latest data
      let dbUser = null;
      try {
        const { db } = await import('@/src/db');
        const { user: userTable } = await import('@/src/db/schema');
        const { eq } = await import('drizzle-orm');
        
        const [user] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, ctx.session.user.id))
          .limit(1);
        
        dbUser = user;
        
        console.log('[AUTH] getSession - DB user data:', {
          id: dbUser?.id,
          email: dbUser?.email,
          role: dbUser?.role,
          hasDbUser: !!dbUser
        });
      } catch (dbError) {
        console.warn('[AUTH] Database query failed, using session data only:', dbError);
        // Continue with session data only
      }
      
      try {
        // Build user data carefully with proper defaults and null safety
        const userData = {
          id: ctx.session.user.id || '',
          email: ctx.session.user.email || '',
          name: ctx.session.user.name || 'Unknown User',
          role: validateUserRole(dbUser?.role || (ctx.session.user as any).role || 'user'),
          organizationId: dbUser?.organizationId || (ctx.session.user as any).organizationId,
          organizationName: dbUser?.organizationName,
          phoneNumber: dbUser?.phoneNumber,
          department: dbUser?.department,
          jobTitle: dbUser?.jobTitle,
          bio: dbUser?.bio,
          status: 'active' as const,
          createdAt: ctx.session.user.createdAt || new Date(),
          updatedAt: ctx.session.user.updatedAt || new Date(),
          isEmailVerified: dbUser?.emailVerified ?? ctx.session.user.emailVerified ?? false,
          lastLoginAt: new Date(), // Current session indicates recent login
        };

        // Validate user data with Zod - this will transform date strings if needed
        const validatedUser = UserResponseSchema.parse(userData);
        
        // Build session response
        const sessionResponse = {
          session: {
            id: ctx.session.session.id,
            userId: ctx.session.session.userId,
            expiresAt: ctx.session.session.expiresAt,
            createdAt: ctx.session.session.createdAt,
          },
          user: validatedUser,
        };

        return SessionResponseSchema.parse(sessionResponse);
        
      } catch (error) {
        console.error('[AUTH] Session validation error:', error);
        console.error('[AUTH] Session data:', {
          hasSession: !!ctx.session,
          userId: ctx.session?.user?.id,
          dbUser: !!dbUser,
        });
        
        // Return null on validation errors to allow graceful fallback
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

  // Complete profile for new OAuth users with comprehensive validation
  completeProfile: protectedProcedure
    .input(CompleteProfileInputSchema)
    .output(z.object({ success: z.literal(true), user: UserResponseSchema, organizationId: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { auditService, AuditAction, AuditOutcome, auditHelpers } = await import('../services/audit');
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
        const { eq } = await import('drizzle-orm');
        
        // Handle organization logic based on role (same as signup)
        let finalOrganizationId = input.organizationId;
        
        if (input.role === 'manager' || input.role === 'admin') {
          if (input.organizationName) {
            // Create new organization
            console.log('[AUTH] Creating new organization:', input.organizationName);
            const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            finalOrganizationId = orgId;
          }
        } else if (input.role === 'user' && input.organizationCode) {
          // Look up organization by code
          console.log('[AUTH] Looking up organization by code:', input.organizationCode);
          finalOrganizationId = `org_from_code_${input.organizationCode}`;
        } else if (input.role === 'user' && !input.organizationCode) {
          // Create personal workspace
          console.log('[AUTH] Creating personal workspace for user');
          const personalOrgId = `personal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          finalOrganizationId = personalOrgId;
        }
        
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
          needsProfileCompletion: false, // Profile is now complete
          updatedAt: new Date(),
        };
        
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
        console.log('[AUTH] Profile completed for user:', {
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
          console.log('[AUTH] Better Auth user updated');
        } catch (authError) {
          console.warn('[AUTH] Better Auth update failed, but database was updated:', authError);
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
        });
        
        return {
          success: true as const,
          user: validatedUser,
          organizationId: finalOrganizationId,
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
        
        console.error('[AUTH] Complete profile error:', error);
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
      const { auditService, AuditAction, AuditOutcome, auditHelpers } = await import('../services/audit');
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
          console.log('[AUTH] Profile completion - setting needsProfileCompletion: false');
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
        console.log('[AUTH] User updated in database:', {
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
          console.log('[AUTH] Better Auth user updated');
        } catch (authError) {
          console.warn('[AUTH] Better Auth update failed, but database was updated:', authError);
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
        
        console.error('[AUTH] Update profile error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to update profile',
        });
      }
    }),

  // Sign out - protected endpoint
  signOut: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { auditService, AuditAction, AuditOutcome, auditHelpers } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req, ctx.session);
      
      try {
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

        console.log('[AUTH] User signed out successfully:', ctx.user.id);
        
        return { success: true };
      } catch (error) {
        // Log failed logout attempt (use LOGOUT with FAILURE outcome)
        await auditService.logAuth(
          AuditAction.LOGOUT,
          AuditOutcome.FAILURE,
          context,
          { reason: error instanceof Error ? error.message : 'Unknown error' }
        );
        
        console.error('[AUTH] Sign out error:', error);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sign out',
        });
      }
    }),

  // Check if email exists (for registration form)
  checkEmail: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .query(async ({ input }) => {
      // In a real app, check database for existing email
      // For now, return false (email available)
      console.log('[AUTH] Checking email availability:', input.email);
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
      console.log('[SECURITY] 2FA requested for user:', ctx.user.id);
      
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
      console.log('[SECURITY] 2FA verification attempted for user:', ctx.user.id, 'with code:', input.code);
      
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
      console.log('[AUDIT] Audit logs requested by:', ctx.user.id, 'filters:', input);
      
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
      console.log('[SECURITY] Password reset forced by:', ctx.user.id, 'for user:', input.userId, 'reason:', input.reason);
      
      // In production, implement actual password reset logic
      return { success: true };
    }),

  // Session management for compliance
  getActiveSessions: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // In production, query session table for user's active sessions
        console.log('[SESSION] Active sessions requested for user:', ctx.user.id);
        
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
        console.log('[SECURITY] Session revoke requested by user:', ctx.user.id, 'for session:', input.sessionId);
        
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
      console.log('[USERS] User list requested by:', ctx.user.id, 'with filters:', input);
      
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
        }));
        
        return {
          users: validatedUsers,
          total: validatedUsers.length,
          hasMore: validatedUsers.length === input.limit,
          nextCursor: validatedUsers.length === input.limit ? 
            validatedUsers[validatedUsers.length - 1].id : undefined,
        };
      } catch (error) {
        console.error('[USERS] Failed to list users:', error);
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
      console.log('[ADMIN] Role change requested by:', ctx.user.id, 'for user:', input.userId, 'new role:', input.newRole);
      
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
        
        const { auditService, AuditAction, AuditOutcome, auditHelpers } = await import('../services/audit');
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
        });
        
        return {
          success: true as const,
          user: validatedUser,
        };
      } catch (error) {
        console.error('[ADMIN] Failed to update user role:', error);
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
      console.log('[ANALYTICS] Analytics requested by:', ctx.user.id, 'metric:', input.metric);
      
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
});