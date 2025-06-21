import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/src/server/routers';
import { getApiUrl } from '@/lib/core/config/unified-env';
import { Platform } from 'react-native';

// Create a server-side tRPC client for SSR
export const createServerClient = (cookie?: string) => {
  const apiUrl = getApiUrl();
  
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${apiUrl}/api/trpc`,
        headers() {
          return {
            'Content-Type': 'application/json',
            ...(cookie && { cookie }),
          };
        },
      }),
    ],
  });
};

// Create a server-side query client
export const createServerQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set defaults to avoid refetching on client
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 0, // Don't retry on server
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    },
  });
};

// Helper to prefetch data on the server
export async function prefetchQuery<TData>(
  queryKey: string[],
  queryFn: () => Promise<TData>
) {
  const queryClient = createServerQueryClient();
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
  return dehydrate(queryClient);
}

// Helper for server components to use tRPC
export function serverApi(cookie?: string) {
  return createServerClient(cookie);
}

// Type-safe prefetch helpers for common queries
export const prefetchHelpers = {
  async user(cookie?: string) {
    const client = serverApi(cookie);
    const queryClient = createServerQueryClient();
    
    await queryClient.prefetchQuery({
      queryKey: ['auth', 'getSession'],
      queryFn: () => client.auth.getSession(),
    });
    
    return dehydrate(queryClient);
  },
  
  async organization(organizationId: string, cookie?: string) {
    const client = serverApi(cookie);
    const queryClient = createServerQueryClient();
    
    await queryClient.prefetchQuery({
      queryKey: ['organization', 'get', { id: organizationId }],
      queryFn: () => client.organization.get({ id: organizationId }),
    });
    
    return dehydrate(queryClient);
  },
  
  async healthcare(hospitalId: string, cookie?: string) {
    const client = serverApi(cookie);
    const queryClient = createServerQueryClient();
    
    // Prefetch multiple healthcare queries
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['healthcare', 'getActiveAlerts', { hospitalId }],
        queryFn: () => client.healthcare.getActiveAlerts({ hospitalId }),
      }),
      queryClient.prefetchQuery({
        queryKey: ['healthcare', 'getMetrics', { hospitalId }],
        queryFn: () => client.healthcare.getMetrics({ hospitalId }),
      }),
    ]);
    
    return dehydrate(queryClient);
  },
};

// Utility to combine multiple dehydrated states
export function combineDehydratedStates(...states: any[]) {
  const queries = states.flatMap(state => state.queries || []);
  const mutations = states.flatMap(state => state.mutations || []);
  
  return {
    queries,
    mutations,
  };
}