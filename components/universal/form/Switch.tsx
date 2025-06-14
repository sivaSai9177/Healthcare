import React, { useEffect } from 'react';
import { Switch as RNSwitch, SwitchProps as RNSwitchProps, Platform, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { cn } from '@/lib/core/utils';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { useShadow } from '@/hooks/useShadow';

export type SwitchAnimationType = 'toggle' | 'slide' | 'glow' | 'none';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);

interface SwitchProps extends Omit<RNSwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'primary' | 'secondary' | 'destructive';
  className?: string;
  shadow?: 'sm' | 'base' | 'md' | 'lg' | 'none';
  
  // Animation props
  animated?: boolean;
  animationType?: SwitchAnimationType;
  animationDuration?: number;
  glowIntensity?: number;
  useHaptics?: boolean;
}

// Variant color mappings for native
const variantColors = {
  default: {
    trackOn: '#3b82f6', // primary
    trackOff: '#e5e7eb', // gray-200
    thumb: '#ffffff',
  },
  primary: {
    trackOn: '#3b82f6',
    trackOff: '#e5e7eb',
    thumb: '#ffffff',
  },
  secondary: {
    trackOn: '#8b5cf6', // violet-500
    trackOff: '#e5e7eb',
    thumb: '#ffffff',
  },
  destructive: {
    trackOn: '#ef4444', // red-500
    trackOff: '#e5e7eb',
    thumb: '#ffffff',
  },
};

export const Switch = React.forwardRef<RNSwitch, SwitchProps>(({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = 'default',
  variant = 'default',
  className,
  shadow = 'none',
  style,
  // Animation props
  animated = true,
  animationType = 'slide',
  animationDuration = 200,
  glowIntensity = 0.5,
  useHaptics = true,
  ...props
}, ref) => {
  const { shouldAnimate } = useAnimationStore();
  const shadowStyle = useShadow(shadow);
  const colors = variantColors[variant];
  
  // Animation values
  const thumbPosition = useSharedValue(checked ? 1 : 0);
  const trackColor = useSharedValue(checked ? 1 : 0);
  const glowOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // Size configurations
  const sizeConfig = {
    sm: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
    default: {},
    lg: { transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] },
  };
  
  // Spring config
  const springConfig = {
    damping: 15,
    stiffness: 300,
  };
  
  // Update animation values when checked changes
  useEffect(() => {
    if (animated && shouldAnimate()) {
      thumbPosition.value = withSpring(checked ? 1 : 0, springConfig);
      trackColor.value = withTiming(checked ? 1 : 0, { duration: animationDuration });
      
      if (animationType === 'glow' && checked) {
        glowOpacity.value = withTiming(glowIntensity, { duration: animationDuration / 2 });
      } else {
        glowOpacity.value = withTiming(0, { duration: animationDuration / 2 });
      }
      
      if (animationType === 'toggle') {
        scale.value = withSpring(0.9, { ...springConfig, damping: 10 }, () => {
          scale.value = withSpring(1, springConfig);
        });
      }
    } else {
      // No animation
      thumbPosition.value = checked ? 1 : 0;
      trackColor.value = checked ? 1 : 0;
      glowOpacity.value = 0;
    }
  }, [checked, animated, shouldAnimate, animationType, glowIntensity, animationDuration]);

  const handleValueChange = (newValue: boolean) => {
    if (animated && shouldAnimate() && useHaptics) {
      haptic('light');
    }
    onCheckedChange?.(newValue);
  };

  // Animated style for custom switch track on web
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      trackColor.value,
      [0, 1],
      [colors.trackOff, colors.trackOn]
    ),
  }));

  // Animated style for custom switch thumb on web
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(thumbPosition.value, [0, 1], [2, 22]) },
    ],
  }));

  // Animated style for glow effect
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Animated container style
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Tailwind classes
  const switchClasses = cn(
    disabled && 'opacity-50',
    className
  );

  // For native platforms, use native Switch
  if (Platform.OS !== 'web') {
    return (
      <View 
        style={[
          sizeConfig[size],
          disabled && { opacity: 0.5 },
          style,
        ]}
      >
        <RNSwitch
          ref={ref}
          value={checked}
          onValueChange={handleValueChange}
          disabled={disabled}
          trackColor={{
            false: colors.trackOff,
            true: colors.trackOn,
          }}
          thumbColor={colors.thumb}
          ios_backgroundColor={colors.trackOff}
          {...props}
        />
      </View>
    );
  }

  // Custom switch for web with full animation support
  return (
    <AnimatedPressable
      onPress={() => !disabled && handleValueChange(!checked)}
      disabled={disabled}
      className={switchClasses}
      style={[
        {
          width: 51,
          height: 31,
          borderRadius: 16,
          padding: 2,
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
        },
        sizeConfig[size],
        shadowStyle,
        animated && shouldAnimate() ? containerStyle : {},
        style,
      ]}
    >
      {/* Track */}
      <AnimatedView
        className={cn(
          'absolute inset-0 rounded-full',
          checked ? 'bg-primary' : 'bg-input'
        )}
        style={animated && shouldAnimate() ? trackStyle : {
          backgroundColor: checked ? colors.trackOn : colors.trackOff,
        }}
      />
      
      {/* Glow effect */}
      {animationType === 'glow' && (
        <AnimatedView
          className="absolute inset-0 rounded-full bg-primary"
          style={[
            {
              filter: 'blur(8px)',
              transform: [{ scale: 1.2 }],
            },
            glowStyle,
          ]}
        />
      )}
      
      {/* Thumb */}
      <AnimatedView
        className="bg-background rounded-full shadow-sm"
        style={[
          {
            width: 27,
            height: 27,
            backgroundColor: colors.thumb,
          },
          animated && shouldAnimate() ? thumbStyle : {
            transform: [{ translateX: checked ? 22 : 2 }],
          },
        ]}
      />
    </AnimatedPressable>
  );
});

Switch.displayName = 'Switch';