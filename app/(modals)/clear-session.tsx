import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/universal';
import { useAuthStore } from '@/lib/stores/auth-store';
import { signOut } from '@/lib/auth/signout-manager';

export default function ClearSessionScreen() {
  const router = useRouter();
  const [cleared, setCleared] = React.useState(false);

  const handleClearSession = async () => {
    try {
      // Use comprehensive signout manager with full cleanup
      await signOut({
        reason: 'user_initiated',
        showAlert: false,
        redirectTo: undefined, // We'll handle redirect ourselves
        clearAllData: true // Clear all app data for fresh start
      });
      
      setCleared(true);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1500);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-4">
      <Text className="text-2xl font-bold mb-4">Clear Session</Text>
      
      {!cleared ? (
        <>
          <Text className="text-center mb-6 text-muted-foreground">
            This will clear all old session cookies and sign you out.
            You'll need to sign in again with a fresh session.
          </Text>
          
          <Button onPress={handleClearSession} className="mb-4">
            Clear Session & Sign Out
          </Button>
          
          <Button variant="outline" onPress={() => router.back()}>
            Cancel
          </Button>
        </>
      ) : (
        <Text className="text-center text-green-600">
          Session cleared! Redirecting to login...
        </Text>
      )}
    </View>
  );
}