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
import { useTheme } from '@/lib/theme/provider';
import { Box } from './Box';
import { useSpacing } from '@/lib/stores/spacing-store';
import { 
  SpacingScale,
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';

export type SkeletonAnimationType = 'shimmer' | 'pulse' | 'wave' | 'none';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  style?: ViewStyle;
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
  lines?: number; // For text skeleton
  spacing?: SpacingScale; // Space between lines
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: SkeletonAnimationType;
  animationDuration?: number;
  shimmerWidth?: number;
  shimmerAngle?: number;
  animationConfig?: {
    duration?: number;
    colors?: string[];
  };
}

export const Skeleton = React.forwardRef<View, SkeletonProps>(({
  width,
  height,
  rounded = 'md',
  style,
  variant = 'default',
  lines = 1,
  spacing = 2,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'shimmer',
  animationDuration,
  shimmerWidth = 0.3,
  shimmerAngle = 20,
  animationConfig,
}, ref) => {
  const theme = useTheme();
  const { spacing: spacingValues } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config: variantConfig, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? variantConfig.duration.slow;
  
  // Theme-aware colors
  const baseColor = theme.muted;
  const highlightColor = theme.card;
  const shimmerColors = animationConfig?.colors || [
    baseColor,
    highlightColor,
    baseColor,
  ];
  
  // Animation values
  const shimmerPosition = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.3);
  const waveScale = useSharedValue(1);

  // Variant-based dimensions
  const getVariantDimensions = () => {
    switch (variant) {
      case 'text':
        return { width: width || '100%', height: height || 16 };
      case 'circular':
        const size = width || height || 40;
        return { width: size, height: size };
      case 'rectangular':
        return { width: width || '100%', height: height || 100 };
      default:
        return { width: width || '100%', height: height || 20 };
    }
  };

  const dimensions = getVariantDimensions();

  const borderRadius = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    full: variant === 'circular' ? 999 : 999,
  }[rounded];

  // Animation setup
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      if (animationType === 'shimmer') {
        shimmerPosition.value = withRepeat(
          withTiming(1, {
            duration,
            easing: Easing.linear,
          }),
          -1,
          false
        );
      } else if (animationType === 'pulse') {
        pulseOpacity.value = withRepeat(
          withTiming(0.7, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        );
      } else if (animationType === 'wave') {
        waveScale.value = withRepeat(
          withTiming(1.05, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        );
      }
    }
  }, [animated, isAnimated, shouldAnimate, animationType, duration]);

  // Animated styles
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        shimmerPosition.value,
        [0, 1],
        [-200, 200]
      ),
    }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale.value }],
  }));

  // Web CSS animations
  const webAnimationStyle = Platform.OS === 'web' && animated && isAnimated && shouldAnimate() ? {
    '@keyframes shimmer': {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    '@keyframes pulse': {
      '0%, 100%': { opacity: 0.3 },
      '50%': { opacity: 0.7 },
    },
    '@keyframes wave': {
      '0%, 100%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' },
    },
  } as any : {};

  const renderSkeleton = (key?: number) => {
    const skeletonStyle = {
      backgroundColor: baseColor,
      borderRadius,
      width: dimensions.width,
      height: dimensions.height,
      overflow: 'hidden' as const,
    };

    if (Platform.OS === 'web' && animated && isAnimated && shouldAnimate()) {
      return (
        <View
          key={key}
          style={[
            skeletonStyle,
            animationType === 'shimmer' ? {
              background: `linear-gradient(90deg, ${baseColor} 25%, ${highlightColor} 50%, ${baseColor} 75%)`,
              backgroundSize: '200% 100%',
              animation: `shimmer ${duration}ms infinite`,
            } : animationType === 'pulse' ? {
              animation: `pulse ${duration}ms infinite`,
            } : animationType === 'wave' ? {
              animation: `wave ${duration}ms infinite`,
            } : {},
            webAnimationStyle,
            style,
          ] as any}
        />
      );
    }

    // Native implementation
    if (animationType === 'shimmer' && animated && isAnimated && shouldAnimate()) {
      return (
        <Animated.View
          key={key}
          style={[
            skeletonStyle,
            animationType === 'wave' ? waveStyle : {},
            style,
          ]}
        >
          <LinearGradient
            colors={shimmerColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: `${shimmerWidth * 100}%`,
                backgroundColor: highlightColor,
                opacity: 0.5,
                transform: [{ skewX: `${shimmerAngle}deg` }],
              },
              shimmerStyle,
            ]}
          />
        </Animated.View>
      );
    }

    // Pulse or wave animation
    return (
      <Animated.View
        key={key}
        style={[
          skeletonStyle,
          animationType === 'pulse' && animated && isAnimated && shouldAnimate() ? pulseStyle : {},
          animationType === 'wave' && animated && isAnimated && shouldAnimate() ? waveStyle : {},
          !animated || !isAnimated || !shouldAnimate() ? { opacity: 0.5 } : {},
          style,
        ]}
      />
    );
  };

  if (variant === 'text' && lines > 1) {
    return (
      <View ref={ref}>
        {Array.from({ length: lines }, (_, i) => (
          <View key={i} style={{ marginBottom: i < lines - 1 ? spacingValues[spacing] : 0 }}>
            {renderSkeleton(i)}
          </View>
        ))}
      </View>
    );
  }

  return renderSkeleton();
});

Skeleton.displayName = 'Skeleton';

// Skeleton Container for complex loading states
export interface SkeletonContainerProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  fade?: boolean;
  animationDuration?: number;
}

export const SkeletonContainer: React.FC<SkeletonContainerProps> = ({
  isLoading,
  children,
  skeleton,
  fade = true,
  animationDuration = 300,
}) => {
  const opacity = useSharedValue(isLoading ? 0 : 1);

  useEffect(() => {
    if (fade) {
      opacity.value = withTiming(isLoading ? 0 : 1, {
        duration: animationDuration,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [isLoading, fade, animationDuration]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (isLoading && skeleton) {
    return <>{skeleton}</>;
  }

  if (fade) {
    return (
      <Animated.View style={fadeStyle}>
        {children}
      </Animated.View>
    );
  }

  return <>{children}</>;
};

// Pre-built skeleton templates
export const SkeletonTemplates = {
  Card: () => (
    <Box p={4 as SpacingScale} rounded="lg" bgTheme="card">
      <Skeleton variant="rectangular" height={200} rounded="md" />
      <Box mt={3}>
        <Skeleton variant="text" width="60%" />
        <Box mt={2}>
          <Skeleton variant="text" lines={3} spacing={2} />
        </Box>
      </Box>
    </Box>
  ),
  
  ListItem: () => (
    <Box p={4 as SpacingScale} flexDirection="row" alignItems="center">
      <Skeleton variant="circular" width={40} height={40} />
      <Box ml={3} flex={1}>
        <Skeleton variant="text" width="70%" />
        <Box mt={1}>
          <Skeleton variant="text" width="40%" height={12} />
        </Box>
      </Box>
    </Box>
  ),
  
  Profile: () => (
    <Box alignItems="center" p={4 as SpacingScale}>
      <Skeleton variant="circular" width={80} height={80} />
      <Box mt={3} width="100%" alignItems="center">
        <Skeleton variant="text" width="50%" height={20} />
        <Box mt={2}>
          <Skeleton variant="text" width="70%" height={14} />
        </Box>
      </Box>
    </Box>
  ),
};