import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { logger } from '@/lib/core/debug/unified-logger';
import { showErrorAlert, showSuccessAlert } from '@/lib/core/alert';
import { useErrorDetection } from '@/hooks/useErrorDetection';
import { api } from '@/lib/api/trpc';
import { haptic } from '@/lib/ui/haptics';

interface ApiMutationOptions<TData, TVariables, TContext = unknown> 
  extends Omit<UseMutationOptions<TData, TRPCClientError<any>, TVariables, TContext>, 'mutationFn'> {
  // Custom options
  showErrorAlert?: boolean;
  showSuccessAlert?: boolean;
  errorTitle?: string;
  errorMessage?: string;
  successTitle?: string;
  successMessage?: string;
  invalidateQueries?: string[][];
  hapticFeedback?: boolean;
}

type ApiMutationResult<TData, TVariables, TContext = unknown> = 
  UseMutationResult<TData, TRPCClientError<any>, TVariables, TContext> & {
    mutateWithFeedback: (variables: TVariables) => Promise<TData | undefined>;
  };

/**
 * Enhanced TRPC mutation hook with error handling, optimistic updates, and feedback
 */
export function useApiMutation<TData = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: ApiMutationOptions<TData, TVariables, TContext>
): ApiMutationResult<TData, TVariables, TContext> {
  const { handleTRPCError } = useErrorDetection();
  const utils = api.useUtils();
  
  const {
    showErrorAlert: shouldShowErrorAlert = true,
    showSuccessAlert: shouldShowSuccessAlert = true,
    errorTitle = 'Error',
    errorMessage,
    successTitle = 'Success',
    successMessage,
    invalidateQueries = [],
    hapticFeedback = true,
    onError,
    onSuccess,
    onMutate,
    onSettled,
    ...mutationOptions
  } = options || {};

  // Enhanced mutation with error handling
  const mutation = useMutation<TData, TRPCClientError<any>, TVariables, TContext>({
    mutationFn,
    onMutate: async (variables) => {
      // Haptic feedback on action
      if (hapticFeedback && Platform.OS !== 'web') {
        haptic('light');
      }

      // Cancel outgoing queries if optimistic
      // Note: tRPC utils doesn't have granular cancel, we'll handle this in onSettled

      // Call original onMutate
      return onMutate?.(variables);
    },
    onError: (error, variables, context) => {
      // Track error
      handleTRPCError(error);

      // Log error
      logger.error('API mutation error', 'API', {
        error: error.message,
        code: error.data?.code,
        variables,
      });

      // Haptic feedback for error
      if (hapticFeedback && Platform.OS !== 'web') {
        haptic('error');
      }

      // Show error alert
      if (shouldShowErrorAlert) {
        const message = errorMessage || error.message || 'An error occurred';
        showErrorAlert(errorTitle, message);
      }

      // Call original onError
      onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      // Log success
      logger.debug('API mutation success', 'API', {
        data,
        variables,
      });

      // Haptic feedback for success
      if (hapticFeedback && Platform.OS !== 'web') {
        haptic('success');
      }

      // Show success alert
      if (shouldShowSuccessAlert) {
        const message = successMessage || 'Operation completed successfully';
        showSuccessAlert(successTitle, message);
      }

      // Call original onSuccess
      onSuccess?.(data, variables, context);
    },
    onSettled: async (data, error, variables, context) => {
      // Invalidate all queries (tRPC utils invalidates all cached data)
      if (invalidateQueries.length > 0) {
        await utils.invalidate();
      }

      // Call original onSettled
      onSettled?.(data, error, variables, context);
    },
    ...mutationOptions,
  });

  // Wrapper function with built-in feedback
  const mutateWithFeedback = useCallback(async (variables: TVariables) => {
    try {
      const result = await mutation.mutateAsync(variables);
      return result;
    } catch {
      // Error is already handled in onError
      return undefined;
    }
  }, [mutation]);

  return {
    ...mutation,
    mutateWithFeedback,
  };
}

/**
 * Healthcare-specific mutation hook with optimistic updates
 */
export function useHealthcareMutation<TData = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: ApiMutationOptions<TData, TVariables, TContext>
): ApiMutationResult<TData, TVariables, TContext> {
  return useApiMutation(mutationFn, {
    errorTitle: 'Healthcare Error',
    successTitle: 'Healthcare Update',
    hapticFeedback: true,
    ...options,
  });
}

/**
 * Organization-specific mutation hook
 */
export function useOrganizationMutation<TData = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: ApiMutationOptions<TData, TVariables, TContext>
): ApiMutationResult<TData, TVariables, TContext> {
  return useApiMutation(mutationFn, {
    errorTitle: 'Organization Error',
    successTitle: 'Organization Update',
    ...options,
  });
}

/**
 * Auth-specific mutation hook (no optimistic updates for security)
 */
export function useAuthMutation<TData = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: ApiMutationOptions<TData, TVariables, TContext>
): ApiMutationResult<TData, TVariables, TContext> {
  return useApiMutation(mutationFn, {
    errorTitle: 'Authentication Error',
    showSuccessAlert: false, // Auth success handled separately
    ...options,
  });
}