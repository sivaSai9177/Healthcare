import React, { useEffect } from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Symbol } from '@/components/universal/display/Symbols';
import { cn } from '@/lib/core/utils';
import { useAnimationStore } from '@/lib/stores/animation-store';

export type SpinnerSize = 'xs' | 'sm' | 'default' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'primary' | 'secondary' | 'destructive' | 'success';
export type SpinnerAnimationType = 'spin' | 'pulse' | 'dots' | 'bars';

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  style?: ViewStyle;
  label?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: SpinnerAnimationType;
  animationDuration?: number;
  customIcon?: string;
  strokeWidth?: number;
}

// Size configurations
const sizeConfig = {
  xs: {
    size: 16,
    strokeWidth: 2,
    fontSize: 'xs' as const,
  },
  sm: {
    size: 20,
    strokeWidth: 2,
    fontSize: 'sm' as const,
  },
  default: {
    size: 24,
    strokeWidth: 2.5,
    fontSize: 'base' as const,
  },
  lg: {
    size: 32,
    strokeWidth: 3,
    fontSize: 'lg' as const,
  },
  xl: {
    size: 48,
    strokeWidth: 4,
    fontSize: 'xl' as const,
  },
};

// Variant colors
const variantColors = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
  destructive: 'text-destructive',
  success: 'text-green-500',
};

const AnimatedView = Animated.View;

