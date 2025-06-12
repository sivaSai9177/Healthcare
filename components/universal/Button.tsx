import React, { useEffect } from 'react';
import { Pressable, PressableProps, ActivityIndicator, ViewStyle, TextStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  FadeIn,
  ZoomIn,
  SlideInDown,
  SlideInUp,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { Text } from './Text';
import { Box } from './Box';
import { 
  SpacingScale, 
  AnimationVariant,
  ButtonAnimationType
} from '@/lib/design';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import { ResponsiveValue } from '@/lib/design/responsive';
import { useResponsiveValue } from '@/hooks/responsive';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { log } from '@/lib/core/debug/logger';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon';
type ButtonColorScheme = 'primary' | 'secondary' | 'destructive' | 'accent' | 'muted';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ResponsiveValue<ButtonSize>;
  colorScheme?: ButtonColorScheme;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  rounded?: 'sm' | 'md' | 'lg' | 'full' | number;
  fullWidth?: ResponsiveValue<boolean>;
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void; // For web compatibility
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: ButtonAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  useHaptics?: boolean;
  loadingAnimation?: 'rotate' | 'pulse' | 'bounce';
  successAnimation?: boolean;
  successDuration?: number;
  entranceAnimation?: 'fade' | 'zoom' | 'slideUp' | 'slideDown' | 'none';
  
  // Animation overrides
  animationConfig?: {
    hoverScale?: number;
    pressScale?: number;
    duration?: number;
    spring?: {
      damping?: number;
      stiffness?: number;
    };
  };
  
  // Advanced animations
  rippleColor?: string;
  glowIntensity?: number;
  shakeMagnitude?: number;
}

// Button sizes will be defined dynamically based on spacing density

