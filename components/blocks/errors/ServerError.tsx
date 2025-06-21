import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { ErrorPage } from './ErrorPage';
import { Text } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout';
import { Card } from '@/components/universal/display';
import { Symbol } from '@/components/universal/display/Symbols';
import { Button } from '@/components/universal/interaction';
import { useTheme } from '@/lib/theme/provider';
import { logger } from '@/lib/core/debug/unified-logger';

interface ServerErrorProps {
  statusCode?: number;
  errorMessage?: string;
  requestId?: string;
  onRetry?: () => void;
}

export function ServerError({ 
  statusCode = 500, 
  errorMessage,
  requestId,
  onRetry 
}: ServerErrorProps) {
  const router = useRouter();
  const theme = useTheme();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  React.useEffect(() => {
    logger.api.error('Server error displayed', {
      statusCode,
      errorMessage,
      requestId,
    });
  }, [statusCode, errorMessage, requestId]);
  
  const getErrorTitle = () => {
    switch (statusCode) {
      case 500:
        return 'Internal Server Error';
      case 502:
        return 'Bad Gateway';
      case 503:
        return 'Service Unavailable';
      case 504:
        return 'Gateway Timeout';
      default:
        return 'Server Error';
    }
  };
  
  const getErrorDescription = () => {
    switch (statusCode) {
      case 500:
        return 'The server encountered an unexpected error. Our team has been notified.';
      case 502:
        return 'The server received an invalid response. Please try again later.';
      case 503:
        return 'The service is temporarily unavailable. Please check back soon.';
      case 504:
        return 'The server took too long to respond. Please try again.';
      default:
        return 'An unexpected server error occurred. Please try again later.';
    }
  };
  
  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    logger.api.info('Retrying after server error', { retryCount: retryCount + 1 });
    
    try {
      if (onRetry) {
        await onRetry();
      } else {
        // Default retry behavior - refresh the current page
        router.replace(router);
      }
    } catch (error) {
      logger.api.error('Retry failed', { error });
    } finally {
      setIsRetrying(false);
    }
  };
  
  const handleGoHome = () => {
    logger.router.navigate('server-error', '/(app)/(tabs)/home');
    router.replace('/(app)/(tabs)/home');
  };
  
  const handleReportIssue = () => {
    logger.support.info('User reporting server error', { statusCode, requestId });
    router.push('/(app)/support');
  };
  
  return (
    <ErrorPage
      type="server-error"
      title={getErrorTitle()}
      message={getErrorDescription()}
      icon="exclamationmark.triangle.fill"
      primaryAction={{
        label: isRetrying ? 'Retrying...' : 'Try Again',
        onPress: handleRetry,
        variant: 'default',
      }}
      secondaryAction={{
        label: 'Go to Home',
        onPress: handleGoHome,
        variant: 'outline',
      }}
      debugInfo={`Status Code: ${statusCode}\nRequest ID: ${requestId || 'N/A'}\nRetry Count: ${retryCount}\nError: ${errorMessage || 'Unknown'}`}
    >
      <VStack gap={4} className="w-full">
        {/* Error Details */}
        <Card className="p-4 bg-destructive/10">
          <VStack gap={3}>
            <HStack gap={2} align="center">
              <Symbol name="server.rack" size={20} color={theme.destructive} />
              <Text size="sm" weight="semibold" className="text-destructive">
                Error Details
              </Text>
            </HStack>
            
            <VStack gap={2}>
              <HStack gap={2} align="center">
                <Text size="xs" colorTheme="mutedForeground">Status Code:</Text>
                <Text size="xs" weight="medium" className="font-mono">{statusCode}</Text>
              </HStack>
              
              {requestId && (
                <HStack gap={2} align="center">
                  <Text size="xs" colorTheme="mutedForeground">Request ID:</Text>
                  <Text size="xs" weight="medium" className="font-mono text-xs">
                    {requestId}
                  </Text>
                </HStack>
              )}
              
              {errorMessage && (
                <VStack gap={1}>
                  <Text size="xs" colorTheme="mutedForeground">Message:</Text>
                  <Text size="xs" className="font-mono">
                    {errorMessage}
                  </Text>
                </VStack>
              )}
            </VStack>
          </VStack>
        </Card>
        
        {/* Status Info */}
        <Card className="p-4">
          <VStack gap={3}>
            <HStack gap={2} align="center">
              <Symbol name="info.circle" size={20} color={theme.primary} />
              <Text size="sm" weight="semibold">What's happening?</Text>
            </HStack>
            
            <VStack gap={2}>
              <HStack gap={2} align="flex-start">
                <Text size="xs">•</Text>
                <Text size="xs" colorTheme="mutedForeground" className="flex-1">
                  Our servers are experiencing temporary issues
                </Text>
              </HStack>
              <HStack gap={2} align="flex-start">
                <Text size="xs">•</Text>
                <Text size="xs" colorTheme="mutedForeground" className="flex-1">
                  Your data is safe and no information was lost
                </Text>
              </HStack>
              <HStack gap={2} align="flex-start">
                <Text size="xs">•</Text>
                <Text size="xs" colorTheme="mutedForeground" className="flex-1">
                  Our team has been automatically notified
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Card>
        
        {/* Retry Warning */}
        {retryCount >= 3 && (
          <Card className="p-3 bg-warning/10 border border-warning/20">
            <VStack gap={2}>
              <HStack gap={2} align="center">
                <Symbol name="exclamationmark.circle" size={16} color={theme.warning} />
                <Text size="xs" weight="semibold" className="text-warning">
                  Multiple retry attempts
                </Text>
              </HStack>
              <Text size="xs" colorTheme="mutedForeground">
                The issue persists after {retryCount} attempts. You may want to try again later or report this issue.
              </Text>
              <Button
                size="sm"
                variant="outline"
                onPress={handleReportIssue}
                className="mt-2"
              >
                Report Issue
              </Button>
            </VStack>
          </Card>
        )}
      </VStack>
    </ErrorPage>
  );
}