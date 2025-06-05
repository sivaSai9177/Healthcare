import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Box } from "@/components/universal";
import { Platform } from "react-native";

export default function AuthLayout() {
  const { isAuthenticated, user, hasHydrated } = useAuth();
  
  // Wait for auth state to be ready
  if (!hasHydrated) {
    return null;
  }
  
  // If authenticated and profile complete, redirect to home
  if (isAuthenticated && user && !user.needsProfileCompletion && user.role !== 'guest') {
    return <Redirect href="/(home)" />;
  }
  
  return (
    <Box 
      flex={1} 
      bgTheme="muted" 
      style={Platform.OS === 'web' ? { minHeight: '100vh' } as any : undefined}
    >
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
        <Stack.Screen name="complete-profile" />
      </Stack>
    </Box>
  );
}