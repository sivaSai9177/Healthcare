import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AuthCallback() {
  const router = useRouter();
  const { isAuthenticated, user, checkSession } = useAuth();

  useEffect(() => {
    console.log('[AUTH CALLBACK] Processing OAuth callback...');
    
    // Refresh the session to get the latest user data
    checkSession();
    
    // Check authentication after a short delay
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        // Check if user needs to complete profile
        if (user.needsProfileCompletion) {
          console.log('[AUTH CALLBACK] User needs to complete profile, redirecting...');
          router.replace('/(auth)/complete-profile');
        } else {
          console.log('[AUTH CALLBACK] User authenticated, redirecting to home...');
          router.replace('/(home)');
        }
      } else if (isAuthenticated) {
        // Authenticated but no user data yet, wait a bit more
        console.log('[AUTH CALLBACK] Waiting for user data...');
      } else {
        console.log('[AUTH CALLBACK] Authentication failed, redirecting to login...');
        router.replace('/(auth)/login');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router, checkSession]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 20 }}>Processing login...</Text>
    </View>
  );
}