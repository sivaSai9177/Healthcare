import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';
import { stackScreenOptions } from '@/lib/navigation/transitions';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function ManagerLayout() {
  const { colors } = useTheme();
  const { user, isAuthenticated, hasHydrated } = useAuth();

  // Wait for auth state to be loaded
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Note: Role-based access is handled at the root index.tsx level
  // This layout assumes the user has already been authorized to access manager routes

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