import React, { useState, useEffect, ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { ConnectionLostError } from '@/components/blocks/errors/ConnectionLostError';
import { ErrorPage } from '@/components/blocks/errors/ErrorPage';
import { extractAuthError, AUTH_ERROR_CODES } from '@/lib/auth/error-handling';
import { logger } from '@/lib/core/debug/server-logger';

interface AuthScreenWrapperProps {
  children: ReactNode;
  isLoading?: boolean;
  error?: any;
  onRetry?: () => void;
  onBackToLogin?: () => void;
  screenName: string;
}

export function AuthScreenWrapper({
  children,
  isLoading = false,
  error = null,
  onRetry,
  onBackToLogin,
  screenName
}: AuthScreenWrapperProps) {
  const theme = useTheme();
  const { isOffline } = useNetworkStatus();
  const [renderError, setRenderError] = useState<any>(null);

  useEffect(() => {
    if (error) {
      logger.auth.error(`Error in ${screenName}`, error);
    }
  }, [error, screenName]);

  // Handle render errors
  useEffect(() => {
    const errorHandler = (event: any) => {
      logger.auth.error(`Render error in ${screenName}`, event.error);
      setRenderError(event.error);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('error', errorHandler);
      return () => window.removeEventListener('error', errorHandler);
    }
  }, [screenName]);

  // Show loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Show offline state
  if (isOffline) {
    return (
      <ConnectionLostError
        onRetry={onRetry}
        onOfflineMode={onBackToLogin}
      />
    );
  }

  // Show error state
  if (error || renderError) {
    const displayError = error || renderError;
    const authError = extractAuthError(displayError);
    
    // Determine error type and appropriate actions
    const isSessionError = authError.code === AUTH_ERROR_CODES.SESSION_EXPIRED || 
                          authError.code === AUTH_ERROR_CODES.UNAUTHORIZED;
    
    const isRateLimit = authError.code === AUTH_ERROR_CODES.RATE_LIMIT || 
                        authError.code === AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS;

    if (isRateLimit) {
      return (
        <ErrorPage
          type="rate-limit"
          title="Too Many Attempts"
          message={authError.message}
          icon="clock.badge.exclamationmark"
          primaryAction={onBackToLogin ? {
            label: 'Back to Login',
            onPress: onBackToLogin,
            variant: 'outline',
          } : undefined}
          debugInfo={`Screen: ${screenName}\nError Code: ${authError.code}`}
        />
      );
    }

    if (isSessionError) {
      return (
        <ErrorPage
          type="session-timeout"
          title="Session Expired"
          message={authError.message}
          icon="clock.arrow.circlepath"
          primaryAction={onBackToLogin ? {
            label: 'Sign In Again',
            onPress: onBackToLogin,
            variant: 'default',
          } : undefined}
          debugInfo={`Screen: ${screenName}\nError Code: ${authError.code}`}
        />
      );
    }

    // Generic error
    return (
      <ErrorPage
        type="server-error"
        title="Something Went Wrong"
        message={authError.message}
        icon="exclamationmark.triangle"
        primaryAction={onRetry ? {
          label: 'Try Again',
          onPress: () => {
            setRenderError(null);
            onRetry();
          },
          variant: 'default',
        } : undefined}
        secondaryAction={onBackToLogin ? {
          label: 'Back to Login',
          onPress: onBackToLogin,
          variant: 'outline',
        } : undefined}
        debugInfo={`Screen: ${screenName}\nError Code: ${authError.code}\nRetryable: ${authError.isRetryable}`}
      />
    );
  }

  // Render children when everything is fine
  return <>{children}</>;
}

// HOC version for easier use
export function withAuthErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  screenName: string
) {
  return (props: P & { onBackToLogin?: () => void }) => {
    return (
      <AuthScreenWrapper screenName={screenName} onBackToLogin={props.onBackToLogin}>
        <Component {...props} />
      </AuthScreenWrapper>
    );
  };
}