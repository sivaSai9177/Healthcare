import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';
import { stackScreenOptions } from '@/lib/navigation/transitions';

export default function AdminLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        ...stackScreenOptions.default,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="users" 
        options={{ 
          title: 'User Management',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="system" 
        options={{ 
          title: 'System Settings',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="audit" 
        options={{ 
          title: 'Audit Logs',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}