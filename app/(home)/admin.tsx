import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function AdminScreen() {
  const { user, hasHydrated, isAuthenticated } = useAuth();

  // Wait for hydration
  if (!hasHydrated) {
    return null;
  }

  // Check authentication and authorization
  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Check admin role
  if (user.role !== 'admin') {
    return <Redirect href="/(home)" />;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Admin Dashboard
      </ThemedText>
      <ThemedText style={styles.welcome}>
        Welcome, Administrator {user?.name}!
      </ThemedText>
      <ThemedText style={styles.description}>
        This is the admin dashboard where you can access admin-specific features like user management, system settings, and audit logs.
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