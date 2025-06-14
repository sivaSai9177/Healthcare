import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/trpc';
import { log } from '@/lib/core/debug/logger';
import { showSuccessAlert } from '@/lib/core/alert';

// Hook for optimistic updates with React 19's useOptimistic
import { useOptimistic } from 'react';
// Define AlertEvent type locally to avoid server imports
interface AlertEvent {
  type: 'created' | 'acknowledged' | 'resolved' | 'escalated';
  alertId: string;
  alert: {
    id: string;
    patientName: string;
    roomNumber: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    message: string;
    createdAt: Date;
    acknowledgedAt?: Date | null;
    resolvedAt?: Date | null;
  };
  userId?: string;
  userName?: string;
  timestamp: Date;
}

interface UseAlertSubscriptionOptions {
  hospitalId: string;
  onAlertCreated?: (event: AlertEvent) => void;
  onAlertAcknowledged?: (event: AlertEvent) => void;
  onAlertResolved?: (event: AlertEvent) => void;
  onAlertEscalated?: (event: AlertEvent) => void;
  showNotifications?: boolean;
}

export function useAlertSubscription({
  hospitalId,
  onAlertCreated,
  onAlertAcknowledged,
  onAlertResolved,
  onAlertEscalated,
  showNotifications = true,
}: UseAlertSubscriptionOptions) {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  // Handle incoming events
  const handleEvent = useCallback((event: AlertEvent) => {
    log.info('Alert event received', 'ALERT_SUBSCRIPTION', event);

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
          showSuccessAlert('New Alert', `New alert in room ${event.data.roomNumber}`);
          break;
        case 'alert.acknowledged':
          showSuccessAlert('Alert Acknowledged', 'An alert has been acknowledged');
          break;
        case 'alert.escalated':
          showSuccessAlert('Alert Escalated', `Alert escalated to tier ${event.data.toTier}`);
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

  useEffect(() => {
    if (!hospitalId) return;

    log.info('Starting alert subscription', 'ALERT_SUBSCRIPTION', { hospitalId });

    // Use the real WebSocket subscription
    const subscription = api.healthcare.subscribeToAlerts.subscribe(
      { hospitalId },
      {
        onData: (event) => {
          handleEvent(event);
        },
        onError: (error) => {
          log.error('Alert subscription error', 'ALERT_SUBSCRIPTION', error);
          
          // Fall back to polling on error
          const pollInterval = setInterval(() => {
            queryClient.invalidateQueries({
              queryKey: [['healthcare', 'getActiveAlerts'], { input: { hospitalId } }],
            });
          }, 5000);
          
          subscriptionRef.current = { type: 'polling', interval: pollInterval };
        },
        onStarted: () => {
          log.info('Alert subscription connected', 'ALERT_SUBSCRIPTION');
          subscriptionRef.current = { type: 'websocket' };
        },
        onStopped: () => {
          log.info('Alert subscription disconnected', 'ALERT_SUBSCRIPTION');
          subscriptionRef.current = null;
        },
      }
    );

    // Store subscription reference
    subscriptionRef.current = { type: 'websocket', subscription };

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current?.type === 'polling') {
        clearInterval(subscriptionRef.current.interval);
      } else if (subscriptionRef.current?.subscription) {
        subscriptionRef.current.subscription.unsubscribe();
      }
      subscriptionRef.current = null;
    };
  }, [hospitalId, queryClient, handleEvent]);

  return {
    isSubscribed: !!subscriptionRef.current,
  };
}

// Hook for single alert subscription
export function useAlertDetailSubscription(alertId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!alertId) return;

    const subscription = api.healthcare.subscribeToAlert.subscribe(
      { alertId },
      {
        onData: (event) => {
          log.info('Alert detail event received', 'ALERT_DETAIL_SUBSCRIPTION', event);

          // Invalidate alert-specific queries
          queryClient.invalidateQueries({
            queryKey: [['healthcare', 'getEscalationStatus'], { input: { alertId } }],
          });
          
          queryClient.invalidateQueries({
            queryKey: [['healthcare', 'getEscalationHistory'], { input: { alertId } }],
          });
        },
        onError: (error) => {
          log.error('Alert detail subscription error', 'ALERT_DETAIL_SUBSCRIPTION', error);
        },
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [alertId, queryClient]);
}

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