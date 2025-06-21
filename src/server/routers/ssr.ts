import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { prefetchHelpers, combineDehydratedStates } from '@/lib/api/ssr-utils';
import { log } from '@/lib/core/debug/logger';

export const ssrRouter = router({
  // Prefetch data for a specific page
  prefetchPage: publicProcedure
    .input(z.object({
      path: z.string(),
      params: z.record(z.string()).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { path, params } = input;
      
      log.debug('SSR prefetch request', 'SSR', { path, params });
      
      // Get cookie from context for authentication
      const cookie = ctx.req.headers.get('cookie');
      
      try {
        let dehydratedState;
        
        switch (path) {
          case '/':
          case '/index':
            // Prefetch user session for homepage
            dehydratedState = await prefetchHelpers.user(cookie);
            break;
            
          case '/dashboard':
          case '/operator-dashboard':
            // Prefetch user and organization data
            const userState = await prefetchHelpers.user(cookie);
            if (params?.organizationId) {
              const orgState = await prefetchHelpers.organization(params.organizationId, cookie);
              dehydratedState = combineDehydratedStates(userState, orgState);
            } else {
              dehydratedState = userState;
            }
            break;
            
          case '/healthcare':
          case '/healthcare/alerts':
            // Prefetch healthcare data
            if (params?.hospitalId) {
              dehydratedState = await prefetchHelpers.healthcare(params.hospitalId, cookie);
            }
            break;
            
          default:
            // For unknown paths, just prefetch user
            dehydratedState = await prefetchHelpers.user(cookie);
        }
        
        return {
          success: true,
          dehydratedState,
        };
      } catch (error) {
        log.error('SSR prefetch error', 'SSR', error);
        return {
          success: false,
          error: 'Failed to prefetch data',
          dehydratedState: null,
        };
      }
    }),
    
  // Get current SSR state (for hydration)
  getHydrationState: publicProcedure
    .query(async ({ ctx }) => {
      // This would be called on the server to get the initial state
      // For now, return null as we're not doing true SSR
      return null;
    }),
});