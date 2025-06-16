// Suppress common Expo Go warnings - MUST be first import
// Temporarily disabled to fix Hermes errors
// import "@/lib/core/platform/suppress-warnings";
// Import crypto polyfill early for React Native
import "@/lib/core/crypto";
// Setup window debugger for browser console access
import "@/lib/core/debug/setup-window-logger";
// Import router debugging (will initialize after navigation is ready)
// import { initializeRouterDebugger } from "@/lib/core/debug/router-debug";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { stackScreenOptions } from "@/lib/navigation/transitions";
import { AnimationProvider } from "@/lib/ui/animations/AnimationContext";
import { logger } from '@/lib/core/debug/unified-logger';
import { useThemeStore } from '@/lib/stores/theme-store';

import { ErrorBoundary } from "@/components/providers/ErrorBoundary";
import { ConsolidatedDebugPanel } from "@/components/blocks/debug/DebugPanel/DebugPanel";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeStyleInjector } from "@/components/providers/ThemeStyleInjector";
import { ThemeSync } from "@/components/providers/ThemeSync";
// SpacingProvider removed - now using Zustand store
import { EnhancedThemeProvider } from "@/lib/theme/provider";
import { TRPCProvider } from "@/lib/api/trpc";
import { initializeSecureStorage } from "@/lib/core/secure-storage";
// AnimationProvider removed - animations are now handled by components directly

// Import CSS for web platform
import './global.css';

// Only import reanimated on native platforms
if (Platform.OS !== 'web') {
  try {
    // Dynamic import for native platforms only
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("react-native-reanimated");
  } catch {
    logger.debug('[Reanimated] Failed to load on native platform', 'SYSTEM');
  }
}

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Debug component to track mount/unmount (disabled to reduce console noise)
const LayoutDebugger = () => {
  return null;
};

// StatusBar component that responds to theme changes
const ThemedStatusBar = () => {
  const colorScheme = useThemeStore((state) => state.getEffectiveColorScheme());
  return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />;
};



export default function RootLayout() {
  logger.system.info('RootLayout rendering', {
    platform: Platform.OS,
    timestamp: new Date().toISOString()
  });
  
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [storageReady, setStorageReady] = useState(Platform.OS === 'web');
  
  logger.system.info('RootLayout state', { fontLoaded: loaded, storageReady });

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
      
      // Initialize router debugger after navigation is ready
      // Use a small delay to ensure navigation container is fully mounted
      // Temporarily disabled to fix navigation context error
      // TODO: Re-implement with proper navigation-aware initialization
      // if (__DEV__) {
      //   setTimeout(() => {
      //     initializeRouterDebugger();
      //   }, 100);
      // }
    }
  }, [loaded, storageReady]);

  // Wait for both fonts and storage to be ready
  if (!loaded || !storageReady) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <ErrorBoundary>
        <TRPCProvider>
          <SyncProvider>
            <SessionProvider>
              <EnhancedThemeProvider>
                <ThemeSync />
                <AnimationProvider>
                  <ThemeStyleInjector>
                    <Stack 
                    screenOptions={{
                      ...stackScreenOptions.default,
                      headerShown: false,
                    }}
                  >
                    {/* Entry point */}
                    <Stack.Screen 
                      name="index" 
                      options={{ 
                        animation: 'fade',
                        animationDuration: 300,
                      }} 
                    />
                    
                    {/* Public routes - always accessible */}
                    <Stack.Screen name="(auth)" options={stackScreenOptions.default} />
                    <Stack.Screen 
                      name="auth-callback" 
                      options={{ animation: 'fade' }}
                    />
                    
                    {/* Protected routes - require authentication */}
                    <Stack.Screen 
                      name="(home)" 
                      options={{
                        ...stackScreenOptions.default,
                        animation: Platform.OS === 'web' ? 'fade' : 'slide_from_right',
                        animationDuration: 300,
                      }} 
                    />
                    <Stack.Screen 
                      name="(healthcare)" 
                      options={{
                        ...stackScreenOptions.default,
                        animation: Platform.OS === 'web' ? 'fade' : 'slide_from_right',
                        animationDuration: 300,
                      }} 
                    />
                    <Stack.Screen 
                      name="(organization)" 
                      options={{
                        ...stackScreenOptions.default,
                        animation: Platform.OS === 'web' ? 'fade' : 'slide_from_right',
                        animationDuration: 300,
                      }} 
                    />
                    <Stack.Screen 
                      name="(admin)" 
                      options={{
                        ...stackScreenOptions.default,
                        animation: Platform.OS === 'web' ? 'fade' : 'slide_from_right',
                        animationDuration: 300,
                      }} 
                    />
                    <Stack.Screen 
                      name="(manager)" 
                      options={{
                        ...stackScreenOptions.default,
                        animation: Platform.OS === 'web' ? 'fade' : 'slide_from_right',
                        animationDuration: 300,
                      }} 
                    />
                    <Stack.Screen 
                      name="(modals)" 
                      options={stackScreenOptions.modal}
                    />
                    
                    {/* 404 handler */}
                    <Stack.Screen 
                      name="+not-found" 
                      options={{ 
                        animation: 'fade',
                        animationDuration: 200,
                      }} 
                    />
                  </Stack>
                  <ThemedStatusBar />
                  <ConsolidatedDebugPanel />
                  <LayoutDebugger />
                  </ThemeStyleInjector>
                </AnimationProvider>
              </EnhancedThemeProvider>
              </SessionProvider>
            </SyncProvider>
          </TRPCProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
