import React, { useState } from 'react';
import { View, Platform, Alert } from 'react-native';
import { Text } from '@/components/universal/typography/Text';
import { Button } from '@/components/universal/interaction/Button';
import { Card } from '@/components/universal/display/Card';
import { Badge } from '@/components/universal/display/Badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { api } from '@/lib/api/trpc';
import { Bell, BellOff, Smartphone, Check } from '@/components/universal/display/Symbols';
import { useTheme } from '@/lib/theme/provider';

export function PushNotificationSettings() {
  const theme = useTheme();
  const {
    expoPushToken,
    permissionStatus,
    isRegistering,
    error,
    registerForPushNotifications,
    unregisterForPushNotifications,
    isSupported,
  } = usePushNotifications();

  const { data: pushTokens, refetch } = api.user.getPushTokens.useQuery();
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  const handleEnableNotifications = async () => {
    if (!isSupported) {
      Alert.alert(
        'Not Supported',
        'Push notifications are only supported on physical devices.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await registerForPushNotifications();
      await refetch();
    } catch (err) {
      Alert.alert(
        'Error',
        'Failed to enable push notifications. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDisableNotifications = async () => {
    Alert.alert(
      'Disable Notifications',
      'Are you sure you want to disable push notifications? You will not receive alerts on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await unregisterForPushNotifications();
              await refetch();
            } catch (err) {
              Alert.alert(
                'Error',
                'Failed to disable push notifications. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    if (!expoPushToken) {
      Alert.alert('Error', 'No push token available. Please enable notifications first.');
      return;
    }

    setIsTestingNotification(true);
    try {
      // This would trigger a test notification from the server
      // For now, we'll use the local notification service
      const { notificationService } = await import('@/lib/ui/notifications/service');
      await notificationService.showTestNotification();
    } catch (err) {
      Alert.alert('Error', 'Failed to send test notification.');
    } finally {
      setIsTestingNotification(false);
    }
  };

  const isEnabled = permissionStatus === 'granted' && expoPushToken !== null;

  return (
    <Card className="p-6">
      <View className="space-y-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center space-x-3">
            {isEnabled ? (
              <Bell size={24} color={theme.primary} />
            ) : (
              <BellOff size={24} color={theme.foreground} />
            )}
            <Text variant="h3">Push Notifications</Text>
          </View>
          <Badge variant={isEnabled ? 'success' : 'secondary'}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </View>

        {/* Description */}
        <Text variant="body" className="text-muted-foreground">
          Receive instant alerts about new healthcare incidents, escalations, and important updates.
        </Text>

        {/* Platform Support */}
        {!isSupported && (
          <View className="bg-warning/10 rounded-lg p-3">
            <Text variant="caption" className="text-warning">
              Push notifications are only available on physical devices (iOS/Android).
            </Text>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View className="bg-destructive/10 rounded-lg p-3">
            <Text variant="caption" className="text-destructive">
              {error}
            </Text>
          </View>
        )}

        {/* Active Devices */}
        {pushTokens && pushTokens.activeCount > 0 && (
          <View className="space-y-2">
            <Text variant="label" className="text-muted-foreground">
              Active Devices
            </Text>
            {pushTokens.tokens
              .filter(token => token.active)
              .map((token) => (
                <View
                  key={token.id}
                  className="flex-row items-center justify-between bg-muted/50 rounded-lg p-3"
                >
                  <View className="flex-row items-center space-x-2">
                    <Smartphone size={16} color={theme.mutedForeground} />
                    <View>
                      <Text variant="caption">
                        {token.deviceName || 'Unknown Device'}
                      </Text>
                      <Text variant="caption" className="text-muted-foreground">
                        {token.platform} • Last active:{' '}
                        {token.lastUsedAt
                          ? new Date(token.lastUsedAt).toLocaleDateString()
                          : 'Never'}
                      </Text>
                    </View>
                  </View>
                  <Check size={16} color={theme.success} />
                </View>
              ))}
          </View>
        )}

        {/* Actions */}
        <View className="space-y-3 pt-2">
          {!isEnabled ? (
            <Button
              onPress={handleEnableNotifications}
              loading={isRegistering}
              disabled={!isSupported}
              className="w-full"
            >
              Enable Push Notifications
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onPress={handleTestNotification}
                loading={isTestingNotification}
                className="w-full"
              >
                Send Test Notification
              </Button>
              <Button
                variant="outline"
                onPress={handleDisableNotifications}
                className="w-full"
              >
                Disable Notifications
              </Button>
            </>
          )}
        </View>

        {/* Info */}
        <Text variant="caption" className="text-muted-foreground text-center mt-2">
          {Platform.OS === 'ios'
            ? 'You can manage notification settings in iOS Settings > Notifications'
            : Platform.OS === 'android'
            ? 'You can manage notification settings in Android Settings > Apps'
            : 'Notification preferences can be managed in your device settings'}
        </Text>
      </View>
    </Card>
  );
}