import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/trpc';
import { log } from '@/lib/core/logger';
import { showSuccessAlert } from '@/lib/core/alert';
import type { AlertEvent } from '@/src/server/services/alert-subscriptions';

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

    // TODO: Replace with real subscription when WebSocket support is added
    // For now, we'll use polling to simulate real-time updates
    // Only log once when the component mounts
    if (!subscriptionRef.current) {
      log.debug('Using polling for alert updates', 'ALERT_SUBSCRIPTION', { 
        hospitalId,
        reason: 'WebSocket subscriptions not yet implemented' 
      });
      subscriptionRef.current = true;
    }
    
    // Poll for updates every 5 seconds
    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: [['healthcare', 'getActiveAlerts'], { input: { hospitalId } }],
      });
    }, 5000);

    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, [hospitalId, queryClient]);

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

// Hook for optimistic updates with React 19's useOptimistic
import { useOptimistic } from 'react';

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