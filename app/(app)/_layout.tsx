import React, { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { RefreshingBar } from '@/components/universal/feedback';
import { logger } from '@/lib/core/debug/unified-logger';
import { useUserAccess } from '@/hooks/usePermissions';
import { AnimatedStack } from '@/components/navigation/AnimatedStack';

export default function AppLayout() {
  const { isAuthenticated, hasHydrated, user } = useAuth();
  const theme = useTheme();
  const { isLoading: permissionsLoading } = useUserAccess();

  useEffect(() => {
    // Log navigation decisions after render
    if (!hasHydrated || permissionsLoading) return;
    
    if (!isAuthenticated) {
      logger.router.navigate('(app)/_layout', '/login', { 
        reason: 'not authenticated',
        hasUser: !!user 
      });
    }
  }, [hasHydrated, isAuthenticated, user, permissionsLoading]);

  // Show loading while checking auth state and permissions
  if (!hasHydrated || permissionsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  // Check if user needs profile completion
  if (user?.needsProfileCompletion || user?.role === 'user' || !user?.role || user?.role === 'guest') {
    return <Redirect href="/auth/complete-profile" />;
  }

  return (
    <>
      <RefreshingBar />
      <AnimatedStack transitionType="glass">
        <Stack.Screen 
          name="(tabs)" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="patients/[id]"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="alerts/[id]"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="shifts/handover"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </AnimatedStack>
    </>
  );
}