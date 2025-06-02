import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { createAuthLogger } from '@/lib/core/debug';
import { toAppUser } from '@/lib/stores/auth-store';

const authLogger = createAuthLogger();

export default function AuthCallback() {
  const router = useRouter();
  const { updateAuth } = useAuth();
  
  // Use tRPC to get session
  const { data: sessionData, isLoading } = trpc.auth.getSession.useQuery(undefined, {
    refetchInterval: false,
    retry: 1,
  });

  useEffect(() => {
    console.log('[AUTH CALLBACK] Processing OAuth callback...');
    authLogger.logOAuthCallback('google', !!sessionData?.user);
    
    if (sessionData?.user && sessionData?.session) {
      console.log('[AUTH CALLBACK] Session data received:', { 
        userId: sessionData.user.id,
        email: sessionData.user.email,
        needsProfileCompletion: sessionData.user.needsProfileCompletion 
      });
      
      // Update auth store with session data (convert to AppUser)
      const appUser = toAppUser(sessionData.user);
      updateAuth(appUser, sessionData.session as any);
      authLogger.logSessionUpdate(sessionData.user, sessionData.session);
      
      // Navigate based on profile completion
      if (sessionData.user.needsProfileCompletion) {
        authLogger.logNavigationDecision('/(auth)/complete-profile', 'User needs profile completion');
        router.replace('/(auth)/complete-profile');
      } else {
        authLogger.logNavigationDecision('/(home)', 'User profile complete');
        router.replace('/(home)');
      }
    } else if (!isLoading && !sessionData) {
      console.log('[AUTH CALLBACK] No session found, redirecting to login');
      authLogger.logNavigationDecision('/(auth)/login', 'No session found');
      
      // Wait a bit before redirecting to login
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1000);
    }
  }, [sessionData, isLoading, router, updateAuth]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 20 }}>Processing login...</Text>
    </View>
  );
}