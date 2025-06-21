import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Platform, AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { api } from '@/lib/api/trpc';
import { log } from '@/lib/core/debug/logger';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';
import { MobileWebSocketClient, getWebSocketConfig } from '@/lib/core/config/websocket-config';
import type { inferSubscriptionOutput } from '@trpc/client';
import type { AppRouter } from '@/src/server/routers';

// Type for the alert event from subscription
type AlertSubscriptionEvent = inferSubscriptionOutput<AppRouter['healthcare']['subscribeToAlerts']>;

interface UseMobileAlertWebSocketOptions {
  hospitalId: string;
  enabled?: boolean;
  onAlertCreated?: (event: AlertSubscriptionEvent) => void;
  onAlertAcknowledged?: (event: AlertSubscriptionEvent) => void;
  onAlertResolved?: (event: AlertSubscriptionEvent) => void;
  onAlertEscalated?: (event: AlertSubscriptionEvent) => void;
  showNotifications?: boolean;
  fallbackToPolling?: boolean;
  pollingInterval?: number;
}

/**
 * Mobile-optimized WebSocket hook for healthcare alerts
 * Handles connection management, background/foreground transitions, and network changes
 */
export function useMobileAlertWebSocket({
  hospitalId,
  enabled = true,
  onAlertCreated,
  onAlertAcknowledged,
  onAlertResolved,
  onAlertEscalated,
  showNotifications = true,
  fallbackToPolling = true,
  pollingInterval = 5000,
}: UseMobileAlertWebSocketOptions) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsClientRef = useRef<MobileWebSocketClient | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Handle incoming alert events
  const handleEvent = useCallback((event: AlertSubscriptionEvent) => {
    log.info('Alert event received', 'MOBILE_WS', event);

    // Invalidate relevant queries
    queryClient.invalidateQueries({
      queryKey: [['healthcare', 'getActiveAlerts'], { input: { hospitalId } }],
    });

    if (event.alertId) {
      queryClient.invalidateQueries({
        queryKey: [['healthcare', 'getEscalationStatus'], { input: { alertId: event.alertId } }],
      });
    }

    // Show notifications if enabled
    if (showNotifications && appStateRef.current === 'active') {
      switch (event.type) {
        case 'alert.created':
          showSuccessAlert('New Alert', `New alert in room ${event.data?.roomNumber || 'Unknown'}`);
          break;
        case 'alert.acknowledged':
          showSuccessAlert('Alert Acknowledged', 'An alert has been acknowledged');
          break;
        case 'alert.escalated':
          showSuccessAlert('Alert Escalated', `Alert escalated to tier ${event.data?.toTier || 'Unknown'}`);
          break;
      }
    }

    // Call specific handlers
    switch (event.type) {
      case 'alert.created':
        onAlertCreated?.(event);
        break;
      case 'alert.acknowledged':
        onAlertAcknowledged?.(event);
        break;
      case 'alert.resolved':
        onAlertResolved?.(event);
        break;
      case 'alert.escalated':
        onAlertEscalated?.(event);
        break;
    }
  }, [
    queryClient,
    hospitalId,
    onAlertCreated,
    onAlertAcknowledged,
    onAlertResolved,
    onAlertEscalated,
    showNotifications,
  ]);

  // Start polling as fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current || !fallbackToPolling) return;
    
    log.info('Starting polling fallback', 'MOBILE_WS', { 
      hospitalId, 
      interval: pollingInterval 
    });
    
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(() => {
      if (appStateRef.current === 'active') {
        queryClient.invalidateQueries({
          queryKey: [['healthcare', 'getActiveAlerts'], { input: { hospitalId } }],
        });
      }
    }, pollingInterval);
  }, [hospitalId, pollingInterval, queryClient, fallbackToPolling]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
      log.info('Stopped polling', 'MOBILE_WS');
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (!enabled || wsClientRef.current) return;

    const wsConfig = getWebSocketConfig();
    if (!wsConfig.enabled) {
      log.warn('WebSocket disabled in configuration', 'MOBILE_WS');
      startPolling();
      return;
    }

    log.info('Connecting to WebSocket', 'MOBILE_WS', { hospitalId });

    wsClientRef.current = new MobileWebSocketClient(
      wsConfig,
      // onOpen
      () => {
        setIsConnected(true);
        setConnectionError(null);
        stopPolling();
        
        // Subscribe to hospital alerts
        wsClientRef.current?.send({
          type: 'subscribe',
          channel: `hospital:${hospitalId}`,
        });
      },
      // onMessage
      (data) => {
        if (data.type === 'alert.event') {
          handleEvent(data.payload);
        }
      },
      // onError
      (error) => {
        log.error('WebSocket error', 'MOBILE_WS', error);
        setConnectionError(error.message);
        if (fallbackToPolling) {
          startPolling();
        }
      },
      // onClose
      () => {
        setIsConnected(false);
        if (fallbackToPolling && appStateRef.current === 'active') {
          startPolling();
        }
      }
    );
  }, [enabled, hospitalId, handleEvent, startPolling, stopPolling, fallbackToPolling]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsClientRef.current) {
      wsClientRef.current.close();
      wsClientRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        log.info('App came to foreground', 'MOBILE_WS');
        // Reconnect WebSocket when app comes to foreground
        disconnectWebSocket();
        connectWebSocket();
      } else if (nextAppState.match(/inactive|background/)) {
        log.info('App went to background', 'MOBILE_WS');
        // Disconnect WebSocket when app goes to background
        disconnectWebSocket();
        stopPolling();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [connectWebSocket, disconnectWebSocket, stopPolling]);

  // Handle network state changes
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && !wsClientRef.current && enabled) {
        log.info('Network reconnected', 'MOBILE_WS');
        connectWebSocket();
      } else if (!state.isConnected) {
        log.info('Network disconnected', 'MOBILE_WS');
        disconnectWebSocket();
        stopPolling();
      }
    });

    return unsubscribe;
  }, [connectWebSocket, disconnectWebSocket, stopPolling, enabled]);

  // Initial connection
  useEffect(() => {
    if (enabled) {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
      stopPolling();
    };
  }, [enabled, connectWebSocket, disconnectWebSocket, stopPolling]);

  // For platforms that support TRPC subscriptions, use them as primary
  const subscription = Platform.OS === 'web' ? api.healthcare.subscribeToAlerts.useSubscription(
    enabled ? { hospitalId } : undefined,
    {
      enabled: enabled && Platform.OS === 'web',
      onStarted: () => {
        log.info('TRPC subscription started', 'MOBILE_WS', { hospitalId });
        setIsConnected(true);
        setConnectionError(null);
        stopPolling();
      },
      onData: (event) => {
        handleEvent(event);
      },
      onError: (error) => {
        log.error('TRPC subscription error', 'MOBILE_WS', error);
        setIsConnected(false);
        setConnectionError(error.message);
        if (fallbackToPolling) {
          startPolling();
        }
      },
    }
  ) : undefined;

  return {
    isConnected,
    connectionError,
    isPolling,
    reconnect: () => {
      disconnectWebSocket();
      connectWebSocket();
    },
  };
}

/**
 * Hook for optimistic updates with mobile support
 */
export function useMobileOptimisticAlertUpdate() {
  const queryClient = useQueryClient();

  const updateAlertOptimistically = useCallback((
    alertId: string,
    updates: Partial<any>
  ) => {
    // Optimistically update the cache
    queryClient.setQueryData(
      [['healthcare', 'getActiveAlerts']],
      (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          alerts: oldData.alerts.map((alertData: any) =>
            alertData.alert.id === alertId
              ? { ...alertData, alert: { ...alertData.alert, ...updates } }
              : alertData
          ),
        };
      }
    );

    // For mobile, also update any cached individual alert queries
    queryClient.setQueryData(
      [['healthcare', 'getAlert'], { input: { alertId } }],
      (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, ...updates };
      }
    );
  }, [queryClient]);

  return { updateAlertOptimistically };
}