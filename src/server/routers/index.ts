import { router } from '../trpc';
import { authRouter } from './auth';
import { adminRouter } from './admin';
import { healthcareRouter } from './healthcare';
import { patientRouter } from './patient';
import { organizationRouter } from './organization';

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
  healthcare: healthcareRouter,
  patient: patientRouter,
  organization: organizationRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;