import React, { useEffect } from 'react';
import { View, ViewStyle, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { Text } from './Text';

import { useSpacing } from '@/lib/stores/spacing-store';
import { 
  SpacingScale,
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';
export type BadgeAnimationType = 'scale' | 'pulse' | 'none';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  style?: ViewStyle;
  dot?: boolean;
  onPress?: () => void;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: BadgeAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  animateOnChange?: boolean;
  pulseOnUpdate?: boolean;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

// Theme-aware color mapping
const getBadgeColors = (variant: BadgeVariant, theme: any) => {
  // Provide fallback values in case theme is not properly initialized
  const safeTheme = theme || {
    muted: '#f6f6f6',
    mutedForeground: '#737373',
    primary: '#0a0a0a',
    primaryForeground: '#fafafa',
    secondary: 'theme.muted',
    secondaryForeground: '#0a0a0a',
    success: '#16a34a',
    destructive: 'theme.destructive',
    foreground: '#0a0a0a',
    border: 'theme.border',
  };

  const colorMap = {
    default: {
      background: safeTheme.muted,
      text: safeTheme.mutedForeground,
      border: 'transparent',
    },
    primary: {
      background: safeTheme.primary,
      text: safeTheme.primaryForeground,
      border: 'transparent',
    },
    secondary: {
      background: safeTheme.secondary,
      text: safeTheme.secondaryForeground,
      border: 'transparent',
    },
    success: {
      background: safeTheme.success + '1a', // 10% opacity
      text: safeTheme.success,
      border: safeTheme.success + '33', // 20% opacity
    },
    warning: {
      background: 'theme.warning' + '1a',
      text: 'theme.warning',
      border: 'theme.warning' + '33',
    },
    error: {
      background: safeTheme.destructive + '1a',
      text: safeTheme.destructive,
      border: safeTheme.destructive + '33',
    },
    outline: {
      background: 'transparent',
      text: safeTheme.foreground,
      border: safeTheme.border,
    },
  };
  
  return colorMap[variant];
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Badge = React.forwardRef<View, BadgeProps>(({
  variant = 'default',
  size = 'md',
  children,
  rounded = 'md',
  style,
  dot = false,
  onPress,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'scale',
  animationDuration,
  animationDelay = 0,
  animateOnChange = true,
  pulseOnUpdate = false,
  useHaptics = true,
  animationConfig,
}, ref) => {
  // All hooks must be called before any conditions
  const theme = useTheme();
  const { spacing, componentSpacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const [prevChildren, setPrevChildren] = React.useState(children);
  
  // Animated styles - must be defined before conditionals
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pulseScale.value }
    ],
    opacity: opacity.value,
  }));
  
  const duration = animationDuration ?? config.duration.normal;
  
  // Trigger animation on content change
  useEffect(() => {
    if (animateOnChange && prevChildren !== children && animated && isAnimated && shouldAnimate()) {
      // Scale bounce animation
      scale.value = withSequence(
        withSpring(1.2, { ...config.spring, damping: 10 }),
        withSpring(1, config.spring)
      );
      
      // Haptic feedback on change
      if (useHaptics && Platform.OS !== 'web') {
        haptic('light');
      }
    }
    setPrevChildren(children);
  }, [children, animateOnChange, animated, isAnimated, shouldAnimate, useHaptics, config.spring, scale, prevChildren]);
  
  // Pulse animation
  useEffect(() => {
    if (pulseOnUpdate && animated && isAnimated && shouldAnimate()) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: duration / 2 }),
          withTiming(1, { duration: duration / 2 })
        ),
        3,
        false
      );
    }
  }, [pulseOnUpdate, animated, isAnimated, shouldAnimate, duration, pulseScale]);
  
  // Early return if theme is not loaded
  if (!theme) {
    return null;
  }
  
  const colors = getBadgeColors(variant, theme);
  
  // Handle press animation
  const handlePressIn = () => {
    if (animated && isAnimated && shouldAnimate() && onPress) {
      scale.value = withSpring(0.9, config.spring);
      if (useHaptics && Platform.OS !== 'web') {
        haptic('light');
      }
    }
  };
  
  const handlePressOut = () => {
    if (animated && isAnimated && shouldAnimate() && onPress) {
      scale.value = withSpring(1, config.spring);
    }
  };

  // Dynamic sizing based on spacing density
  const sizeConfig = {
    xs: {
      paddingH: 1.5 as SpacingScale,
      paddingV: 0.5 as SpacingScale,
      fontSize: 'xs' as const,
      dotSize: spacing[1.5],
    },
    sm: {
      paddingH: 2 as SpacingScale,
      paddingV: 0.5 as SpacingScale,
      fontSize: 'sm' as const,
      dotSize: spacing[2],
    },
    md: {
      paddingH: 2.5 as SpacingScale,
      paddingV: 1 as SpacingScale,
      fontSize: 'sm' as const,
      dotSize: spacing[2.5],
    },
    lg: {
      paddingH: 3 as SpacingScale,
      paddingV: 1.5 as SpacingScale,
      fontSize: 'md' as const,
      dotSize: spacing[3],
    },
  };

  const badgeSizeConfig = sizeConfig[size] || sizeConfig.md;
  
  const borderRadius = {
    sm: spacing[1],
    md: spacing[1.5],
    lg: spacing[2],
    full: 999,
  }[rounded] || spacing[1.5];
  
  // Get entrance animation
  const getEntranceAnimation = () => {
    if (!animated || !isAnimated || !shouldAnimate() || animationType === 'none') return undefined;
    return animationType === 'scale' 
      ? ZoomIn.duration(duration).delay(animationDelay)
      : FadeIn.duration(duration).delay(animationDelay);
  };
  
  // Base style for badge
  const badgeStyle = {
    backgroundColor: colors.background,
    borderRadius,
    borderWidth: variant === 'outline' || ['success', 'warning', 'error'].includes(variant) ? 1 : 0,
    borderColor: colors.border,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: spacing[badgeSizeConfig.paddingH],
    paddingVertical: spacing[badgeSizeConfig.paddingV],
  };
  
  // Web animation styles
  const webAnimationStyle = Platform.OS === 'web' && animated && isAnimated && shouldAnimate() ? {
    transition: `transform ${config.duration.fast}ms ease-out`,
    transformOrigin: 'center',
  } as any : {};
  
  const AnimatedComponent = animated && isAnimated && shouldAnimate() && Platform.OS !== 'web'
    ? Animated.View
    : View;

  const content = (
    <AnimatedComponent
      ref={ref}
      style={[
        badgeStyle,
        animated && isAnimated && shouldAnimate() && Platform.OS !== 'web' ? animatedStyle : {},
        webAnimationStyle,
        style,
      ]}
      entering={Platform.OS !== 'web' ? getEntranceAnimation() : undefined}
    >
      {dot && (
        <View
          style={{
            width: badgeSizeConfig.dotSize,
            height: badgeSizeConfig.dotSize,
            borderRadius: badgeSizeConfig.dotSize / 2,
            backgroundColor: colors.text,
            marginRight: spacing[1],
          }}
        />
      )}
      <Text
        size={badgeSizeConfig.fontSize}
        weight="medium"
        style={{ color: colors.text }}
      >
        {children}
      </Text>
    </AnimatedComponent>
  );

  if (onPress) {
    if (animated && isAnimated && shouldAnimate() && Platform.OS !== 'web') {
      return (
        <AnimatedPressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={animated && isAnimated && shouldAnimate() ? animatedStyle : {}}
        >
          {content}
        </AnimatedPressable>
      );
    }
    
    return (
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View style={{ opacity: pressed ? 0.7 : 1 }}>
            {content}
          </View>
        )}
      </Pressable>
    );
  }

  return content;
});

Badge.displayName = 'Badge';