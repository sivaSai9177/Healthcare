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

import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider } from "@/hooks/useAuth";
import { TRPCProvider } from "@/lib/trpc";
import "./global.css";

// Inner layout component that can use useAuth
function AppNavigator() {
  const colorScheme = useColorScheme();
  
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: Platform.OS === 'android' ? { paddingTop: 0 } : {},
        }}
      >
        {/* All screens must be declared for Expo Router to work */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(home)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" backgroundColor={colorScheme === "dark" ? "#12242e" : "#f6e6ee"} />
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
      <TRPCProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </TRPCProvider>
    </SafeAreaProvider>
  );
}
