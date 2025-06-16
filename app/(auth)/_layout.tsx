import { Stack, Redirect, useRouter, usePathname } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Platform, View, ActivityIndicator, Text } from "react-native";
import { useTheme } from "@/lib/theme/provider";
import React from "react";
import { stackScreenOptions } from "@/lib/navigation/transitions";
import { logger } from '@/lib/core/debug/unified-logger';

export default function AuthLayout() {
  const { isAuthenticated, user, hasHydrated } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  
  // Move logging to useEffect to avoid state updates during render
  React.useEffect(() => {
    logger.debug('AuthLayout rendering', 'ROUTER');
    logger.auth.debug('Auth layout state', {
      isAuthenticated, 
      hasHydrated, 
      user: !!user,
      needsProfileCompletion: user?.needsProfileCompletion,
      role: user?.role,
      platform: Platform.OS
    });
  }, [isAuthenticated, hasHydrated, user]);
  
  // Wait for auth state to be ready
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.foreground} />
        <Text style={{ marginTop: 10, color: theme.foreground }}>Loading auth...</Text>
      </View>
    );
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && user) {
    // Don't redirect if user needs to complete profile or verify email
    const needsProfileCompletion = user.needsProfileCompletion || user.role === 'guest';
    const needsEmailVerification = process.env.EXPO_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true' && !user.emailVerified;
    
    // Allow access to specific auth pages if needed
    if (needsProfileCompletion && pathname === '/complete-profile') {
      // User needs profile completion, allow access
    } else if (needsEmailVerification && pathname === '/verify-email') {
      // User needs email verification, allow access
    } else if (!needsProfileCompletion && !needsEmailVerification) {
      // User is fully authenticated and doesn't need any auth pages
      return <Redirect href="/(home)" />;
    }
  }
  
  return (
    <View 
      style={{
        flex: 1,
        backgroundColor: theme.muted,
        ...(Platform.OS === 'web' ? { minHeight: '100vh' } as any : {})
      }}
    >
      <Stack
        screenOptions={{
          ...stackScreenOptions.default,
          headerShown: Platform.OS !== 'web',
          contentStyle: {
            backgroundColor: 'transparent',
          },
          headerStyle: {
            backgroundColor: theme.card,
          },
          headerTintColor: theme.foreground,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: true,
        }}
      >
        <Stack.Screen 
          name="login" 
          options={{
            title: 'Login',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen 
          name="register" 
          options={{
            title: 'Create Account',
            headerBackTitle: 'Login',
          }}
        />
        <Stack.Screen 
          name="forgot-password" 
          options={{
            ...stackScreenOptions.modal,
            title: 'Forgot Password',
            headerBackTitle: 'Login',
          }}
        />
        <Stack.Screen 
          name="complete-profile" 
          options={{
            title: 'Complete Profile',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen 
          name="verify-email" 
          options={{
            title: 'Verify Email',
            headerBackTitle: 'Login',
          }}
        />
      </Stack>
    </View>
  );
}