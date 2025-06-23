import React, { useCallback, useMemo } from 'react';
import { 
  Pressable, 
  PressableProps, 
  ActivityIndicator, 
  View, 
  Platform,
  ViewStyle 
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { cn } from '@/lib/core/utils';
import { Text } from '@/components/universal/typography/Text';
import { haptic } from '@/lib/ui/haptics';
import { useAnimation } from '@/lib/ui/animations/hooks';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useResponsive } from '@/hooks/responsive/index';
import { useShadow } from '@/hooks/useShadow';
import { useTheme } from '@/lib/theme/provider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  // Variants match shadcn/ui patterns
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'glass' | 'glass-primary' | 'glass-destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  
  // State props
  isLoading?: boolean;
  isDisabled?: boolean;
  
  // Content props
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  
  // Style props
  className?: string;
  textClassName?: string;
  fullWidth?: boolean;
  
  // Platform-specific props
  style?: ViewStyle;
  
  // Animation & interaction props
  animated?: boolean;
  useHaptics?: boolean;
  rippleEffect?: boolean; // Android-style ripple
  pressDepth?: number; // iOS-style press depth
  
  // Shadow props
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

// Button variant styles using Tailwind classes
const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
  glass: 'glass glass-hover glass-press text-foreground',
  'glass-primary': 'glass-info glass-hover glass-press text-primary-foreground',
  'glass-destructive': 'glass-urgent glass-hover glass-press text-destructive-foreground',
};

// Disabled variants for better visual feedback
const disabledVariants = {
  default: 'bg-primary/50 text-primary-foreground/70',
  destructive: 'bg-destructive/50 text-destructive-foreground/70',
  outline: 'border-input/50 bg-background/50 text-foreground/50',
  secondary: 'bg-secondary/50 text-secondary-foreground/70',
  ghost: 'text-foreground/50',
  link: 'text-primary/50',
  glass: 'opacity-50 backdrop-blur-sm',
  'glass-primary': 'opacity-50 backdrop-blur-sm',
  'glass-destructive': 'opacity-50 backdrop-blur-sm',
};

const buttonSizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

// Note: Density-aware button sizes can be implemented in the future
// Currently using standard button sizes from buttonStyles

// Platform-specific press feedback configurations
const pressFeedback = {
  ios: {
    scale: 0.96,
    opacity: 0.9 as any,
    duration: 100,
  },
  android: {
    scale: 0.98,
    opacity: 0.8 as any,
    duration: 150,
  },
  web: {
    scale: 0.98,
    opacity: 1 as any,
    duration: 100,
  },
};

