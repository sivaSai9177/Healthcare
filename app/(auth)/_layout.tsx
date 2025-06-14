import { Stack, Redirect, useRouter, usePathname } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Platform, View, ActivityIndicator, Text } from "react-native";
import { useTheme } from "@/lib/theme/provider";
import React from "react";
import { stackScreenOptions } from "@/lib/navigation/transitions";

export default function AuthLayout() {
  // TODO: Replace with structured logging
  // console.log('[AuthLayout] Component rendering');
  const { isAuthenticated, user, hasHydrated } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  
// TODO: Replace with structured logging
  // console.log('[AuthLayout] Auth state:', {
  //   isAuthenticated, 
  //   hasHydrated, 
  //   user: !!user,
  //   needsProfileCompletion: user?.needsProfileCompletion,
  //   role: user?.role,
  //   platform: Platform.OS
  // });
  
  // Wait for auth state to be ready
  if (!hasHydrated) {
    // TODO: Replace with structured logging
    // console.log('[AuthLayout] Waiting for auth hydration...');
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
      // TODO: Replace with structured logging
      // console.log('[AuthLayout] User needs profile completion, allowing complete-profile access');
    } else if (needsEmailVerification && pathname === '/verify-email') {
      // TODO: Replace with structured logging
      // console.log('[AuthLayout] User needs email verification, allowing verify-email access');
    } else if (!needsProfileCompletion && !needsEmailVerification) {
      // User is fully authenticated and doesn't need any auth pages
      // TODO: Replace with structured logging
      // console.log('[AuthLayout] User is fully authenticated, redirecting to home');
      return <Redirect href="/(home)" />;
    }
  }
  
  // TODO: Replace with structured logging
  // console.log('[AuthLayout] Rendering auth stack');
  
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
            backgroundColor: theme.background,
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