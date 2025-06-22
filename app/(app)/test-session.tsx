import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Text, VStack, HStack, Button, Card } from '@/components/universal';
import { api } from '@/lib/api/trpc';
import { useAuth } from '@/hooks/useAuth';

export default function TestSessionScreen() {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.auth.getSession.useUtils().fetch();
      setSessionData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch session');
    } finally {
      setLoading(false);
    }
  };
  
  const invalidateSession = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.auth.getSession.useUtils().invalidate();
      const data = await api.auth.getSession.useUtils().fetch();
      setSessionData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to invalidate session');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Test Session',
          headerShown: true,
        }}
      />
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <VStack gap={4}>
          <Card>
            <VStack gap={3}>
              <Text size="lg" weight="semibold">Current Auth Store User</Text>
              <View style={{ backgroundColor: '#f5f5f5', padding: 8, borderRadius: 8 }}>
                <Text size="xs" style={{ fontFamily: 'monospace' }}>
                  {JSON.stringify(user, null, 2)}
                </Text>
              </View>
            </VStack>
          </Card>
          
          <Card>
            <VStack gap={3}>
              <Text size="lg" weight="semibold">Session Actions</Text>
              <HStack gap={2}>
                <Button onPress={fetchSession} disabled={loading}>
                  Fetch Session
                </Button>
                <Button onPress={invalidateSession} disabled={loading} variant="outline">
                  Invalidate & Fetch
                </Button>
              </HStack>
            </VStack>
          </Card>
          
          {error && (
            <Card style={{ backgroundColor: '#fee' }}>
              <Text size="sm" style={{ color: '#c00' }}>Error: {error}</Text>
            </Card>
          )}
          
          {sessionData && (
            <Card>
              <VStack gap={3}>
                <Text size="lg" weight="semibold">Fresh Session Data</Text>
                <View style={{ backgroundColor: '#f5f5f5', padding: 8, borderRadius: 8 }}>
                  <Text size="xs" style={{ fontFamily: 'monospace' }}>
                    {JSON.stringify(sessionData, null, 2)}
                  </Text>
                </View>
              </VStack>
            </Card>
          )}
        </VStack>
      </ScrollView>
    </>
  );
}