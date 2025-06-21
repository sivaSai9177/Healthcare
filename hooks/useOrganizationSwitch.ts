import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';
import { useActiveOrganization } from '@/lib/stores/organization-store';
import { useRouter } from 'expo-router';
import { log } from '@/lib/core/debug/logger';
import { haptic } from '@/lib/ui/haptics';

interface OrganizationSwitchOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useOrganizationSwitch(options?: OrganizationSwitchOptions) {
  const { user } = useAuth();
  const router = useRouter();
  const { setActiveOrganization } = useActiveOrganization();
  const [isSwitching, setIsSwitching] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingOrganizationId, setPendingOrganizationId] = useState<string | null>(null);
  
  // Check if user is on duty
  const { data: onDutyStatus } = api.healthcare.getOnDutyStatus.useQuery(
    undefined,
    { enabled: !!user }
  );
  
  // Check for active alerts
  const { data: activeAlerts } = api.healthcare.getActiveAlerts.useQuery(
    { hospitalId: user?.organizationId || '' },
    { enabled: !!user?.organizationId }
  );
  
  // Toggle off duty mutation
  const toggleOffDuty = api.healthcare.toggleOnDuty.useMutation();
  
  const handleSwitch = useCallback(async (organizationId: string) => {
    try {
      // Check if user is on duty or has active alerts
      if (onDutyStatus?.isOnDuty || (activeAlerts?.alerts && activeAlerts.alerts.length > 0)) {
        setPendingOrganizationId(organizationId);
        setShowWarning(true);
        return;
      }
      
      // Proceed with switch
      await performSwitch(organizationId);
    } catch (error) {
      log.error('Failed to switch organization', 'ORG_SWITCH', error);
      options?.onError?.(error as Error);
    }
  }, [onDutyStatus, activeAlerts, options]);
  
  const performSwitch = async (organizationId: string) => {
    setIsSwitching(true);
    
    try {
      // Update active organization in store
      await setActiveOrganization(organizationId);
      
      // Update user's default organization via API
      await api.organization.setActiveOrganization.mutate({ organizationId });
      
      log.info('Organization switched successfully', 'ORG_SWITCH', { organizationId });
      haptic('success');
      
      // Navigate to home to refresh context
      router.replace('/(app)/(tabs)/home');
      
      options?.onSuccess?.();
    } catch (error) {
      log.error('Failed to perform organization switch', 'ORG_SWITCH', error);
      throw error;
    } finally {
      setIsSwitching(false);
      setPendingOrganizationId(null);
    }
  };
  
  const confirmSwitch = async () => {
    if (!pendingOrganizationId) return;
    
    try {
      // End shift if on duty
      if (onDutyStatus?.isOnDuty) {
        await toggleOffDuty.mutateAsync({
          isOnDuty: false,
          handoverNotes: 'Ended shift due to organization switch',
        });
      }
      
      // Proceed with switch
      await performSwitch(pendingOrganizationId);
      setShowWarning(false);
    } catch (error) {
      log.error('Failed to confirm organization switch', 'ORG_SWITCH', error);
      options?.onError?.(error as Error);
    }
  };
  
  const cancelSwitch = () => {
    setShowWarning(false);
    setPendingOrganizationId(null);
  };
  
  return {
    switchOrganization: handleSwitch,
    confirmSwitch,
    cancelSwitch,
    isSwitching,
    showWarning,
    hasActiveShift: onDutyStatus?.isOnDuty || false,
    activeAlertsCount: activeAlerts?.alerts?.length || 0,
  };
}