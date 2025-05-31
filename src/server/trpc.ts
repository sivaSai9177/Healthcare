import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@/lib/auth';
import type { Session, User } from 'better-auth';

// Define custom user type with additional fields
export interface CustomUser extends User {
  role: string;
  hospitalId?: string;
}

// Context type for tRPC procedures
export interface Context {
  session: {
    session: Session;
    user: CustomUser;
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

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});