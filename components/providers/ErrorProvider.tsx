import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useErrorDetection, ErrorType } from '@/hooks/useErrorDetection';
import { useRouter } from 'expo-router';
import { ROUTES } from '@/lib/navigation/routes';
import { logger } from '@/lib/core/debug/unified-logger';
import { showErrorAlert } from '@/lib/core/alert';
import { useAuth } from '@/hooks/useAuth';

interface ErrorRecoveryStrategy {
  type: ErrorType;
  action: () => void | Promise<void>;
  label: string;
  description?: string;
}

interface ErrorContextValue {
  error: {
    type: ErrorType;
    message?: string;
    statusCode?: number;
    retryAfter?: number;
    requestId?: string;
  } | null;
  isOnline: boolean;
  clearError: () => void;
  setError: (error: any) => void;
  recoveryStrategies: ErrorRecoveryStrategy[];
  executeRecovery: (strategy: ErrorRecoveryStrategy) => Promise<void>;
  isRecovering: boolean;
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
}

interface ErrorProviderProps {
  children: React.ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const { error, isOnline, clearError, setError } = useErrorDetection();
  const router = useRouter();
  const { checkSession } = useAuth();
  const [isRecovering, setIsRecovering] = useState(false);

  // Define recovery strategies based on error type
  const getRecoveryStrategies = useCallback((): ErrorRecoveryStrategy[] => {
    if (!error) return [];

    const strategies: ErrorRecoveryStrategy[] = [];

    switch (error.type) {
      case 'session-timeout':
        strategies.push({
          type: 'session-timeout',
          action: async () => {
            try {
              await checkSession();
              clearError();
            } catch (err) {
              logger.auth.error('Session refresh failed:', err);
              router.replace(ROUTES.auth.login);
            }
          },
          label: 'Refresh Session',
          description: 'Attempt to restore your session',
        });
        strategies.push({
          type: 'session-timeout',
          action: () => {
            router.replace(ROUTES.auth.login);
          },
          label: 'Return to Login',
          description: 'Sign in again to continue',
        });
        break;

      case 'connection-lost':
        strategies.push({
          type: 'connection-lost',
          action: async () => {
            // Wait for connection to restore
            const checkConnection = () => {
              return new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                  if (isOnline) {
                    clearInterval(interval);
                    clearError();
                    resolve();
                  }
                }, 1000);
              });
            };
            await checkConnection();
          },
          label: 'Wait for Connection',
          description: 'We\'ll automatically retry when connection is restored',
        });
        break;

      case 'unauthorized':
        strategies.push({
          type: 'unauthorized',
          action: () => {
            router.replace(ROUTES.auth.login);
          },
          label: 'Sign In Again',
          description: 'Your access has been revoked',
        });
        break;

      case 'server-error':
        strategies.push({
          type: 'server-error',
          action: () => {
            clearError();
            router.replace(ROUTES.APP.home);
          },
          label: 'Return Home',
          description: 'Try again later',
        });
        break;

      case 'rate-limit':
        const waitTime = error.retryAfter || 60;
        strategies.push({
          type: 'rate-limit',
          action: async () => {
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            clearError();
          },
          label: `Wait ${waitTime} seconds`,
          description: 'You\'ve made too many requests',
        });
        break;

      case 'profile-incomplete':
        // Hospital selection is now optional - direct to settings
        strategies.push({
          type: 'profile-incomplete',
          action: () => {
            clearError();
            router.push('/(tabs)/settings' as any);
          },
          label: 'Go to Settings',
          description: 'Select a hospital in settings when you\'re ready',
        });
        strategies.push({
          type: 'profile-incomplete',
          action: () => {
            clearError();
          },
          label: 'Continue',
          description: 'Continue without hospital selection',
        });
        break;
    }

    return strategies;
  }, [error, isOnline, clearError, checkSession, router]);

  // Execute recovery strategy
  const executeRecovery = useCallback(async (strategy: ErrorRecoveryStrategy) => {
    setIsRecovering(true);
    try {
      await strategy.action();
      logger.info('Recovery strategy executed', 'ERROR', { strategy: strategy.label });
    } catch (err) {
      logger.error('Recovery strategy failed', 'ERROR', err);
      showErrorAlert('Recovery failed. Please try again.');
    } finally {
      setIsRecovering(false);
    }
  }, []);

  // Auto-execute certain recovery strategies
  useEffect(() => {
    if (!error) return;

    // Auto-retry for connection lost when online again
    if (error.type === 'connection-lost' && isOnline) {
      clearError();
      logger.info('Connection restored, clearing error');
    }
  }, [error, isOnline, clearError]);

  const contextValue: ErrorContextValue = {
    error,
    isOnline,
    clearError,
    setError,
    recoveryStrategies: getRecoveryStrategies(),
    executeRecovery,
    isRecovering,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
}