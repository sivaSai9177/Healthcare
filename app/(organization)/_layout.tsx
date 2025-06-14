import { Stack, Redirect } from 'expo-router';
import { cn } from '@/lib/core/utils';
import { Platform, View, ActivityIndicator } from 'react-native';
import { stackScreenOptions } from '@/lib/navigation/transitions';
import { useAuth } from '@/hooks/useAuth';

export default function OrganizationLayout() {
  const { user, isAuthenticated, hasHydrated } = useAuth();

  // Wait for auth state to be loaded
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Note: Role-based access is handled at the root index.tsx level
  // This layout assumes the user has already been authorized to access organization routes

  return (
    <Stack
      screenOptions={{
        ...stackScreenOptions.default,
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
          ...(Platform.OS === 'web' && {
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }),
        },
        headerTintColor: '#000000',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: Platform.OS !== 'web',
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name="members"
        options={{
          title: 'Team Members',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="billing"
        options={{
          title: 'Billing & Subscription',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="email-settings"
        options={{
          title: 'Email & Invitations',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}