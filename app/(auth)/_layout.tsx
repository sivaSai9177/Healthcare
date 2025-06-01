import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "@/app/global.css";

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("[AUTH LAYOUT] Auth state changed:", {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email
    });
    
    if (!isLoading && isAuthenticated) {
      // User is authenticated, redirect to home
      console.log("Auth layout: User is authenticated, redirecting to home");
      router.replace("/(home)");
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    // Will redirect in useEffect, show loading in the meantime
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  console.log("Auth layout: User not authenticated, showing auth screens");

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "transparent",
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}