import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';
import { stackScreenOptions } from '@/lib/navigation/transitions';

export default function ManagerLayout() {
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
        name="team" 
        options={{ 
          title: 'Team Overview',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="tasks" 
        options={{ 
          title: 'Task Management',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="reports" 
        options={{ 
          title: 'Reports',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}