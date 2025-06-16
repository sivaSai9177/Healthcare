import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from '@/components/universal/typography/Text';
import { Button } from '@/components/universal/interaction/Button';
import { Card } from '@/components/universal/display/Card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { api } from '@/lib/api/trpc';
import { Bell, Send, CheckCircle, XCircle } from '@/components/universal/display/Symbols';
import { useTheme } from '@/lib/theme/provider';

export default function TestPushNotificationsScreen() {
  const theme = useTheme();
  const {
    expoPushToken,
    permissionStatus,
    notification,
    isRegistering,
    error,
    registerForPushNotifications,
    unregisterForPushNotifications,
    isSupported,
  } = usePushNotifications();

  const [isSendingTest, setIsSendingTest] = useState(false);

  // Create a test alert mutation
  const createTestAlert = api.healthcare.createAlert.useMutation({
    onSuccess: () => {
      Alert.alert(
        'Success',
        'Test alert created! You should receive a push notification shortly.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to create test alert');
    },
  });

  const handleSendTestNotification = async () => {
    if (!expoPushToken) {
      Alert.alert('Error', 'Please enable push notifications first');
      return;
    }

    setIsSendingTest(true);
    try {
      // Create a test alert which will trigger push notifications
      await createTestAlert.mutateAsync({
        roomNumber: '999',
        alertType: 'Test Alert',
        urgencyLevel: 'medium',
        description: 'This is a test alert for push notifications',
        hospitalId: 'test-hospital', // This should be the actual hospital ID
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Test Push Notifications',
          presentation: 'modal',
        }}
      />
      
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 space-y-4">
          {/* Status Card */}
          <Card className="p-6">
            <View className="space-y-4">
              <View className="flex-row items-center space-x-2">
                <Bell size={24} color={theme.colors.primary} />
                <Text variant="h3">Push Notification Status</Text>
              </View>

              <View className="space-y-2">
                <View className="flex-row items-center justify-between">
                  <Text variant="label">Permission Status</Text>
                  <View className="flex-row items-center space-x-2">
                    {permissionStatus === 'granted' ? (
                      <CheckCircle size={16} color={theme.colors.success} />
                    ) : (
                      <XCircle size={16} color={theme.colors.destructive} />
                    )}
                    <Text variant="body" className={
                      permissionStatus === 'granted' ? 'text-success' : 'text-destructive'
                    }>
                      {permissionStatus}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text variant="label">Device Support</Text>
                  <View className="flex-row items-center space-x-2">
                    {isSupported ? (
                      <CheckCircle size={16} color={theme.colors.success} />
                    ) : (
                      <XCircle size={16} color={theme.colors.destructive} />
                    )}
                    <Text variant="body" className={
                      isSupported ? 'text-success' : 'text-destructive'
                    }>
                      {isSupported ? 'Supported' : 'Not Supported'}
                    </Text>
                  </View>
                </View>

                {expoPushToken && (
                  <View>
                    <Text variant="label">Push Token</Text>
                    <Text variant="caption" className="text-muted-foreground mt-1">
                      {expoPushToken.substring(0, 30)}...
                    </Text>
                  </View>
                )}
              </View>

              {error && (
                <View className="bg-destructive/10 rounded-lg p-3">
                  <Text variant="caption" className="text-destructive">
                    {error}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <View className="space-y-4">
              <Text variant="h4">Actions</Text>

              {!expoPushToken ? (
                <Button
                  onPress={registerForPushNotifications}
                  loading={isRegistering}
                  disabled={!isSupported}
                  className="w-full"
                >
                  Enable Push Notifications
                </Button>
              ) : (
                <View className="space-y-3">
                  <Button
                    onPress={handleSendTestNotification}
                    loading={isSendingTest || createTestAlert.isPending}
                    className="w-full"
                  >
                    <View className="flex-row items-center space-x-2">
                      <Send size={16} color="white" />
                      <Text className="text-white">Send Test Alert</Text>
                    </View>
                  </Button>

                  <Button
                    variant="outline"
                    onPress={unregisterForPushNotifications}
                    className="w-full"
                  >
                    Disable Push Notifications
                  </Button>
                </View>
              )}
            </View>
          </Card>

          {/* Recent Notification */}
          {notification && (
            <Card className="p-6">
              <View className="space-y-2">
                <Text variant="h4">Recent Notification</Text>
                <View className="bg-muted rounded-lg p-3">
                  <Text variant="label">
                    {notification.request.content.title || 'No title'}
                  </Text>
                  <Text variant="body" className="mt-1">
                    {notification.request.content.body || 'No body'}
                  </Text>
                  {notification.request.content.data && (
                    <Text variant="caption" className="text-muted-foreground mt-2">
                      Data: {JSON.stringify(notification.request.content.data, null, 2)}
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          )}

          {/* Instructions */}
          <Card className="p-6">
            <View className="space-y-2">
              <Text variant="h4">How to Test</Text>
              <View className="space-y-2">
                <Text variant="body">1. Enable push notifications</Text>
                <Text variant="body">2. Click "Send Test Alert"</Text>
                <Text variant="body">3. You should receive a push notification</Text>
                <Text variant="body">4. Tap the notification to see it handled</Text>
              </View>
              
              <Text variant="caption" className="text-muted-foreground mt-4">
                Note: Push notifications only work on physical devices, not in simulators or web browsers.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}