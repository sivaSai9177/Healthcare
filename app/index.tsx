import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { ActivityIndicator, View } from "react-native";
import React from "react";
import { log } from "@/lib/core/logger";

export default function Index() {
  const { user, isLoading, isAuthenticated, hasHydrated } = useAuth();

  // Show loading while hydrating or checking auth
  if (!hasHydrated || isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center",
        backgroundColor: "#ffffff"
      }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated && user) {
    // Check if user needs to complete their profile (either flag is set OR role is guest)
    if (user.needsProfileCompletion || user.role === 'guest') {
      log.auth.debug("User needs profile completion", {
        needsProfileCompletion: user.needsProfileCompletion,
        role: user.role
      });
      return <Redirect href="/(auth)/complete-profile" />;
    }
    
    log.auth.debug("User authenticated, redirecting to home", { role: user.role });
    return <Redirect href="/(home)" />;
  }
  
  log.auth.debug("User not authenticated, redirecting to login");
  return <Redirect href="/(auth)/login" />;
}