export const Spinner = React.forwardRef<View, SpinnerProps>(({
  size = 'default',
  variant = 'primary',
  className,
  style,
  label,
  // Animation props
  animated = true,
  animationType = 'spin',
  animationDuration = 1000,
  customIcon,
  strokeWidth,
}, ref) => {
  const { shouldAnimate } = useAnimationStore();
  
  const config = sizeConfig[size];
  const colorClass = variantColors[variant];
  
  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const dot1Opacity = useSharedValue(1);
  const dot2Opacity = useSharedValue(0.4);
  const dot3Opacity = useSharedValue(0.4);
  const bar1Height = useSharedValue(0.4);
  const bar2Height = useSharedValue(0.8);
  const bar3Height = useSharedValue(0.6);
  
  // Initialize animations
  useEffect(() => {
    if (animated && shouldAnimate()) {
      if (animationType === 'spin') {
        rotation.value = withRepeat(
          withTiming(360, {
            duration: animationDuration,
            easing: Easing.linear,
          }),
          -1,
          false
        );
      } else if (animationType === 'pulse') {
        scale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: animationDuration / 2 }),
            withTiming(1, { duration: animationDuration / 2 })
          ),
          -1,
          false
        );
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: animationDuration / 2 }),
            withTiming(1, { duration: animationDuration / 2 })
          ),
          -1,
          false
        );
      } else if (animationType === 'dots') {
        // Staggered dot animation
        dot1Opacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: animationDuration / 3 }),
            withTiming(0.4, { duration: animationDuration / 3 }),
            withTiming(0.4, { duration: animationDuration / 3 })
          ),
          -1,
          false
        );
        dot2Opacity.value = withRepeat(
          withSequence(
            withTiming(0.4, { duration: animationDuration / 3 }),
            withTiming(1, { duration: animationDuration / 3 }),
            withTiming(0.4, { duration: animationDuration / 3 })
          ),
          -1,
          false
        );
        dot3Opacity.value = withRepeat(
          withSequence(
            withTiming(0.4, { duration: animationDuration / 3 }),
            withTiming(0.4, { duration: animationDuration / 3 }),
            withTiming(1, { duration: animationDuration / 3 })
          ),
          -1,
          false
        );
      } else if (animationType === 'bars') {
        // Animated bars
        bar1Height.value = withRepeat(
          withSequence(
            withTiming(1, { duration: animationDuration / 3 }),
            withTiming(0.4, { duration: animationDuration / 3 })
          ),
          -1,
          true
        );
        bar2Height.value = withRepeat(
          withSequence(
            withTiming(0.4, { duration: animationDuration / 3 }),
            withTiming(1, { duration: animationDuration / 3 })
          ),
          -1,
          true
        );
        bar3Height.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: animationDuration / 3 }),
            withTiming(0.9, { duration: animationDuration / 3 })
          ),
          -1,
          true
        );
      }
    }
  }, [animated, shouldAnimate, animationType, animationDuration]);
  
  // Animated styles
  const spinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const dot1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));
  
  const dot2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));
  
  const dot3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));
  
  const bar1AnimatedStyle = useAnimatedStyle(() => ({
    height: `${bar1Height.value * 100}%`,
  }));
  
  const bar2AnimatedStyle = useAnimatedStyle(() => ({
    height: `${bar2Height.value * 100}%`,
  }));
  
  const bar3AnimatedStyle = useAnimatedStyle(() => ({
    height: `${bar3Height.value * 100}%`,
  }));
  
  // Container classes
  const containerClasses = cn(
    'items-center justify-center',
    className
  );
  
  // Render different animation types
  const renderSpinner = () => {
    if (animationType === 'dots') {
      const dotSize = config.size / 4;
      return (
        <View className="flex-row items-center justify-center" style={{ gap: dotSize / 2 }}>
          <AnimatedView
            className={cn('rounded-full', colorClass)}
            style={[
              {
                width: dotSize,
                height: dotSize,
                backgroundColor: 'currentColor',
              },
              animated && shouldAnimate() ? dot1AnimatedStyle : {},
            ]}
          />
          <AnimatedView
            className={cn('rounded-full', colorClass)}
            style={[
              {
                width: dotSize,
                height: dotSize,
                backgroundColor: 'currentColor',
              },
              animated && shouldAnimate() ? dot2AnimatedStyle : {},
            ]}
          />
          <AnimatedView
            className={cn('rounded-full', colorClass)}
            style={[
              {
                width: dotSize,
                height: dotSize,
                backgroundColor: 'currentColor',
              },
              animated && shouldAnimate() ? dot3AnimatedStyle : {},
            ]}
          />
        </View>
      );
    }
    
    if (animationType === 'bars') {
      const barWidth = config.size / 6;
      return (
        <View className="flex-row items-end justify-center" style={{ height: config.size, gap: barWidth / 2 }}>
          <AnimatedView
            className={cn('rounded-full', colorClass)}
            style={[
              {
                width: barWidth,
                backgroundColor: 'currentColor',
              },
              animated && shouldAnimate() ? bar1AnimatedStyle : { height: '40%' },
            ]}
          />
          <AnimatedView
            className={cn('rounded-full', colorClass)}
            style={[
              {
                width: barWidth,
                backgroundColor: 'currentColor',
              },
              animated && shouldAnimate() ? bar2AnimatedStyle : { height: '80%' },
            ]}
          />
          <AnimatedView
            className={cn('rounded-full', colorClass)}
            style={[
              {
                width: barWidth,
                backgroundColor: 'currentColor',
              },
              animated && shouldAnimate() ? bar3AnimatedStyle : { height: '60%' },
            ]}
          />
        </View>
      );
    }
    
    // Default spin or pulse with icon
    const animatedStyle = animationType === 'pulse' ? pulseAnimatedStyle : spinAnimatedStyle;
    
    return (
      <AnimatedView
        style={[
          animated && shouldAnimate() && animationType !== 'none' ? animatedStyle : {},
        ]}
      >
        <Symbol
          name={customIcon || 'arrow.circlepath'}
          size={config.size}
          weight={strokeWidth || config.strokeWidth}
          className={colorClass}
        />
      </AnimatedView>
    );
  };
  
  return (
    <View
      ref={ref}
      className={containerClasses}
      style={[style]}
    >
      {renderSpinner()}
      {label && (
        <Text
          size={config.fontSize}
          className={cn('mt-2', colorClass)}
        >
          {label}
        </Text>
      )}
    </View>
  );
});

Spinner.displayName = 'Spinner';

// Export a LoadingSpinner component for common use cases
export const LoadingSpinner: React.FC<{
  size?: SpinnerSize;
  fullScreen?: boolean;
  label?: string;
}> = ({ size = 'default', fullScreen = false, label = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size={size} label={label} />
      </View>
    );
  }
  
  return <Spinner size={size} label={label} />;
};