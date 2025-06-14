import React, { useRef, useState, useEffect } from 'react';
import { Animated, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { Text } from '@/components/universal/typography/Text';
import { useSpacing } from '@/lib/stores/spacing-store';
import { cn } from '@/lib/core/utils';
import { 
  AnimationVariant,
  ScrollHeaderAnimationType,
  getAnimationConfig,
  getSpacing,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';

interface ScrollHeaderProps {
  title: string;
  scrollY: Animated.Value;
  children?: React.ReactNode;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: ScrollHeaderAnimationType;
  animationDuration?: number;
  shrinkScale?: number;
  blurIntensity?: number;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export function ScrollHeader({ 
  title, 
  scrollY, 
  children,
  // Animation props
  animated = false,
  animationVariant = 'moderate',
  animationType = 'shrink',
  animationDuration,
  shrinkScale = 0.85,
  blurIntensity = 100,
  animationConfig,
}: ScrollHeaderProps) {
  const { spacing } = useSpacing();
  const insets = useSafeAreaInsets();
  const [showBorder, setShowBorder] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.normal;

  // Check if dark mode is active
  useEffect(() => {
    // This is a simple check - you might want to use a more sophisticated approach
    const checkDarkMode = () => {
      if (Platform.OS === 'web') {
        setIsDarkMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };
    checkDarkMode();
  }, []);

  // Threshold for when to show the header
  const HEADER_THRESHOLD = 50;

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      setShowBorder(value > HEADER_THRESHOLD);
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY]);

  // Animated values for header appearance
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_THRESHOLD, HEADER_THRESHOLD + 20],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_THRESHOLD, HEADER_THRESHOLD + 20],
    outputRange: [20, 20, 0],
    extrapolate: 'clamp',
  });

  // Animation values for shrink/scale effects
  const titleScale = animated && animationType === 'shrink' ? scrollY.interpolate({
    inputRange: [0, HEADER_THRESHOLD, HEADER_THRESHOLD + 50],
    outputRange: [1, 1, shrinkScale],
    extrapolate: 'clamp',
  }) : 1;

  const fadeOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_THRESHOLD - 20, HEADER_THRESHOLD],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const backgroundBlur = animated && animationType === 'blur' ? scrollY.interpolate({
    inputRange: [0, HEADER_THRESHOLD, HEADER_THRESHOLD + 50],
    outputRange: [0, 0, blurIntensity],
    extrapolate: 'clamp',
  }) : blurIntensity;

  const headerHeight = Platform.select({
    ios: 44,
    android: 56,
    default: 56,
  });

  const totalHeaderHeight = headerHeight + insets.top;

  if (Platform.OS === 'web') {
    // Web implementation with backdrop filter
    const webStyle: ViewStyle = {
      height: totalHeaderHeight,
      paddingTop: insets.top,
      opacity: headerOpacity as any,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        } as any,
      }),
    };

    return (
      <Animated.View
        style={[styles.header, webStyle]}
        className={cn(
          'bg-background/90',
          showBorder && 'border-b border-border'
        )}
      >
        <View style={styles.headerContent}>
          <Animated.View
            style={{
              transform: [
                { translateY: titleTranslateY },
                { scale: titleScale },
              ],
              opacity: fadeOpacity,
            }}
          >
            <Text
              style={styles.headerTitle}
              color="foreground"
              weight="semibold"
            >
              {title}
            </Text>
          </Animated.View>
          {children}
        </View>
      </Animated.View>
    );
  }

  // Native implementation with BlurView
  return (
    <Animated.View
      style={[
        styles.header,
        {
          height: totalHeaderHeight,
          opacity: headerOpacity,
        },
      ]}
    >
      <BlurView
        intensity={animated && isAnimated && shouldAnimate() && animationType === 'blur' ? backgroundBlur : blurIntensity}
        tint={isDarkMode ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
        className={cn(
          showBorder && 'border-b border-border'
        )}
      />
      <View style={[
        styles.headerContent, 
        { 
          paddingTop: insets.top,
          paddingHorizontal: spacing[4] || 16,
        }
      ]}>
        <Animated.View
          style={{
            transform: [
              { translateY: titleTranslateY },
              { scale: titleScale },
            ],
            opacity: fadeOpacity,
          }}
        >
          <Text
            style={styles.headerTitle}
            color="foreground"
            weight="semibold"
          >
            {title}
          </Text>
        </Animated.View>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    textAlign: 'center' as const,
  },
});