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
import { Box } from '@/components/universal/layout/Box';
import { Text } from '@/components/universal/typography/Text';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export type ProgressSize = 'xs' | 'sm' | 'default' | 'lg';
export type ProgressVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
export type ProgressAnimationType = 'smooth' | 'spring' | 'pulse' | 'none';

export interface ProgressProps {
  value: number; // 0-100
  max?: number;
  size?: ProgressSize;
  variant?: ProgressVariant;
  showValue?: boolean;
  label?: string;
  indeterminate?: boolean;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  style?: ViewStyle;
  trackStyle?: ViewStyle;
  fillStyle?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationType?: ProgressAnimationType;
  animationDuration?: number;
  pulseIntensity?: number;
  onComplete?: () => void;
  useHaptics?: boolean;
}

// Size configurations
const sizeConfig = {
  xs: {
    height: 2,
    fontSize: 'xs' as const,
  },
  sm: {
    height: 4,
    fontSize: 'sm' as const,
  },
  default: {
    height: 8,
    fontSize: 'base' as const,
  },
  lg: {
    height: 12,
    fontSize: 'lg' as const,
  },
};

// Variant classes
const variantClasses = {
  default: {
    track: 'bg-muted',
    fill: 'bg-foreground',
  },
  primary: {
    track: 'bg-primary/20',
    fill: 'bg-primary',
  },
  secondary: {
    track: 'bg-secondary/20',
    fill: 'bg-secondary',
  },
  success: {
    track: 'bg-green-500/20',
    fill: 'bg-green-500',
  },
  warning: {
    track: 'bg-yellow-500/20',
    fill: 'bg-yellow-500',
  },
  destructive: {
    track: 'bg-destructive/20',
    fill: 'bg-destructive',
  },
};

const AnimatedView = Animated.View;

export const Progress = React.forwardRef<View, ProgressProps>(({
  value,
  max = 100,
  size = 'default',
  variant = 'primary',
  showValue = false,
  label,
  indeterminate = false,
  className,
  trackClassName,
  fillClassName,
  style,
  trackStyle,
  fillStyle,
  // Animation props
  animated = true,
  animationType = 'smooth',
  animationDuration = 1000,
  pulseIntensity = 0.1,
  onComplete,
  useHaptics = true,
}, ref) => {
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  
  const config = sizeConfig[size];
  const classes = variantClasses[variant];
  
  // Normalize value
  const normalizedValue = Math.max(0, Math.min(100, (value / max) * 100));
  
  // Animation values
  const progressWidth = useSharedValue(0);
  const indeterminatePosition = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);
  
  // Spring config
  const springConfig = {
    damping: 15,
    stiffness: 100,
  };
  
  // Update progress animation
  useEffect(() => {
    if (indeterminate) {
      // Indeterminate animation - sliding bar
      if (animated && shouldAnimate()) {
        indeterminatePosition.value = withRepeat(
          withTiming(1, { duration: 1500, easing: Easing.linear }),
          -1,
          false
        );
      }
    } else {
      // Determinate animation
      if (animated && shouldAnimate()) {
        if (animationType === 'smooth') {
          progressWidth.value = withTiming(normalizedValue, { 
            duration: animationDuration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          });
        } else if (animationType === 'spring') {
          progressWidth.value = withSpring(normalizedValue, springConfig);
        }
        
        // Pulse animation
        if (animationType === 'pulse') {
          pulseOpacity.value = withRepeat(
            withSequence(
              withTiming(1 - pulseIntensity, { duration: 500 }),
              withTiming(1, { duration: 500 })
            ),
            -1,
            true
          );
        }
        
        // Complete callback and haptic
        if (normalizedValue === 100 && onComplete) {
          setTimeout(() => {
            if (useHaptics) {
              haptic('notificationSuccess');
            }
            onComplete();
          }, animationDuration);
        }
      } else {
        progressWidth.value = normalizedValue;
      }
    }
  }, [normalizedValue, indeterminate, animated, shouldAnimate, animationType]);
  
  // Animated styles
  const fillAnimatedStyle = useAnimatedStyle(() => {
    if (indeterminate) {
      return {
        width: '30%',
        transform: [{
          translateX: interpolate(
            indeterminatePosition.value,
            [0, 1],
            [-100, 300]
          )
        }],
      };
    }
    
    return {
      width: `${progressWidth.value}%`,
      opacity: animationType === 'pulse' ? pulseOpacity.value : 1,
    };
  });
  
  // Track classes
  const trackClasses = cn(
    'rounded-full overflow-hidden',
    classes.track,
    trackClassName,
    className
  );
  
  // Fill classes
  const fillClasses = cn(
    'h-full rounded-full',
    classes.fill,
    fillClassName
  );
  
  return (
    <View ref={ref} style={style}>
      {/* Label and value */}
      {(label || showValue) && (
        <Box 
          className="flex-row justify-between items-center mb-1"
        >
          {label && (
            <Text size={config.fontSize} weight="medium">
              {label}
            </Text>
          )}
          {showValue && !indeterminate && (
            <Text size={config.fontSize} className="text-muted-foreground">
              {Math.round(normalizedValue)}%
            </Text>
          )}
        </Box>
      )}
      
      {/* Progress track */}
      <View
        className={trackClasses}
        style={[
          {
            height: config.height,
          },
          trackStyle,
        ]}
      >
        {/* Progress fill */}
        <AnimatedView
          className={fillClasses}
          style={[
            animated && shouldAnimate() ? fillAnimatedStyle : {
              width: indeterminate ? '30%' : `${normalizedValue}%`,
            },
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
});

Progress.displayName = 'Progress';