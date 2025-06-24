import React from 'react';
import { Stack } from 'expo-router';

export default function OrganizationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Organization Dashboard',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Organization Settings',
        }}
      />
    </Stack>
  );
}