import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/trpc';
import { startTransition, useOptimistic, useDeferredValue , useCallback, useRef } from 'react';
import type { z } from 'zod';
import type { 
  UpdateOrganizationSettingsSchema,
  SecuritySettingsSchema,
  NotificationSettingsSchema,
  FeatureSettingsSchema
} from '@/lib/validations/organization';
import { log } from '@/lib/core/debug/logger';

type UpdateSettingsInput = z.infer<typeof UpdateOrganizationSettingsSchema>;
type SecuritySettings = z.infer<typeof SecuritySettingsSchema>;
type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;
type FeatureSettings = z.infer<typeof FeatureSettingsSchema>;

export function useOrganizationSettings(organizationId: string) {
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  
  // Fetch settings
  const query = api.organization.getSettings.useQuery(
    { organizationId },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Update settings mutation with optimistic updates
  const updateMutation = api.organization.updateSettings.useMutation({
    onMutate: async (input: UpdateSettingsInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [['organization', 'getSettings'], { input: { organizationId } }],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(
        [['organization', 'getSettings'], { input: { organizationId } }]
      );

      // Optimistically update to the new value
      queryClient.setQueryData(
        [['organization', 'getSettings'], { input: { organizationId } }],
        (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            ...input.settings,
            security: { ...old.security, ...input.settings.security },
            notifications: { ...old.notifications, ...input.settings.notifications },
            features: { ...old.features, ...input.settings.features },
            member: { ...old.member, ...input.settings.member },
            branding: { ...old.branding, ...input.settings.branding },
          };
        }
      );

      return { previousData };
    },
    onError: (err, input, context) => {
      log.error('Failed to update settings', 'USE_ORG_SETTINGS', { error: err });
      
      // Roll back on error
      if (context?.previousData) {
        queryClient.setQueryData(
          [['organization', 'getSettings'], { input: { organizationId } }],
          context.previousData
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      startTransition(() => {
        queryClient.invalidateQueries({
          queryKey: [['organization', 'getSettings'], { input: { organizationId } }],
        });
      });
    },
  });

  // Debounced update function for auto-save
  const debouncedUpdate = useCallback((settings: UpdateSettingsInput['settings']) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateMutation.mutate({ organizationId, settings });
    }, 1000); // 1 second debounce
  }, [organizationId, updateMutation]);

  // Immediate update function
  const updateSettings = useCallback((settings: UpdateSettingsInput['settings']) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    updateMutation.mutate({ organizationId, settings });
  }, [organizationId, updateMutation]);

  // Helper functions for specific settings updates
  const updateSecuritySettings = useCallback((security: Partial<SecuritySettings>) => {
    updateSettings({ security });
  }, [updateSettings]);

  const updateNotificationSettings = useCallback((notifications: Partial<NotificationSettings>) => {
    updateSettings({ notifications });
  }, [updateSettings]);

  const updateFeatureSettings = useCallback((features: Partial<FeatureSettings>) => {
    updateSettings({ features });
  }, [updateSettings]);

  // Optimistic state management for immediate UI feedback
  const [optimisticSettings, setOptimisticSettings] = useOptimistic(
    query.data,
    (state, newSettings: any) => ({
      ...state,
      ...newSettings,
    })
  );

  return {
    // Data
    settings: optimisticSettings || query.data,
    
    // Query states
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    
    // Mutations
    updateSettings,
    updateSettingsDebounced: debouncedUpdate,
    updateSecuritySettings,
    updateNotificationSettings,
    updateFeatureSettings,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    
    // Optimistic update
    setOptimisticSettings,
    
    // Utilities
    refetch: query.refetch,
  };
}

// Hook for activity log
export function useOrganizationActivityLog(
  organizationId: string,
  options: {
    page?: number;
    limit?: number;
    action?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const { page = 1, limit = 50, ...filters } = options;
  
  const query = api.organization.getActivityLog.useQuery(
    {
      organizationId,
      page,
      limit,
      ...filters,
    },
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000,
      keepPreviousData: true,
    }
  );

  return {
    activities: query.data?.activities ?? [],
    total: query.data?.total ?? 0,
    currentPage: query.data?.page ?? 1,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

// Hook for organization metrics
export function useOrganizationMetrics(organizationId: string) {
  const query = api.organization.getMetrics.useQuery(
    { organizationId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,
      refetchInterval: 30 * 1000, // Refresh every 30 seconds
    }
  );

  // Use deferred value for smooth updates
  const deferredMetrics = useDeferredValue(query.data);

  return {
    metrics: deferredMetrics,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}