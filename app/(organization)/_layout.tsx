import { Stack } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Platform } from 'react-native';
import { stackScreenOptions } from '@/lib/navigation/transitions';

export default function OrganizationLayout() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  return (
    <Stack
      screenOptions={{
        ...stackScreenOptions.default,
        headerShown: true,
        headerStyle: {
          backgroundColor,
          ...(Platform.OS === 'web' && {
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
          }),
        },
        headerTintColor: textColor,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: Platform.OS !== 'web',
        contentStyle: {
          backgroundColor,
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