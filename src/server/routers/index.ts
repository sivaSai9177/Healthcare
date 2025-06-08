import { router } from '../trpc';
import { authRouter } from './auth';
import { adminRouter } from './admin';
import { healthcareRouter } from './healthcare';

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
  healthcare: healthcareRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;