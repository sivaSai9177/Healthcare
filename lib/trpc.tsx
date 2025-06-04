import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, TRPCClientError } from '@trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { useState } from 'react';
import { Platform } from 'react-native';
import type { AppRouter } from '@/src/server/routers';
import { authClient } from './auth/auth-client';
import { getApiUrlSync } from './core/config';
import { env } from './core/env';
import { log } from '@/lib/core/logger';

// Create tRPC React hooks
export const api = createTRPCReact<AppRouter>();

// Get initial URL synchronously
const INITIAL_TRPC_URL = `${getApiUrlSync()}/api/trpc`;

// Enhanced query client factory with platform-specific optimizations
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Longer stale time for mobile to reduce unnecessary requests
        staleTime: Platform.OS === 'web' ? 5 * 1000 : 30 * 1000,
        // Disable refetch on window focus for mobile apps
        refetchOnWindowFocus: Platform.OS === 'web',
        // Background refetch for critical data - but prevent excessive refetching
        refetchOnMount: 'always',
        refetchOnReconnect: true,
        // Prevent infinite subscriptions
        refetchInterval: false,
        refetchIntervalInBackground: false,
        // Retry strategy
        retry: (failureCount, error) => {
          // Don't retry on auth errors
          if (error instanceof TRPCClientError) {
            const code = error.data?.code;
            if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN' || code === 'NOT_FOUND') {
              return false;
            }
          }
          // Less aggressive retry on mobile to save battery
          return failureCount < (Platform.OS === 'web' ? 3 : 2);
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Prevent queries from staying enabled indefinitely
        gcTime: 5 * 60 * 1000, // 5 minutes
      },
      mutations: {
        retry: false,
        // Global error handling for mutations
        onError: (error) => {
          log.api.error('Mutation failed', error);
          // Add toast notification here if needed
        },
        // Global success handling
        onSuccess: (data, variables, context) => {
          log.api.response('Mutation completed successfully');
          // Add global success actions here
        },
        // Prevent mutation caching issues
        gcTime: 0,
      },
    },
  });
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  log.api.request('TRPC Provider mounting');
  
  const [queryClient] = useState(() => createQueryClient());
  const [trpcUrl, setTrpcUrl] = useState(INITIAL_TRPC_URL);
  
  // Update URL when environment is ready
  React.useEffect(() => {
    env.getApiUrl().then(apiUrl => {
      const newTrpcUrl = `${apiUrl}/api/trpc`;
      if (newTrpcUrl !== trpcUrl) {
        log.api.request('TRPC URL updated', { from: trpcUrl, to: newTrpcUrl });
        setTrpcUrl(newTrpcUrl);
      }
    }).catch(error => log.api.error('Failed to update TRPC URL', error));
  }, [trpcUrl]);

  // Create tRPC client with dynamic URL
  const trpcClient = React.useMemo(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: trpcUrl,
          maxBatchSize: 1, // Disable batching to fix parsing issues
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
    }), [trpcUrl]);

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* Only show DevTools in development and web platform */}
        {__DEV__ && Platform.OS === 'web' && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
            position="bottom"
          />
        )}
      </QueryClientProvider>
    </api.Provider>
  );
}

// Export typed hooks for convenience
export const trpc = api;

// Custom hooks for common tRPC patterns
export function useOptimisticMutation<TOutput>(
  mutationFn: any,
  options?: {
    onSuccess?: (data: TOutput) => void;
    onError?: (error: any) => void;
  }
) {
  const utils = api.useUtils();
  
  return mutationFn.useMutation({
    onMutate: async () => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await utils.invalidate();
    },
    onError: (error: any) => {
      log.api.error('Optimistic mutation failed', error);
      options?.onError?.(error);
    },
    onSuccess: (data: TOutput) => {
      options?.onSuccess?.(data);
    },
    onSettled: () => {
      // Sync with server state
      utils.invalidate();
    },
  });
}

// Hook for batch invalidation - with throttling to prevent infinite loops
let lastInvalidation = 0;
export function useBatchInvalidation() {
  const utils = api.useUtils();
  
  return {
    invalidateAll: () => {
      const now = Date.now();
      if (now - lastInvalidation < 1000) { // Throttle to once per second
        log.warn('Query invalidation throttled to prevent infinite loops', 'TRPC');
        return;
      }
      lastInvalidation = now;
      utils.invalidate();
    },
    invalidateAuth: () => {
      const now = Date.now();
      if (now - lastInvalidation < 1000) {
        log.warn('Auth invalidation throttled to prevent infinite loops', 'TRPC');
        return;
      }
      lastInvalidation = now;
      utils.auth.invalidate();
    },
    // Add more specific invalidations as needed
  };
}

// Hook for prefetching with conditional logic
export function usePrefetch() {
  return {
    prefetchOnHover: (procedure: any, input?: any) => ({
      onMouseEnter: Platform.OS === 'web' ? () => {
        procedure.prefetch(input);
      } : undefined,
    }),
    prefetchOnFocus: (procedure: any, input?: any) => ({
      onFocus: () => {
        procedure.prefetch(input);
      },
    }),
  };
}

// Higher-order component for error boundaries
export function withTRPCErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return function TRPCErrorBoundaryWrapper(props: P) {
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <Component {...props} />
      </React.Suspense>
    );
  };
}

// Hook for handling loading states across multiple queries
export function useMultipleQueries(queries: Array<{ enabled?: boolean }>) {
  const isLoading = queries.some(q => q.enabled !== false);
  const hasError = queries.some(q => 'error' in q && q.error);
  
  return {
    isLoading,
    hasError,
    isReady: !isLoading && !hasError,
  };
}