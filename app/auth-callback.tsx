import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/trpc';
import { log } from '@/lib/core/logger';
import { toAppUser } from '@/lib/stores/auth-store';

export default function AuthCallback() {
  const router = useRouter();
  const { updateAuth, isAuthenticated, user } = useAuth();
  
  // Use tRPC to get session with enhanced error handling
  const { data: sessionData, isLoading, error } = api.auth.getSession.useQuery(undefined, {
    refetchInterval: false,
    retry: 1,
    onError: (error) => {
      log.auth.error('Session fetch error in auth callback', error);
    },
  });

  useEffect(() => {
    log.auth.oauth('Processing OAuth callback', { 
      provider: 'google',
      hasSessionData: !!sessionData,
      isLoading,
      hasError: !!error,
      localAuthState: { isAuthenticated, hasUser: !!user },
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A'
    });
    
    // If we already have auth state, check if we can proceed
    if (isAuthenticated && user && !isLoading) {
      log.auth.oauth('User already authenticated in auth store', {
        userId: user.id,
        userRole: user.role,
        needsProfileCompletion: user.needsProfileCompletion
      });
      
      // Navigate based on existing user state
      if (user.needsProfileCompletion) {
        log.info('Navigating to profile completion (from auth store)', 'AUTH_CALLBACK');
        router.push('/(auth)/complete-profile');
      } else {
        log.info('Navigating to home (from auth store)', 'AUTH_CALLBACK');
        router.push('/(home)');
      }
      return;
    }
    
    if (sessionData?.user && sessionData?.session) {
      log.auth.oauth('Session data received from tRPC', { 
        userId: sessionData.user.id,
        email: sessionData.user.email,
        needsProfileCompletion: sessionData.user.needsProfileCompletion 
      });
      
      // Update auth store with session data (convert to AppUser)
      const appUser = toAppUser(sessionData.user);
      updateAuth(appUser, sessionData.session as any);
      
      // Navigate based on profile completion and role using Expo Router
      if (sessionData.user.needsProfileCompletion) {
        log.info('Navigating to profile completion (from tRPC)', 'AUTH_CALLBACK');
        router.push('/(auth)/complete-profile');
      } else {
        log.info('Navigating to home (from tRPC)', 'AUTH_CALLBACK');
        router.push('/(home)');
      }
    } else if (!isLoading && (!sessionData || error)) {
      log.auth.warn('No session found or error occurred', { 
        hasError: !!error,
        errorMessage: error?.message,
        recommendation: 'User needs to complete authentication flow'
      });
      
      // Redirect to login using Expo Router
      log.info('Redirecting to login - no valid session', 'AUTH_CALLBACK');
      router.push('/(auth)/login');
    }
  }, [sessionData, isLoading, error, updateAuth, router, isAuthenticated, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 20 }}>Processing login...</Text>
    </View>
  );
}