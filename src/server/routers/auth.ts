import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { auth } from '@/lib/auth';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  // Sign in with email
  signIn: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
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

  // Sign up with email
  signUp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
      role: z.enum(['operator', 'doctor', 'nurse', 'head_doctor']).optional(),
      hospitalId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await auth.api.signUpEmail({
          body: {
            email: input.email,
            password: input.password,
            name: input.name,
            // Additional fields need to be passed directly in the body
            role: input.role || 'doctor',
            hospitalId: input.hospitalId,
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
          role: ctx.session.user.role || 'doctor',
          hospitalId: ctx.session.user.hospitalId,
        },
      };
    }),
});