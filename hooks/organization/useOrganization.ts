import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/trpc';
import { startTransition } from 'react';
import type { z } from 'zod';
import type { 
  OrganizationResponseSchema, 
  UpdateOrganizationSchema 
} from '@/lib/validations/organization';
import { log } from '@/lib/core/debug/logger';

type OrganizationResponse = z.infer<typeof OrganizationResponseSchema>;
type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

export function useOrganization(organizationId: string) {
  const queryClient = useQueryClient();
  
  // Fetch organization data
  const query = api.organization.get.useQuery(
    { organizationId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 404s
        if (error?.data?.code === 'NOT_FOUND') {
          return false;
        }
        return failureCount < 2;
      },
    }
  );

  // Update organization mutation with optimistic updates
  const updateMutation = api.organization.update.useMutation({
    onMutate: async (input: UpdateOrganizationInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [['organization', 'get'], { input: { organizationId } }],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<OrganizationResponse>(
        [['organization', 'get'], { input: { organizationId } }]
      );

      // Optimistically update to the new value
      if (previousData) {
        queryClient.setQueryData<OrganizationResponse>(
          [['organization', 'get'], { input: { organizationId } }],
          (old) => old ? { ...old, ...input.data } : old
        );
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (err, input, context) => {
      log.error('Failed to update organization', 'USE_ORG', { error: err });
      
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData<OrganizationResponse>(
          [['organization', 'get'], { input: { organizationId } }],
          context.previousData
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      startTransition(() => {
        queryClient.invalidateQueries({
          queryKey: [['organization', 'get'], { input: { organizationId } }],
        });
      });
    },
  });

  // Delete organization mutation
  const deleteMutation = api.organization.delete.useMutation({
    onSuccess: () => {
      // Invalidate and remove from cache
      queryClient.removeQueries({
        queryKey: [['organization', 'get'], { input: { organizationId } }],
      });
      
      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: [['organization', 'listUserOrganizations']],
      });
    },
  });

  return {
    // Data
    organization: query.data,
    
    // Query states
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    
    // Mutations
    updateOrganization: updateMutation.mutate,
    updateOrganizationAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    
    deleteOrganization: deleteMutation.mutate,
    deleteOrganizationAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
    
    // Utilities
    refetch: query.refetch,
    invalidate: () => queryClient.invalidateQueries({
      queryKey: [['organization', 'get'], { input: { organizationId } }],
    }),
  };
}

// Hook for listing user's organizations
export function useUserOrganizations() {
  const queryClient = useQueryClient();
  
  const query = api.organization.listUserOrganizations.useQuery(
    {},
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Prefetch organization details on hover
  const prefetchOrganization = (organizationId: string) => {
    queryClient.prefetchQuery({
      queryKey: [['organization', 'get'], { input: { organizationId } }],
      queryFn: () => api.organization.get.query({ organizationId }),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    organizations: query.data?.organizations ?? [],
    activeOrganizationId: query.data?.activeOrganizationId,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    prefetchOrganization,
  };
}