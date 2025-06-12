import { Stack } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { stackScreenOptions } from '@/lib/navigation/transitions';

export default function HealthcareLayout() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <Stack
      screenOptions={{
        ...stackScreenOptions.default,
        headerShown: true,
        headerStyle: {
          backgroundColor,
        },
        headerTintColor: textColor,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor,
        },
      }}
    >
      <Stack.Screen
        name="alerts"
        options={{
          title: 'Alert Management',
          headerLargeTitleStyle: {
            color: textColor,
          },
        }}
      />
      <Stack.Screen
        name="patients"
        options={{
          title: 'Patients',
          headerLargeTitleStyle: {
            color: textColor,
          },
        }}
      />
      <Stack.Screen
        name="activity-logs"
        options={{
          title: 'Activity Logs',
          headerLargeTitleStyle: {
            color: textColor,
          },
        }}
      />
      <Stack.Screen
        name="alert-history"
        options={{
          title: 'Alert History',
          headerLargeTitleStyle: {
            color: textColor,
          },
        }}
      />
      <Stack.Screen
        name="escalation-queue"
        options={{
          title: 'Escalation Queue',
          headerLargeTitleStyle: {
            color: textColor,
          },
        }}
      />
      <Stack.Screen
        name="response-analytics"
        options={{
          title: 'Response Analytics',
          headerLargeTitleStyle: {
            color: textColor,
          },
        }}
      />
      <Stack.Screen
        name="shift-handover"
        options={{
          title: 'Shift Handover',
          headerLargeTitleStyle: {
            color: textColor,
          },
        }}
      />
    </Stack>
  );
}