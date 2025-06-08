import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";

// Only import reanimated on native platforms
if (Platform.OS !== 'web') {
  require("react-native-reanimated");
}

// Import crypto polyfill early for React Native
import "@/lib/core/crypto";
// Suppress common Expo Go warnings
import "@/lib/core/suppress-warnings";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EnhancedDebugPanel } from "@/components/EnhancedDebugPanel";
import { SyncProvider } from "@/components/SyncProvider";
import { ColorSchemeProvider } from "@/contexts/ColorSchemeContext";
import { SpacingProvider } from "@/contexts/SpacingContext";
import { EnhancedThemeProvider } from "@/lib/theme/enhanced-theme-provider";
import { TRPCProvider } from "@/lib/trpc";
import { initializeSecureStorage } from "@/lib/core/secure-storage";
import "./global.css";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Debug component to track mount/unmount (disabled to reduce console noise)
const LayoutDebugger = () => {
  return null;
};

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [storageReady, setStorageReady] = useState(Platform.OS === 'web');

  useEffect(() => {
    // Initialize storage on mobile
    if (Platform.OS !== 'web') {
      initializeSecureStorage().then(() => {
        setStorageReady(true);
      });
    }
  }, []);

  useEffect(() => {
    if (loaded && storageReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, storageReady]);

  // Wait for both fonts and storage to be ready
  if (!loaded || !storageReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ColorSchemeProvider>
          <SpacingProvider>
            <TRPCProvider>
              <SyncProvider>
                <EnhancedThemeProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    {/* Entry point */}
                    <Stack.Screen name="index" />
                    
                    {/* Public routes - always accessible */}
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="auth-callback" />
                    
                    {/* Protected routes - always render, guards in the layout */}
                    <Stack.Screen name="(home)" />
                    
                    {/* 404 handler */}
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="auto" />
                  <EnhancedDebugPanel />
                  <LayoutDebugger />
                </EnhancedThemeProvider>
              </SyncProvider>
            </TRPCProvider>
          </SpacingProvider>
        </ColorSchemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
