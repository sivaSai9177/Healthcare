import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { ActivityIndicator, View } from "react-native";
import React from "react";

export default function Index() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Log only on significant changes
  React.useEffect(() => {
    console.log("[INDEX] Auth state changed:", {
      isLoading,
      isAuthenticated,
      userEmail: user?.email
    });
  }, [isLoading, isAuthenticated, user?.email]);

  // Show loading while Better Auth checks session
  if (isLoading) {
    console.log("[INDEX] Showing loading - isLoading:", isLoading);
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated && user) {
    console.log("[INDEX] User authenticated, redirecting to home");
    return <Redirect href="/(home)" />;
  }
  
  console.log("[INDEX] User not authenticated, redirecting to login");
  return <Redirect href="/(auth)/login" />;
}