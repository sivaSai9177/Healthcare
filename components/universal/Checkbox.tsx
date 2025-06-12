import React, { useState, useEffect } from 'react';
import { Pressable, View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { Text } from './Text';
import { 
  designSystem,
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export type CheckboxAnimationType = 'check' | 'bounce' | 'scale' | 'none';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: number;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: CheckboxAnimationType;
  animationDuration?: number;
  bounceScale?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const Checkbox = React.forwardRef<View, CheckboxProps>(({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = 20,
  style,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'bounce',
  animationDuration,
  bounceScale = 1.2,
  useHaptics = true,
  animationConfig,
}, ref) => {
  const theme = useTheme();
  const { componentSizes } = useSpacing();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.fast;
  
  // Animation values
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(checked ? 1 : 0);
  const checkRotation = useSharedValue(checked ? 0 : -45);
  
  // Update animation values when checked state changes
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      if (checked) {
        checkScale.value = withSpring(1, config.spring);
        checkRotation.value = withSpring(0, config.spring);
        if (animationType === 'bounce') {
          scale.value = withSpring(bounceScale, {
            ...config.spring,
            damping: 10,
          }, () => {
            scale.value = withSpring(1, config.spring);
          });
        }
      } else {
        checkScale.value = withSpring(0, config.spring);
        checkRotation.value = withSpring(-45, config.spring);
      }
    } else {
      // No animation
      checkScale.value = checked ? 1 : 0;
      checkRotation.value = checked ? 0 : -45;
    }
  }, [checked, animated, isAnimated, shouldAnimate, animationType, bounceScale, config.spring]);

  const handlePress = () => {
    if (!disabled && onCheckedChange) {
      if (animated && isAnimated && shouldAnimate() && useHaptics) {
        haptic('light');
      }
      onCheckedChange(!checked);
      
      // Scale animation on press
      if (animated && isAnimated && shouldAnimate() && animationType === 'scale') {
        scale.value = withSpring(0.9, config.spring, () => {
          scale.value = withSpring(1, config.spring);
        });
      }
    }
  };

  const getBorderColor = () => {
    if (checked) return theme.primary;
    if (isHovered && !disabled) return theme.primary + '80'; // 50% opacity
    return theme.border;
  };

  const getBackgroundColor = () => {
    if (checked) {
      if (isPressed && !disabled) return theme.primary + 'cc'; // 80% opacity
      return theme.primary;
    }
    if (isHovered && !disabled) return theme.primary + '1a'; // 10% opacity
    return 'transparent';
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
  
  const ViewComponent = animated && isAnimated && shouldAnimate() ? AnimatedPressable : Pressable;
  
  return (
    <ViewComponent
      ref={ref}
      onPress={handlePress}
      disabled={disabled}
      style={[
        {
          width: size,
          height: size,
          borderRadius: designSystem.borderRadius.sm,
          borderWidth: 2,
          borderColor: getBorderColor(),
          backgroundColor: getBackgroundColor(),
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          // Web-specific styles
          ...(Platform.OS === 'web' && {
            transition: 'all 0.2s ease',
            cursor: disabled ? 'not-allowed' : 'pointer',
          } as any),
        },
        animated && isAnimated && shouldAnimate() ? containerStyle : {},
        style,
      ]}
      {...webHandlers}
    >
      {animated && isAnimated && shouldAnimate() ? (
        <Animated.View style={checkStyle}>
          <Text
            size="xs"
            weight="bold"
            style={{
              color: theme.primaryForeground,
              fontSize: size * 0.7,
              lineHeight: size * 0.7,
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
            style={{
              color: theme.primaryForeground,
              fontSize: size * 0.7,
              lineHeight: size * 0.7,
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