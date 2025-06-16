import React, { useEffect } from 'react';
import { api } from '@/lib/api/trpc';
import { useAuth } from '@/hooks/useAuth';
import { log } from '@/lib/core/debug/logger';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { updateAuth, clearAuth, hasHydrated } = useAuth();
  
  // Keep auth state synchronized between server and client using TanStack Query
  const { data, error } = api.auth.getSession.useQuery(undefined, {
    // Always enable the query after hydration to verify session
    enabled: hasHydrated,
    
    // Don&apos;t retry too many times on mobile to prevent blocking
    retry: 1,
    
    // Poll every 5 minutes (reduced frequency to minimize rerenders)
    refetchInterval: 5 * 60 * 1000,
    
    // Refetch on app focus only on web
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    
    // Consider data fresh for 10 minutes
    staleTime: 10 * 60 * 1000,
    
    // Keep in cache for 30 minutes
    gcTime: 30 * 60 * 1000,
    
    // Don&apos;t refetch on mount if data is fresh
    refetchOnMount: false,
  });
  
  // Handle state updates with useEffect (TanStack Query v5 pattern)
  useEffect(() => {
    // Log the response for debugging
    log.debug('SyncProvider getSession response', 'AUTH_SYNC', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      hasUser: !!(data as any)?.user,
      hasSession: !!(data as any)?.session,
    });
    
    // Only update if we have actual data with both user and session
    if (data && (data as any).user && (data as any).session) {
      const { user, session } = data as any;
      log.debug('Updating auth from server session', 'AUTH_SYNC', {
        userId: user.id,
        userRole: user.role,
        sessionId: session.id,
      });
      updateAuth(user, session);
    } else if (data === null) {
      // Server explicitly returned null (no session)
      log.debug('Server returned null session, clearing auth', 'AUTH_SYNC');
      clearAuth();
    }
    // Don't clear auth if data is undefined (loading state)
  }, [data, updateAuth, clearAuth]);
  
  // Handle auth errors
  useEffect(() => {
    if (error?.data?.httpStatus === 401) {
      clearAuth();
      log.auth.error('Auth error, clearing session', error);
    }
  }, [error, clearAuth]);
  
  return <>{children}</>;
}