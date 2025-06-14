import { Stack, Redirect } from 'expo-router';
import { cn } from '@/lib/core/utils';
import { stackScreenOptions } from '@/lib/navigation/transitions';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function HealthcareLayout() {
  const { user, isAuthenticated, hasHydrated } = useAuth();

  // Wait for auth state to be loaded
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Check authentication
  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Check if user has healthcare role
  const effectiveRole = user.organizationRole || user.role;
  const isHealthcareRole = ['doctor', 'nurse', 'head_doctor', 'operator', 'admin'].includes(effectiveRole);
  
  if (!isHealthcareRole) {
    // Redirect non-healthcare users to home
    return <Redirect href="/(home)" />;
  }

  return (
    <Stack
      screenOptions={{
        ...stackScreenOptions.default,
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#000000',
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Healthcare Dashboard',
          headerLargeTitleStyle: {
            color: '#000000',
          },
        }}
      />
      <Stack.Screen
        name="alerts"
        options={{
          title: 'Alert Management',
          headerLargeTitleStyle: {
            color: '#000000',
          },
        }}
      />
      <Stack.Screen
        name="patients"
        options={{
          title: 'Patients',
          headerLargeTitleStyle: {
            color: '#000000',
          },
        }}
      />
      <Stack.Screen
        name="activity-logs"
        options={{
          title: 'Activity Logs',
          headerLargeTitleStyle: {
            color: '#000000',
          },
        }}
      />
      <Stack.Screen
        name="alert-history"
        options={{
          title: 'Alert History',
          headerLargeTitleStyle: {
            color: '#000000',
          },
        }}
      />
      <Stack.Screen
        name="escalation-queue"
        options={{
          title: 'Escalation Queue',
          headerLargeTitleStyle: {
            color: '#000000',
          },
        }}
      />
      <Stack.Screen
        name="response-analytics"
        options={{
          title: 'Response Analytics',
          headerLargeTitleStyle: {
            color: '#000000',
          },
        }}
      />
      <Stack.Screen
        name="shift-handover"
        options={{
          title: 'Shift Handover',
          headerLargeTitleStyle: {
            color: '#000000',
          },
        }}
      />
    </Stack>
  );
}