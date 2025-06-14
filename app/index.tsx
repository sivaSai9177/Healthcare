import { useAuth } from "@/hooks/useAuth";
import { View, ActivityIndicator } from "react-native";
import React from "react";
import { useTheme } from '@/lib/theme/provider';
import { Redirect } from "expo-router";

export default function Index() {
  const theme = useTheme();
  const { user, isLoading, hasHydrated } = useAuth();
  
  // Show loading screen while auth state is loading
  if (!hasHydrated || isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center", 
        backgroundColor: theme.background 
      }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  // Check if email verification is required
  const requiresEmailVerification = process.env.EXPO_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true';
  
  // If not authenticated, go to login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }
  
  // Check email verification if required
  if (requiresEmailVerification && !user.emailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }
  
  // Check profile completion
  if (user.needsProfileCompletion || user.role === 'guest') {
    return <Redirect href="/(auth)/complete-profile" />;
  }
  
  // Route to appropriate dashboard based on role (check organizationRole first, then role)
  const effectiveRole = user.organizationRole || user.role;
  
  const isHealthcareRole = ['doctor', 'nurse', 'head_doctor'].includes(effectiveRole);
    
  if (isHealthcareRole) {
    return <Redirect href="/(healthcare)/dashboard" />;
  }
  
  if (effectiveRole === 'operator') {
    return <Redirect href="/(home)/operator-dashboard" />;
  }
  
  if (user.role === 'admin') {
    return <Redirect href="/(home)/admin" />;
  }
  
  if (user.role === 'manager') {
    return <Redirect href="/(home)/manager" />;
  }
  
  // Default redirect for regular users
  return <Redirect href="/(home)" />;
}