import { useEffect, useRef, useState, useCallback } from 'react';
import { TRPCClientError } from '@trpc/client';
import { logger } from '@/lib/core/debug/unified-logger';
import { useErrorDetection } from '@/hooks/useErrorDetection';
import { showErrorAlert } from '@/lib/core/alert';

interface ApiSubscriptionOptions<TData> {
  enabled?: boolean;
  onData?: (data: TData) => void;
  onError?: (error: TRPCClientError<any>) => void;
  onComplete?: () => void;
  onStarted?: () => void;
  showErrorAlert?: boolean;
  errorTitle?: string;
  errorMessage?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

interface ApiSubscriptionResult<TData> {
  data: TData | undefined;
  error: TRPCClientError<any> | null;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * Enhanced TRPC subscription hook with error handling and reconnection logic
 */
export function useApiSubscription<TData>(
  subscriptionKey: string[],
  subscriptionFn: () => any, // TRPC subscription function
  options?: ApiSubscriptionOptions<TData>
): ApiSubscriptionResult<TData> {
  const { handleTRPCError } = useErrorDetection();
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<TRPCClientError<any> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const subscriptionRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);

  const {
    enabled = true,
    onData,
    onError,
    onComplete,
    onStarted,
    showErrorAlert: shouldShowAlert = true,
    errorTitle = 'Connection Error',
    errorMessage,
    retryAttempts = 3,
    retryDelay = 5000,
  } = options || {};

  // Cleanup function
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe?.();
      subscriptionRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setIsConnected(false);
    setIsReconnecting(false);
  }, []);

  // Connect function
  const connect = useCallback(() => {
    if (!enabled || subscriptionRef.current) return;

    try {
      logger.debug('Starting subscription', 'API', { key: subscriptionKey });
      
      const subscription = subscriptionFn();
      
      subscription.subscribe({
        onStarted: () => {
          logger.debug('Subscription started', 'API', { key: subscriptionKey });
          setIsConnected(true);
          setIsReconnecting(false);
          setError(null);
          retryCountRef.current = 0;
          onStarted?.();
        },
        onData: (value: TData) => {
          logger.debug('Subscription data received', 'API', { 
            key: subscriptionKey,
            data: value,
          });
          setData(value);
          onData?.(value);
        },
        onError: (err: TRPCClientError<any>) => {
          logger.error('Subscription error', 'API', {
            key: subscriptionKey,
            error: err.message,
            code: err.data?.code,
          });
          
          setError(err);
          setIsConnected(false);
          handleTRPCError(err);
          
          // Show alert if enabled
          if (shouldShowAlert) {
            const message = errorMessage || err.message || 'Connection lost';
            showErrorAlert(errorTitle, message);
          }
          
          onError?.(err);
          
          // Attempt reconnection
          if (retryCountRef.current < retryAttempts) {
            setIsReconnecting(true);
            retryCountRef.current++;
            
            logger.debug('Scheduling reconnection', 'API', {
              attempt: retryCountRef.current,
              maxAttempts: retryAttempts,
              delay: retryDelay,
            });
            
            retryTimeoutRef.current = setTimeout(() => {
              cleanup();
              connect();
            }, retryDelay * retryCountRef.current) as any;
          }
        },
        onComplete: () => {
          logger.debug('Subscription completed', 'API', { key: subscriptionKey });
          setIsConnected(false);
          onComplete?.();
        },
      });
      
      subscriptionRef.current = subscription;
    } catch (error) {
      logger.error('Failed to create subscription', 'API', error);
      setError(error as TRPCClientError<any>);
      
      if (shouldShowAlert) {
        showErrorAlert(errorTitle, 'Failed to establish connection');
      }
    }
  }, [
    enabled,
    subscriptionFn,
    subscriptionKey,
    onStarted,
    onData,
    onError,
    onComplete,
    shouldShowAlert,
    errorTitle,
    errorMessage,
    retryAttempts,
    retryDelay,
    cleanup,
    handleTRPCError,
  ]);

  // Disconnect function
  const disconnect = useCallback(() => {
    logger.debug('Disconnecting subscription', 'API', { key: subscriptionKey });
    cleanup();
  }, [cleanup, subscriptionKey]);

  // Reconnect function
  const reconnect = useCallback(() => {
    logger.debug('Manual reconnection requested', 'API', { key: subscriptionKey });
    retryCountRef.current = 0;
    cleanup();
    connect();
  }, [cleanup, connect, subscriptionKey]);

  // Effect to manage subscription lifecycle
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      cleanup();
    }

    return cleanup;
  }, [enabled, connect, cleanup]);

  return {
    data,
    error,
    isConnected,
    isReconnecting,
    reconnect,
    disconnect,
  };
}

/**
 * Healthcare-specific subscription hook
 */
export function useHealthcareSubscription<TData>(
  subscriptionKey: string[],
  subscriptionFn: () => any,
  options?: ApiSubscriptionOptions<TData>
): ApiSubscriptionResult<TData> {
  return useApiSubscription(subscriptionKey, subscriptionFn, {
    errorTitle: 'Healthcare Connection Error',
    retryAttempts: 5, // More retries for critical healthcare data
    retryDelay: 3000, // Shorter delay for healthcare
    ...options,
  });
}