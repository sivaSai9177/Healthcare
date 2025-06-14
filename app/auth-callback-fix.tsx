import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';
import { log } from '@/lib/core/debug/logger';
import { getModuleLogger } from '@/lib/core/debug/window-logger';
import { toAppUser } from '@/lib/stores/auth-store';
import { authClient } from '@/lib/auth/auth-client';

// Get auth module logger
const authLogger = getModuleLogger('Auth');

export default function AuthCallbackFix() {
  const router = useRouter();
  const { updateAuth, isAuthenticated, user } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const maxRetries = 5;
  
  // Use tRPC to get session with enhanced error handling
  const { data: sessionData, isLoading, error, refetch } = api.auth.getSession.useQuery(undefined, {
    refetchInterval: false,
    retry: 3,
    retryDelay: 1000,
    staleTime: 0,
    gcTime: 0,
    enabled: retryCount <= maxRetries,
  });

  // Also try to get session via Better Auth client directly
  const checkBetterAuthSession = async () => {
    try {
      authLogger.info('Checking session via Better Auth client...');
      const betterAuthSession = await authClient.getSession();
      
      if (betterAuthSession?.data?.session && betterAuthSession?.data?.user) {
        authLogger.info('Found session via Better Auth client', {
          userId: betterAuthSession.data.user.id,
          hasSession: true
        });
        
        // Update our auth store
        const appUser = toAppUser(betterAuthSession.data.user);
        updateAuth(appUser, betterAuthSession.data.session as any);
        
        // Navigate based on profile completion
        if (appUser.needsProfileCompletion || appUser.role === 'guest') {
          router.replace('/(auth)/complete-profile');
        } else {
          router.replace('/(home)');
        }
        return true;
      }
      
      return false;
    } catch (error) {
      authLogger.error('Failed to check Better Auth session', error);
      return false;
    }
  };

  useEffect(() => {
    const processOAuthCallback = async () => {
      // Enhanced debugging
      const cookies = typeof document !== 'undefined' ? document.cookie : '';
      const hasAuthCookie = cookies.includes('better-auth.session_token');
      const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
      const params = url ? Object.fromEntries(url.searchParams) : {};
      
      const debug = {
        provider: 'google',
        hasSessionData: !!sessionData,
        isLoading,
        hasError: !!error,
        retryCount,
        cookies: {
          hasAuthCookie,
          allCookies: cookies.split(';').map(c => c.split('=')[0].trim())
        },
        urlParams: params,
        hasCode: !!params.code,
        hasState: !!params.state,
        currentUrl: url?.href || 'N/A',
        pathname: url?.pathname || 'N/A',
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(debug);
      console.log('[AUTH_CALLBACK_FIX] Debug info:', debug);
      authLogger.debug('OAuth Callback Debug', debug);
      
      // Check if this is an OAuth callback
      const isOAuthCallback = !!(params.code || params.state || 
                                 (url?.pathname || '').includes('auth-callback'));
      
      if (isOAuthCallback && !sessionData && !isLoading && retryCount < maxRetries) {
        authLogger.info(`OAuth callback detected, waiting... (attempt ${retryCount + 1}/${maxRetries})`);
        
        // First try Better Auth client
        const foundSession = await checkBetterAuthSession();
        if (foundSession) {
          return;
        }
        
        // If no session found, wait and retry tRPC
        setTimeout(() => {
          authLogger.info('Retrying session fetch...');
          setRetryCount(prev => prev + 1);
          refetch();
        }, 2000);
        
        return;
      }
      
      // Handle session data from tRPC
      if (sessionData && (sessionData as any)?.user && (sessionData as any)?.session) {
        const sessionUser = (sessionData as any).user;
        const sessionObj = (sessionData as any).session;
        
        authLogger.info('Session found via tRPC', {
          userId: sessionUser.id,
          role: sessionUser.role,
          needsProfileCompletion: sessionUser.needsProfileCompletion
        });
        
        const appUser = toAppUser(sessionUser);
        updateAuth(appUser, sessionObj as any);
        
        if (sessionUser.needsProfileCompletion || sessionUser.role === 'guest') {
          router.replace('/(auth)/complete-profile');
        } else {
          router.replace('/(home)');
        }
      } else if (!isLoading && !sessionData && retryCount >= maxRetries) {
        // Final attempt with Better Auth client
        authLogger.warn('No session after retries, trying Better Auth client one more time...');
        const foundSession = await checkBetterAuthSession();
        
        if (!foundSession) {
          authLogger.error('No session found after all attempts', {
            hasAuthCookie,
            retryCount,
            error: error?.message
          });
          router.replace('/(auth)/login');
        }
      }
    };
    
    processOAuthCallback();
  }, [sessionData, isLoading, error, updateAuth, router, refetch, retryCount]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 20, fontSize: 16, fontWeight: '600' }}>
        {retryCount > 0 ? `Processing login... (attempt ${retryCount + 1}/${maxRetries + 1})` : 'Processing login...'}
      </Text>
      
      {/* Debug info in development */}
      {__DEV__ && (
        <View style={{ marginTop: 20, padding: 20, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
          <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>
            Debug Info:{'\n'}
            Has Cookie: {debugInfo.cookies?.hasAuthCookie ? 'YES' : 'NO'}{'\n'}
            Has Code: {debugInfo.hasCode ? 'YES' : 'NO'}{'\n'}
            Has State: {debugInfo.hasState ? 'YES' : 'NO'}{'\n'}
            Retry: {retryCount}/{maxRetries}
          </Text>
        </View>
      )}
    </View>
  );
}