// Suppress common Expo Go warnings - MUST be first import
import "@/lib/core/platform/suppress-warnings";
// Import crypto polyfill early for React Native
import "@/lib/core/crypto";
// Initialize router debugging
import "@/lib/core/debug/router-debug";

import { useFonts } from "expo-font";
import { Stack , useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { stackScreenOptions } from "@/lib/navigation/transitions";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EnhancedDebugPanel } from "@/components/EnhancedDebugPanel";
import { SyncProvider } from "@/components/SyncProvider";
import { ColorSchemeProvider } from "@/contexts/ColorSchemeContext";
// SpacingProvider removed - now using Zustand store
import { EnhancedThemeProvider } from "@/lib/theme/provider";
import { TRPCProvider } from "@/lib/api/trpc";
import { initializeSecureStorage } from "@/lib/core/platform/secure-storage";
import { useAuth } from "@/hooks/useAuth";
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
    console.debug('[Reanimated] Failed to load on native platform');
  }
}

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Debug component to track mount/unmount (disabled to reduce console noise)
const LayoutDebugger = () => {
  return null;
};

// Navigation Guard Component
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, hasHydrated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!hasHydrated || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = ['(home)', '(healthcare)', '(organization)', '(admin)', '(manager)', '(modals)'].includes(segments[0]);
    
    // If not authenticated and trying to access protected routes
    if (!user && inProtectedGroup) {
      // Redirect to login
      router.replace('/(auth)/login');
    } 
    // If authenticated and trying to access auth routes (except complete-profile)
    else if (user && inAuthGroup && segments[1] !== 'complete-profile') {
      // Check if user needs to complete profile or has no role/guest role
      if (user.needsProfileCompletion || !user.role || user.role === 'guest') {
        router.replace('/(auth)/complete-profile');
      } else {
        // Redirect to appropriate dashboard based on role
        const userRole = user.role || 'user'; // Fallback to 'user' if role is somehow null
        switch (userRole) {
          case 'admin':
            router.replace('/(home)/admin');
            break;
          case 'manager':
            router.replace('/(home)/manager');
            break;
          case 'user':
            if (user.organizationRole === 'operator') {
              router.replace('/(home)/operator-dashboard');
            } else if (user.organizationRole === 'doctor' || user.organizationRole === 'nurse') {
              router.replace('/(healthcare)/dashboard');
            } else {
              router.replace('/(home)');
            }
            break;
          default:
            router.replace('/(home)');
        }
      }
    }
    
    setIsReady(true);
  }, [user, isLoading, hasHydrated, segments, router]);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
// TODO: Replace with structured logging - console.log('[RootLayout] Rendering, Platform:', Platform.OS);
// TODO: Replace with structured logging - console.log('[RootLayout] Current time:', new Date().toISOString());
  
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [storageReady, setStorageReady] = useState(Platform.OS === 'web');
  
// TODO: Replace with structured logging - console.log('[RootLayout] Font loaded:', loaded, 'Storage ready:', storageReady);

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
    <SafeAreaProvider style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <ErrorBoundary>
        <ColorSchemeProvider>
          <TRPCProvider>
            <SyncProvider>
              <EnhancedThemeProvider>
                <NavigationGuard>
                  <Stack 
                        screenOptions={{
                          ...stackScreenOptions.default,
                          headerShown: false,
                        }}
                      >
                        {/* Entry point */}
                        <Stack.Screen name="index" options={{ animation: 'fade' }} />
                        
                        {/* Public routes - always accessible */}
                        <Stack.Screen name="(auth)" options={stackScreenOptions.default} />
                        <Stack.Screen 
                          name="auth-callback" 
                          options={{ animation: 'fade' }}
                        />
                        
                        {/* Protected routes - require authentication */}
                        <Stack.Screen name="(home)" options={stackScreenOptions.default} />
                        <Stack.Screen name="(healthcare)" options={stackScreenOptions.default} />
                        <Stack.Screen name="(organization)" options={stackScreenOptions.default} />
                        <Stack.Screen name="(admin)" options={stackScreenOptions.default} />
                        <Stack.Screen name="(manager)" options={stackScreenOptions.default} />
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
                </NavigationGuard>
                <StatusBar style="auto" />
                <EnhancedDebugPanel />
                <LayoutDebugger />
              </EnhancedThemeProvider>
              </SyncProvider>
            </TRPCProvider>
        </ColorSchemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
