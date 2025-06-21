import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { ErrorPage } from './ErrorPage';
import { Text } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout';
import { Card } from '@/components/universal/display';
import { Symbol } from '@/components/universal/display/Symbols';
import { useTheme } from '@/lib/theme/provider';
import { logger } from '@/lib/core/debug/unified-logger';

// Dynamic import with fallback
let NetInfo: any;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch (e) {
  // NetInfo not available - provide a mock
  NetInfo = {
    addEventListener: () => () => {},
    fetch: () => Promise.resolve({ isConnected: true, isInternetReachable: true }),
  };
}

interface ConnectionLostErrorProps {
  onRetry?: () => void;
  onOfflineMode?: () => void;
}

export function ConnectionLostError({ onRetry, onOfflineMode }: ConnectionLostErrorProps) {
  const theme = useTheme();
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  
  useEffect(() => {
    logger.network.error('Connection lost error displayed');
    
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      logger.network.info('Network state changed', { 
        connected: state.isConnected,
        reachable: state.isInternetReachable,
        type: state.type
      });
      
      setIsOnline(connected || false);
      
      // Auto-retry when connection is restored
      if (connected && retryCount > 0 && onRetry) {
        logger.network.success('Connection restored, auto-retrying');
        onRetry();
      }
    });
    
    // Check initial state
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected && state.isInternetReachable || false);
    });
    
    // Handle app state changes
    const appStateListener = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkConnection();
      }
    };
    
    const subscription = AppState.addEventListener('change', appStateListener);
    
    return () => {
      unsubscribe();
      subscription?.remove();
    };
  }, [retryCount, onRetry]);
  
  const checkConnection = async () => {
    setIsChecking(true);
    logger.network.info('Manually checking connection');
    
    try {
      const state = await NetInfo.fetch();
      const connected = state.isConnected && state.isInternetReachable;
      setIsOnline(connected || false);
      
      if (connected) {
        logger.network.success('Connection verified');
        if (onRetry) {
          onRetry();
        }
      } else {
        logger.network.warn('Still offline');
        setRetryCount(prev => prev + 1);
      }
    } catch (error) {
      logger.network.error('Connection check failed', { error });
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <ErrorPage
      type="connection-lost"
      title="No Internet Connection"
      message="Please check your internet connection and try again."
      icon="wifi.slash"
      primaryAction={{
        label: isChecking ? 'Checking...' : 'Retry Connection',
        onPress: checkConnection,
        variant: 'default',
      }}
      secondaryAction={onOfflineMode ? {
        label: 'Continue Offline',
        onPress: onOfflineMode,
        variant: 'outline',
      } : undefined}
      debugInfo={`Online: ${isOnline}\nRetry Count: ${retryCount}\nPlatform: ${Platform.OS}`}
    >
      <VStack gap={4} className="w-full">
        {/* Connection Status */}
        <Card className="p-4">
          <HStack gap={3} align="center">
            <Symbol 
              name={isOnline ? 'wifi' : 'wifi.slash'} 
              size={24} 
              color={isOnline ? theme.success : theme.destructive}
            />
            <VStack gap={1} className="flex-1">
              <Text size="sm" weight="semibold">
                Connection Status
              </Text>
              <Text size="xs" colorTheme="mutedForeground">
                {isOnline ? 'Connected' : 'Disconnected'}
              </Text>
            </VStack>
            {isOnline && (
              <Symbol name="checkmark.circle.fill" size={20} color={theme.success} />
            )}
          </HStack>
        </Card>
        
        {/* Troubleshooting Tips */}
        <Card className="p-4 bg-muted/50">
          <VStack gap={2}>
            <Text size="sm" weight="semibold">
              Troubleshooting Tips:
            </Text>
            <HStack gap={2} align="flex-start">
              <Text size="xs">•</Text>
              <Text size="xs" colorTheme="mutedForeground" className="flex-1">
                Check if Wi-Fi or mobile data is enabled
              </Text>
            </HStack>
            <HStack gap={2} align="flex-start">
              <Text size="xs">•</Text>
              <Text size="xs" colorTheme="mutedForeground" className="flex-1">
                Try turning airplane mode on and off
              </Text>
            </HStack>
            <HStack gap={2} align="flex-start">
              <Text size="xs">•</Text>
              <Text size="xs" colorTheme="mutedForeground" className="flex-1">
                Move to an area with better signal strength
              </Text>
            </HStack>
            <HStack gap={2} align="flex-start">
              <Text size="xs">•</Text>
              <Text size="xs" colorTheme="mutedForeground" className="flex-1">
                Restart your device if the problem persists
              </Text>
            </HStack>
          </VStack>
        </Card>
        
        {retryCount > 2 && (
          <Card className="p-3 bg-warning/10 border border-warning/20">
            <HStack gap={2} align="center">
              <Symbol name="exclamationmark.triangle" size={16} color={theme.warning} />
              <Text size="xs" className="flex-1">
                Having trouble? The app will automatically retry when your connection is restored.
              </Text>
            </HStack>
          </Card>
        )}
      </VStack>
    </ErrorPage>
  );
}