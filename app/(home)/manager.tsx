import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function ManagerScreen() {
  const { user, hasHydrated, isAuthenticated } = useAuth();

  // Wait for hydration
  if (!hasHydrated) {
    return null;
  }

  // Check authentication and authorization
  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Check manager or admin role
  if (user.role !== 'manager' && user.role !== 'admin') {
    return <Redirect href="/(home)" />;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Manager Dashboard
      </ThemedText>
      <ThemedText style={styles.welcome}>
        Welcome, {user?.name}!
      </ThemedText>
      <ThemedText style={styles.description}>
        This is the manager dashboard where you can access manager-specific features.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  welcome: {
    fontSize: 18,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});