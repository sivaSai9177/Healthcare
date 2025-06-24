import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ErrorPage } from './ErrorPage';
import { Text } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout';
import { Card } from '@/components/universal/display';
import { Symbol } from '@/components/universal/display/Symbols';
import { useTheme } from '@/lib/theme/provider';
import { logger } from '@/lib/core/debug/unified-logger';
import { ProgressBar } from '@/components/universal/feedback';

interface RateLimitErrorProps {
  retryAfter?: number; // seconds until rate limit resets
  limit?: number; // requests allowed
  window?: number; // time window in seconds
  onRetry?: () => void;
}

export function RateLimitError({ 
  retryAfter = 60,
  limit,
  window,
  onRetry 
}: RateLimitErrorProps) {
  const router = useRouter();
  const theme = useTheme();
  const [timeRemaining, setTimeRemaining] = useState(retryAfter);
  const [canRetry, setCanRetry] = useState(false);
  
  useEffect(() => {
    logger.api.rateLimit('Rate limit error displayed', {
      retryAfter,
      limit,
      window,
    });
    
    // Countdown timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanRetry(true);
          logger.api.info('Rate limit expired, retry available');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [retryAfter, limit, window]);
  
  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };
  
  const handleRetry = () => {
    if (!canRetry) return;
    
    logger.api.info('Retrying after rate limit');
    if (onRetry) {
      onRetry();
    } else {
      router.replace(router);
    }
  };
  
  const handleGoHome = () => {
    logger.router.navigate('rate-limit-error', '/home');
    router.replace('/home');
  };
  
  const progress = ((retryAfter - timeRemaining) / retryAfter) * 100;
  
  return (
    <ErrorPage
      type="rate-limit"
      title="Too Many Requests"
      message="You've made too many requests. Please wait before trying again."
      icon="speedometer"
      primaryAction={{
        label: canRetry ? 'Try Again' : `Wait ${formatTime(timeRemaining)}`,
        onPress: handleRetry,
        variant: canRetry ? 'default' : 'outline',
      }}
      secondaryAction={{
        label: 'Go to Home',
        onPress: handleGoHome,
        variant: 'ghost',
      }}
      debugInfo={`Rate Limit: ${limit || 'Unknown'} requests per ${window || 'Unknown'} seconds\nRetry After: ${retryAfter}s\nTime Remaining: ${timeRemaining}s`}
    >
      <VStack gap={4} className="w-full">
        {/* Countdown Timer */}
        <Card className="p-4">
          <VStack gap={3}>
            <HStack gap={2} align="center" justify="between">
              <HStack gap={2} align="center">
                <Symbol name="timer" size={20} color={theme.warning} />
                <Text size="sm" weight="semibold">Wait Time</Text>
              </HStack>
              <Text size="lg" weight="bold" className="font-mono text-warning">
                {formatTime(timeRemaining)}
              </Text>
            </HStack>
            
            <ProgressBar 
              progress={progress} 
              className="h-2"
              indicatorClassName="bg-warning"
            />
            
            {canRetry && (
              <HStack gap={2} align="center" className="mt-2">
                <Symbol name="checkmark.circle.fill" size={16} color={theme.success} />
                <Text size="xs" className="text-success">
                  You can try again now!
                </Text>
              </HStack>
            )}
          </VStack>
        </Card>
        
        {/* Rate Limit Info */}
        {(limit || window) && (
          <Card className="p-4 bg-warning/10">
            <VStack gap={3}>
              <HStack gap={2} align="center">
                <Symbol name="info.circle" size={20} color={theme.warning} />
                <Text size="sm" weight="semibold" className="text-warning">
                  Rate Limit Details
                </Text>
              </HStack>
              
              <VStack gap={2}>
                {limit && (
                  <HStack gap={2} align="center">
                    <Text size="xs" colorTheme="mutedForeground">Limit:</Text>
                    <Text size="xs" weight="medium">{limit} requests</Text>
                  </HStack>
                )}
                {window && (
                  <HStack gap={2} align="center">
                    <Text size="xs" colorTheme="mutedForeground">Time Window:</Text>
                    <Text size="xs" weight="medium">{window} seconds</Text>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </Card>
        )}
        
        {/* Tips */}
        <Card className="p-4 bg-muted/50">
          <VStack gap={2}>
            <Text size="sm" weight="semibold">Tips to Avoid Rate Limits</Text>
            <VStack gap={2}>
              <HStack gap={2} align="flex-start">
                <Text size="xs">•</Text>
                <Text size="xs" colorTheme="mutedForeground" className="flex-1">
                  Avoid making rapid consecutive requests
                </Text>
              </HStack>
              <HStack gap={2} align="flex-start">
                <Text size="xs">•</Text>
                <Text size="xs" colorTheme="mutedForeground" className="flex-1">
                  Use search and filters to reduce the number of requests
                </Text>
              </HStack>
              <HStack gap={2} align="flex-start">
                <Text size="xs">•</Text>
                <Text size="xs" colorTheme="mutedForeground" className="flex-1">
                  Wait for operations to complete before starting new ones
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </ErrorPage>
  );
}