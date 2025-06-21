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
import { cn } from '@/lib/core/utils';
import { Text } from '@/components/universal/typography/Text';

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

// Tailwind-based badge variants
const badgeVariants = {
  default: {
    container: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  primary: {
    container: 'bg-primary text-primary-foreground',
    dot: 'bg-primary-foreground',
  },
  secondary: {
    container: 'bg-secondary text-secondary-foreground',
    dot: 'bg-secondary-foreground',
  },
  success: {
    container: 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
    dot: 'bg-green-700 dark:bg-green-300',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-700 dark:bg-yellow-300',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
    dot: 'bg-red-700 dark:bg-red-300',
  },
  outline: {
    container: 'bg-transparent text-foreground border border-input',
    dot: 'bg-foreground',
  },
};

// Tailwind size classes with density support
const badgeSizeClasses = {
  xs: 'px-1.5 py-0.5 text-xs',
  sm: 'px-2 py-0.5 text-sm',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const densityBadgeSizeClasses = {
  compact: {
    xs: 'px-1 py-0.5 text-xs',
    sm: 'px-1.5 py-0.5 text-sm',
    md: 'px-2 py-0.5 text-sm',
    lg: 'px-2.5 py-1 text-base',
  },
  medium: {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-sm',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  },
  large: {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-sm',
    md: 'px-3 py-1.5 text-base',
    lg: 'px-4 py-2 text-lg',
  },
};

const roundedClasses = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
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
  const { spacing, componentSpacing, density } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const prevChildrenRef = React.useRef(children);
  
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
    if (animateOnChange && prevChildrenRef.current !== children && animated && isAnimated && shouldAnimate()) {
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
    prevChildrenRef.current = children;
  }, [children, animateOnChange, animated, isAnimated, shouldAnimate, useHaptics, config.spring, scale]);
  
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
  
  const styles = badgeVariants[variant] || badgeVariants.default;
  const sizeClass = densityBadgeSizeClasses[density]?.[size] || badgeSizeClasses[size];
  
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

  // Get dot size based on badge size
  const dotSizeMap = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };
  
  // Get entrance animation
  const getEntranceAnimation = () => {
    if (!animated || !isAnimated || !shouldAnimate() || animationType === 'none') return undefined;
    return animationType === 'scale' 
      ? ZoomIn.duration(duration).delay(animationDelay)
      : FadeIn.duration(duration).delay(animationDelay);
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
      className={cn(
        'inline-flex items-center',
        styles.container,
        sizeClass,
        roundedClasses[rounded],
        'transition-colors'
      )}
      style={[
        animated && isAnimated && shouldAnimate() && Platform.OS !== 'web' ? animatedStyle : {},
        webAnimationStyle,
        style,
      ]}
      entering={Platform.OS !== 'web' ? getEntranceAnimation() : undefined}
    >
      {dot && (
        <View
          className={cn(
            'rounded-full mr-1',
            dotSizeMap[size],
            styles.dot
          )}
        />
      )}
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : size === 'lg' ? 'base' : 'sm'}>
          {children}
        </Text>
      ) : (
        children
      )}
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