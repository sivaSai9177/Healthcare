import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/trpc';
import { log } from '@/lib/core/debug/logger';
import { showSuccessAlert } from '@/lib/core/alert';
import type { inferSubscriptionOutput } from '@trpc/client';
import type { AppRouter } from '@/src/server/routers';

// Type for the alert event from subscription
type AlertSubscriptionEvent = inferSubscriptionOutput<AppRouter['healthcare']['subscribeToAlerts']>;

interface UseAlertWebSocketOptions {
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

export function useAlertWebSocket({
  hospitalId,
  enabled = true,
  onAlertCreated,
  onAlertAcknowledged,
  onAlertResolved,
  onAlertEscalated,
  showNotifications = true,
  fallbackToPolling = true,
  pollingInterval = 5000,
}: UseAlertWebSocketOptions) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle incoming alert events
  const handleEvent = useCallback((event: AlertSubscriptionEvent) => {
    log.info('Alert event received via WebSocket', 'ALERT_WS', event);

    // Invalidate relevant queries to trigger refetch
    queryClient.invalidateQueries({
      queryKey: [['healthcare', 'getActiveAlerts'], { input: { hospitalId } }],
    });

    // Also invalidate specific alert queries if needed
    queryClient.invalidateQueries({
      queryKey: [['healthcare', 'getEscalationStatus'], { input: { alertId: event.alertId } }],
    });

    // Show notifications if enabled
    if (showNotifications) {
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
    if (pollingIntervalRef.current) return;
    
    log.info('Starting polling fallback for alerts', 'ALERT_WS', { 
      hospitalId, 
      interval: pollingInterval 
    });
    
    pollingIntervalRef.current = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: [['healthcare', 'getActiveAlerts'], { input: { hospitalId } }],
      });
    }, pollingInterval);
  }, [hospitalId, pollingInterval, queryClient]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      log.info('Stopped polling for alerts', 'ALERT_WS');
    }
  }, []);

  // Use the subscription
  const subscription = api.healthcare.subscribeToAlerts.useSubscription(
    enabled ? { hospitalId } : undefined,
    {
      enabled,
      onStarted: () => {
        log.info('WebSocket subscription started', 'ALERT_WS', { hospitalId });
        setIsConnected(true);
        setConnectionError(null);
        stopPolling(); // Stop polling when WebSocket connects
      },
      onData: (event) => {
        handleEvent(event);
      },
      onError: (error) => {
        log.error('WebSocket subscription error', 'ALERT_WS', error);
        setIsConnected(false);
        setConnectionError(error.message);
        
        // Start polling as fallback if enabled
        if (fallbackToPolling) {
          startPolling();
        }
      },
    }
  );

  // Handle metrics subscription for real-time dashboard updates
  const metricsSubscription = api.healthcare.subscribeToMetrics.useSubscription(
    enabled ? { hospitalId, interval: 30000 } : undefined,
    {
      enabled,
      onData: (metrics) => {
        log.debug('Metrics update received', 'ALERT_WS', metrics);
        // Update metrics cache
        queryClient.setQueryData(
          [['healthcare', 'getMetrics'], { input: { timeRange: '24h', department: 'all' } }],
          (oldData: any) => ({
            ...oldData,
            ...metrics,
          })
        );
      },
      onError: (error) => {
        log.error('Metrics subscription error', 'ALERT_WS', error);
      },
    }
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isConnected,
    connectionError,
    isPolling: !!pollingIntervalRef.current,
  };
}

// Hook for single alert subscription with details
export function useAlertDetailWebSocket(alertId: string | null, enabled = true) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  // For now, use polling for alert details
  // In the future, this could be a dedicated subscription
  useEffect(() => {
    if (!alertId || !enabled) return;

    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: [['healthcare', 'getEscalationStatus'], { input: { alertId } }],
      });
      
      queryClient.invalidateQueries({
        queryKey: [['healthcare', 'getEscalationHistory'], { input: { alertId } }],
      });
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [alertId, enabled, queryClient]);

  return { isConnected };
}

// Hook for optimistic updates with WebSocket support
export function useOptimisticAlertUpdate() {
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
  }, [queryClient]);

  return { updateAlertOptimistically };
}