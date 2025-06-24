import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';
import { log } from '@/lib/core/debug/logger';
import { getModuleLogger } from '@/lib/core/debug/window-logger';
import { toAppUser } from '@/lib/stores/auth-store';
import { OAuthErrorHandler, OAuthError } from '@/components/blocks/auth/OAuthErrorHandler';

// Get auth module logger
const authLogger = getModuleLogger('Auth');

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { updateAuth, isAuthenticated, user } = useAuth();
  const [retryCount, setRetryCount] = React.useState(0);
  const [oauthError, setOauthError] = React.useState<OAuthError | null>(null);
  const maxRetries = 5;
  
  // Use tRPC to get session with enhanced error handling
  const { data: sessionData, isLoading, error, refetch } = api.auth.getSession.useQuery(undefined, {
    refetchInterval: false,
    retry: 3, // Increase retries for OAuth callbacks
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 0, // Always fetch fresh data in auth callback
    gcTime: 0, // Don't cache in auth callback (gcTime in v5)
    enabled: retryCount <= maxRetries, // Stop querying after max retries
  });

  useEffect(() => {
    // Check for OAuth error parameters
    const errorParam = searchParams.error as string;
    const errorDescription = searchParams.error_description as string;
    
    if (errorParam) {
      const error: OAuthError = {
        code: errorParam === 'access_denied' ? 'access_denied' :
              errorParam === 'server_error' ? 'server_error' :
              errorParam === 'temporarily_unavailable' ? 'temporarily_unavailable' :
              'unknown',
        message: errorDescription || 'OAuth authentication failed',
        provider: searchParams.provider as string || 'google'
      };
      
      log.error('OAuth error detected', 'AUTH', error);
      setOauthError(error);
      return;
    }
    
    // Enhanced debugging for OAuth callback
    const cookies = typeof document !== 'undefined' ? document.cookie : '';
    const hasAuthCookie = cookies.includes('better-auth.session_token');
    
    const debugInfo = {
      provider: 'google',
      hasSessionData: !!sessionData,
      sessionData: sessionData ? {
        userId: (sessionData as any)?.user?.id,
        userRole: (sessionData as any)?.user?.role,
        needsProfileCompletion: (sessionData as any)?.user?.needsProfileCompletion,
        hasSession: !!(sessionData as any)?.session
      } : null,
      isLoading,
      hasError: !!error,
      errorDetails: error?.message,
      localAuthState: { 
        isAuthenticated, 
        hasUser: !!user,
        userId: user?.id,
        userRole: user?.role,
        userNeedsProfileCompletion: user?.needsProfileCompletion
      },
      cookies: {
        hasAuthCookie,
        cookieNames: cookies.split(';').map(c => c.split('=')[0].trim()).filter(c => c.includes('auth'))
      },
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      timestamp: new Date().toISOString()
    };
    
    console.log('[AUTH_CALLBACK] OAuth Callback Debug:', debugInfo);
    log.info('Processing OAuth callback', 'OAUTH', debugInfo);
    authLogger.debug('OAuth Callback Processing', debugInfo);
    
    // Add a small delay for OAuth callbacks to ensure the user is properly created
    const isOAuthCallback = typeof window !== 'undefined' && 
      (window.location.search.includes('code=') || 
       window.location.search.includes('state=') ||
       window.location.pathname.includes('auth-callback') ||
       document.referrer.includes('accounts.google.com'));
    
    // If this looks like an OAuth callback but we don't have session data yet, wait and retry
    if (isOAuthCallback && !sessionData && !isLoading && retryCount < maxRetries) {
      console.log('[AUTH_CALLBACK] OAuth callback detected, waiting before fetching session...', {
        hasError: !!error,
        pathname: window.location.pathname,
        search: window.location.search,
        referrer: document.referrer,
        retryCount,
        maxRetries,
        hasAuthCookie
      });
      authLogger.info('OAuth callback detected - waiting for session', {
        hasAuthCookie,
        retryCount,
        search: window.location.search
      });
      log.info('OAuth callback detected, waiting before fetching session...', 'OAUTH');
      const timer = setTimeout(() => {
        console.log('[AUTH_CALLBACK] Fetching session after OAuth delay (retry ' + (retryCount + 1) + ')');
        log.info('Fetching session after OAuth delay', 'OAUTH', { retry: retryCount + 1 });
        authLogger.info('Retrying session fetch', { retry: retryCount + 1 });
        setRetryCount(prev => prev + 1);
        refetch();
      }, 1500); // 1.5 second delay to ensure DB is updated
      
      return () => clearTimeout(timer);
    }
    
    // Force refetch session data for OAuth callbacks to ensure we have latest profile completion status
    if (isAuthenticated && user && !isLoading && !sessionData) {
      log.info('User authenticated but no fresh session data, refetching...', 'OAUTH', {
        userId: user.id,
        userRole: user.role,
        needsProfileCompletion: user.needsProfileCompletion
      });
      refetch();
      return;
    }
    
    // If we already have auth state, check if we can proceed (but prefer fresh session data)
    if (isAuthenticated && user && !isLoading && !sessionData) {
      log.info('User already authenticated in auth store (using cached data)', 'OAUTH', {
        userId: user.id,
        userRole: user.role,
        needsProfileCompletion: user.needsProfileCompletion
      });
      
      // Navigate based on existing user state, but this should be rare now
      if (user.needsProfileCompletion) {
        log.info('Navigating to profile completion (from auth store)', 'AUTH_CALLBACK');
        router.replace('/(auth)/complete-profile');
      } else {
        log.info('Navigating to home (from auth store)', 'AUTH_CALLBACK');
        router.replace('/home');
      }
      return;
    }
    
    if (sessionData && (sessionData as any)?.user && (sessionData as any)?.session) {
      const sessionUser = (sessionData as any).user;
      const sessionObj = (sessionData as any).session;
      
      log.info('Session data received from tRPC', 'OAUTH', { 
        userId: sessionUser.id,
        email: sessionUser.email,
        role: sessionUser.role,
        needsProfileCompletion: sessionUser.needsProfileCompletion,
        hasRole: !!sessionUser.role,
        isGuest: sessionUser.role === 'guest',
        fullUser: sessionUser
      });
      authLogger.info('Session received successfully', {
        userId: sessionUser.id,
        role: sessionUser.role,
        needsProfileCompletion: sessionUser.needsProfileCompletion
      });
      
      // Update auth store with session data (convert to AppUser)
      const appUser = toAppUser(sessionUser);
      updateAuth(appUser, sessionObj as any);
      
      // Navigate based on profile completion and role using Expo Router
      if (sessionUser.needsProfileCompletion || sessionUser.role === 'guest') {
        log.info('Navigating to profile completion (from tRPC)', 'AUTH_CALLBACK', {
          reason: sessionUser.needsProfileCompletion ? 'needsProfileCompletion=true' : 'role=guest',
          role: sessionUser.role,
          needsProfileCompletion: sessionUser.needsProfileCompletion
        });
        router.replace('/(auth)/complete-profile');
      } else {
        log.info('Navigating to home (from tRPC)', 'AUTH_CALLBACK', {
          role: sessionUser.role,
          needsProfileCompletion: sessionUser.needsProfileCompletion
        });
        router.replace('/home');
      }
    } else if (!isLoading && (!sessionData || error) && retryCount >= maxRetries) {
      // Final check: if we have an auth cookie but no session, there might be a server issue
      if (hasAuthCookie) {
        log.warn('Auth cookie exists but session fetch failed after retries', 'AUTH_CALLBACK', {
          retryCount,
          hasError: !!error,
          errorMessage: error?.message
        });
        
        // Try one more manual refetch
        console.log('[AUTH_CALLBACK] Auth cookie exists, attempting final manual refetch');
        refetch();
      } else {
        log.warn('No session found or error occurred after all retries', 'AUTH_CALLBACK', { 
          hasError: !!error,
          errorMessage: error?.message,
          retryCount,
          recommendation: 'User needs to complete authentication flow'
        });
        
        // Redirect to login using Expo Router
        log.info('Redirecting to login - no valid session after retries', 'AUTH_CALLBACK');
        authLogger.error('No session found after all retries', {
          retryCount,
          hasAuthCookie,
          error: error?.message
        });
        router.replace('/(auth)/login');
      }
    }
  }, [sessionData, isLoading, error, updateAuth, router, isAuthenticated, user, refetch, retryCount, searchParams]);

  // Show OAuth error handler if there's an OAuth error
  if (oauthError) {
    return (
      <OAuthErrorHandler
        error={oauthError}
        onRetry={() => {
          setOauthError(null);
          router.replace('/(auth)/login');
        }}
        onDismiss={() => {
          setOauthError(null);
          router.replace('/(auth)/login');
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 20 }}>
        {retryCount > 0 ? `Processing login... (attempt ${retryCount + 1}/${maxRetries + 1})` : 'Processing login...'}
      </Text>
    </View>
  );
}