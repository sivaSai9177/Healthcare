import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, TRPCClientError, wsLink, splitLink, createWSClient } from '@trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Platform } from 'react-native';
import type { AppRouter } from '@/src/server/routers';
import { getApiUrl, getWebSocketUrl, isWebSocketEnabled } from '@/lib/core/config/unified-env';
import { log } from '@/lib/core/debug/logger';
import { authClient } from '@/lib/auth/auth-client';

// Create tRPC React hooks
export const api = createTRPCReact<AppRouter>();

// Optimized query client factory to prevent excessive refetching
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Much longer stale time to reduce requests
        staleTime: 10 * 60 * 1000, // 10 minutes
        // Disable aggressive refetching
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Only fetch when explicitly needed
        refetchOnReconnect: false, // Prevents loader on network changes
        // Disable background refetch
        refetchInterval: false,
        refetchIntervalInBackground: false,
        // Conservative retry strategy
        retry: (failureCount, error) => {
          // Don't retry on auth errors
          if (error instanceof TRPCClientError) {
            const code = error.data?.code;
            if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN' || code === 'NOT_FOUND') {
              return false;
            }
          }
          return failureCount < 1; // Only retry once
        },
        retryDelay: 2000, // Fixed 2 second delay
        // Longer cache time
        gcTime: 15 * 60 * 1000, // 15 minutes
      },
      mutations: {
        retry: false,
        // Global error handling for mutations
        onError: (error) => {
          log.error('Mutation failed', 'TRPC', error);
        },
        // Global success handling
        onSuccess: () => {
          log.debug('Mutation completed successfully', 'TRPC');
        },
        // Prevent mutation caching issues
        gcTime: 0,
      },
    },
  });
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  log.debug('TRPC Provider mounting', 'TRPC');
  
  const [queryClient] = useState(() => createQueryClient());
  const [error, setError] = useState<string | null>(null);
  
  // Use static URL instead of dynamic updates to prevent re-renders
  const trpcUrl = React.useMemo(() => {
    try {
      const apiUrl = getApiUrl();
      const url = `${apiUrl}/api/trpc`;
      log.debug('TRPC URL configured', 'TRPC', { url });
      return url;
    } catch (err) {
      const errorMsg = 'Failed to configure tRPC URL';
      log.error(errorMsg, 'TRPC', err);
      setError(errorMsg);
      return 'http://localhost:3000/api/trpc'; // fallback
    }
  }, []);

  // Create stable tRPC client with proper error handling
  const trpcClient = React.useMemo(() => {
    try {

      // Create HTTP link configuration
      const httpLink = httpBatchLink({
        url: trpcUrl,
        async headers() {
          const baseHeaders = {
            'Content-Type': 'application/json',
          };
          
          log.debug('Headers function called', 'TRPC', { platform: Platform.OS });
          
          // On mobile, add the Authorization header with Bearer token
          if (Platform.OS !== 'web') {
            try {
              // Import session manager dynamically to avoid circular dependencies
              const authSessionModule = await import('../auth/auth-session-manager');
              const sessionManager = authSessionModule.sessionManager;
              
              // Get token synchronously
              const token = sessionManager?.getSessionToken();
              
              if (token) {
                log.debug('Adding Bearer token', 'TRPC', {
                  tokenPreview: token.substring(0, 20) + '...',
                  tokenLength: token.length,
                });
                const headersWithAuth = {
                  ...baseHeaders,
                  'Authorization': `Bearer ${token}`,
                };
                log.debug('Returning headers with auth', 'TRPC');
                return headersWithAuth;
              } else {
                log.debug('No session token available', 'TRPC');
              }
            } catch (error) {
              log.error('Failed to add auth headers', 'TRPC', error);
            }
            log.debug('Returning base headers without auth', 'TRPC');
            return baseHeaders;
          }
          
          // On web, use cookies
          log.debug('Web platform, using cookies', 'TRPC');
          const cookies = authClient.getCookie();
          if (cookies) {
            return {
              ...baseHeaders,
              'Cookie': cookies,
            };
          }
          
          return baseHeaders;
        },
        // Simplified fetch with timeout and error handling
        async fetch(url, options) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            log.error('tRPC request timeout', 'TRPC', { url: url.toString() });
          }, 30000);
          
          try {
            // Check if we're in tunnel mode
            const isTunnel = url.toString().includes('.exp.direct') || url.toString().includes('.exp.host');
            
            const response = await fetch(url, {
              ...options,
              // Use 'omit' for mobile in tunnel mode to avoid CORS issues
              credentials: Platform.OS === 'web' ? 'include' : (isTunnel ? 'omit' : 'include'),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            if ((error as any).name === 'AbortError') {
              log.error('tRPC request aborted', 'TRPC', { url: url.toString() });
            } else {
              log.error('tRPC request failed', 'TRPC', { 
                error: (error as any).message,
                url: url.toString(),
                platform: Platform.OS,
                isTunnel: url.toString().includes('.exp.direct') || url.toString().includes('.exp.host')
              });
            }
            throw error;
          }
        },
      });

      // Only create WebSocket link if WebSocket is enabled and we're not in a test environment
      const enableWebSocket = isWebSocketEnabled() && 
                            typeof WebSocket !== 'undefined' &&
                            process.env.NODE_ENV !== 'test';
      
      if (enableWebSocket) {
        try {
          const wsUrl = getWebSocketUrl();
          log.debug('WebSocket URL configured', 'TRPC', { wsUrl });
          
          // Create WebSocket client
          const wsClient = createWSClient({
            url: wsUrl,
            connectionParams: async () => {
              // Use better-auth's universal cookie management for WebSocket
              const cookies = authClient.getCookie();
              if (cookies) {
                // Extract session token from cookies for WebSocket auth
                const match = cookies.match(/better-auth\.session_token=([^;]+)/);
                if (match && match[1]) {
                  return {
                    authorization: `Bearer ${match[1]}`,
                  };
                }
              }
              return {};
            },
            // Add error handling
            onOpen: () => {
              log.debug('WebSocket connected', 'TRPC', {});
            },
            onClose: () => {
              log.debug('WebSocket disconnected', 'TRPC', {});
            },
            onError: (error: any) => {
              log.error('WebSocket error', 'TRPC', error);
            },
            // Lazy mode - don't connect until first subscription
            lazy: {
              enabled: true,
              closeMs: 30000, // Close after 30 seconds of inactivity
            },
          });

          // Create WebSocket link for subscriptions
          const websocketLink = wsLink({
            client: wsClient,
          });

          // Use split link to route subscriptions through WebSocket
          const link = splitLink({
            condition: (op) => op.type === 'subscription',
            true: websocketLink,
            false: httpLink,
          });
          
          return api.createClient({
            links: [link],
          });
        } catch (wsError) {
          log.error('Failed to create WebSocket link, falling back to HTTP only', 'TRPC', wsError);
          // Fall back to HTTP-only mode
          return api.createClient({
            links: [httpLink],
          });
        }
      }

      // Default to HTTP-only when WebSocket is disabled
      log.debug('WebSocket disabled, using HTTP-only mode', 'TRPC');
      return api.createClient({
        links: [httpLink],
      });
    } catch (err) {
      log.error('Failed to create tRPC client', 'TRPC', err);
      setError('Failed to initialize tRPC client');
      // Return a minimal client that will fail gracefully
      return api.createClient({
        links: [
          httpBatchLink({
            url: trpcUrl,
          }),
        ],
      });
    }
  }, [trpcUrl]);

  // Show error state if tRPC initialization failed
  if (error) {
    log.error('tRPC Provider error state', 'TRPC', { error });
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* React Query DevTools not available for React Native */}
        {/* {__DEV__ && Platform.OS === 'web' && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
            position="bottom"
          />
        )} */}
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
      log.error('Optimistic mutation failed', 'TRPC', error);
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
export function useMultipleQueries(queries: { enabled?: boolean }[]) {
  const isLoading = queries.some(q => q.enabled !== false);
  const hasError = queries.some(q => 'error' in q && q.error);
  
  return {
    isLoading,
    hasError,
    isReady: !isLoading && !hasError,
  };
}