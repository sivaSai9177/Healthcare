import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { ActivityIndicator, View, Platform } from "react-native";
import { useEffect, useState } from "react";

export default function Index() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [isWebReady, setIsWebReady] = useState(Platform.OS !== 'web');

  console.log("[INDEX] Auth state:", {
    isLoading,
    isAuthenticated,
    hasUser: !!user,
    userEmail: user?.email,
    platform: Platform.OS,
    isWebReady
  });

  // Web-specific initialization
  useEffect(() => {
    if (Platform.OS === 'web' && !isWebReady) {
      // Add a short delay for web platform to ensure proper initialization
      const timer = setTimeout(() => {
        console.log("[INDEX] Web platform ready");
        setIsWebReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isWebReady]);

  // Show loading while auth is loading or web is not ready
  if (isLoading || !isWebReady) {
    console.log("[INDEX] Showing loading - isLoading:", isLoading, "isWebReady:", isWebReady);
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