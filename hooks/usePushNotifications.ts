import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { notificationService } from '@/lib/ui/notifications/service';
import { api } from '@/lib/api/trpc';
import { useAuth } from './useAuth';
import { log } from '@/lib/core/debug/logger';
import { useRouter } from 'expo-router';

interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  permissionStatus: string;
  isRegistering: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<PushNotificationState>({
    expoPushToken: null,
    notification: null,
    permissionStatus: 'undetermined',
    isRegistering: false,
    error: null,
  });

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  const registerPushToken = api.user.registerPushToken.useMutation();
  const unregisterPushToken = api.user.unregisterPushToken.useMutation();

  // Register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return;
    }

    setState(prev => ({ ...prev, isRegistering: true, error: null }));

    try {
      // Request permissions
      const permissionResult = await notificationService.requestPermissions();
      
      setState(prev => ({ 
        ...prev, 
        permissionStatus: permissionResult.granted ? 'granted' : 'denied' 
      }));

      if (!permissionResult.granted) {
        setState(prev => ({ 
          ...prev, 
          error: 'Permission to receive notifications was denied',
          isRegistering: false 
        }));
        return;
      }

      // Get push token
      const token = await notificationService.getExpoPushToken();
      
      if (!token) {
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to get push token',
          isRegistering: false 
        }));
        return;
      }

      setState(prev => ({ ...prev, expoPushToken: token }));

      // Register token with backend
      await registerPushToken.mutateAsync({
        token,
        platform: Platform.OS as 'ios' | 'android' | 'web',
        deviceId: Device.osInternalBuildId,
        deviceName: Device.deviceName || undefined,
      });

      log.info('Push notifications registered successfully', 'PUSH_NOTIFICATIONS', {
        token: token.substring(0, 10) + '...',
        platform: Platform.OS,
      });

      setState(prev => ({ ...prev, isRegistering: false }));
    } catch (error) {
      log.error('Failed to register for push notifications', 'PUSH_NOTIFICATIONS', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to register',
        isRegistering: false 
      }));
    }
  }, [user, registerPushToken]);

  // Unregister push notifications
  const unregisterForPushNotifications = useCallback(async () => {
    if (!state.expoPushToken) return;

    try {
      await unregisterPushToken.mutateAsync({
        token: state.expoPushToken,
      });

      setState(prev => ({ 
        ...prev, 
        expoPushToken: null,
        permissionStatus: 'undetermined' 
      }));

      log.info('Push notifications unregistered', 'PUSH_NOTIFICATIONS');
    } catch (error) {
      log.error('Failed to unregister push notifications', 'PUSH_NOTIFICATIONS', error);
    }
  }, [state.expoPushToken, unregisterPushToken]);

  // Handle notification received
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    setState(prev => ({ ...prev, notification }));
    
    log.info('Notification received', 'PUSH_NOTIFICATIONS', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
    });
  }, []);

  // Handle notification response (user tapped on notification)
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    log.info('Notification tapped', 'PUSH_NOTIFICATIONS', {
      actionIdentifier: response.actionIdentifier,
      data,
    });

    // Navigate based on notification type
    if (data?.type) {
      switch (data.type) {
        case 'alert.created':
        case 'alert.escalated':
          if (data.alertId) {
            router.push(`/(modals)/escalation-details?alertId=${data.alertId}`);
          }
          break;
        case 'shift.summary':
          router.push('/(healthcare)/shift-handover');
          break;
        case 'org.invitation':
          router.push('/(organization)/dashboard');
          break;
        default:
          // Default navigation
          router.push('/(home)/');
      }
    }
  }, [router]);

  // Set up notification listeners
  useEffect(() => {
    if (Platform.OS === 'web') {
      log.info('Push notification listeners not available on web', 'PUSH_NOTIFICATIONS');
      return;
    }

    // Set up listeners
    notificationService.setupNotificationListeners(
      handleNotificationReceived,
      handleNotificationResponse
    );

    // Store listener references for cleanup
    notificationListener.current = Notifications.addNotificationReceivedListener(handleNotificationReceived);
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      // Clean up listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      notificationService.removeNotificationListeners();
    };
  }, [handleNotificationReceived, handleNotificationResponse]);

  // Check permission status on mount
  useEffect(() => {
    const checkPermissionStatus = async () => {
      const status = await notificationService.checkPermissionStatus();
      setState(prev => ({ ...prev, permissionStatus: status }));
    };

    checkPermissionStatus();
  }, []);

  // Auto-register if user is authenticated and hasn't registered yet
  useEffect(() => {
    if (user && !state.expoPushToken && state.permissionStatus === 'undetermined') {
      // Don't auto-register, let user decide
      log.info('Push notifications available for registration', 'PUSH_NOTIFICATIONS');
    }
  }, [user, state.expoPushToken, state.permissionStatus]);

  return {
    ...state,
    registerForPushNotifications,
    unregisterForPushNotifications,
    isSupported: Platform.OS !== 'web' && Device.isDevice,
  };
}