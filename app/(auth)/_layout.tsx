import { Stack } from "expo-router";
import "@/app/global.css";

export default function AuthLayout() {
  // Simplified auth layout - protection is handled at root level
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
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}