export const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(({
  variant = 'solid',
  size: sizeProp = 'md',
  colorScheme = 'primary',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  children,
  rounded = 'md',
  fullWidth: fullWidthProp = false,
  style,
  textStyle,
  className,
  type,
  onClick,
  onPress,
  disabled,
  // Animation props
  animated = false,
  animationVariant = 'moderate',
  animationType = 'scale',
  animationDuration,
  animationDelay = 0,
  useHaptics = true,
  loadingAnimation = 'rotate',
  successAnimation = false,
  successDuration = 1000,
  entranceAnimation = 'fade',
  animationConfig,
  rippleColor,
  glowIntensity = 0.5,
  shakeMagnitude = 10,
  ...props
}, ref) => {
  const theme = useTheme();
  const { spacing, componentSpacing, componentSizes } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const isDisabledState = disabled || isDisabled || isLoading;
  
  // Get responsive values
  const size = useResponsiveValue(sizeProp);
  const fullWidth = useResponsiveValue(fullWidthProp);
  
  // Get animation config from variant
  const baseConfig = getAnimationConfig(animationVariant);
  const config = animationConfig ? mergeAnimationConfig(animationVariant, {
    scale: {
      hover: animationConfig.hoverScale ?? baseConfig.scale.hover,
      press: animationConfig.pressScale ?? baseConfig.scale.press,
    },
    duration: animationConfig.duration ? {
      ...baseConfig.duration,
      normal: animationConfig.duration,
    } : baseConfig.duration,
    spring: animationConfig.spring ? {
      ...baseConfig.spring,
      ...animationConfig.spring,
    } : baseConfig.spring,
  }) : baseConfig;
  
  // Use config values
  const duration = animationDuration ?? config.duration.normal;
  const hoverScale = config.scale.hover;
  const pressScale = config.scale.press;
  const springConfig = config.spring;
  
  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const successScale = useSharedValue(1);
  const loadingRotation = useSharedValue(0);
  
  // Loading animation
  useEffect(() => {
    if (isLoading && animated && shouldAnimate()) {
      if (loadingAnimation === 'rotate') {
        loadingRotation.value = withTiming(360, {
          duration: 1000,
          easing: (t) => t,
        }, () => {
          loadingRotation.value = 0;
          if (isLoading) {
            loadingRotation.value = withTiming(360, {
              duration: 1000,
              easing: (t) => t,
            });
          }
        });
      } else if (loadingAnimation === 'pulse') {
        pulseScale.value = withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        );
      } else if (loadingAnimation === 'bounce') {
        scale.value = withSequence(
          withSpring(1.1, { damping: 5, stiffness: 200 }),
          withSpring(1, { damping: 5, stiffness: 200 })
        );
      }
    }
  }, [isLoading, animated, shouldAnimate, loadingAnimation, loadingRotation, pulseScale, scale]);
  
  // Handle form submission for web
  const handlePress = React.useCallback(() => {
    if (isLoading || isDisabledState) return;
    
    // Trigger animations
    if (animated && shouldAnimate()) {
      switch (animationType) {
        case 'scale':
          scale.value = withSequence(
            withSpring(pressScale * 0.95, springConfig),
            withSpring(1, springConfig)
          );
          break;
        case 'ripple':
          rippleScale.value = 0;
          rippleOpacity.value = 0.3;
          rippleScale.value = withTiming(2, { duration: duration * 2 });
          rippleOpacity.value = withTiming(0, { duration: duration * 2 });
          break;
        case 'shake':
          shakeX.value = withSequence(
            withTiming(-shakeMagnitude, { duration: config.duration.fast / 3 }),
            withTiming(shakeMagnitude, { duration: config.duration.fast / 1.5 }),
            withTiming(-shakeMagnitude, { duration: config.duration.fast / 1.5 }),
            withTiming(0, { duration: config.duration.fast / 3 })
          );
          break;
        case 'glow':
          glowOpacity.value = withSequence(
            withTiming(glowIntensity, { duration: config.duration.fast }),
            withTiming(0, { duration: config.duration.normal })
          );
          break;
      }
    }
    
    if (useHaptics) {
      haptic('medium');
    }
    
    if (Platform.OS === "web" && type === "submit") {
      const form = (ref as any)?.current?.closest("form");
      if (form) {
        const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
        return;
      }
    }
    
    if (onClick) onClick();
    if (onPress) onPress(null as any);
    
    // Success animation
    if (successAnimation && animated && shouldAnimate()) {
      setTimeout(() => {
        setShowSuccess(true);
        successScale.value = withSequence(
          withSpring(1.2, { damping: 10, stiffness: 200 }),
          withSpring(1, { damping: 10, stiffness: 200 })
        );
        haptic('success');
        setTimeout(() => setShowSuccess(false), successDuration);
      }, 500);
    }
  }, [onClick, onPress, type, ref, isLoading, isDisabledState, animated, animationType, useHaptics, successAnimation, 
      shouldAnimate, config.duration.fast, config.duration.normal, duration, glowIntensity, glowOpacity, 
      pressScale, rippleOpacity, rippleScale, scale, shakeMagnitude, shakeX, springConfig, successDuration, successScale]);

  // Animated styles - must be called before any early returns
  const animatedStyle = useAnimatedStyle(() => {
    const baseScale = interpolate(
      scale.value,
      [0.9, 1, 1.1],
      [pressScale, 1, hoverScale]
    );
    
    return {
      transform: [
        { scale: baseScale * pulseScale.value * successScale.value } as const,
        { translateX: shakeX.value } as const,
        { rotate: `${rotation.value + loadingRotation.value}deg` } as const,
      ] as const,
    };
  });
  
  const rippleStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: rippleColor || theme.primary,
    opacity: rippleOpacity.value,
    transform: [
      { translateX: -50 } as const,
      { translateY: -50 } as const,
      { scale: rippleScale.value } as const,
    ] as const,
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: componentSpacing.borderRadius,
    backgroundColor: theme.primary,
    opacity: glowOpacity.value,
    transform: [{ scale: 1.02 }],
  }));

  // Get size configuration from spacing context
  const getButtonSize = () => {
    if (size === 'icon') {
      return { height: 40, minWidth: 40 };
    }
    const validSizes = ['sm', 'md', 'lg', 'xl'] as const;
    const sizeKey = validSizes.includes(size as any) ? size : 'md';
    return componentSizes.button[sizeKey as 'sm' | 'md' | 'lg' | 'xl'];
  };
  
  const buttonSize = getButtonSize();
  
  if (!buttonSize) {
    log.error('Button: Invalid button size configuration', 'BUTTON', { size });
    return null;
  }
  
  const buttonConfig = {
    paddingX: size === 'icon' ? 0 : componentSpacing.buttonPadding.x as SpacingScale,
    paddingY: size === 'icon' ? 0 : componentSpacing.buttonPadding.y as SpacingScale,
    fontSize: size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : 'base' as FontSize,
    iconSize: componentSpacing.iconSize,
  };
  
  // Get colors based on variant and color scheme
  const getButtonColors = () => {
    if (isDisabledState) {
      return {
        bg: theme.muted,
        text: theme.mutedForeground,
        border: theme.muted,
      };
    }

    const colors = {
      solid: {
        bg: theme[colorScheme] || theme.primary,
        text: theme[`${colorScheme}Foreground`] || (colorScheme === 'muted' ? theme.mutedForeground : theme.background),
        border: 'transparent',
        hover: {
          bg: (theme[colorScheme] || theme.primary) + 'e6', // 90% opacity
          text: theme[`${colorScheme}Foreground`] || (colorScheme === 'muted' ? theme.mutedForeground : theme.background),
        },
        active: {
          bg: (theme[colorScheme] || theme.primary) + 'cc', // 80% opacity
        },
      },
      outline: {
        bg: 'transparent',
        text: theme[colorScheme],
        border: theme[colorScheme],
        hover: {
          bg: theme[colorScheme] + '1a', // 10% opacity background
          text: theme[colorScheme],
        },
        active: {
          bg: theme[colorScheme] + '33', // 20% opacity
        },
      },
      ghost: {
        bg: 'transparent',
        text: theme[colorScheme],
        border: 'transparent',
        hover: {
          bg: theme[colorScheme] + '1a', // 10% opacity
          text: theme[colorScheme],
        },
        active: {
          bg: theme[colorScheme] + '33', // 20% opacity
        },
      },
      link: {
        bg: 'transparent',
        text: theme[colorScheme],
        border: 'transparent',
        hover: {
          bg: 'transparent',
          text: theme[colorScheme] + 'cc', // Slightly faded on hover
        },
        active: {
          bg: 'transparent',
        },
      },
      // Add 'secondary' as an alias for 'outline' with secondary color scheme
      secondary: {
        bg: 'transparent',
        text: theme.secondary || theme.foreground,
        border: theme.secondary || theme.border,
        hover: {
          bg: (theme.secondary || theme.foreground) + '1a', // 10% opacity background
          text: theme.secondary || theme.foreground,
        },
        active: {
          bg: (theme.secondary || theme.foreground) + '33', // 20% opacity
        },
      },
    };
    
    return colors[variant];
  };
  
  const colors = getButtonColors();
  if (!colors) {
    log.error('Button: Invalid variant', 'BUTTON', { variant });
    return null;
  }
  
  const currentBg = showSuccess ? theme.success : (isPressed && 'active' in colors && colors.active ? colors.active.bg : (isHovered && 'hover' in colors && colors.hover ? colors.hover.bg : colors.bg));
  const currentText = showSuccess ? (theme.successForeground || theme.background) : (isHovered && 'hover' in colors && colors.hover ? colors.hover.text : colors.text);
  
  const buttonStyle: ViewStyle = {
    paddingHorizontal: spacing[buttonConfig.paddingX],
    paddingVertical: spacing[buttonConfig.paddingY],
    borderRadius: componentSpacing.borderRadius,
    backgroundColor: currentBg,
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: showSuccess ? theme.success : colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: buttonSize.height,
    minWidth: buttonSize.minWidth,
    overflow: animated && animationType === 'ripple' ? 'hidden' : undefined,
    ...(fullWidth && { width: '100%', minWidth: undefined }),
    ...(size === 'icon' && { width: buttonSize.minWidth }),
    // Web-specific styles
    ...(Platform.OS === 'web' && {
      cursor: isDisabledState ? 'not-allowed' : 'pointer',
      transition: animated && shouldAnimate() ? 'all 0.2s ease' : 'none',
      userSelect: 'none',
    } as any),
    ...style,
  };
  
  const buttonTextStyle: TextStyle = {
    color: currentText,
    ...(variant === 'link' && {
      textDecorationLine: 'underline',
      textDecorationStyle: 'solid',
      textDecorationColor: currentText,
    }),
    ...textStyle,
  };
  
  // Press handlers
  const handlePressIn = () => {
    if (isDisabledState) return;
    setIsPressed(true);
    if (animated && shouldAnimate() && animationType === 'scale') {
      scale.value = withSpring(pressScale, springConfig);
    }
  };
  
  const handlePressOut = () => {
    setIsPressed(false);
    if (animated && shouldAnimate() && animationType === 'scale') {
      scale.value = withSpring(1, springConfig);
    }
  };
  
  const handleHoverIn = () => {
    if (isDisabledState) return;
    setIsHovered(true);
    if (animated && shouldAnimate() && !isPressed && animationType === 'scale') {
      scale.value = withSpring(hoverScale, springConfig);
    }
  };
  
  const handleHoverOut = () => {
    setIsHovered(false);
    if (animated && shouldAnimate() && !isPressed && animationType === 'scale') {
      scale.value = withSpring(1, springConfig);
    }
  };

  // Add web-specific event handlers
  const webHandlers = Platform.OS === 'web' ? {
    onHoverIn: handleHoverIn,
    onHoverOut: handleHoverOut,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
  } : {
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
  };
  
  const content = (
    <>
      {animated && animationType === 'glow' && shouldAnimate() && (
        <Animated.View style={glowStyle} pointerEvents="none" />
      )}
      {animated && animationType === 'ripple' && shouldAnimate() && (
        <Animated.View style={rippleStyle} pointerEvents="none" />
      )}
      <Box flexDirection="row" alignItems="center" gap={2 as SpacingScale}>
        {isLoading ? (
          <Animated.View
            style={{
              width: buttonConfig.iconSize,
              height: buttonConfig.iconSize,
              transform: animated && shouldAnimate() ? [{ rotate: `${loadingRotation.value}deg` }] : [],
            }}
          >
            <ActivityIndicator
              size="sm"
              color={colors.text}
              style={{ width: buttonConfig.iconSize, height: buttonConfig.iconSize }}
            />
          </Animated.View>
        ) : showSuccess ? (
          <Text size={buttonConfig.fontSize}>✓</Text>
        ) : leftIcon}
        
        {typeof children === 'string' ? (
          <Text
            size={buttonConfig.fontSize}
            weight="medium"
            style={buttonTextStyle}
          >
            {showSuccess ? 'Success!' : children}
          </Text>
        ) : (
          children
        )}
        
        {!isLoading && !showSuccess && rightIcon}
      </Box>
    </>
  );
  
  // Entrance animation
  const getEntranceAnimation = () => {
    if (!animated || !shouldAnimate() || entranceAnimation === 'none' || Platform.OS === 'web') return undefined;
    
    const delay = animationDelay;
    
    // Use variant-based entrance animation if not explicitly set
    const entrance = entranceAnimation || (config.entrance.scale ? 'zoom' : 'fade');
    
    switch (entrance) {
      case 'zoom':
        return ZoomIn.duration(duration).delay(delay).springify();
      case 'slideUp':
        return SlideInUp.duration(duration).delay(delay).springify();
      case 'slideDown':
        return SlideInDown.duration(duration).delay(delay).springify();
      case 'fade':
      default:
        return FadeIn.duration(duration).delay(delay);
    }
  };
  
  if (animated && shouldAnimate()) {
    return (
      <AnimatedPressable
        ref={ref}
        disabled={isDisabledState}
        android_ripple={
          Platform.OS === 'android' && !isDisabledState && animationType !== 'ripple'
            ? {
                color: 'active' in colors && colors.active ? colors.active.bg : colors.bg + '40',
                borderless: false,
              }
            : undefined
        }
        onPress={handlePress}
        style={[buttonStyle, animatedStyle as any]}
        entering={getEntranceAnimation()}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabledState }}
        {...webHandlers}
        {...props}
      >
        {content}
      </AnimatedPressable>
    );
  }
  
  return (
    <Pressable
      ref={ref}
      disabled={isDisabledState}
      android_ripple={
        Platform.OS === 'android' && !isDisabledState
          ? {
              color: 'active' in colors && colors.active ? colors.active.bg : colors.bg + '40',
              borderless: false,
            }
          : undefined
      }
      onPress={handlePress}
      style={buttonStyle}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabledState }}
      {...webHandlers}
      {...props}
    >
      {content}
    </Pressable>
  );
});

Button.displayName = 'Button';