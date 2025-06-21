import { Stack } from 'expo-router';
import { HealthcareErrorBoundary } from '@/components/providers/GlobalErrorBoundary';

export default function AlertsLayout() {
  return (
    <HealthcareErrorBoundary>
      <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Alerts',
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Alert Details',
          presentation: 'modal',
        }} 
      />
    </Stack>
    </HealthcareErrorBoundary>
  );
}