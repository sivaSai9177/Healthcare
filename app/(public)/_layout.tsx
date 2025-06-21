import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { AuthScreenWrapper } from '@/components/blocks/auth/AuthScreenWrapper';
import { logger } from '@/lib/core/debug/unified-logger';
import { useEffect, useRef } from 'react';

export default function PublicLayout() {
  const { isAuthenticated, hasHydrated, user } = useAuth();
  const theme = useTheme();
  const hasLoggedRef = useRef(false);

  // Only log significant state changes to prevent render loops
  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.id && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      logger.router.navigate('(public)/_layout', '/home', { 
        reason: 'already authenticated',
        userId: user.id 
      });
    }
  }, [hasHydrated, isAuthenticated, user?.id]); // Use specific properties instead of entire object

  // Show loading while checking auth state
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Redirect authenticated users to app routes ONLY if profile is complete
  if (isAuthenticated && user && !user.needsProfileCompletion) {
    return <Redirect href="/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="auth" />
    </Stack>
  );
}