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
    .min(12, 'Password must be at least 12 characters for healthcare compliance')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password must contain uppercase, lowercase, number, and special character'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['admin', 'manager', 'user', 'guest']).optional(),
  organizationId: z.string().optional(),
  // Enhanced fields for healthcare
  phoneNumber: z.string().optional(),
  licenseNumber: z.string().min(1, 'Medical license number is required for clinical staff').optional(),
  department: z.string().optional(),
});

export const authRouter = router({
  // Sign in with email - with enhanced logging
  signIn: publicProcedureWithLogging
    .input(signInSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const response = await auth.api.signInEmail({
          body: {
            email: input.email,
            password: input.password,
          },
        });

        if (!response) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          });
        }

        // Better Auth's signInEmail returns user and token, not session
        return {
          success: true,
          user: response.user,
          token: response.token,
        };
      } catch (error: any) {
        console.error('[AUTH] Sign in error:', error);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message || 'Failed to sign in',
        });
      }
    }),

  // Sign up with email - with enhanced validation
  signUp: publicProcedureWithLogging
    .input(signUpSchema)
    .mutation(async ({ input }) => {
      try {
        const response = await auth.api.signUpEmail({
          body: {
            email: input.email,
            password: input.password,
            name: input.name,
            // Additional fields need to be passed directly in the body
            role: input.role || 'user',
            organizationId: input.organizationId,
          },
        });

        if (!response) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Failed to create account',
          });
        }

        return {
          success: true,
          user: response.user,
        };
      } catch (error: any) {
        console.error('[AUTH] Sign up error:', error);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to create account',
        });
      }
    }),

  // Sign out
  signOut: publicProcedure
    .mutation(async ({ ctx }) => {
      try {
        await auth.api.signOut({
          headers: ctx.req.headers,
        });
        return { success: true };
      } catch (error) {
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
      
      return {
        session: ctx.session.session,
        user: {
          ...ctx.session.user,
          role: ctx.session.user.role || 'user',
          organizationId: ctx.session.user.organizationId,
        },
      };
    }),

  // Get current user (protected)
  getMe: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        ...ctx.user,
        role: ctx.user.role || 'user',
        organizationId: ctx.user.organizationId,
      };
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100).optional(),
      // Add other updateable fields as needed
    }))
    .mutation(async ({ input, ctx }) => {
      // In a real app, you'd update the user in the database
      // For now, this is a placeholder for the pattern
      console.log('[AUTH] Update profile:', input, 'for user:', ctx.user.id);
      
      // Return updated user data
      return {
        success: true,
        user: {
          ...ctx.user,
          ...input,
        },
      };
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
      try {
        const result = await auth.api.twoFactorEnable({
          headers: ctx.req.headers,
        });
        
        // Log security action
        console.log('[SECURITY] 2FA enabled for user:', ctx.user.id);
        
        return {
          success: true,
          qrCode: result.qrCode,
          backupCodes: result.backupCodes,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to enable two-factor authentication',
        });
      }
    }),

  // Verify Two-Factor Authentication
  verifyTwoFactor: protectedProcedure
    .input(z.object({
      code: z.string().min(6).max(6),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.twoFactorVerify({
          body: { code: input.code },
          headers: ctx.req.headers,
        });
        
        console.log('[SECURITY] 2FA verified for user:', ctx.user.id);
        
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid verification code',
        });
      }
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
      if (ctx.user.role !== 'admin') {
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
      if (ctx.user.role !== 'admin') {
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
      } catch (error: any) {
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
        await auth.api.revokeSession({
          body: { sessionId: input.sessionId },
          headers: ctx.req.headers,
        });
        
        console.log('[SECURITY] Session revoked by user:', ctx.user.id, 'session:', input.sessionId);
        
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to revoke session',
        });
      }
    }),
});