export const Button = React.forwardRef<View, ButtonProps>(({
  variant = 'default',
  size = 'default',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  children,
  className,
  textClassName,
  fullWidth = false,
  style,
  animated = true,
  useHaptics = true,
  rippleEffect = Platform.OS === 'android',
  pressDepth = Platform.OS === 'ios' ? 2 : 0,
  onPress,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  shadow = variant === 'ghost' || variant === 'link' ? 'none' : 'sm',
  ...props
}, ref) => {
  const theme = useTheme();
  const { shouldAnimate, getAnimationDuration } = useAnimationStore();
  
  // Resolve responsive size
  const responsiveSize = size;
  
  // Get shadow styles
  const shadowStyle = useShadow({ size: shadow });
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const isPressed = useSharedValue(0);
  const isHovered = useSharedValue(0);
  const glassShimmer = useSharedValue(0);
  
  // Ripple effect for Android
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  
  // Glass variant detection
  const isGlassVariant = variant.includes('glass');
  
  // Get platform-specific feedback config
  const feedback = useMemo(() => {
    return pressFeedback[Platform.OS as keyof typeof pressFeedback] || pressFeedback.web;
  }, []);
  
  // Use entrance animation hook
  const { animatedStyle: entranceStyle } = useAnimation('scaleIn', {
    duration: 'fast',
  });

  // Handle press in
  const handlePressIn = useCallback((event: any) => {
    if (animated && shouldAnimate()) {
      const duration = getAnimationDuration(feedback.duration);
      
      // Basic press animation
      scale.value = withSpring(feedback.scale, {
        damping: 15,
        stiffness: 400,
      });
      opacity.value = withTiming(feedback.opacity, { duration });
      isPressed.value = withTiming(1, { duration });
      
      // iOS press depth effect
      if (Platform.OS === 'ios' && pressDepth > 0) {
        translateY.value = withSpring(pressDepth, {
          damping: 15,
          stiffness: 400,
        });
      }
      
      // Glass shimmer effect
      if (isGlassVariant) {
        glassShimmer.value = withSequence(
          withTiming(0.3, { duration: 200 }),
          withTiming(0, { duration: 400 })
        );
      }
      
      // Android ripple effect
      if (rippleEffect && Platform.OS === 'android') {
        rippleScale.value = 0;
        rippleOpacity.value = 0.3;
        rippleScale.value = withTiming(2, { duration: 400 });
        rippleOpacity.value = withTiming(0, { duration: 400 });
      }
    }
    
    onPressIn?.(event);
  }, [animated, shouldAnimate, getAnimationDuration, feedback, scale, opacity, isPressed, translateY, pressDepth, rippleEffect, rippleScale, rippleOpacity, onPressIn]);

  // Handle press out
  const handlePressOut = useCallback((event: any) => {
    if (animated && shouldAnimate()) {
      const duration = getAnimationDuration(feedback.duration);
      
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 400,
      });
      opacity.value = withTiming(1, { duration });
      isPressed.value = withTiming(0, { duration });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 400,
      });
    }
    
    onPressOut?.(event);
  }, [animated, shouldAnimate, getAnimationDuration, feedback, scale, opacity, isPressed, translateY, onPressOut]);

  // Handle hover (web)
  const handleHoverIn = useCallback((event: any) => {
    if (Platform.OS === 'web' && !isDisabled && !isLoading) {
      if (animated && shouldAnimate()) {
        isHovered.value = withTiming(1, { duration: 200 });
      }
      onHoverIn?.(event);
    }
  }, [animated, shouldAnimate, isHovered, isDisabled, isLoading, onHoverIn]);

  const handleHoverOut = useCallback((event: any) => {
    if (Platform.OS === 'web' && !isDisabled && !isLoading) {
      if (animated && shouldAnimate()) {
        isHovered.value = withTiming(0, { duration: 200 });
      }
      onHoverOut?.(event);
    }
  }, [animated, shouldAnimate, isHovered, isDisabled, isLoading, onHoverOut]);

  // Handle press with haptics
  const handlePress = useCallback((event: any) => {
    if (isLoading || isDisabled) return;
    
    // Platform-specific haptic feedback
    if (useHaptics && !isLoading && !isDisabled) {
      if (variant === 'destructive') {
        haptic('medium');
      } else if (variant === 'ghost' || variant === 'link') {
        haptic('selection');
      } else {
        haptic('light');
      }
    }
    
    onPress?.(event);
  }, [isLoading, isDisabled, useHaptics, variant, onPress]);

  // Animated button style
  const animatedButtonStyle = useAnimatedStyle(() => {
    // Remove scale on hover for cleaner effect
    return {
      transform: [
        { scale: scale.value } as any,
        { translateY: translateY.value } as any,
      ],
      opacity: opacity.value,
    };
  });

  // Ripple style for Android
  const rippleStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    borderRadius: 50 as any,
    backgroundColor: variant === 'default' || variant === 'destructive' 
      ? 'rgba(255, 255, 255, 0.3)' 
      : 'rgba(0, 0, 0, 0.1)',
    opacity: rippleOpacity.value,
    transform: [
      { translateX: -50 } as any,
      { translateY: -50 } as any,
      { scale: rippleScale.value } as any,
    ],
  }));

  // Loading indicator color based on variant
  const loadingColor = variant === 'default' || variant === 'destructive' || variant === 'glass-primary' || variant === 'glass-destructive' 
    ? '#ffffff' : '#0a0a0a';

  // Text size classes based on responsive button size
  const textSizeClass = useMemo(() => {
    switch (responsiveSize) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      default: return 'text-base';
    }
  }, [responsiveSize]);

  // Combine all animated styles
  const combinedStyle = useMemo(() => {
    if (!animated) return [shadowStyle, style].filter(Boolean);
    return [shadowStyle, entranceStyle, animatedButtonStyle, style].filter(Boolean);
  }, [animated, shadowStyle, entranceStyle, animatedButtonStyle, style]);

  const isIconOnly = responsiveSize === 'icon' && !children;

  // Create button classes
  const buttonClasses = cn(
    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    (isDisabled || isLoading) ? disabledVariants[variant] : buttonVariants[variant],
    buttonSizes[responsiveSize],
    fullWidth && 'w-full',
    (isDisabled || isLoading) && 'pointer-events-none',
    // Glass-specific classes
    isGlassVariant && [
      'shadow-lg',
      variant === 'glass-primary' && 'glass-glow-info',
      variant === 'glass-destructive' && 'glass-glow-urgent',
    ],
    // Web-specific cursor styles
    Platform.OS === 'web' && [
      (isDisabled || isLoading) ? 'cursor-not-allowed' : 'cursor-pointer',
      'transition-all duration-200 ease-in-out',
      isGlassVariant && 'glass-shimmer'
    ],
    className
  );

  return (
    <AnimatedPressable
      ref={ref as any}
      className={buttonClasses}
      style={[shadowStyle, combinedStyle] as any}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      disabled={isDisabled || isLoading}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled || isLoading,
        busy: isLoading,
      }}
      {...props}
    >
      {/* Android ripple effect */}
      {rippleEffect && Platform.OS === 'android' && animated && (
        <Animated.View style={[rippleStyle, { pointerEvents: 'none' }] as any} />
      )}
      
      {/* Button content */}
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={loadingColor}
          accessibilityLabel="Loading"
        />
      ) : (
        <>
          {leftIcon && (
            <View style={[{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: children ? 8 : 0
            }]}>
              {leftIcon}
            </View>
          )}
          
          {!isIconOnly && children && (
            <Text 
              className={cn(
                'text-center font-medium',
                textSizeClass,
                variant === 'link' && 'underline',
                textClassName
              )}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ 
                color: variant === 'default' || variant === 'destructive' 
                  ? theme.primaryForeground || '#ffffff'
                  : variant === 'outline' || variant === 'ghost' || variant === 'secondary'
                  ? theme.foreground
                  : variant === 'link'
                  ? theme.primary
                  : theme.foreground
              }}
            >
              {children}
            </Text>
          )}
          
          {rightIcon && (
            <View style={[{
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: children ? 8 : 0
            }]}>
              {rightIcon}
            </View>
          )}
        </>
      )}
    </AnimatedPressable>
  );
});

Button.displayName = 'Button';