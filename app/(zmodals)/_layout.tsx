import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { stackScreenOptions } from '@/lib/navigation/transitions';

export default function ModalsLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        ...stackScreenOptions.modal,
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.foreground,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="create-alert"
        options={{
          title: 'Create Alert',
          headerLeft: () => null, // Prevent back button, use cancel instead
        }}
      />
      <Stack.Screen
        name="patient-details"
        options={{
          title: 'Patient Details',
        }}
      />
      <Stack.Screen
        name="member-details"
        options={{
          title: 'Member Details',
        }}
      />
      <Stack.Screen
        name="profile-edit"
        options={{
          title: 'Edit Profile',
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="notification-center"
        options={{
          title: 'Notifications',
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: 'Search',
          animation: 'fade', // Quick fade for search
          animationDuration: 200,
        }}
      />
      <Stack.Screen
        name="alert-details"
        options={{
          title: 'Alert Details',
        }}
      />
      <Stack.Screen
        name="acknowledge-alert"
        options={{
          title: 'Acknowledge Alert',
          headerLeft: () => null, // Prevent back, use cancel button
        }}
      />
      <Stack.Screen
        name="escalation-details"
        options={{
          title: 'Escalation Details',
        }}
      />
    </Stack>
  );
}