import { Stack } from 'expo-router';
import { AuthScreenWrapper } from '@/components/blocks/auth/AuthScreenWrapper';

export default function AuthLayout() {
  return (
    <AuthScreenWrapper>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="verify-email" />
      </Stack>
    </AuthScreenWrapper>
  );
}