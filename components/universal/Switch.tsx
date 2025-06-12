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
import { useTheme } from '@/lib/theme/provider';
import { 
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export type SwitchAnimationType = 'toggle' | 'slide' | 'glow' | 'none';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);

interface SwitchProps extends Omit<RNSwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'primary' | 'accent' | 'secondary';
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: SwitchAnimationType;
  animationDuration?: number;
  glowIntensity?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const Switch = React.forwardRef<RNSwitch, SwitchProps>(({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = 'md',
  colorScheme = 'primary',
  style,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'slide',
  animationDuration,
  glowIntensity = 0.5,
  useHaptics = true,
  animationConfig,
  ...props
}, ref) => {
  const theme = useTheme();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.fast;
  
  // Animation values
  const thumbPosition = useSharedValue(checked ? 1 : 0);
  const trackColor = useSharedValue(checked ? 1 : 0);
  const glowOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // Size configurations - simplified since all platforms use same scale
  const sizeConfig = {
    sm: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
    md: {},
    lg: { transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] },
  };
  
  // Platform-specific constants
  const IOS_SYSTEM_BLUE = 'theme.primary';
  const IOS_SYSTEM_GRAY = '#E5E5EA';
  
  // Update animation values when checked changes
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      thumbPosition.value = withSpring(checked ? 1 : 0, config.spring);
      trackColor.value = withTiming(checked ? 1 : 0, { duration });
      
      if (animationType === 'glow' && checked) {
        glowOpacity.value = withTiming(glowIntensity, { duration: duration / 2 });
      } else {
        glowOpacity.value = withTiming(0, { duration: duration / 2 });
      }
      
      if (animationType === 'toggle') {
        scale.value = withSpring(0.9, { ...config.spring, damping: 10 }, () => {
          scale.value = withSpring(1, config.spring);
        });
      }
    } else {
      thumbPosition.value = checked ? 1 : 0;
      trackColor.value = checked ? 1 : 0;
    }
  }, [checked, animated, isAnimated, shouldAnimate, animationType, duration, glowIntensity, config.spring, glowOpacity, scale, thumbPosition, trackColor]);
  
  // Handle press with haptics
  const handlePress = () => {
    if (!disabled && onCheckedChange) {
      if (animated && isAnimated && shouldAnimate() && useHaptics) {
        haptic('light');
      }
      onCheckedChange(!checked);
    }
  };
  
  // Get track color based on platform and color scheme
  const activeTrackColor = Platform.OS === 'ios' 
    ? IOS_SYSTEM_BLUE 
    : theme[colorScheme === 'accent' ? 'primary' : colorScheme];
  
  const inactiveTrackColor = Platform.OS === 'ios' 
    ? IOS_SYSTEM_GRAY 
    : theme.muted;

  // Web configuration
  const webSizeConfig = {
    sm: { width: 36, height: 20, thumbSize: 16 },
    md: { width: 44, height: 24, thumbSize: 20 },
    lg: { width: 52, height: 28, thumbSize: 24 },
  };
  
  const webConfig = webSizeConfig[size];
  
  // Animated styles - always create them, even if not on web
  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      trackColor.value,
      [0, 1],
      [inactiveTrackColor, activeTrackColor]
    ),
    transform: [{ scale: scale.value }],
  }));
  
  const thumbStyle = useAnimatedStyle(() => ({
    left: interpolate(
      thumbPosition.value,
      [0, 1],
      [2, webConfig.width - webConfig.thumbSize - 2]
    ),
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Web implementation - custom switch similar to shadcn
  if (Platform.OS === 'web') {
    
    const PressableComponent = animated && isAnimated && shouldAnimate() ? AnimatedPressable : Pressable;
    
    return (
      <PressableComponent
        ref={ref as any}
        onPress={handlePress}
        disabled={disabled}
        style={[
          {
            width: webConfig.width,
            height: webConfig.height,
            borderRadius: webConfig.height / 2,
            position: 'relative',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: animated && isAnimated && shouldAnimate() ? undefined : 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          } as any,
          animated && isAnimated && shouldAnimate() ? containerStyle : {
            backgroundColor: checked ? activeTrackColor : inactiveTrackColor,
          },
          style,
        ]}
        {...props}
      >
        {animated && isAnimated && shouldAnimate() && animationType === 'glow' && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: webConfig.width,
                height: webConfig.height,
                borderRadius: webConfig.height / 2,
                backgroundColor: activeTrackColor,
                filter: `blur(${webConfig.height / 2}px)`,
              } as any,
              glowStyle,
            ]}
            pointerEvents="none"
          />
        )}
        <AnimatedView
          style={[
            {
              width: webConfig.thumbSize,
              height: webConfig.thumbSize,
              borderRadius: webConfig.thumbSize / 2,
              backgroundColor: theme.card,
              position: 'absolute',
              top: '50%',
              transform: [{ translateY: -webConfig.thumbSize / 2 }],
              transition: animated && isAnimated && shouldAnimate() ? undefined : 'all 0.2s ease',
              boxShadow: `0 2px 4px ${theme.foreground}26`, // 15% opacity
            } as any,
            animated && isAnimated && shouldAnimate() ? thumbStyle : {
              left: checked ? webConfig.width - webConfig.thumbSize - 2 : 2,
            },
          ]}
        />
      </PressableComponent>
    );
  }

  // Native implementation
  return (
    <RNSwitch
      ref={ref}
      value={checked}
      onValueChange={onCheckedChange}
      disabled={disabled}
      trackColor={{
        false: inactiveTrackColor,
        true: activeTrackColor,
      }}
      thumbColor={Platform.OS === 'ios' 
        ? 'theme.background' 
        : checked ? theme.background : '#FAFAFA'
      }
      ios_backgroundColor={IOS_SYSTEM_GRAY}
      style={[sizeConfig[size], style]}
      {...props}
    />
  );
});

Switch.displayName = 'Switch';