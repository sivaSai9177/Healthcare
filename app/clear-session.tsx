import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api/trpc';
import { authClient } from '@/lib/auth/auth-client';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function ClearSession() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const utils = api.useUtils();
  
  const handleClearSession = async () => {
    try {
      // Clear auth store
      clearAuth();
      
      // Clear Better Auth session
      await authClient.signOut();
      
      // Clear tRPC cache
      utils.invalidate();
      
      // Clear cookies if on web
      if (typeof document !== 'undefined') {
        document.cookie.split(";").forEach(c => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      alert('Session cleared successfully!');
      
      // Redirect to login
      router.replace('/auth/login' as any);
    } catch (error) {
      console.error('Error clearing session:', error);
      alert('Error clearing session');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clear Session</Text>
      <Text style={styles.description}>
        This will clear your current session and all auth data.
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={handleClearSession}>
        <Text style={styles.buttonText}>Clear Session & Logout</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton] as any} 
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});