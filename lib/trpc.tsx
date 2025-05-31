import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, TRPCClientError } from '@trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import type { AppRouter } from '@/src/server/routers';
import { authClient } from './auth-client';
import { getApiUrl } from './config';

// Create tRPC React hooks
export const api = createTRPCReact<AppRouter>();

// Create a stable query client factory
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof TRPCClientError) {
            const code = error.data?.code;
            if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN' || code === 'NOT_FOUND') {
              return false;
            }
          }
          return failureCount < 3;
        },
      },
      mutations: {
        retry: false,
        onError: (error) => {
          // Global error handling for mutations
          console.error('[TRPC] Mutation error:', error);
        },
      },
    },
  });
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  console.log('[TRPC] Provider mounting...');
  
  const [queryClient] = useState(() => createQueryClient());

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: `${getApiUrl()}/api/trpc`,
          headers() {
            const headers = new Map<string, string>();
            
            // Get auth cookies from Better Auth client
            const cookies = authClient.getCookie();
            if (cookies) {
              headers.set('Cookie', cookies);
            }
            
            // Add content type
            headers.set('Content-Type', 'application/json');
            
            return Object.fromEntries(headers);
          },
          // Enable credentials for cookie handling
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: 'include',
            });
          },
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </api.Provider>
  );
}

// Export typed hooks for convenience
export const trpc = api;