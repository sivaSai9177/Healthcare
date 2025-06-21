import React from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import { ActivityLogsBlock } from '@/components/blocks/healthcare/ActivityLogsBlock';
import { useHealthcareAccess } from '@/hooks/usePermissions';
import { ErrorDisplay } from '@/components/universal/feedback';
import { useHealthcareUser } from '@/hooks/healthcare/useHealthcareUser';

export default function ActivityLogsScreen() {
  const { canViewAuditLogs } = useHealthcareAccess();
  const { user, isValid, error } = useHealthcareUser();

  // Handle users without healthcare context
  if (!isValid) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Stack.Screen
          options={{
            title: 'Activity Logs',
            headerShown: true,
          }}
        />
        <ErrorDisplay
          title="Hospital Assignment Required"
          message={error === 'no-hospital' 
            ? "Healthcare features require hospital assignment. Please complete your profile to select a hospital." 
            : "Please complete your healthcare profile to access this feature."}
          variant="info"
          action={{
            label: "Complete Your Profile",
            onPress: () => router.push('/auth/complete-profile')
          }}
        />
      </View>
    );
  }

  if (!canViewAuditLogs) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Stack.Screen
          options={{
            title: 'Activity Logs',
            headerShown: true,
          }}
        />
        <ErrorDisplay
          title="Access Denied"
          message="You don't have permission to view activity logs."
          variant="warning"
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Activity Logs',
          headerShown: true,
        }}
      />
      <View style={{ flex: 1, padding: 16 }}>
        <ActivityLogsBlock 
          hospitalId={user?.defaultHospitalId}
        />
      </View>
    </>
  );
}