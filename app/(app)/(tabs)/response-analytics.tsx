import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { ResponseAnalyticsDashboard } from '@/components/blocks/healthcare';
import { useHealthcareAccess } from '@/hooks/usePermissions';
import { ErrorDisplay } from '@/components/universal/feedback';
import { useHealthcareUser } from '@/hooks/healthcare/useHealthcareUser';

export default function ResponseAnalyticsScreen() {
  const { canViewAnalytics } = useHealthcareAccess();
  const { user } = useHealthcareUser();

  if (!canViewAnalytics) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <ErrorDisplay
          title="Access Denied"
          message="You don't have permission to view response analytics."
          variant="warning"
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Response Analytics',
          headerShown: true,
        }}
      />
      <View style={{ flex: 1 }}>
        <ResponseAnalyticsDashboard 
          hospitalId={user?.defaultHospitalId}
        />
      </View>
    </>
  );
}