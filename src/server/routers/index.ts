import { router } from '../trpc';
import { authRouter } from './auth';
import { adminRouter } from './admin';
import { healthcareRouter } from './healthcare';
import { patientRouter } from './patient';
import { organizationRouter } from './organization';
import { userRouter } from './user';
import { systemRouter } from './system';

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
  healthcare: healthcareRouter,
  patient: patientRouter,
  organization: organizationRouter,
  user: userRouter,
  system: systemRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;