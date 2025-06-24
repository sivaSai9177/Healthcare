import React from 'react';
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="audit"
        options={{
          title: 'Audit',
        }}
      />
      <Stack.Screen
        name="organizations"
        options={{
          title: 'Organizations',
        }}
      />
      <Stack.Screen
        name="system"
        options={{
          title: 'System',
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'Users',
        }}
      />
    </Stack>
  );
}