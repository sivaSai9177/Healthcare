import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle } from '@/components/universal/display/Symbols';
import { Button } from '@/components/universal/interaction';
import { Card, CardContent } from '@/components/universal/display';
import { Text } from '@/components/universal/typography';
import { VStack } from '@/components/universal/layout';
import { log } from '@/lib/core/debug/logger';

export interface OAuthError {
  code: 'access_denied' | 'invalid_request' | 'server_error' | 'temporarily_unavailable' | 'user_cancelled' | 'unknown';
  message: string;
  provider?: string;
  details?: any;
}

interface OAuthErrorHandlerProps {
  error: OAuthError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function OAuthErrorHandler({ error, onRetry, onDismiss }: OAuthErrorHandlerProps) {
  const router = useRouter();

  const getErrorTitle = (code: OAuthError['code']) => {
    switch (code) {
      case 'access_denied':
        return 'Access Denied';
      case 'invalid_request':
        return 'Invalid Request';
      case 'server_error':
        return 'Server Error';
      case 'temporarily_unavailable':
        return 'Service Unavailable';
      case 'user_cancelled':
        return 'Sign In Cancelled';
      default:
        return 'Authentication Error';
    }
  };

  const getErrorMessage = (error: OAuthError) => {
    switch (error.code) {
      case 'access_denied':
        return 'You denied access to your account. Please try again and grant the necessary permissions.';
      case 'invalid_request':
        return 'The authentication request was invalid. Please try signing in again.';
      case 'server_error':
        return 'Our servers encountered an error. Please try again in a few moments.';
      case 'temporarily_unavailable':
        return 'The authentication service is temporarily unavailable. Please try again later.';
      case 'user_cancelled':
        return 'You cancelled the sign in process. You can try again whenever you\'re ready.';
      default:
        return error.message || 'An unexpected error occurred during authentication. Please try again.';
    }
  };

  const handleRetry = () => {
    log.auth.info('OAuth error retry requested', { error });
    if (onRetry) {
      onRetry();
    } else {
      router.replace('/(public)/auth/login');
    }
  };

  const handleDismiss = () => {
    log.auth.info('OAuth error dismissed', { error });
    if (onDismiss) {
      onDismiss();
    } else {
      router.replace('/(public)/auth/login');
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardContent>
          <VStack gap={16}>
            <View className="items-center">
              <AlertCircle
                size={48}
                color="#ef4444"
                style={{ marginBottom: 16 }}
              />
            </View>
            
            <VStack gap={8}>
              <Text size="lg" weight="semibold" className="text-center">
                {getErrorTitle(error.code)}
              </Text>
              
              <Text size="sm" colorTheme="mutedForeground" className="text-center">
                {getErrorMessage(error)}
              </Text>
              
              {error.provider && (
                <Text size="xs" colorTheme="mutedForeground" className="text-center mt-2">
                  Provider: {error.provider}
                </Text>
              )}
            </VStack>
            
            <VStack gap={8} className="mt-4">
              <Button onPress={handleRetry} variant="default">
                Try Again
              </Button>
              
              <Button onPress={handleDismiss} variant="outline">
                Back to Sign In
              </Button>
            </VStack>
          </VStack>
        </CardContent>
      </Card>
    </View>
  );
}