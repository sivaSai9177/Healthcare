import { useEffect } from 'react';
import { useErrorDetection } from '@/hooks/useErrorDetection';

/**
 * Hook to set up global error store for TRPC error handling
 * This allows the TRPC error link to access error detection functions
 */
export function useGlobalErrorStore() {
  const { handleTRPCError } = useErrorDetection();

  useEffect(() => {
    // Store the error handler globally so TRPC can access it
    if (typeof window !== 'undefined') {
      (window as any).__errorDetectionStore = {
        handleTRPCError,
      };
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__errorDetectionStore;
      }
    };
  }, [handleTRPCError]);
}