import React from 'react';
import { Stack } from 'expo-router';

export default function AnalyticsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="response-analytics"
        options={{
          title: 'Response Analytics',
        }}
      />
    </Stack>
  );
}