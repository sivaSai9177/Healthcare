import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { api } from '@/lib/api/trpc';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationSync } from '@/lib/stores/organization-store';
import { log } from '@/lib/core/debug/logger';
import { logger } from '@/lib/core/debug/unified-logger';
import { toAppUser } from '@/lib/stores/auth-store';

declare global {
  interface Window {
    __trpcEndpointErrorLogged?: boolean;
  }
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { updateAuth, clearAuth, hasHydrated, user, isAuthenticated } = useAuth();
  const utils = api.useUtils();
  
  // Debouncing: Track last session check time to prevent excessive checks
  const lastSessionCheckRef = React.useRef<number>(0);
  const SESSION_CHECK_DEBOUNCE = 30000; // 30 seconds minimum between checks
  
  // Sync organization state
  useOrganizationSync(user, isAuthenticated);
  
  // Track user activity and app state to prevent session timeout
  React.useEffect(() => {
    if (!isAuthenticated) return;
    
    if (Platform.OS === 'web') {
      // Web: Track user activity
      let activityTimer: ReturnType<typeof setTimeout>;
      
      const resetActivityTimer = () => {
        if (activityTimer) clearTimeout(activityTimer);
        
        // Set a 5-minute activity timeout
        activityTimer = setTimeout(async () => {
          logger.auth.info('Inactivity timeout reached - triggering session refresh', {
            userId: user?.id,
            platform: 'web'
          });
          
          // Check debounce before refreshing
          const now = Date.now();
          if (now - lastSessionCheckRef.current < SESSION_CHECK_DEBOUNCE) {
            logger.auth.debug('Skipping session refresh - debounced', {
              timeSinceLastCheck: now - lastSessionCheckRef.current,
              threshold: SESSION_CHECK_DEBOUNCE
            });
            return;
          }
          
          // Force a session refresh to keep it alive
          const startTime = Date.now();
          try {
            lastSessionCheckRef.current = now;
            // Refreshing state removed from simplified auth store
            logger.auth.debug('Starting session refresh');
            
            await utils.auth.getSession.fetch();
            
            const duration = Date.now() - startTime;
            logger.auth.sessionRefresh(user?.id || 'unknown', 'web-inactivity');
            logger.auth.info('Session refreshed successfully after inactivity', {
              duration,
              platform: 'web'
            });
          } catch (error) {
            const duration = Date.now() - startTime;
            logger.auth.error('Failed to refresh session on inactivity', {
              error: error?.message || error,
              duration,
              platform: 'web'
            });
          } finally {
            // Refreshing state removed from simplified auth store
            logger.auth.debug('Session refresh completed');
          }
        }, 5 * 60 * 1000);
      };
      
      // Listen for user activity
      const events = ['touchstart', 'mousedown', 'keypress', 'scroll', 'focus'];
      events.forEach(event => {
        window.addEventListener(event, resetActivityTimer, { passive: true });
      });
      
      // Start the timer
      resetActivityTimer();
      
      return () => {
        if (activityTimer) clearTimeout(activityTimer);
        events.forEach(event => {
          window.removeEventListener(event, resetActivityTimer);
        });
      };
    } else {
      // Mobile: Listen to app state changes
      let lastAppState = AppState.currentState;
      const subscription = AppState.addEventListener('change', async (nextAppState) => {
        logger.auth.debug('App state change detected', {
          from: lastAppState,
          to: nextAppState,
          userId: user?.id,
          platform: Platform.OS
        });
        
        if (nextAppState === 'active' && lastAppState !== 'active') {
          logger.auth.info('App became active from background - triggering session refresh', {
            userId: user?.id,
            platform: Platform.OS
          });
          
          // Check debounce before refreshing
          const now = Date.now();
          if (now - lastSessionCheckRef.current < SESSION_CHECK_DEBOUNCE) {
            logger.auth.debug('Skipping session refresh - debounced', {
              timeSinceLastCheck: now - lastSessionCheckRef.current,
              threshold: SESSION_CHECK_DEBOUNCE,
              platform: Platform.OS
            });
            return;
          }
          
          // Refresh session when app comes to foreground
          const startTime = Date.now();
          try {
            lastSessionCheckRef.current = now;
            // Refreshing state removed from simplified auth store
            logger.auth.debug('Starting session refresh');
            
            await utils.auth.getSession.fetch();
            
            const duration = Date.now() - startTime;
            logger.auth.sessionRefresh(user?.id || 'unknown', `${Platform.OS}-app-active`);
            logger.auth.info('Session refreshed successfully after app became active', {
              duration,
              platform: Platform.OS
            });
          } catch (error) {
            const duration = Date.now() - startTime;
            logger.auth.error('Failed to refresh session on app active', {
              error: error?.message || error,
              duration,
              platform: Platform.OS
            });
          } finally {
            // Refreshing state removed from simplified auth store
            logger.auth.debug('Session refresh completed');
          }
        }
        lastAppState = nextAppState;
      });
      
      return () => {
        subscription.remove();
      };
    }
  }, [isAuthenticated, user?.id, utils.auth.getSession]);
  
  // Use session check manager to prevent concurrent checks
  const [shouldCheckSession, setShouldCheckSession] = React.useState(false);
  const hasCheckedInitialSession = React.useRef(false);
  const lastCheckAttempt = React.useRef(0);
  const isCheckingSession = React.useRef(false);
  
  React.useEffect(() => {
    // Only check session in specific scenarios to prevent DB exhaustion
    if (!hasHydrated) return;
    
    // Don't check session on profile completion page or during OAuth flow
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const isProfileCompletion = pathname.includes('complete-profile');
      const isAuthCallback = pathname.includes('auth-callback');
      const hasOAuthParams = window.location.search.includes('code=') && window.location.search.includes('state=');
      const oauthActive = typeof isOAuthActive === 'function' ? isOAuthActive() : false;
      
      if (isProfileCompletion || isAuthCallback || hasOAuthParams || oauthActive) {
        logger.auth.debug('Skipping session check during auth flow', {
          isProfileCompletion,
          isAuthCallback,
          hasOAuthParams,
          isOAuthActive: oauthActive,
          pathname
        });
        setShouldCheckSession(false);
        return;
      }
    }
    
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckAttempt.current;
    
    // Prevent checks more frequent than every 10 seconds
    if (timeSinceLastCheck < 10000) {
      logger.auth.debug('Skipping session check - too frequent', {
        timeSinceLastCheck,
        threshold: 10000
      });
      return;
    }
    
    // Scenario 1: Initial mount - check once after hydration
    if (!hasCheckedInitialSession.current && !isAuthenticated) {
      logger.auth.debug('Enabling initial session check after hydration');
      hasCheckedInitialSession.current = true;
      lastCheckAttempt.current = now;
      setShouldCheckSession(true);
      
      // Disable after 3 seconds
      const timer = setTimeout(() => {
        setShouldCheckSession(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    // Scenario 2: OAuth callback - check when we detect OAuth params
    if (typeof window !== 'undefined') {
      const isOAuthCallback = window.location.pathname.includes('auth-callback') ||
                             (window.location.search.includes('code=') && 
                              window.location.search.includes('state='));
      
      if (isOAuthCallback && !isAuthenticated) {
        logger.auth.debug('OAuth callback detected, enabling one-time session check');
        lastCheckAttempt.current = now;
        setShouldCheckSession(true);
        
        // Disable after 5 seconds
        const timer = setTimeout(() => {
          setShouldCheckSession(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [hasHydrated, isAuthenticated]);
  
  // Keep auth state synchronized between server and client using TanStack Query
  logger.auth.debug('SyncProvider: Session query config', {
    shouldCheckSession,
    hasHydrated,
    isCheckingSession: isCheckingSession.current
  });
  
  const { data, error, isFetching, isRefetching, refetch } = api.auth.getSession.useQuery(undefined, {
    // Enable selectively to prevent database connection exhaustion
    // Don't check session if we're not authenticated or in an auth flow
    // Also skip for users with incomplete profiles or OAuth active
    enabled: shouldCheckSession && hasHydrated && !isCheckingSession.current && 
             (isAuthenticated || (typeof window !== 'undefined' && window.location.pathname.includes('auth-callback'))) &&
             !(user?.needsProfileCompletion || user?.role === 'guest') &&
             !(typeof isOAuthActive === 'function' && isOAuthActive()),
    
    // Reduce retries to prevent connection exhaustion
    retry: (failureCount, error) => {
      // Don't retry on 500 errors - these are usually database connection issues
      if (error?.data?.httpStatus === 500) {
        logger.auth.error('Server error - not retrying', {
          httpStatus: 500,
          error: error?.message,
          hint: 'Database connection exhausted'
        });
        // Disable further checks
        setShouldCheckSession(false);
        return false;
      }
      // Don't retry on 401 - session is invalid
      if (error?.data?.httpStatus === 401) {
        return false;
      }
      // Retry up to 1 time for other errors
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000),
    
    // Disable automatic refetching to prevent DB exhaustion
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    
    // Keep data fresh for longer to reduce database queries
    staleTime: 5 * 60 * 1000, // 5 minutes (matches cookie cache)
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Handle state updates with useEffect (TanStack Query v5 pattern)
  useEffect(() => {
    // Track when we're processing session data
    if (isFetching || isRefetching) {
      isCheckingSession.current = true;
      logger.auth.debug('SyncProvider: Fetching session', { isFetching, isRefetching });
    } else {
      isCheckingSession.current = false;
    }
    
    logger.auth.debug('SyncProvider: Session query result', {
      hasData: !!data,
      dataType: data === null ? 'null' : typeof data,
      isFetching,
      isRefetching,
      hasError: !!error
    });
    
    // Only update if we have actual data with both user and session
    if (data && (data as any).user && (data as any).session) {
      const { user, session } = data as any;
      logger.auth.debug('SyncProvider: Received session data', {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
        sessionId: session?.id,
        sessionExpires: session?.expiresAt
      });
      
      // Ensure user has all required fields
      const appUser = toAppUser(user);
      updateAuth(appUser, session);
      
      // Disable further checks after successful auth
      setShouldCheckSession(false);
    } else if (data === null && !isFetching && !isRefetching) {
      // Only clear auth if server explicitly returned null AND we're not in a loading state
      // This prevents clearing auth during profile completion or OAuth flow
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthFlow = currentPath.includes('complete-profile') || 
                        currentPath.includes('auth-callback') ||
                        currentPath.includes('login') ||
                        currentPath.includes('register') ||
                        currentPath.includes('auth') ||
                        (typeof window !== 'undefined' && window.location.search.includes('code=')) ||
                        (typeof window !== 'undefined' && window.location.search.includes('state='));
      
      // Check if OAuth is active
      const oauthActive = false; // isOAuthActive was removed from simplified auth store
      
      logger.auth.debug('SyncProvider: Server returned null session', {
        currentPath,
        isAuthFlow,
        isOAuthActive: oauthActive,
        isFetching,
        isRefetching,
        currentAuthState: {
          isAuthenticated,
          hasUser: !!user
        }
      });
      
      if (!isAuthFlow && !oauthActive) {
        // Check if we're already in the process of signing out
        const isSigningOut = currentPath.includes('login') || 
                           currentPath.includes('sign-out') ||
                           window.location.search.includes('signout');
        
        if (!isSigningOut) {
          logger.auth.warn('Clearing auth - server returned null session', {
            path: currentPath,
            isFetching,
            isRefetching
          });
          clearAuth();
        } else {
          logger.auth.debug('Already signing out, skipping additional clearAuth call', {
            path: currentPath
          });
        }
      } else {
        logger.auth.debug('Skipping auth clear during auth flow', {
          path: currentPath,
          isAuthFlow
        });
      }
    }
    // Don't clear auth if data is undefined (loading state)
  }, [data, updateAuth, clearAuth, isFetching, isRefetching]);
  
  // Handle auth errors with rate limiting
  const lastErrorTime = React.useRef(0);
  useEffect(() => {
    if (!error) return;
    
    // Rate limit error handling to prevent loops
    const now = Date.now();
    if (now - lastErrorTime.current < 5000) {
      return; // Skip if we handled an error in the last 5 seconds
    }
    lastErrorTime.current = now;
    
    if (error?.data?.httpStatus === 401) {
      logger.auth.error('401 Unauthorized - clearing session', {
        error: error?.message || error,
        httpStatus: error?.data?.httpStatus,
        code: error?.data?.code
      });
      clearAuth();
    } else if (error?.data?.httpStatus === 500) {
      // Database connection errors - don't clear auth, just log
      logger.auth.error('Server error - database may be overloaded', {
        error: error?.message || error,
        httpStatus: 500,
        hint: 'Too many concurrent connections'
      });
      // Disable further checks to prevent exhaustion
      setShouldCheckSession(false);
    } else {
      // Check if error is due to HTML response (common when endpoint doesn't exist)
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('JSON Parse error') || errorMessage.includes('Unexpected character') || 
          errorMessage.includes('Unexpected end of JSON input')) {
        // Only log once to avoid spam
        if (!window.__trpcEndpointErrorLogged) {
          window.__trpcEndpointErrorLogged = true;
          logger.auth.error('Session sync error - received non-JSON response', {
            error: errorMessage,
            hint: 'API endpoint may be returning HTML (404 page) instead of JSON',
            endpoint: '/api/trpc/auth.getSession',
            platform: Platform.OS
          });
        }
        // Don't trigger auth clear for JSON parse errors - these are usually routing issues
        return;
      } else {
        logger.auth.error('Session sync error', {
          error: errorMessage,
          httpStatus: error?.data?.httpStatus,
          code: error?.data?.code
        });
      }
    }
  }, [error, clearAuth]);
  
  // Log refreshing state for debugging
  useEffect(() => {
    if (isRefetching && !isFetching) {
      // Log refetch status
      logger.debug('Session refetch in progress', 'AUTH');
    } else if (!isRefetching && !isFetching) {
      // Log when refetch completes
      logger.debug('Session refetch completed', 'AUTH');
    }
  }, [isFetching, isRefetching]);
  
  return <>{children}</>;
}