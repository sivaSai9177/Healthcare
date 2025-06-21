import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TRPCClientError } from '@trpc/client';
import { router } from 'expo-router';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { VStack, HStack } from '@/components/universal/layout';
import { Symbol } from '@/components/universal/display/Symbols';
import { Alert } from '@/components/universal/feedback';
import { logger } from '@/lib/core/debug/unified-logger';
import { api } from '@/lib/api/trpc';
import * as Haptics from 'expo-haptics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  retryRoute?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRetrying: boolean;
  showDetails: boolean;
}

/**
 * Error boundary specifically for API/TRPC errors
 */
export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
      showDetails: props.showDetails ?? false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Only catch TRPC/API errors
    if (
      error instanceof TRPCClientError ||
      error.message?.includes('TRPC') ||
      error.message?.includes('fetch') ||
      error.message?.includes('network')
    ) {
      return {
        hasError: true,
        error,
      };
    }
    // Let other errors bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only handle API errors
    if (
      error instanceof TRPCClientError ||
      error.message?.includes('TRPC') ||
      error.message?.includes('fetch') ||
      error.message?.includes('network')
    ) {
      logger.error('API error caught in boundary', 'API_ERROR_BOUNDARY', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });

      this.setState({ errorInfo });
      this.props.onError?.(error, errorInfo);

      // Vibrate on mobile
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }

  private getErrorDetails = () => {
    const { error } = this.state;
    
    if (error instanceof TRPCClientError) {
      return {
        type: 'API Error',
        code: error.data?.code || 'UNKNOWN',
        httpStatus: error.data?.httpStatus,
        path: error.data?.path,
      };
    }
    
    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return {
        type: 'Network Error',
        code: 'NETWORK_ERROR',
      };
    }
    
    return {
      type: 'Unknown API Error',
      code: 'UNKNOWN',
    };
  };

  private handleRetry = async () => {
    this.setState({ isRetrying: true });
    
    try {
      // Invalidate all queries to force refetch
      const utils = api.useUtils();
      await utils.invalidate();
      
      // Clear error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
      });
      
      // Navigate to retry route if specified
      if (this.props.retryRoute) {
        router.replace(this.props.retryRoute as any);
      }
    } catch (error) {
      logger.error('Retry failed', 'API_ERROR_BOUNDARY', error);
      this.setState({ isRetrying: false });
    }
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    router.replace('/');
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const { error, isRetrying, showDetails } = this.state;
      const errorDetails = this.getErrorDetails();

      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <SafeAreaView style={{ flex: 1 }} className="bg-background">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <VStack gap={6} className="flex-1 justify-center items-center">
              {/* Icon */}
              <Symbol 
                name={errorDetails.type === 'Network Error' ? 'wifi.slash' : 'exclamationmark.icloud'} 
                size="xl" 
                color="#EF4444" 
              />

              {/* Error Title */}
              <Text size="2xl" weight="bold" align="center">
                {errorDetails.type}
              </Text>

              {/* Error Message */}
              <Text size="md" colorTheme="mutedForeground" align="center" className="max-w-md">
                {error?.message || 'An unexpected error occurred while communicating with the server'}
              </Text>

              {/* Error Details Alert */}
              {errorDetails.httpStatus && (
                <Alert variant="destructive" className="max-w-md">
                  <HStack gap={2} alignItems="center">
                    <Symbol name="info.circle" size="sm" />
                    <Text size="sm">
                      HTTP {errorDetails.httpStatus} • {errorDetails.code}
                    </Text>
                  </HStack>
                </Alert>
              )}

              {/* Technical Details Toggle */}
              {__DEV__ && (
                <TouchableOpacity onPress={this.toggleDetails}>
                  <HStack gap={1} alignItems="center">
                    <Text size="sm" colorTheme="primary">
                      {showDetails ? 'Hide' : 'Show'} technical details
                    </Text>
                    <Symbol 
                      name={showDetails ? 'chevron.up' : 'chevron.down'} 
                      size="xs" 
                      color="#3B82F6" 
                    />
                  </HStack>
                </TouchableOpacity>
              )}

              {/* Technical Details */}
              {showDetails && (
                <View className="bg-muted rounded-lg p-4 max-w-md w-full">
                  <Text size="xs" className="font-mono" colorTheme="mutedForeground">
                    {JSON.stringify(errorDetails, null, 2)}
                  </Text>
                  {error?.stack && (
                    <Text size="xs" className="font-mono mt-2" colorTheme="mutedForeground">
                      {error.stack}
                    </Text>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <VStack gap={3} className="w-full max-w-xs mt-4">
                <Button
                  onPress={this.handleRetry}
                  variant="default"
                  size="lg"
                  isLoading={isRetrying}
                  className="w-full"
                >
                  <HStack gap={2} alignItems="center">
                    <Symbol name="arrow.clockwise" size="sm" />
                    <Text>Try Again</Text>
                  </HStack>
                </Button>

                <Button
                  onPress={this.handleGoHome}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <HStack gap={2} alignItems="center">
                    <Symbol name="house" size="sm" />
                    <Text>Go Home</Text>
                  </HStack>
                </Button>
              </VStack>

              {/* Helpful Tips */}
              <View className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 max-w-md mt-6">
                <Text size="sm" weight="semibold" className="mb-2">
                  Tips:
                </Text>
                <VStack gap={1}>
                  <Text size="xs" colorTheme="mutedForeground">
                    • Check your internet connection
                  </Text>
                  <Text size="xs" colorTheme="mutedForeground">
                    • Try refreshing the page
                  </Text>
                  <Text size="xs" colorTheme="mutedForeground">
                    • Contact support if the problem persists
                  </Text>
                </VStack>
              </View>
            </VStack>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to wrap components with API error boundary
 */
export function withApiErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Omit<Props, 'children'>
) {
  return function ApiErrorBoundaryWrapper(props: P) {
    return (
      <ApiErrorBoundary {...boundaryProps}>
        <Component {...props} />
      </ApiErrorBoundary>
    );
  };
}