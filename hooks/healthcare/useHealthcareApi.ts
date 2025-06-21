import { api } from '@/lib/api/trpc';
import { useHealthcareQuery, useHealthcareMutation } from '@/hooks/api';
import { useHospitalContext } from './useHospitalContext';
import { Alert, AlertCreationInput, AlertStats, Patient, Shift } from '@/types/healthcare';
import { showErrorAlert } from '@/lib/core/alert';

/**
 * Hook for fetching active alerts with error handling and caching
 */
export function useActiveAlerts(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const { hospitalId, canAccessHealthcare } = useHospitalContext();
  
  return useHealthcareQuery(
    ['healthcare', 'getActiveAlerts', { hospitalId }],
    () => api.healthcare.getActiveAlerts.query({ hospitalId: hospitalId! }),
    {
      enabled: !!hospitalId && canAccessHealthcare && (options?.enabled ?? true),
      refetchInterval: options?.refetchInterval || 30000, // 30 seconds
      errorMessage: 'Failed to load alerts. Please check your connection.',
      cacheKey: `alerts_${hospitalId}`,
      cacheDuration: 2 * 60 * 1000, // 2 minutes
    }
  );
}

/**
 * Hook for fetching alert details
 */
export function useAlertDetails(alertId: string, options?: { enabled?: boolean }) {
  const { hospitalId, canAccessHealthcare } = useHospitalContext();
  
  return useHealthcareQuery(
    ['healthcare', 'getAlert', { alertId, hospitalId }],
    () => api.healthcare.getAlert.query({ alertId, hospitalId: hospitalId! }),
    {
      enabled: !!alertId && !!hospitalId && canAccessHealthcare && (options?.enabled ?? true),
      errorMessage: 'Failed to load alert details.',
      cacheKey: `alert_${alertId}`,
    }
  );
}

/**
 * Hook for acknowledging alerts with optimistic updates
 */
export function useAcknowledgeAlert() {
  const utils = api.useUtils();
  const { hospitalId } = useHospitalContext();
  
  return useHealthcareMutation<
    { success: boolean; alert: Alert },
    { alertId: string; notes?: string }
  >(
    (variables) => api.healthcare.acknowledgeAlert.mutate(variables),
    {
      successMessage: 'Alert acknowledged successfully',
      errorMessage: 'Failed to acknowledge alert',
      invalidateQueries: [['healthcare', 'getActiveAlerts']],
      onMutate: async ({ alertId }) => {
        // Cancel outgoing refetches
        await utils.healthcare.getActiveAlerts.cancel();
        
        // Snapshot previous value
        const previousAlerts = utils.healthcare.getActiveAlerts.getData({ hospitalId: hospitalId! });
        
        // Optimistically update
        if (previousAlerts && hospitalId) {
          utils.healthcare.getActiveAlerts.setData(
            { hospitalId },
            {
              ...previousAlerts,
              alerts: previousAlerts.alerts.map(alert =>
                alert.id === alertId
                  ? { ...alert, acknowledged: true, acknowledgedAt: new Date() }
                  : alert
              ),
            }
          );
        }
        
        return { previousAlerts };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousAlerts && hospitalId) {
          utils.healthcare.getActiveAlerts.setData(
            { hospitalId },
            context.previousAlerts
          );
        }
      },
    }
  );
}

/**
 * Hook for resolving alerts
 */
export function useResolveAlert() {
  const utils = api.useUtils();
  const { hospitalId } = useHospitalContext();
  
  return useHealthcareMutation<
    { success: boolean; alert: Alert },
    { alertId: string; resolution: string }
  >(
    (variables) => api.healthcare.resolveAlert.mutate(variables),
    {
      successMessage: 'Alert resolved successfully',
      errorMessage: 'Failed to resolve alert',
      invalidateQueries: [['healthcare', 'getActiveAlerts']],
      onMutate: async ({ alertId }) => {
        await utils.healthcare.getActiveAlerts.cancel();
        
        const previousAlerts = utils.healthcare.getActiveAlerts.getData({ hospitalId: hospitalId! });
        
        if (previousAlerts && hospitalId) {
          utils.healthcare.getActiveAlerts.setData(
            { hospitalId },
            {
              ...previousAlerts,
              alerts: previousAlerts.alerts.map(alert =>
                alert.id === alertId
                  ? { ...alert, resolved: true, resolvedAt: new Date() }
                  : alert
              ),
            }
          );
        }
        
        return { previousAlerts };
      },
      onError: (err, variables, context) => {
        if (context?.previousAlerts && hospitalId) {
          utils.healthcare.getActiveAlerts.setData(
            { hospitalId },
            context.previousAlerts
          );
        }
      },
    }
  );
}

