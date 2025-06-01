import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AuthCallback() {
  const router = useRouter();
  const { isAuthenticated, user, refreshUser } = useAuth();

  useEffect(() => {
    console.log('[AUTH CALLBACK] Processing OAuth callback...');
    
    // Refresh the session to get the latest user data
    refreshUser();
    
    // Check authentication after a short delay
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        console.log('[AUTH CALLBACK] User authenticated, redirecting...');
        router.replace('/(home)');
      } else {
        console.log('[AUTH CALLBACK] Authentication failed, redirecting to login...');
        router.replace('/(auth)/login');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router, refreshUser]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 20 }}>Processing login...</Text>
    </View>
  );
}