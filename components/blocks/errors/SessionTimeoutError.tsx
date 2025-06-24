import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ErrorPage } from './ErrorPage';
import { useAuth } from '@/hooks/useAuth';
import { Text } from '@/components/universal/typography';
import { VStack } from '@/components/universal/layout';
import { Card } from '@/components/universal/display';
import { logger } from '@/lib/core/debug/unified-logger';

interface SessionTimeoutErrorProps {
  onRetry?: () => void;
}

export function SessionTimeoutError({ onRetry }: SessionTimeoutErrorProps) {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, refreshSession } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  useEffect(() => {
    logger.auth.sessionTimeout('Session timeout error displayed');
    
    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleLogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    logger.auth.info('Attempting to refresh session from timeout error');
    
    try {
      await refreshSession();
      
      // Check if refresh was successful
      if (isAuthenticated) {
        logger.auth.success('Session refreshed successfully');
        if (onRetry) {
          onRetry();
        } else {
          router.replace('/home');
        }
      } else {
        logger.auth.error('Session refresh failed');
        handleLogin();
      }
    } catch (error) {
      logger.auth.error('Session refresh error', { error });
      handleLogin();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleLogin = () => {
    logger.auth.navigate('Redirecting to login from session timeout');
    router.replace('/(public)/auth/login');
  };
  
  return (
    <ErrorPage
      type="session-timeout"
      title="Session Expired"
      message="Your session has expired for security reasons. Please sign in again to continue."
      icon="clock.arrow.circlepath"
      primaryAction={{
        label: isRefreshing ? 'Refreshing...' : 'Try to Refresh Session',
        onPress: handleRefresh,
        variant: 'default',
      }}
      secondaryAction={{
        label: `Sign In Again (${countdown}s)`,
        onPress: handleLogin,
        variant: 'outline',
      }}
      debugInfo={`Authenticated: ${isAuthenticated}\nHydrated: ${hasHydrated}\nCountdown: ${countdown}s`}
    >
      <Card className="p-4 bg-warning/10">
        <VStack gap={2}>
          <Text size="sm" weight="semibold" className="text-warning">
            Why did this happen?
          </Text>
          <Text size="xs" colorTheme="mutedForeground">
            • You were inactive for more than 5 minutes
          </Text>
          <Text size="xs" colorTheme="mutedForeground">
            • Your session token expired
          </Text>
          <Text size="xs" colorTheme="mutedForeground">
            • Security policy requires re-authentication
          </Text>
        </VStack>
      </Card>
    </ErrorPage>
  );
}