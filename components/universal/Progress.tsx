import React, { useEffect } from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { Box } from './Box';
import { Text } from './Text';
import { useSpacing } from '@/lib/stores/spacing-store';
import { 
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg';
export type ProgressVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';
export type ProgressAnimationType = 'smooth' | 'spring' | 'pulse' | 'none';

export interface ProgressProps {
  value: number; // 0-100
  max?: number;
  size?: ProgressSize;
  variant?: ProgressVariant;
  showValue?: boolean;
  indeterminate?: boolean;
  style?: ViewStyle;
  trackStyle?: ViewStyle;
  fillStyle?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: ProgressAnimationType;
  animationDuration?: number;
  pulseIntensity?: number;
  onComplete?: () => void;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

// Theme-aware color mapping
const getProgressColors = (variant: ProgressVariant, theme: any) => {
  const colorMap = {
    default: {
      track: theme.muted,
      fill: theme.mutedForeground,
    },
    primary: {
      track: theme.primary + '33', // 20% opacity
      fill: theme.primary,
    },
    success: {
      track: theme.success + '33',
      fill: theme.success,
    },
    warning: {
      track: 'theme.warning' + '33',
      fill: 'theme.warning',
    },
    error: {
      track: theme.destructive + '33',
      fill: theme.destructive,
    },
  };
  
  return colorMap[variant];
};

export const Progress = React.forwardRef<View, ProgressProps>(({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showValue = false,
  indeterminate = false,
  style,
  trackStyle,
  fillStyle,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'smooth',
  animationDuration,
  pulseIntensity = 0.1,
  onComplete,
  useHaptics = true,
  animationConfig,
}, ref) => {
  const theme = useTheme();
  const { spacing, componentSpacing } = useSpacing();
  const colors = getProgressColors(variant, theme);
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.normal;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  // Animation values
  const progress = useSharedValue(0);
  const indeterminateProgress = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);
  
  // Track previous value for completion detection
  const [prevPercentage, setPrevPercentage] = React.useState(percentage);

  // Size configuration
  const sizeConfig = {
    xs: { height: spacing[0.5], fontSize: 'xs' as const },
    sm: { height: spacing[1], fontSize: 'sm' as const },
    md: { height: spacing[2], fontSize: 'sm' as const },
    lg: { height: spacing[3], fontSize: 'md' as const },
  };

  const sizeConf = sizeConfig[size];

  // Animate progress value changes
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate() && !indeterminate) {
      if (animationType === 'smooth') {
        progress.value = withTiming(percentage, { 
          duration,
          easing: Easing.inOut(Easing.ease),
        });
      } else if (animationType === 'spring') {
        progress.value = withSpring(percentage, config.spring);
      }
      
      // Trigger pulse animation
      if (animationType === 'pulse') {
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(1 - pulseIntensity, { duration: duration / 2 }),
            withTiming(1, { duration: duration / 2 })
          ),
          -1,
          true
        );
      }
      
      // Check for completion
      if (percentage === 100 && prevPercentage < 100) {
        if (useHaptics && Platform.OS !== 'web') {
          haptic('success');
        }
        onComplete?.();
      }
    } else if (!indeterminate) {
      progress.value = percentage;
    }
    setPrevPercentage(percentage);
  }, [percentage, animated, isAnimated, shouldAnimate, indeterminate, animationType, duration, pulseIntensity, config.spring, prevPercentage, onComplete, useHaptics]);

  // Indeterminate animation
  useEffect(() => {
    if (indeterminate && animated && isAnimated && shouldAnimate()) {
      indeterminateProgress.value = withRepeat(
        withTiming(1, {
          duration: 1500,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [indeterminate, animated, isAnimated, shouldAnimate]);

  // Animated styles
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const indeterminateStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        indeterminateProgress.value,
        [0, 1],
        [-100, 300] // Move from -100% to 300% of container width
      )
    }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Web CSS animations
  const webAnimationStyle = Platform.OS === 'web' && animated && isAnimated && shouldAnimate() ? {
    '@keyframes progress': {
      from: { width: '0%' },
      to: { width: `${percentage}%` },
    },
    '@keyframes indeterminate': {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(300%)' },
    },
    '@keyframes pulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 1 - pulseIntensity },
    },
  } as any : {};

  return (
    <View ref={ref} style={style}>
      <View
        style={[
          {
            height: sizeConf.height,
            backgroundColor: colors.track,
            borderRadius: sizeConf.height / 2,
            overflow: 'hidden',
            width: '100%',
          },
          trackStyle,
          webAnimationStyle,
        ]}
      >
        {indeterminate ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '30%',
                backgroundColor: colors.fill,
                borderRadius: sizeConf.height / 2,
              },
              Platform.OS === 'web' && animated && isAnimated && shouldAnimate() 
                ? {
                    animation: 'indeterminate 1.5s linear infinite',
                  } as any
                : indeterminateStyle,
              fillStyle,
            ]}
          />
        ) : (
          <Animated.View
            style={[
              {
                height: '100%',
                backgroundColor: colors.fill,
                borderRadius: sizeConf.height / 2,
              },
              Platform.OS === 'web' && animated && isAnimated && shouldAnimate()
                ? {
                    width: `${percentage}%`,
                    transition: animationType === 'smooth' 
                      ? `width ${duration}ms ease-in-out`
                      : animationType === 'spring'
                      ? `width ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                      : undefined,
                    animation: animationType === 'pulse' 
                      ? `pulse ${duration}ms ease-in-out infinite`
                      : undefined,
                  } as any
                : progressStyle,
              animationType === 'pulse' && Platform.OS !== 'web' ? pulseStyle : {},
              fillStyle,
            ]}
          />
        )}
      </View>
      
      {showValue && !indeterminate && (
        <Box mt={1}>
          <Text size={sizeConf.fontSize} colorTheme="mutedForeground">
            {Math.round(percentage)}%
          </Text>
        </Box>
      )}
    </View>
  );
});

Progress.displayName = 'Progress';

// Circular Progress Component
export interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  variant?: ProgressVariant;
  showValue?: boolean;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: 'smooth' | 'spring' | 'none';
  animationDuration?: number;
  onComplete?: () => void;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const CircularProgress = React.forwardRef<View, CircularProgressProps>(({
  value,
  size = 60,
  strokeWidth = 4,
  variant = 'primary',
  showValue = true,
  animated = true,
  style,
}, ref) => {
  const theme = useTheme();
  const colors = getProgressColors(variant, theme);
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max(value, 0), 100);

  React.useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      animatedValue.setValue(percentage);
    }
  }, [percentage, animated]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View
      ref={ref}
      style={[
        {
          width: size,
          height: size,
          transform: [{ rotate: '-90deg' }],
        },
        style,
      ]}
    >
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.fill}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      
      {showValue && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ rotate: '90deg' }],
          }}
        >
          <Text size="sm" weight="semibold">
            {Math.round(percentage)}%
          </Text>
        </View>
      )}
    </View>
  );
});

CircularProgress.displayName = 'CircularProgress';

// Note: For circular progress, we'll need to conditionally import SVG
const Svg = require('react-native-svg').Svg;
const Circle = require('react-native-svg').Circle;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);