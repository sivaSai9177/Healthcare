import React, { useEffect } from 'react';
import { View, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Symbol } from '@/components/universal/display/Symbols';
import { Text } from '@/components/universal/typography/Text';
import { VStack, HStack } from '@/components/universal/layout/Stack';
import { Card } from '@/components/universal/display/Card';
import { useTheme } from '@/lib/theme/provider';
import { haptic } from '@/lib/ui/haptics';
import { useError } from '@/components/providers/ErrorProvider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useResponsive } from '@/hooks/useResponsive';
import { useFadeAnimation, useScaleAnimation } from '@/lib/ui/animations';
import Animated from 'react-native-reanimated';

interface ErrorRecoveryProps {
  onDismiss?: () => void;
  compact?: boolean;
}

export function ErrorRecovery({ onDismiss, compact = false }: ErrorRecoveryProps) {
  const { error, recoveryStrategies, executeRecovery, isRecovering, clearError } = useError();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { isMobile } = useResponsive();
  const { animatedStyle: fadeStyle, fadeIn } = useFadeAnimation({ duration: 300 });
  const { animatedStyle: scaleStyle, scaleIn } = useScaleAnimation({ 
    duration: 400,
    initialScale: 0.9,
    finalScale: 1,
  });

  useEffect(() => {
    if (error) {
      fadeIn();
      scaleIn();
    }
  }, [error, fadeIn, scaleIn]);

  if (!error) return null;

  const handleRecovery = async (strategy: any) => {
    haptic('light');
    await executeRecovery(strategy);
  };

  const handleDismiss = () => {
    haptic('light');
    if (onDismiss) {
      onDismiss();
    } else {
      clearError();
    }
  };

  if (compact) {
    return (
      <Animated.View style={[fadeStyle]}>
        <Card style={{ 
          backgroundColor: theme.muted,
          borderColor: theme.border,
          padding: spacing[3],
          marginVertical: spacing[2],
        }}>
        <HStack gap={spacing[3]} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Text size="sm" style={{ color: theme.mutedForeground, flex: 1 }}>
            {error.message}
          </Text>
          {recoveryStrategies.length > 0 && (
            <Pressable
              style={{
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[2],
                backgroundColor: theme.primary,
                borderRadius: 6,
                opacity: isRecovering ? 0.6 : 1,
              }}
              onPress={() => handleRecovery(recoveryStrategies[0])}
              disabled={isRecovering}
            >
              {isRecovering ? (
                <ActivityIndicator size="small" color={theme.primaryForeground} />
              ) : (
                <Text size="sm" weight="semibold" style={{ color: theme.primaryForeground }}>
                  {recoveryStrategies[0].label}
                </Text>
              )}
            </Pressable>
          )}
        </HStack>
      </Card>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[fadeStyle, scaleStyle]}>
      <Card style={{ 
        padding: spacing[5],
        marginHorizontal: spacing[4],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}>
      <VStack gap={spacing[4]}>
        <HStack gap={spacing[3]} style={{ alignItems: 'center' }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: getErrorColor(error.type, theme),
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Symbol name={getErrorIcon(error.type)} size="md" color="white" />
          </View>
          <Text size="lg" weight="semibold" style={{ color: theme.foreground }}>
            {getErrorTitle(error.type)}
          </Text>
        </HStack>

        <Text size={isMobile ? "sm" : "base"} style={{ color: theme.mutedForeground, lineHeight: 22 }}>
          {error.message}
        </Text>

        {error.statusCode && (
          <Text size="xs" style={{ 
            color: theme.mutedForeground, 
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' 
          }}>
            Error Code: {error.statusCode}
          </Text>
        )}

        {recoveryStrategies.length > 0 && (
          <VStack gap={spacing[3]}>
            <Text size="sm" weight="semibold" style={{ color: theme.foreground }}>
              What would you like to do?
            </Text>
            <VStack gap={spacing[2]}>
              {recoveryStrategies.map((strategy, index) => (
                <Pressable
                  key={index}
                  style={{
                    borderWidth: 1,
                    borderColor: index === 0 ? theme.primary : theme.border,
                    backgroundColor: index === 0 ? theme.primary : theme.background,
                    borderRadius: 8,
                    padding: spacing[3],
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: isRecovering ? 0.6 : 1,
                  }}
                  onPress={() => handleRecovery(strategy)}
                  disabled={isRecovering}
                >
                  <VStack style={{ flex: 1 }}>
                    <Text 
                      size="sm" 
                      weight="medium" 
                      style={{ color: index === 0 ? theme.primaryForeground : theme.foreground }}
                    >
                      {strategy.label}
                    </Text>
                    {strategy.description && (
                      <Text 
                        size="xs" 
                        style={{ 
                          color: index === 0 ? theme.primaryForeground : theme.mutedForeground,
                          marginTop: spacing[1],
                        }}
                      >
                        {strategy.description}
                      </Text>
                    )}
                  </VStack>
                  {isRecovering && index === 0 && (
                    <ActivityIndicator size="small" color={theme.primaryForeground} />
                  )}
                </Pressable>
              ))}
            </VStack>
          </VStack>
        )}

        <Pressable
          style={{
            alignSelf: 'center',
            paddingHorizontal: spacing[5],
            paddingVertical: spacing[2],
            opacity: isRecovering ? 0.6 : 1,
          }}
          onPress={handleDismiss}
          disabled={isRecovering}
        >
          <Text size="sm" style={{ color: theme.mutedForeground }}>
            Dismiss
          </Text>
        </Pressable>
      </VStack>
    </Card>
    </Animated.View>
  );
}

function getErrorColor(type: string | null, theme: any): string {
  switch (type) {
    case 'connection-lost':
      return '#F59E0B'; // Amber warning color
    case 'session-timeout':
    case 'unauthorized':
      return '#3B82F6'; // Blue info color
    case 'profile-incomplete':
      return '#8B5CF6'; // Purple info color
    case 'server-error':
    case 'rate-limit':
      return theme.destructive;
    default:
      return theme.destructive;
  }
}

function getErrorIcon(type: string | null): string {
  switch (type) {
    case 'connection-lost':
      return 'wifi.slash';
    case 'session-timeout':
      return 'clock.badge.exclamationmark';
    case 'unauthorized':
      return 'lock.fill';
    case 'profile-incomplete':
      return 'person.badge.plus';
    case 'server-error':
      return 'exclamationmark.triangle.fill';
    case 'rate-limit':
      return 'hourglass';
    default:
      return 'exclamationmark.circle.fill';
  }
}

function getErrorTitle(type: string | null): string {
  switch (type) {
    case 'connection-lost':
      return 'Connection Lost';
    case 'session-timeout':
      return 'Session Expired';
    case 'unauthorized':
      return 'Access Denied';
    case 'profile-incomplete':
      return 'Profile Incomplete';
    case 'server-error':
      return 'Server Error';
    case 'rate-limit':
      return 'Too Many Requests';
    default:
      return 'Error';
  }
}