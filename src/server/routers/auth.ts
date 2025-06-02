import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, publicProcedureWithLogging } from '../trpc';
import { auth } from '@/lib/auth';
import { TRPCError } from '@trpc/server';

// Enhanced validation schemas
const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters for security compliance')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password must contain uppercase, lowercase, number, and special character'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['admin', 'manager', 'user', 'guest']).default('user'),
  // Role-based organization fields
  organizationCode: z.string().min(4).max(12).regex(/^[A-Z0-9]+$/).optional(),
  organizationName: z.string().min(2).max(100).optional(),
  organizationId: z.string().uuid().optional(), // Legacy support
  // Terms acceptance
  acceptTerms: z.boolean().refine(val => val === true),
  acceptPrivacy: z.boolean().refine(val => val === true),
  // Enhanced fields for business use
  phoneNumber: z.string().optional(),
  department: z.string().optional(),
}).refine(data => {
  // Validate organization requirements based on role
  if ((data.role === 'manager' || data.role === 'admin') && !data.organizationName) {
    return false;
  }
  return true;
}, {
  message: 'Organization name is required for managers and admins',
  path: ['organizationName'],
});

export const authRouter = router({
  // Sign in with email - with enhanced logging
  signIn: publicProcedureWithLogging
    .input(signInSchema)
    .mutation(async ({ input, ctx }) => {
      const { auditService, AuditAction, AuditOutcome, auditHelpers } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req);
      
      try {
        const response = await auth.api.signInEmail({
          body: {
            email: input.email,
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

  // Sign up with email - with enhanced validation and organization handling
  signUp: publicProcedureWithLogging
    .input(signUpSchema)
    .mutation(async ({ input }) => {
      try {
        console.log('[AUTH] Processing signup with input:', {
          email: input.email,
          role: input.role,
          hasOrgCode: !!input.organizationCode,
          hasOrgName: !!input.organizationName,
          acceptTerms: input.acceptTerms,
          acceptPrivacy: input.acceptPrivacy
        });
        
        let finalOrganizationId = input.organizationId;
        
        // Handle organization logic based on role
        if (input.role === 'manager' || input.role === 'admin') {
          if (input.organizationName) {
            // Create new organization
            console.log('[AUTH] Creating new organization:', input.organizationName);
            const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // TODO: Create organization in database
            finalOrganizationId = orgId;
            console.log('[AUTH] Generated organization ID:', finalOrganizationId);
          }
        } else if (input.role === 'user' && input.organizationCode) {
          // Look up organization by code
          console.log('[AUTH] Looking up organization by code:', input.organizationCode);
          // TODO: Implement organization code lookup
          // For now, generate a mock ID
          finalOrganizationId = `org_from_code_${input.organizationCode}`;
        } else if (input.role === 'user' && !input.organizationCode) {
          // Create personal workspace
          console.log('[AUTH] Creating personal workspace for user');
          const personalOrgId = `personal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          finalOrganizationId = personalOrgId;
        }
        // Guests get no organization (finalOrganizationId remains undefined)

        console.log('[AUTH] Calling Better Auth signUpEmail with:', {
          email: input.email,
          name: input.name,
          role: input.role,
          organizationId: finalOrganizationId,
        });

        const response = await auth.api.signUpEmail({
          body: {
            email: input.email,
            password: input.password,
            name: input.name,
            // Additional fields need to be passed directly in the body
            role: input.role,
            organizationId: finalOrganizationId,
            needsProfileCompletion: false, // Email signup collects all info upfront
          },
        });

        console.log('[AUTH] Better Auth response:', response ? 'Success' : 'Failed');
        if (response) {
          console.log('[AUTH] Response details:', {
            user: response.user,
            token: response.token,
            session: response.session
          });
        }

        if (!response) {
          console.error('[AUTH] Better Auth returned null/undefined response');
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Failed to create account - no response from auth service',
          });
        }

        console.log('[AUTH] User created successfully with organization:', finalOrganizationId);

        // Ensure we return the complete user object with custom fields
        const completeUser = {
          ...response.user,
          role: input.role,
          organizationId: finalOrganizationId,
          needsProfileCompletion: false,
        };

        return {
          success: true,
          user: completeUser,
          organizationId: finalOrganizationId,
        };
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

  // Sign out
  signOut: publicProcedure
    .mutation(async ({ ctx }) => {
      const { auditService, AuditAction, AuditOutcome, auditHelpers } = await import('../services/audit');
      const context = auditHelpers.extractContext(ctx.req, ctx.session);
      
      try {
        await auth.api.signOut({
          headers: ctx.req.headers,
        });
        
        // Log successful logout
        await auditService.logAuth(
          AuditAction.LOGOUT,
          AuditOutcome.SUCCESS,
          context
        );
        
        return { success: true };
      } catch (error) {
        // Log failed logout
        await auditService.logAuth(
          AuditAction.LOGOUT,
          AuditOutcome.FAILURE,
          context,
          { reason: error.message || 'System error' }
        );
        
        console.error('[AUTH] Sign out error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sign out',
        });
      }
    }),

  // Get current session
  getSession: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session) return null;
      
      // Fetch fresh user data from database to ensure we have latest needsProfileCompletion
      const { db } = await import('@/src/db');
      const { user: userTable } = await import('@/src/db/schema');
      const { eq } = await import('drizzle-orm');
      
      const [dbUser] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, ctx.session.user.id))
        .limit(1);
      
      console.log('[AUTH] getSession - DB user data:', {
        id: dbUser?.id,
        email: dbUser?.email,
        needsProfileCompletion: dbUser?.needsProfileCompletion
      });
      
      return {
        session: ctx.session.session,
        user: {
          ...ctx.session.user,
          role: dbUser?.role || (ctx.session.user as any).role || 'user',
          organizationId: dbUser?.organizationId || (ctx.session.user as any).organizationId,
          needsProfileCompletion: dbUser?.needsProfileCompletion ?? false,
          // Include additional fields from database
          phoneNumber: dbUser?.phoneNumber,
          department: dbUser?.department,
          organizationName: dbUser?.organizationName,
          jobTitle: dbUser?.jobTitle,
          bio: dbUser?.bio,
        },
      };
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

  // Complete profile for new OAuth users - uses same validation as signup
  completeProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
      role: z.enum(['admin', 'manager', 'user', 'guest']),
      // Role-based organization fields
      organizationCode: z.string().min(4).max(12).regex(/^[A-Z0-9]+$/).optional(),
      organizationName: z.string().min(2).max(100).optional(),
      organizationId: z.string().uuid().optional(), // Legacy support
      // Terms acceptance
      acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
      acceptPrivacy: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
      // Enhanced fields for business use
      phoneNumber: z.string().optional(),
      department: z.string().optional(),
      jobTitle: z.string().optional(),
      bio: z.string().max(500).optional(),
    }).refine(data => {
      // Validate organization requirements based on role
      if ((data.role === 'manager' || data.role === 'admin') && !data.organizationName) {
        return false;
      }
      return true;
    }, {
      message: 'Organization name is required for managers and admins',
      path: ['organizationName'],
    }))
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
            const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            finalOrganizationId = orgId;
          }
        } else if (input.role === 'user' && input.organizationCode) {
          // Look up organization by code
          console.log('[AUTH] Looking up organization by code:', input.organizationCode);
          finalOrganizationId = `org_from_code_${input.organizationCode}`;
        } else if (input.role === 'user' && !input.organizationCode) {
          // Create personal workspace
          console.log('[AUTH] Creating personal workspace for user');
          const personalOrgId = `personal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

        return {
          success: true,
          user: updatedUser,
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

  // Get audit logs for compliance (head_doctor only)
  getAuditLogs: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      userId: z.string().optional(),
      action: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      // Check if user has permission to view audit logs
      if ((ctx.user as any).role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to view audit logs',
        });
      }
      
      // In production, query audit_log table
      console.log('[AUDIT] Audit logs requested by:', ctx.user.id, 'filters:', input);
      
      return {
        logs: [], // Would return actual audit logs from database
        total: 0,
      };
    }),

  // Force password reset (admin only)
  forcePasswordReset: protectedProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string().min(1, 'Reason is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      if ((ctx.user as any).role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        });
      }
      
      // Log security action
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
});