/**
 * Hook for creating new alerts
 */
export function useCreateAlert() {
  const { hospitalId } = useHospitalContext();
  
  return useHealthcareMutation<
    { success: boolean; alert: Alert },
    AlertCreationInput
  >(
    (input) => api.healthcare.createAlert.mutate({
      ...input,
      hospitalId: hospitalId!,
    }),
    {
      successMessage: 'Alert created successfully',
      errorMessage: 'Failed to create alert',
      invalidateQueries: [
        ['healthcare', 'getActiveAlerts'],
        ['healthcare', 'getMetrics'],
      ],
    }
  );
}

/**
 * Hook for fetching healthcare metrics
 */
export function useHealthcareMetrics(options?: {
  timeRange?: 'day' | 'week' | 'month';
  enabled?: boolean;
}) {
  const { hospitalId, canAccessHealthcare } = useHospitalContext();
  
  return useHealthcareQuery(
    ['healthcare', 'getMetrics', { hospitalId, timeRange: options?.timeRange }],
    () => api.healthcare.getMetrics.query({ 
      hospitalId: hospitalId!,
      timeRange: options?.timeRange || 'day',
    }),
    {
      enabled: !!hospitalId && canAccessHealthcare && (options?.enabled ?? true),
      refetchInterval: 60000, // 1 minute
      errorMessage: 'Failed to load metrics.',
      cacheKey: `metrics_${hospitalId}_${options?.timeRange || 'day'}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook for fetching patients
 */
export function usePatients(options?: {
  status?: 'active' | 'discharged' | 'all';
  enabled?: boolean;
}) {
  const { hospitalId, canAccessHealthcare } = useHospitalContext();
  
  return useHealthcareQuery(
    ['healthcare', 'getPatients', { hospitalId, status: options?.status }],
    () => api.healthcare.getPatients.query({ 
      hospitalId: hospitalId!,
      status: options?.status || 'active',
    }),
    {
      enabled: !!hospitalId && canAccessHealthcare && (options?.enabled ?? true),
      errorMessage: 'Failed to load patients.',
      cacheKey: `patients_${hospitalId}_${options?.status || 'active'}`,
      cacheDuration: 10 * 60 * 1000, // 10 minutes
    }
  );
}

/**
 * Hook for current shift status
 */
export function useShiftStatus() {
  const { hospitalId, canAccessHealthcare } = useHospitalContext();
  
  return useHealthcareQuery(
    ['healthcare', 'getShiftStatus', { hospitalId }],
    () => api.healthcare.getShiftStatus.query({ hospitalId: hospitalId! }),
    {
      enabled: !!hospitalId && canAccessHealthcare,
      refetchInterval: 5 * 60 * 1000, // 5 minutes
      errorMessage: 'Failed to load shift status.',
      cacheKey: `shift_${hospitalId}`,
    }
  );
}

/**
 * Hook for shift handover
 */
export function useShiftHandover() {
  const { hospitalId } = useHospitalContext();
  
  return useHealthcareMutation<
    { success: boolean; handover: any },
    { notes: string; criticalAlerts: string[] }
  >(
    (input) => api.healthcare.createShiftHandover.mutate({
      ...input,
      hospitalId: hospitalId!,
    }),
    {
      successMessage: 'Shift handover completed',
      errorMessage: 'Failed to complete shift handover',
      invalidateQueries: [
        ['healthcare', 'getShiftStatus'],
        ['healthcare', 'getActiveAlerts'],
      ],
    }
  );
}

/**
 * Hook for fetching active alerts with organization data
 */
export function useActiveAlertsWithOrg(options?: {
  hospitalId?: string;
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const { hospitalId: contextHospitalId } = useHospitalContext();
  const hospitalId = options?.hospitalId || contextHospitalId;
  
  return useHealthcareQuery(
    ['healthcare', 'getActiveAlertsWithOrg', { hospitalId }],
    () => api.healthcare.getActiveAlertsWithOrg.query({ hospitalId: hospitalId! }),
    {
      enabled: !!hospitalId && (options?.enabled ?? true),
      refetchInterval: options?.refetchInterval || 30000,
      errorMessage: 'Failed to load alerts with organization data.',
      cacheKey: `alerts_org_${hospitalId}`,
      cacheDuration: 2 * 60 * 1000,
    }
  );
}

/**
 * Hook for organization alert stats
 */
export function useOrganizationAlertStats(options?: {
  organizationId?: string;
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useHealthcareQuery(
    ['healthcare', 'getOrganizationAlertStats', { organizationId: options?.organizationId }],
    () => api.healthcare.getOrganizationAlertStats.query({ 
      organizationId: options?.organizationId! 
    }),
    {
      enabled: !!options?.organizationId && (options?.enabled ?? true),
      refetchInterval: options?.refetchInterval || 60000,
      errorMessage: 'Failed to load organization statistics.',
      cacheKey: `org_stats_${options?.organizationId}`,
      cacheDuration: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook for healthcare metrics
 */
export function useMetrics(options?: {
  hospitalId?: string;
  timeRange?: string;
  department?: string;
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const { hospitalId: contextHospitalId } = useHospitalContext();
  const hospitalId = options?.hospitalId || contextHospitalId;
  
  return useHealthcareQuery(
    ['healthcare', 'getMetrics', { 
      hospitalId, 
      timeRange: options?.timeRange,
      department: options?.department 
    }],
    () => api.healthcare.getMetrics.query({ 
      hospitalId: hospitalId!,
      timeRange: options?.timeRange || '24h',
      department: options?.department,
    }),
    {
      enabled: !!hospitalId && (options?.enabled ?? true),
      refetchInterval: options?.refetchInterval || 30000,
      errorMessage: 'Failed to load metrics.',
      cacheKey: `metrics_${hospitalId}_${options?.timeRange}_${options?.department}`,
      cacheDuration: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook for response times
 */
export function useResponseTimes(options?: {
  hospitalId?: string;
  period?: string;
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const { hospitalId: contextHospitalId } = useHospitalContext();
  const hospitalId = options?.hospitalId || contextHospitalId;
  
  return useHealthcareQuery(
    ['healthcare', 'getResponseTimes', { hospitalId, period: options?.period }],
    () => api.healthcare.getResponseTimes.query({ 
      hospitalId: hospitalId!,
      period: options?.period || '24h',
    }),
    {
      enabled: !!hospitalId && (options?.enabled ?? true),
      refetchInterval: options?.refetchInterval || 30000,
      errorMessage: 'Failed to load response times.',
      cacheKey: `response_times_${hospitalId}_${options?.period}`,
      cacheDuration: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook for my patients (getMyPatients)
 */
export function useMyPatients(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const { hospitalId, canAccessHealthcare } = useHospitalContext();
  
  return useHealthcareQuery(
    ['healthcare', 'getMyPatients', { hospitalId }],
    () => api.healthcare.getMyPatients.query({ hospitalId: hospitalId! }),
    {
      enabled: !!hospitalId && canAccessHealthcare && (options?.enabled ?? true),
      refetchInterval: options?.refetchInterval || 30000,
      errorMessage: 'Failed to load your patients.',
      cacheKey: `my_patients_${hospitalId}`,
      cacheDuration: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook for alert stats
 */
export function useAlertStats(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const { hospitalId } = useHospitalContext();
  
  return useHealthcareQuery(
    ['healthcare', 'getAlertStats'],
    () => api.healthcare.getAlertStats.query(),
    {
      enabled: options?.enabled ?? true,
      refetchInterval: options?.refetchInterval || 30000,
      errorMessage: 'Failed to load alert statistics.',
      cacheKey: 'alert_stats',
      cacheDuration: 2 * 60 * 1000,
    }
  );
}

/**
 * Hook for unread notifications
 */
export function useUnreadNotifications(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useHealthcareQuery(
    ['notification', 'getUnread'],
    () => api.notification.getUnread.query(),
    {
      enabled: options?.enabled ?? true,
      refetchInterval: options?.refetchInterval || 60000,
      errorMessage: 'Failed to load notifications.',
      cacheKey: 'unread_notifications',
      cacheDuration: 1 * 60 * 1000,
    }
  );
}

/**
 * Hook for organization hospitals
 */
export function useOrganizationHospitals(organizationId: string, options?: {
  enabled?: boolean;
}) {
  return useHealthcareQuery(
    ['healthcare', 'getOrganizationHospitals', { organizationId }],
    () => api.healthcare.getOrganizationHospitals.query({ organizationId }),
    {
      enabled: !!organizationId && (options?.enabled ?? true),
      errorMessage: 'Failed to load hospitals.',
      cacheKey: `org_hospitals_${organizationId}`,
      cacheDuration: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook for selecting hospital
 */
export function useSelectHospital() {
  const utils = api.useUtils();
  
  return useHealthcareMutation<
    { success: boolean; hospital: any },
    { hospitalId: string }
  >(
    (variables) => api.auth.selectHospital.mutate(variables),
    {
      successMessage: 'Hospital selected successfully',
      errorMessage: 'Failed to select hospital',
      onSuccess: (data) => {
        // Invalidate all healthcare queries after hospital change
        utils.healthcare.invalidate();
      },
    }
  );
}