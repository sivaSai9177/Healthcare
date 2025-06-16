import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { AuthScreenWrapper } from '@/components/blocks/auth/AuthScreenWrapper';

export default function PublicLayout() {
  const { isAuthenticated, hasHydrated } = useAuth();
  const theme = useTheme();

  // Show loading while checking auth state
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Redirect to app if already authenticated
  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="auth" />
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}