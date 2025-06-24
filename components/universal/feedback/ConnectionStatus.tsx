import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Text } from '../typography/Text';
import { Symbol } from '../display/Symbols';
import { HStack, VStack } from '../layout/Stack';
import { useTheme } from '@/lib/theme/provider';
import { haptic } from '@/lib/ui/haptics';
import type { ConnectionState } from '@/lib/websocket/connection-manager';

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  compact?: boolean;
  showDetails?: boolean;
  position?: 'top' | 'bottom' | 'inline';
  onPress?: () => void;
}

const statusConfig = {
  connecting: {
    icon: 'wifi' as const,
    label: 'Connecting',
    color: '#f59e0b',
    pulse: true,
  },
  connected: {
    icon: 'wifi' as const,
    label: 'Connected',
    color: '#10b981',
    pulse: false,
  },
  disconnected: {
    icon: 'wifi.slash' as const,
    label: 'Disconnected',
    color: '#6b7280',
    pulse: false,
  },
  error: {
    icon: 'exclamationmark.triangle.fill' as const,
    label: 'Connection Error',
    color: '#ef4444',
    pulse: true,
  },
  reconnecting: {
    icon: 'arrow.triangle.2.circlepath' as const,
    label: 'Reconnecting',
    color: '#3b82f6',
    pulse: true,
  },
};

export function ConnectionStatus({
  connectionState,
  compact = false,
  showDetails = false,
  position = 'inline',
  onPress,
}: ConnectionStatusProps) {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const config = statusConfig[connectionState.status];

  // Pulse animation for certain states
  const pulseStyle = useAnimatedStyle(() => {
    if (!config.pulse) return {};

    const scale = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      false
    );

    return {
      transform: [{ scale }],
    };
  });

  // Auto-hide after connected
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    if (connectionState.status === 'connected') {
      const timer = setTimeout(() => {
        if (!showDetails) {
          setIsVisible(false);
        }
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [connectionState.status, showDetails]);

  // Format uptime
  const getUptimeText = () => {
    if (!connectionState.lastConnectedAt) return null;
    const uptime = Date.now() - connectionState.lastConnectedAt.getTime();
    const minutes = Math.floor(uptime / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m uptime`;
    }
    return `${minutes}m uptime`;
  };

  // Format downtime
  const getDowntimeText = () => {
    if (!connectionState.lastDisconnectedAt) return null;
    const downtime = Date.now() - connectionState.lastDisconnectedAt.getTime();
    const seconds = Math.floor(downtime / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s offline`;
    }
    return `${seconds}s offline`;
  };

  const handlePress = () => {
    haptic('light');
    setIsExpanded(!isExpanded);
    onPress?.();
  };

  if (!isVisible && connectionState.status === 'connected' && !showDetails) {
    return null;
  }

  const containerStyle = position === 'inline' ? {} : {
    position: 'absolute' as const,
    [position]: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  };

  const content = (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: compact ? 20 : 12,
          borderWidth: 1,
          borderColor: config.color + '30',
          paddingHorizontal: compact ? 12 : 16,
          paddingVertical: compact ? 6 : 12,
          margin: position === 'inline' ? 0 : 16,
          ...containerStyle,
        },
      ]}
    >
      <Pressable onPress={handlePress} disabled={!showDetails}>
        <HStack gap={8} alignItems="center">
          <Animated.View style={pulseStyle}>
            <Symbol
              name={config.icon}
              size="sm"
              color={config.color}
            />
          </Animated.View>
          
          {!compact && (
            <VStack gap={2} flex={1}>
              <HStack gap={8} alignItems="center">
                <Text size="sm" weight="medium" style={{ color: config.color }}>
                  {config.label}
                </Text>
                {connectionState.retryCount > 0 && connectionState.status === 'reconnecting' && (
                  <Text size="xs" colorTheme="mutedForeground">
                    (Attempt {connectionState.retryCount})
                  </Text>
                )}
              </HStack>
              
              {connectionState.status === 'connected' && getUptimeText() && (
                <Text size="xs" colorTheme="mutedForeground">
                  {getUptimeText()}
                </Text>
              )}
              
              {connectionState.status !== 'connected' && getDowntimeText() && (
                <Text size="xs" colorTheme="mutedForeground">
                  {getDowntimeText()}
                </Text>
              )}
            </VStack>
          )}
          
          {showDetails && (
            <Symbol
              name={isExpanded ? 'chevron.up' : 'chevron.down'}
              size="xs"
              color={theme.mutedForeground}
            />
          )}
        </HStack>
        
        {isExpanded && showDetails && (
          <VStack gap={8} mt={12}>
            <View
              style={{
                height: 1,
                backgroundColor: theme.border,
                marginHorizontal: -16,
              }}
            />
            
            <VStack gap={4}>
              <HStack justifyContent="space-between">
                <Text size="xs" colorTheme="mutedForeground">Status</Text>
                <Text size="xs" weight="medium">{connectionState.status}</Text>
              </HStack>
              
              <HStack justifyContent="space-between">
                <Text size="xs" colorTheme="mutedForeground">Retry Count</Text>
                <Text size="xs" weight="medium">{connectionState.retryCount}</Text>
              </HStack>
              
              <HStack justifyContent="space-between">
                <Text size="xs" colorTheme="mutedForeground">Failures</Text>
                <Text size="xs" weight="medium">{connectionState.consecutiveFailures}</Text>
              </HStack>
              
              {connectionState.lastConnectedAt && (
                <HStack justifyContent="space-between">
                  <Text size="xs" colorTheme="mutedForeground">Last Connected</Text>
                  <Text size="xs" weight="medium">
                    {new Date(connectionState.lastConnectedAt).toLocaleTimeString()}
                  </Text>
                </HStack>
              )}
            </VStack>
          </VStack>
        )}
      </Pressable>
    </Animated.View>
  );

  return content;
}

// Compact inline version for headers
export function ConnectionStatusBadge({ connectionState }: { connectionState: ConnectionState }) {
  const config = statusConfig[connectionState.status];
  
  if (connectionState.status === 'connected') {
    return null; // Don't show when connected
  }

  return (
    <View
      style={{
        backgroundColor: config.color + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: config.color + '30',
      }}
    >
      <HStack gap={4} alignItems="center">
        <Symbol name={config.icon} size="xs" color={config.color} />
        <Text size="xs" weight="medium" style={{ color: config.color }}>
          {config.label}
        </Text>
      </HStack>
    </View>
  );
}