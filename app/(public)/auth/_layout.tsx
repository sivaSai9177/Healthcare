import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { stackScreenOptions } from '@/lib/navigation/transitions';
import { AuthErrorBoundary } from '@/components/blocks/errors/AuthErrorBoundary';

export default function AuthLayout() {
  const theme = useTheme();
  
  return (
    <AuthErrorBoundary>
      <View 
        style={{
          flex: 1,
          backgroundColor: theme.muted,
          ...(Platform.OS === 'web' ? { minHeight: '100vh' } as any : {})
        }}
      >
        <Stack
        screenOptions={{
          ...stackScreenOptions.default,
          headerShown: false,
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="complete-profile" />
      </Stack>
    </View>
    </AuthErrorBoundary>
  );
}