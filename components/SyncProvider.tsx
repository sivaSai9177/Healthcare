import React, { useEffect } from 'react';
import { api } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { log } from '@/lib/core/logger';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { updateAuth, clearAuth, user, hasHydrated } = useAuth();
  
  // Keep auth state synchronized between server and client using TanStack Query
  const { data, error } = api.auth.getSession.useQuery(undefined, {
    // Only run the query after hydration and if we don't have a user
    // This prevents unnecessary auth checks on app startup
    enabled: hasHydrated && !user,
    
    // Poll every 5 minutes (reduced frequency to minimize rerenders)
    refetchInterval: 5 * 60 * 1000,
    
    // Refetch on app focus
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    
    // Consider data fresh for 10 minutes
    staleTime: 10 * 60 * 1000,
    
    // Keep in cache for 30 minutes
    gcTime: 30 * 60 * 1000,
    
    // Don't refetch on mount if data is fresh
    refetchOnMount: false,
  });
  
  // Handle state updates with useEffect (TanStack Query v5 pattern)
  useEffect(() => {
    // Only update if we have actual data
    if (data && (data as any).user) {
      updateAuth((data as any).user, (data as any).session);
    }
    // Don't clear auth just because the query returned null
    // Let the error handler deal with actual auth failures
  }, [data, updateAuth]);
  
  // Handle auth errors
  useEffect(() => {
    if (error?.data?.httpStatus === 401) {
      clearAuth();
      log.auth.error('Auth error, clearing session', error);
    }
  }, [error, clearAuth]);
  
  return <>{children}</>;
}