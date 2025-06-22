import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, TRPCClientError, wsLink, splitLink, createWSClient, TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import { QueryClient, QueryClientProvider, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import React, { useState, useMemo } from 'react';
import { Platform } from 'react-native';
import type { AppRouter } from '@/src/server/routers';
import { getApiUrl } from '@/lib/core/config/unified-env';
import { getWebSocketConfig } from '@/lib/core/config/websocket-config';
import { log } from '@/lib/core/debug/logger';
import { logger } from '@/lib/core/debug/unified-logger';
import { authClient } from '@/lib/auth/auth-client';
// Removed broken import - createQueryClient will be defined inline

// Create tRPC React hooks
export const api = createTRPCReact<AppRouter>();

// Create query client with SSR-friendly defaults
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some sensible defaults
        // to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: Platform.OS === 'web' ? 0 : 3, // Don't retry on web in SSR
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    },
  });
}

// SSR support: Allow passing initial state
interface TRPCProviderProps {
  children: React.ReactNode;
  dehydratedState?: any;
}

export function TRPCProvider({ children, dehydratedState }: TRPCProviderProps) {
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

      // Create error link to handle TRPC errors globally
      const errorLink: TRPCLink<AppRouter> = () => {
        return ({ next, op }) => {
          return observable((observer) => {
            const unsubscribe = next(op).subscribe({
              next(value) {
                observer.next(value);
              },
              error(err) {
                logger.trpc.error(op.path, op.type, err);
                
                // Check for database connection errors
                const errorMessage = err?.message || err?.toString() || '';
                if (errorMessage.includes('too many clients already') || 
                    errorMessage.includes('FATAL') ||
                    errorMessage.includes('53300')) {
                  logger.auth.error('Database connection exhausted', {
                    operation: op.path,
                    error: errorMessage
                  });
                  
                  // Stop further session checks
                  if (op.path === 'auth.getSession') {
                    logger.auth.warn('Disabling session checks due to database exhaustion');
                  }
                }
                
                // Use the global error store to handle TRPC errors
                // The store is set up by RootErrorStoreSetup component
                const errorStore = (window as any).__errorDetectionStore;
                if (errorStore?.handleTRPCError) {
                  errorStore.handleTRPCError(err);
                }
                
                observer.error(err);
              },
              complete() {
                observer.complete();
              },
            });
            return unsubscribe;
          });
        };
      };

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
                log.debug('Returning headers with auth', 'TRPC', {
                  headers: Object.keys(headersWithAuth),
                  hasAuth: !!headersWithAuth.Authorization
                });
                return headersWithAuth;
              } else {
                log.debug('No session token available', 'TRPC');
                
                // Try to get cookie as fallback
                const { waitForStorageInit, mobileStorage } = await import('../core/secure-storage');
                await waitForStorageInit();
                
                const cookie = mobileStorage.getItem('better-auth_cookie') || 
                              mobileStorage.getItem('better-auth.cookie');
                
                if (cookie) {
                  log.debug('Found cookie, extracting token', 'TRPC');
                  const tokenMatch = cookie.match(/better-auth\.session-token=([^;\s]+)/);
                  if (tokenMatch && tokenMatch[1]) {
                    const extractedToken = tokenMatch[1];
                    log.debug('Extracted token from cookie', 'TRPC', {
                      tokenPreview: extractedToken.substring(0, 20) + '...'
                    });
                    return {
                      ...baseHeaders,
                      'Authorization': `Bearer ${extractedToken}`,
                    };
                  }
                }
              }
            } catch (error) {
              log.error('Failed to add auth headers', 'TRPC', error);
            }
            log.debug('Returning base headers without auth', 'TRPC');
            return baseHeaders;
          }
          
          // On web, try to use Bearer token from localStorage as fallback
          log.debug('Web platform, checking for auth', 'TRPC');
          
          // First try cookies
          const cookies = authClient.getCookie();
          if (cookies) {
            log.debug('Using cookies for auth', 'TRPC');
            return {
              ...baseHeaders,
              'Cookie': cookies,
            };
          }
          
          // Fallback to Bearer token from localStorage
          try {
            const token = localStorage.getItem('auth-token');
            if (token) {
              // Check if token is not too old (24 hours)
              const timestamp = localStorage.getItem('auth-token-timestamp');
              if (timestamp) {
                const age = Date.now() - parseInt(timestamp, 10);
                if (age > 24 * 60 * 60 * 1000) {
                  log.debug('Token too old, removing', 'TRPC');
                  localStorage.removeItem('auth-token');
                  localStorage.removeItem('auth-token-timestamp');
                } else {
                  log.debug('Using Bearer token from localStorage', 'TRPC', {
                    tokenPreview: token.substring(0, 20) + '...',
                    age: Math.round(age / 1000 / 60) + ' minutes'
                  });
                  return {
                    ...baseHeaders,
                    'Authorization': `Bearer ${token}`,
                  };
                }
              }
            }
          } catch (e) {
            log.error('Failed to get token from localStorage', 'TRPC', e);
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

      // Get WebSocket configuration
      const wsConfig = getWebSocketConfig();
      
      if (wsConfig.enabled) {
        try {
          log.debug('WebSocket URL configured', 'TRPC', { wsUrl: wsConfig.url });
          
          // Create WebSocket client
          const wsClient = createWSClient({
            url: wsConfig.url,
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
              // Only log WebSocket errors in development
              if (__DEV__) {
                log.warn('WebSocket connection failed - subscriptions will not be available', 'TRPC', {
                  error: error?.message || 'Connection refused',
                  url: wsConfig.url
                });
              }
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

          // Custom logging link for healthcare operations
          const loggingLink: TRPCLink<AppRouter> = () => {
            return ({ next, op }) => {
              // Log healthcare operations
              if (op.path.includes('healthcare')) {
                logger.healthcare.info(`TRPC ${op.type}: ${op.path}`, {
                  type: op.type,
                  path: op.path,
                  input: op.input,
                });
              }
              
              return observable((observer) => {
                const unsubscribe = next(op).subscribe({
                  next(value) {
                    if (op.path.includes('healthcare')) {
                      logger.healthcare.info(`TRPC ${op.type} success: ${op.path}`, {
                        type: op.type,
                        path: op.path,
                        result: value.result,
                      });
                    }
                    observer.next(value);
                  },
                  error(err) {
                    if (op.path.includes('healthcare')) {
                      logger.healthcare.error(`TRPC ${op.type} error: ${op.path}`, {
                        type: op.type,
                        path: op.path,
                        error: err,
                        message: err?.message,
                        code: err?.data?.code,
                      });
                    }
                    observer.error(err);
                  },
                  complete() {
                    observer.complete();
                  },
                });
                return unsubscribe;
              });
            };
          };

          // Use split link to route subscriptions through WebSocket
          const link = splitLink({
            condition: (op) => op.type === 'subscription',
            true: websocketLink,
            false: httpLink,
          });
          
          return api.createClient({
            links: [errorLink, loggingLink, link],
          });
        } catch (wsError) {
          log.error('Failed to create WebSocket link, falling back to HTTP only', 'TRPC', wsError);
          // Fall back to HTTP-only mode
          return api.createClient({
            links: [errorLink, httpLink],
          });
        }
      }

      // Custom logging link for healthcare operations
      const loggingLink: TRPCLink<AppRouter> = () => {
        return ({ next, op }) => {
          // Log healthcare operations
          if (op.path.includes('healthcare')) {
            logger.healthcare.info(`TRPC ${op.type}: ${op.path}`, {
              type: op.type,
              path: op.path,
              input: op.input,
            });
          }
          
          return observable((observer) => {
            const unsubscribe = next(op).subscribe({
              next(value) {
                if (op.path.includes('healthcare')) {
                  logger.healthcare.info(`TRPC ${op.type} success: ${op.path}`, {
                    type: op.type,
                    path: op.path,
                    result: value.result,
                  });
                }
                observer.next(value);
              },
              error(err) {
                if (op.path.includes('healthcare')) {
                  logger.healthcare.error(`TRPC ${op.type} error: ${op.path}`, {
                    type: op.type,
                    path: op.path,
                    error: err,
                    message: err?.message,
                    code: err?.data?.code,
                  });
                }
                observer.error(err);
              },
              complete() {
                observer.complete();
              },
            });
            return unsubscribe;
          });
        };
      };

      // Default to HTTP-only when WebSocket is disabled
      log.debug('WebSocket disabled, using HTTP-only mode', 'TRPC');
      return api.createClient({
        links: [errorLink, loggingLink, httpLink],
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
        <HydrationBoundary state={dehydratedState}>
          {children}
        </HydrationBoundary>
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