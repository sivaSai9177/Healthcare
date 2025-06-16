import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { log } from '@/lib/core/debug/logger';
import { showSuccessAlert } from '@/lib/core/alert';

// Hook for optimistic updates with React 19's useOptimistic
// import { useOptimistic } from 'react';
// Define AlertEvent type locally to avoid server imports
interface AlertEvent {
  type: 'alert.created' | 'alert.acknowledged' | 'alert.resolved' | 'alert.escalated';
  alertId: string;
  data: {
    roomNumber?: string;
    toTier?: number;
    [key: string]: any;
  };
  alert?: {
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

    // Fall back to polling for now since WebSocket subscription requires special handling
    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: [['healthcare', 'getActiveAlerts'], { input: { hospitalId } }],
      });
    }, 5000);
    
    subscriptionRef.current = { type: 'polling', interval: pollInterval };
    log.info('Using polling for alert updates', 'ALERT_SUBSCRIPTION');

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current?.type === 'polling') {
        clearInterval(subscriptionRef.current.interval);
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

    // Fall back to polling for alert details
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