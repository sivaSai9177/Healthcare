import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './useAuth';
import { logger } from '@/lib/core/debug/unified-logger';

import { SafeNetInfo } from '@/lib/utils/safe-netinfo';

export type ErrorType = 
  | 'session-timeout' 
  | 'connection-lost' 
  | 'unauthorized' 
  | 'server-error' 
  | 'rate-limit'
  | 'connectivity-check'
  | 'profile-incomplete'
  | null;

interface ErrorInfo {
  type: ErrorType;
  statusCode?: number;
  message?: string;
  retryAfter?: number;
  requestId?: string;
}

export function useErrorDetection() {
  const { isAuthenticated, hasHydrated } = useAuth();
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastAuthState, setLastAuthState] = useState<boolean | null>(null);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Set error with logging
  const setErrorWithLogging = useCallback((errorInfo: ErrorInfo | null) => {
    if (errorInfo) {
      logger.error(`Error detected: ${errorInfo.type || 'unknown'}`, 'ERROR', {
        type: errorInfo.type,
        message: errorInfo.message,
        statusCode: errorInfo.statusCode,
        retryAfter: errorInfo.retryAfter,
        requestId: errorInfo.requestId,
      });
    }
    setError(errorInfo);
  }, []);
  
  // Monitor network connectivity (disabled in development to avoid false positives)
  useEffect(() => {
    // Skip NetInfo monitoring in development as it causes false connection errors
    if (__DEV__) {
      setIsOnline(true);
      return;
    }
    
    let unsubscribe: (() => void) | undefined;
    
    try {
      unsubscribe = SafeNetInfo.addEventListener(state => {
        // isInternetReachable can be null initially, treat null as connected
        const connected = state.isConnected && (state.isInternetReachable !== false);
        setIsOnline(connected || false);
        
        // Only show connection lost if we're definitely offline
        if (state.isConnected === false && error?.type !== 'connection-lost') {
          setErrorWithLogging({
            type: 'connection-lost',
          message: 'Internet connection lost',
        });
      } else if (connected && error?.type === 'connection-lost') {
        clearError();
      }
      });
      
      // Check initial connection state
      SafeNetInfo.fetch()
        .then(state => {
          const connected = state.isConnected && (state.isInternetReachable !== false);
          setIsOnline(connected || false);
        })
        .catch(err => {
          // Ignore abort errors
          if (err?.name !== 'AbortError') {
            console.warn('Initial NetInfo fetch error:', err);
          }
          // Assume online if check fails
          setIsOnline(true);
        });
    } catch (error) {
      // If NetInfo is not available or fails, assume online
      console.warn('NetInfo not available:', error);
      setIsOnline(true);
    }
    
    return () => unsubscribe?.();
  }, [error, setErrorWithLogging, clearError]);
  
  // Monitor auth state changes for session timeout
  useEffect(() => {
    if (!hasHydrated) return;
    
    // Initialize last auth state
    if (lastAuthState === null) {
      setLastAuthState(isAuthenticated);
      return;
    }
    
    // Detect session timeout (was authenticated, now not)
    if (lastAuthState === true && isAuthenticated === false) {
      setErrorWithLogging({
        type: 'session-timeout',
        message: 'Your session has expired',
      });
    }
    
    setLastAuthState(isAuthenticated);
  }, [isAuthenticated, hasHydrated, lastAuthState, setErrorWithLogging]);
  
  // Monitor app state for connection issues
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Re-check connection when app becomes active
        SafeNetInfo.fetch()
          .then(state => {
            const connected = state.isConnected && (state.isInternetReachable !== false);
            setIsOnline(connected || false);
            
            // Clear connection error if we're back online
            if (connected && error?.type === 'connection-lost') {
              clearError();
            }
          })
          .catch(err => {
            // Ignore abort errors from internetReachability
            if (err?.name !== 'AbortError') {
              console.warn('NetInfo fetch error:', err);
            }
          });
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [error, clearError]);
  
  // Check if error is from connectivity check
  const isConnectivityCheckError = useCallback((error: any): boolean => {
    const errorString = String(error).toLowerCase();
    const messageString = error?.message?.toLowerCase() || '';
    
    const connectivityUrls = [
      'clients3.google.com/generate_204',
      'connectivitycheck.gstatic.com',
      'captive.apple.com',
    ];
    
    const isConnectivityUrl = connectivityUrls.some(url => 
      errorString.includes(url) || messageString.includes(url)
    );
    
    const isAbortError = errorString.includes('abort') || messageString.includes('abort');
    
    return isConnectivityUrl && isAbortError;
  }, []);

  // Handle TRPC errors - this can be called from error handlers
  const handleTRPCError = useCallback((error: any) => {
    // Ignore connectivity check errors
    if (isConnectivityCheckError(error)) {
      logger.debug('Ignoring connectivity check error', error);
      return;
    }
    
    // Handle different error types
    if (error.data?.code === 'UNAUTHORIZED' || error.data?.httpStatus === 401) {
      setErrorWithLogging({
        type: 'unauthorized',
        statusCode: 401,
        message: error.message,
      });
    } else if (error.data?.httpStatus === 403 && 
               (error.message?.includes('Hospital assignment required') || 
                error.message?.includes('complete your profile'))) {
      setErrorWithLogging({
        type: 'profile-incomplete',
        statusCode: 403,
        message: error.message || 'Please complete your profile to access healthcare features',
      });
    } else if (error.data?.httpStatus === 429) {
      const retryAfter = error.data?.retryAfter || 60;
      setErrorWithLogging({
        type: 'rate-limit',
        statusCode: 429,
        message: error.message,
        retryAfter,
      });
    } else if (error.data?.httpStatus >= 500) {
      setErrorWithLogging({
        type: 'server-error',
        statusCode: error.data.httpStatus,
        message: error.message,
        requestId: error.data?.requestId,
      });
    }
  }, [setErrorWithLogging, isConnectivityCheckError]);
  
  return {
    error,
    clearError,
    isOnline,
    setError: setErrorWithLogging,
    handleTRPCError,
  };
}