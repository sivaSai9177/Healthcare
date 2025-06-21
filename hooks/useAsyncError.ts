import { useCallback, useRef, useState } from 'react';
import { useError } from '@/components/providers/ErrorProvider';
import { logger } from '@/lib/core/debug/unified-logger';

interface AsyncErrorOptions {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  retries?: number;
  retryDelay?: number;
  fallbackValue?: any;
}

export function useAsyncError(options: AsyncErrorOptions = {}) {
  const { setError } = useError();
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<Error | null>(null);
  const retryCountRef = useRef(0);

  const handleError = useCallback((error: Error, context?: string) => {
    logger.error(`Async error${context ? ` in ${context}` : ''}`, 'ERROR', error);
    
    setLocalError(error);
    
    // Set global error for specific error types
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      setError({
        type: 'unauthorized',
        message: 'Your session has expired. Please sign in again.',
        statusCode: 401,
      });
    } else if (error.message.includes('Network request failed') || error.message.includes('fetch failed')) {
      setError({
        type: 'connection-lost',
        message: 'Unable to connect to the server. Please check your internet connection.',
      });
    } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      setError({
        type: 'server-error',
        message: 'Something went wrong on our end. Please try again later.',
        statusCode: 500,
      });
    }

    if (options.onError) {
      options.onError(error);
    }
  }, [setError, options]);

  const executeAsync = useCallback(async <T,>(
    asyncFunction: () => Promise<T>,
    context?: string
  ): Promise<T | undefined> => {
    setIsLoading(true);
    setLocalError(null);
    retryCountRef.current = 0;

    const maxRetries = options.retries || 0;
    const retryDelay = options.retryDelay || 1000;

    const attemptExecution = async (): Promise<T | undefined> => {
      try {
        const result = await asyncFunction();
        
        if (options.onSuccess) {
          options.onSuccess();
        }
        
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          logger.warn(`Retrying ${context || 'operation'} (${retryCountRef.current}/${maxRetries})`, 'ERROR');
          
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, retryCountRef.current - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return attemptExecution();
        }
        
        handleError(err, context);
        
        if (options.fallbackValue !== undefined) {
          return options.fallbackValue;
        }
        
        throw err;
      } finally {
        setIsLoading(false);
      }
    };

    return attemptExecution();
  }, [options, handleError]);

  const clearLocalError = useCallback(() => {
    setLocalError(null);
  }, []);

  return {
    executeAsync,
    isLoading,
    error: localError,
    clearError: clearLocalError,
  };
}

// Hook for wrapping async functions with error handling
export function useAsyncErrorHandler() {
  const { executeAsync } = useAsyncError();
  
  return useCallback(<T extends (...args: any[]) => Promise<any>>(
    asyncFunction: T,
    context?: string
  ) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      return executeAsync(() => asyncFunction(...args), context);
    };
  }, [executeAsync]);
}