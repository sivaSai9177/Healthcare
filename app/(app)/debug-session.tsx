import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Text, VStack, Button, Card } from '@/components/universal';
import { api } from '@/lib/api/trpc';
import { useAuth } from '@/hooks/useAuth';

export default function DebugSessionScreen() {
  const { user, updateAuth } = useAuth();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const utils = api.useUtils();
  
  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const data = await api.auth.debugUserData.useUtils().fetch();
      setDebugData(data);
    } catch (err: any) {
      console.error('Failed to fetch debug data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshAndUpdate = async () => {
    setLoading(true);
    try {
      // Invalidate and refetch session
      await utils.auth.getSession.invalidate();
      const freshSession = await utils.auth.getSession.fetch();
      
      if (freshSession?.user && freshSession?.session) {
        console.log('Updating auth with fresh data:', freshSession);
        updateAuth(freshSession.user, freshSession.session);
      }
      
      // Then fetch debug data
      const data = await api.auth.debugUserData.useUtils().fetch();
      setDebugData(data);
    } catch (err: any) {
      console.error('Failed to refresh:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Debug Session',
          headerShown: true,
        }}
      />
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <VStack gap={4}>
          <Card>
            <VStack gap={3}>
              <Text size="lg" weight="semibold">Current Auth Store</Text>
              <View style={{ backgroundColor: '#f5f5f5', padding: 8, borderRadius: 8 }}>
                <Text size="xs">ID: {user?.id}</Text>
                <Text size="xs">Email: {user?.email}</Text>
                <Text size="xs">Role: {user?.role}</Text>
                <Text size="xs">Org ID: {user?.organizationId || 'MISSING'}</Text>
                <Text size="xs">Org Name: {user?.organizationName || 'MISSING'}</Text>
                <Text size="xs">Hospital ID: {user?.defaultHospitalId || 'MISSING'}</Text>
              </View>
            </VStack>
          </Card>
          
          <Card>
            <VStack gap={3}>
              <Text size="lg" weight="semibold">Actions</Text>
              <VStack gap={2}>
                <Button onPress={fetchDebugData} disabled={loading} fullWidth>
                  Fetch Debug Data
                </Button>
                <Button onPress={refreshAndUpdate} disabled={loading} variant="outline" fullWidth>
                  Force Refresh & Update Auth
                </Button>
              </VStack>
            </VStack>
          </Card>
          
          {debugData && (
            <Card>
              <VStack gap={3}>
                <Text size="lg" weight="semibold">Debug Data</Text>
                <ScrollView horizontal>
                  <View style={{ backgroundColor: '#f5f5f5', padding: 8, borderRadius: 8 }}>
                    <Text size="xs" style={{ fontFamily: 'monospace' }}>
                      {JSON.stringify(debugData, null, 2)}
                    </Text>
                  </View>
                </ScrollView>
              </VStack>
            </Card>
          )}
        </VStack>
      </ScrollView>
    </>
  );
}