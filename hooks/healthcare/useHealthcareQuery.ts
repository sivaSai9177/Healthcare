import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { TRPCClientError } from '@trpc/client';
import { useErrorDetection } from '@/hooks/useErrorDetection';
import { logger } from '@/lib/core/debug/unified-logger';
import { ROUTES } from '@/lib/navigation/routes';

interface UseHealthcareQueryOptions {
  onProfileIncomplete?: () => void;
  redirectToProfile?: boolean;
}

export function useHealthcareQuery(
  queryResult: any,
  options: UseHealthcareQueryOptions = {}
) {
  const { handleTRPCError } = useErrorDetection();
  const router = useRouter();
  const { 
    onProfileIncomplete, 
    redirectToProfile = true 
  } = options;

  useEffect(() => {
    if (queryResult.error) {
      const error = queryResult.error;
      
      // Check if it's a profile incomplete error
      if (error instanceof TRPCClientError) {
        const isProfileIncomplete = 
          error.data?.httpStatus === 403 && 
          (error.message?.includes('Hospital assignment required') || 
           error.message?.includes('complete your profile'));

        if (isProfileIncomplete) {
          logger.info('Healthcare query failed: Profile incomplete');
          
          // Call custom handler if provided
          if (onProfileIncomplete) {
            onProfileIncomplete();
          } else if (redirectToProfile) {
            // Default behavior: redirect to profile completion
            router.replace(ROUTES.auth.completeProfile);
          }
        }
        
        // Let the global error handler deal with the error
        handleTRPCError(error);
      }
    }
  }, [queryResult.error, handleTRPCError, router, onProfileIncomplete, redirectToProfile]);

  return queryResult;
}

// Helper hook for healthcare mutations
export function useHealthcareMutation(
  mutationResult: any,
  options: UseHealthcareQueryOptions = {}
) {
  const { handleTRPCError } = useErrorDetection();
  const router = useRouter();
  const { 
    onProfileIncomplete, 
    redirectToProfile = true 
  } = options;

  // Handle mutation errors
  useEffect(() => {
    if (mutationResult.error) {
      const error = mutationResult.error;
      
      if (error instanceof TRPCClientError) {
        const isProfileIncomplete = 
          error.data?.httpStatus === 403 && 
          (error.message?.includes('Hospital assignment required') || 
           error.message?.includes('complete your profile'));

        if (isProfileIncomplete) {
          logger.info('Healthcare mutation failed: Profile incomplete');
          
          if (onProfileIncomplete) {
            onProfileIncomplete();
          } else if (redirectToProfile) {
            router.replace(ROUTES.auth.completeProfile);
          }
        }
        
        handleTRPCError(error);
      }
    }
  }, [mutationResult.error, handleTRPCError, router, onProfileIncomplete, redirectToProfile]);

  return mutationResult;
}