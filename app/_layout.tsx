import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, Platform } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import crypto polyfill early for React Native
import "@/lib/core/crypto";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { TRPCProvider } from "@/lib/trpc";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DebugPanel } from "@/components/DebugPanel";
import "./global.css";

// Inner layout component that uses pure Zustand
function AppNavigator() {
  const colorScheme = useColorScheme();
  const { hasHydrated } = useAuth();
  
  // Show loading screen while auth is being determined
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: Platform.OS === 'android' ? { paddingTop: 0 } : {},
        }}
      >
        {/* All routes - protection handled at screen level */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(home)" options={{ headerShown: false }} />
        <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" backgroundColor={colorScheme === "dark" ? "#12242e" : "#f6e6ee"} />
      <DebugPanel />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Show loading screen while fonts load
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <TRPCProvider>
          {/* No AuthProvider - using pure Zustand pattern */}
          <AppNavigator />
        </TRPCProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}