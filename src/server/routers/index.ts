import { router } from '../trpc';
import { authRouter } from './auth';
import { adminRouter } from './admin';

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;