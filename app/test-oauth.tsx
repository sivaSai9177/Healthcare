import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text as RNText, Pressable, ActivityIndicator } from 'react-native';
import { Button, Card, Text } from '@/components/universal';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';

export default function TestOAuth() {
  const router = useRouter();
  const { user, isAuthenticated, updateAuth, clearAuth } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch session via tRPC
  const { data: sessionData, refetch: refetchSession, isLoading: sessionLoading } = api.auth.getSession.useQuery();
  
  // Fetch debug info
  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/auth/debug-session');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Failed to fetch debug info:', error);
    }
  };
  
  useEffect(() => {
    fetchDebugInfo();
  }, []);
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Direct OAuth initiation
      window.location.href = '/api/auth/sign-in/provider/google?callbackURL=' + encodeURIComponent(window.location.origin + '/auth-callback?oauth=true&delay=1000');
    } catch (error) {
      console.error('OAuth error:', error);
      setIsLoading(false);
    }
  };
  
  const handleClearSession = async () => {
    await clearAuth();
    await refetchSession();
    await fetchDebugInfo();
  };
  
  const handleRefresh = async () => {
    await refetchSession();
    await fetchDebugInfo();
  };
  
  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Card className="mb-4">
        <View className="space-y-4">
          <Text className="text-2xl font-bold">OAuth Testing Page</Text>
          
          {/* Current Auth State */}
          <View className="p-4 bg-muted rounded-lg">
            <Text className="font-semibold mb-2">Current Auth State:</Text>
            <Text className="text-sm">Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
            {user && (
              <>
                <Text className="text-sm">User ID: {user.id}</Text>
                <Text className="text-sm">Email: {user.email}</Text>
                <Text className="text-sm">Role: {user.role}</Text>
                <Text className="text-sm">Needs Profile: {user.needsProfileCompletion ? 'Yes' : 'No'}</Text>
              </>
            )}
          </View>
          
          {/* tRPC Session Data */}
          <View className="p-4 bg-muted rounded-lg">
            <Text className="font-semibold mb-2">tRPC Session Data:</Text>
            {sessionLoading ? (
              <ActivityIndicator />
            ) : sessionData ? (
              <>
                <Text className="text-sm">Has Session: Yes</Text>
                <Text className="text-sm">User ID: {sessionData.user?.id}</Text>
                <Text className="text-sm">Role: {sessionData.user?.role}</Text>
                <Text className="text-sm">Needs Profile: {sessionData.user?.needsProfileCompletion ? 'Yes' : 'No'}</Text>
              </>
            ) : (
              <Text className="text-sm">No session data</Text>
            )}
          </View>
          
          {/* Debug Info */}
          {debugInfo && (
            <View className="p-4 bg-muted rounded-lg">
              <Text className="font-semibold mb-2">Debug Info:</Text>
              <RNText className="text-xs font-mono">
                {JSON.stringify(debugInfo, null, 2)}
              </RNText>
            </View>
          )}
          
          {/* Actions */}
          <View className="space-y-2">
            {!isAuthenticated ? (
              <Button
                onPress={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Redirecting...' : 'Sign in with Google'}
              </Button>
            ) : (
              <>
                <Button
                  onPress={() => router.push('/(auth)/complete-profile')}
                  className="w-full"
                >
                  Go to Complete Profile
                </Button>
                <Button
                  onPress={() => router.push('/(home)')}
                  variant="outline"
                  className="w-full"
                >
                  Go to Home
                </Button>
              </>
            )}
            
            <Button
              onPress={handleRefresh}
              variant="outline"
              className="w-full"
            >
              Refresh Session
            </Button>
            
            <Button
              onPress={handleClearSession}
              variant="destructive"
              className="w-full"
            >
              Clear Session
            </Button>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}