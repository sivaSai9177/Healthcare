import React from 'react';
import { View, ActivityIndicator, Platform, Animated } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Text } from '../typography';
import { useTheme } from '@/lib/theme/provider';

export function RefreshingOverlay() {
  const { isRefreshing } = useAuth();
  const theme = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isRefreshing ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isRefreshing, fadeAnim]);

  if (!isRefreshing) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colorScheme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        opacity: fadeAnim,
      }}
      pointerEvents={isRefreshing ? 'auto' : 'none'}
    >
      <View
        style={{
          backgroundColor: theme.background,
          padding: 24,
          borderRadius: 12 as any,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text size="md" weight="medium" style={{ marginTop: 12 }}>
          Refreshing session...
        </Text>
        <Text size="sm" colorTheme="mutedForeground" style={{ marginTop: 4 }}>
          Please wait
        </Text>
      </View>
    </Animated.View>
  );
}

// Subtle loading bar for better UX
export function RefreshingBar() {
  const { isRefreshing } = useAuth();
  const theme = useTheme();
  const widthAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isRefreshing) {
      // Animate loading bar
      Animated.loop(
        Animated.timing(widthAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        })
      ).start();
    } else {
      widthAnim.setValue(0);
    }
  }, [isRefreshing, widthAnim]);

  if (!isRefreshing) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: theme.border,
        zIndex: 9999,
      }}
    >
      <Animated.View
        style={{
          height: '100%',
          backgroundColor: theme.primary,
          width: widthAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </View>
  );
}