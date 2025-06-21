import React, { useEffect, useState, useRef } from 'react';
import { View, Pressable, Animated, Platform } from 'react-native';
import { useError } from '@/components/providers/ErrorProvider';
import { Symbol } from '@/components/universal/display/Symbols';
import { useTheme } from '@/lib/theme/provider';
import { haptic } from '@/lib/ui/haptics';
import { ActivityTimer } from '@/components/universal/feedback/ActivityTimer';
import { Text } from '@/components/universal/typography/Text';
import { VStack, HStack } from '@/components/universal/layout/Stack';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useResponsive } from '@/hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ErrorBanner() {
  const { error, clearError, isOnline, recoveryStrategies, executeRecovery, isRecovering } = useError();
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { getAnimationDuration, shouldAnimate } = useAnimationStore();
  const { isMobile } = useResponsive();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (error) {
      // Animate banner appearance
      const animations = [
        Animated.timing(animatedHeight, {
          toValue: isExpanded ? (isMobile ? 250 : 200) : (isMobile ? 80 : 60),
          duration: shouldAnimate() ? getAnimationDuration(300) : 0,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: shouldAnimate() ? getAnimationDuration(200) : 0,
          useNativeDriver: true,
        }),
      ];
      
      Animated.parallel(animations).start();
      haptic('medium');
    } else {
      // Animate banner disappearance
      const animations = [
        Animated.timing(animatedHeight, {
          toValue: 0,
          duration: shouldAnimate() ? getAnimationDuration(300) : 0,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: shouldAnimate() ? getAnimationDuration(200) : 0,
          useNativeDriver: true,
        }),
      ];
      
      Animated.parallel(animations).start();
    }
  }, [error, isExpanded, shouldAnimate, getAnimationDuration, isMobile]);

  if (!error) return null;

  const getErrorColor = () => {
    switch (error.type) {
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
  };

  const getErrorIcon = () => {
    switch (error.type) {
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
  };

  const errorColor = getErrorColor();

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: animatedHeight,
          overflow: 'hidden',
        },
      ]}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: errorColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            opacity: animatedOpacity,
          },
        ]}
      >
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          paddingTop: Platform.OS === 'ios' ? insets.top + spacing[3] : spacing[3],
        }}
      >
        <HStack gap={spacing[3]} style={{ flex: 1, alignItems: 'center' }}>
          <Symbol name={getErrorIcon()} size="md" color="white" />
          <Text 
            weight="semibold"
            size={isMobile ? "sm" : "base"}
            style={{ color: 'white', flex: 1 }}
          >
            {error.message || 'An error occurred'}
          </Text>
          {!isOnline && (
            <View style={{
              marginLeft: spacing[2],
              padding: spacing[1],
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
            }}>
              <Symbol name="wifi.slash" size="xs" color="white" />
            </View>
          )}
        </HStack>
        <Symbol
          name={isExpanded ? 'chevron.up' : 'chevron.down'}
          size="sm"
          color="white"
        />
      </Pressable>

      {isExpanded && (
        <VStack gap={spacing[4]} style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[4] }}>
          {error.requestId && (
            <Text 
              size="xs" 
              style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
            >
              Request ID: {error.requestId}
            </Text>
          )}
          
          {error.type === 'rate-limit' && error.retryAfter && (
            <HStack gap={spacing[2]} style={{ alignItems: 'center' }}>
              <Text size="sm" style={{ color: 'white' }}>Retry in:</Text>
              <ActivityTimer
                duration={error.retryAfter * 1000}
                onComplete={() => clearError()}
                format="mm:ss"
                style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}
              />
            </HStack>
          )}

          <VStack gap={spacing[2]}>
            {recoveryStrategies.map((strategy, index) => (
              <Pressable
                key={index}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  paddingVertical: spacing[3],
                  paddingHorizontal: spacing[4],
                  borderRadius: 8,
                  opacity: isRecovering ? 0.5 : 1,
                }}
                onPress={() => !isRecovering && executeRecovery(strategy)}
                disabled={isRecovering}
              >
                <Text weight="semibold" size="sm" style={{ color: 'white' }}>
                  {strategy.label}
                </Text>
                {strategy.description && (
                  <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.8)', marginTop: spacing[1] }}>
                    {strategy.description}
                  </Text>
                )}
              </Pressable>
            ))}
            
            <Pressable
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                paddingVertical: spacing[2],
                paddingHorizontal: spacing[4],
                borderRadius: 8,
                alignSelf: 'flex-start',
                opacity: isRecovering ? 0.5 : 1,
              }}
              onPress={clearError}
              disabled={isRecovering}
            >
              <Text size="sm" style={{ color: 'white' }}>Dismiss</Text>
            </Pressable>
          </VStack>
        </VStack>
      )}
      </Animated.View>
    </Animated.View>
  );
}