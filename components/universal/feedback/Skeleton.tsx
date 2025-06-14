import React, { useEffect } from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/core/utils';
import { Box } from '@/components/universal/layout/Box';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';

export type SkeletonAnimationType = 'shimmer' | 'pulse' | 'wave' | 'none';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  style?: ViewStyle;
  variant?: 'default' | 'text' | 'circular' | 'rectangular' | 'button';
  lines?: number; // For text skeleton
  spacing?: 'sm' | 'base' | 'lg'; // Space between lines
  
  // Animation props
  animated?: boolean;
  animationType?: SkeletonAnimationType;
  animationDuration?: number;
  shimmerWidth?: number;
  shimmerAngle?: number;
  pulseIntensity?: number;
}

// Rounded mapping
const roundedMap = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

// Variant presets
const variantPresets = {
  default: {
    width: '100%',
    height: 20,
    rounded: 'md' as const,
  },
  text: {
    width: '100%',
    height: 16,
    rounded: 'md' as const,
  },
  circular: {
    width: 40,
    height: 40,
    rounded: 'full' as const,
  },
  rectangular: {
    width: '100%',
    height: 100,
    rounded: 'md' as const,
  },
  button: {
    width: 100,
    height: 40,
    rounded: 'md' as const,
  },
};

// Spacing values
const spacingMap = {
  sm: 4,
  base: 8,
  lg: 12,
};

const AnimatedView = Animated.View;
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const Skeleton = React.forwardRef<View, SkeletonProps>(({
  width,
  height,
  rounded = 'md',
  className,
  style,
  variant = 'default',
  lines = 1,
  spacing = 'base',
  // Animation props
  animated = true,
  animationType = 'shimmer',
  animationDuration = 1500,
  shimmerWidth = 0.3,
  shimmerAngle = 20,
  pulseIntensity = 0.3,
}, ref) => {
  const { spacing: getSpacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  
  // Get variant preset
  const preset = variantPresets[variant];
  const finalWidth = width ?? preset.width;
  const finalHeight = height ?? preset.height;
  const finalRounded = rounded ?? preset.rounded;
  const borderRadius = roundedMap[finalRounded];
  
  // Animation values
  const shimmerPosition = useSharedValue(-1);
  const pulseOpacity = useSharedValue(1);
  const waveScale = useSharedValue(1);
  
  // Initialize animations
  useEffect(() => {
    if (animated && shouldAnimate()) {
      if (animationType === 'shimmer') {
        shimmerPosition.value = withRepeat(
          withTiming(2, {
            duration: animationDuration,
            easing: Easing.linear,
          }),
          -1,
          false
        );
      } else if (animationType === 'pulse') {
        pulseOpacity.value = withRepeat(
          withTiming(1 - pulseIntensity, {
            duration: animationDuration,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        );
      } else if (animationType === 'wave') {
        waveScale.value = withRepeat(
          withTiming(1.02, {
            duration: animationDuration,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        );
      }
    }
  }, [animated, shouldAnimate, animationType]);
  
  // Animated styles
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));
  
  const waveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: waveScale.value }],
  }));
  
  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        shimmerPosition.value,
        [-1, 2],
        [-200, 400]
      ),
    }],
  }));
  
  // Base classes
  const baseClasses = cn(
    'bg-muted overflow-hidden',
    className
  );
  
  // Base style
  const baseStyle: ViewStyle = {
    width: finalWidth,
    height: finalHeight,
    borderRadius,
    ...style,
  };
  
  // Render single skeleton
  const renderSkeleton = (key?: number) => {
    if (animationType === 'shimmer' && animated && shouldAnimate()) {
      return (
        <View
          key={key}
          className={baseClasses}
          style={baseStyle}
        >
          <AnimatedLinearGradient
            colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                width: `${shimmerWidth * 100}%`,
              },
              shimmerAnimatedStyle,
            ]}
          />
        </View>
      );
    }
    
    return (
      <AnimatedView
        key={key}
        className={baseClasses}
        style={[
          baseStyle,
          animated && shouldAnimate() && animationType === 'pulse' ? pulseAnimatedStyle : {},
          animated && shouldAnimate() && animationType === 'wave' ? waveAnimatedStyle : {},
        ]}
      />
    );
  };
  
  // Render multiple lines for text variant
  if (variant === 'text' && lines > 1) {
    return (
      <Box ref={ref} style={style}>
        {Array.from({ length: lines }).map((_, index) => (
          <View key={index}>
            {renderSkeleton(index)}
            {index < lines - 1 && (
              <View style={{ height: spacingMap[spacing] }} />
            )}
          </View>
        ))}
      </Box>
    );
  }
  
  // Single skeleton
  return renderSkeleton();
});

Skeleton.displayName = 'Skeleton';