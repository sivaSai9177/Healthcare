import React, { useState, useEffect } from 'react';
import { Pressable, View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { useShadow } from '@/hooks/useShadow';

export type CheckboxAnimationType = 'check' | 'bounce' | 'scale' | 'none';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  
  // Styling
  className?: string;
  style?: ViewStyle;
  variant?: 'default' | 'primary' | 'secondary' | 'destructive';
  shadow?: 'sm' | 'base' | 'md' | 'lg' | 'none';
  
  // Animation props
  animated?: boolean;
  animationType?: CheckboxAnimationType;
  animationDuration?: number;
  bounceScale?: number;
  useHaptics?: boolean;
}

// Size mappings
const sizeMap = {
  sm: 16,
  default: 20,
  lg: 24,
};

// Variant classes for Tailwind
const variantClasses = {
  default: {
    unchecked: 'border-input bg-background',
    checked: 'border-primary bg-primary',
    hover: 'hover:border-primary hover:bg-primary/10',
  },
  primary: {
    unchecked: 'border-primary/50 bg-background',
    checked: 'border-primary bg-primary',
    hover: 'hover:border-primary hover:bg-primary/10',
  },
  secondary: {
    unchecked: 'border-secondary/50 bg-background',
    checked: 'border-secondary bg-secondary',
    hover: 'hover:border-secondary hover:bg-secondary/10',
  },
  destructive: {
    unchecked: 'border-destructive/50 bg-background',
    checked: 'border-destructive bg-destructive',
    hover: 'hover:border-destructive hover:bg-destructive/10',
  },
};

export const Checkbox = React.forwardRef<View, CheckboxProps>(({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = 'default',
  className,
  style,
  variant = 'default',
  shadow = 'none',
  // Animation props
  animated = true,
  animationType = 'bounce',
  animationDuration = 200,
  bounceScale = 1.2,
  useHaptics = true,
}, ref) => {
  const { spacing } = useSpacing();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { shouldAnimate } = useAnimationStore();
  const shadowStyle = useShadow(shadow);
  
  const pixelSize = sizeMap[size];
  const variantClass = variantClasses[variant];
  
  // Animation values
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(checked ? 1 : 0);
  const checkRotation = useSharedValue(checked ? 0 : -45);
  
  // Spring config
  const springConfig = {
    damping: 15,
    stiffness: 300,
  };
  
  // Update animation values when checked state changes
  useEffect(() => {
    if (animated && shouldAnimate()) {
      if (checked) {
        checkScale.value = withSpring(1, springConfig);
        checkRotation.value = withSpring(0, springConfig);
        if (animationType === 'bounce') {
          scale.value = withSpring(bounceScale, {
            ...springConfig,
            damping: 10,
          }, () => {
            scale.value = withSpring(1, springConfig);
          });
        }
      } else {
        checkScale.value = withSpring(0, springConfig);
        checkRotation.value = withSpring(-45, springConfig);
      }
    } else {
      // No animation
      checkScale.value = checked ? 1 : 0;
      checkRotation.value = checked ? 0 : -45;
    }
  }, [checked, animated, shouldAnimate, animationType, bounceScale]);

  const handlePress = () => {
    if (!disabled && onCheckedChange) {
      if (animated && shouldAnimate() && useHaptics) {
        haptic('light');
      }
      onCheckedChange(!checked);
      
      // Scale animation on press
      if (animated && shouldAnimate() && animationType === 'scale') {
        scale.value = withSpring(0.9, springConfig, () => {
          scale.value = withSpring(1, springConfig);
        });
      }
    }
  };

  const webHandlers = Platform.OS === 'web' && !disabled ? {
    onHoverIn: () => setIsHovered(true),
    onHoverOut: () => setIsHovered(false),
    onPressIn: () => setIsPressed(true),
    onPressOut: () => setIsPressed(false),
  } : {};
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const checkStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: checkScale.value },
      { rotate: `${checkRotation.value}deg` },
    ],
    opacity: interpolate(checkScale.value, [0, 1], [0, 1]),
  }));
  
  const ViewComponent = animated && shouldAnimate() ? AnimatedPressable : Pressable;
  
  // Tailwind classes
  const checkboxClasses = cn(
    'rounded border-2 items-center justify-center',
    checked ? variantClass.checked : variantClass.unchecked,
    !disabled && variantClass.hover,
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );
  
  // Native styles
  const nativeStyle: ViewStyle = {
    width: pixelSize,
    height: pixelSize,
    borderRadius: spacing[1],
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      cursor: disabled ? 'not-allowed' : 'pointer',
    } as any),
  };
  
  return (
    <ViewComponent
      ref={ref}
      onPress={handlePress}
      disabled={disabled}
      className={checkboxClasses}
      style={[
        nativeStyle,
        shadowStyle,
        animated && shouldAnimate() ? containerStyle : {},
        style,
      ]}
      {...webHandlers}
    >
      {animated && shouldAnimate() ? (
        <Animated.View style={checkStyle}>
          <Text
            size="xs"
            weight="bold"
            className={checked ? 'text-primary-foreground' : 'text-transparent'}
            style={{
              fontSize: pixelSize * 0.7,
              lineHeight: pixelSize * 0.7,
            }}
          >
            ✓
          </Text>
        </Animated.View>
      ) : (
        checked && (
          <Text
            size="xs"
            weight="bold"
            className="text-primary-foreground"
            style={{
              fontSize: pixelSize * 0.7,
              lineHeight: pixelSize * 0.7,
            }}
          >
            ✓
          </Text>
        )
      )}
    </ViewComponent>
  );
});

Checkbox.displayName = 'Checkbox';