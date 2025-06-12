import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Platform, View, ActivityIndicator, Text } from "react-native";
import { useTheme } from "@/lib/theme/provider";
import React from "react";
import { stackScreenOptions } from "@/lib/navigation/transitions";

export default function AuthLayout() {
  console.log('[AuthLayout] Component rendering');
  const { isAuthenticated, user, hasHydrated } = useAuth();
  const theme = useTheme();
  
  console.log('[AuthLayout] Auth state:', {
    isAuthenticated, 
    hasHydrated, 
    user: !!user,
    needsProfileCompletion: user?.needsProfileCompletion,
    role: user?.role,
    platform: Platform.OS
  });
  
  // Wait for auth state to be ready
  if (!hasHydrated) {
    console.log('[AuthLayout] Waiting for auth hydration...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.foreground} />
        <Text style={{ marginTop: 10, color: theme.foreground }}>Loading auth...</Text>
      </View>
    );
  }
  
  // Check authentication and email verification status
  if (isAuthenticated && user) {
    // If email not verified, redirect to verification
    if (!user.emailVerified && user.email) {
      return <Redirect href="/(auth)/verify-email" />;
    }
    
    // If profile needs completion, redirect there
    if (user.needsProfileCompletion) {
      return <Redirect href="/(auth)/complete-profile" />;
    }
    
    // If fully authenticated and verified, go to home
    if (user.role !== 'guest') {
      return <Redirect href="/(home)" />;
    }
  }
  
  console.log('[AuthLayout] Rendering auth stack');
  
  return (
    <View 
      style={{
        flex: 1,
        backgroundColor: 'theme.muted',
        ...(Platform.OS === 'web' ? { minHeight: '100vh' } as any : {})
      }}
    >
      <Stack
        screenOptions={{
          ...stackScreenOptions.default,
          headerShown: Platform.OS !== 'web',
          contentStyle: {
            backgroundColor: 'theme.background',
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
          name="register-simple" 
          options={{
            title: 'Simple Register',
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