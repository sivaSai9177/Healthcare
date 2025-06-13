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
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { cn } from '@/lib/core/utils';
import { Text } from './Text';
import { haptic } from '@/lib/ui/haptics';
import { useAnimation } from '@/lib/ui/animations/hooks';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  // Variants match shadcn/ui patterns
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
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
}

// Tailwind-based variants
const buttonVariants = {
  default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/80',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/80',
  outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:bg-secondary/70',
  ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
  link: 'text-primary underline-offset-4 hover:underline active:opacity-80',
};

// Density-aware button sizes
const densityButtonSizes = {
  compact: {
    default: 'h-9 px-3 py-2 min-w-[44px]',
    sm: 'h-8 px-2.5 py-1.5 text-sm min-w-[44px]',
    lg: 'h-10 px-6 py-2.5 text-base min-w-[44px]',
    icon: 'h-9 w-9 p-0',
  },
  medium: {
    default: 'h-10 px-4 py-2 min-w-[44px]',
    sm: 'h-9 px-3 py-1.5 text-sm min-w-[44px]',
    lg: 'h-11 px-8 py-3 text-lg min-w-[44px]',
    icon: 'h-10 w-10 p-0',
  },
  large: {
    default: 'h-11 px-6 py-2.5 min-w-[44px]',
    sm: 'h-10 px-4 py-2 text-base min-w-[44px]',
    lg: 'h-13 px-10 py-3.5 text-xl min-w-[44px]',
    icon: 'h-11 w-11 p-0',
  },
};

// Platform-specific press feedback configurations
const pressFeedback = {
  ios: {
    scale: 0.96,
    opacity: 0.9,
    duration: 100,
  },
  android: {
    scale: 0.98,
    opacity: 0.8,
    duration: 150,
  },
  web: {
    scale: 0.98,
    opacity: 1,
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
  ...props
}, ref) => {
  const theme = useTheme();
  const { density } = useSpacing();
  const { shouldAnimate, getAnimationDuration } = useAnimationStore();
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const isPressed = useSharedValue(0);
  const isHovered = useSharedValue(0);
  
  // Ripple effect for Android
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  
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
    if (Platform.OS === 'web' && animated && shouldAnimate()) {
      isHovered.value = withTiming(1, { duration: 200 });
    }
    onHoverIn?.(event);
  }, [animated, shouldAnimate, isHovered, onHoverIn]);

  const handleHoverOut = useCallback((event: any) => {
    if (Platform.OS === 'web' && animated && shouldAnimate()) {
      isHovered.value = withTiming(0, { duration: 200 });
    }
    onHoverOut?.(event);
  }, [animated, shouldAnimate, isHovered, onHoverOut]);

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
    const hoverScale = interpolate(
      isHovered.value,
      [0, 1],
      [1, 1.02],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [
        { scale: scale.value * hoverScale } as any,
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
    borderRadius: 50,
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
  const loadingColor = useMemo(() => {
    if (variant === 'default' || variant === 'destructive') return '#FFFFFF';
    if (variant === 'outline' || variant === 'secondary') return theme.foreground;
    return theme.primary;
  }, [variant, theme]);

  // Text size classes based on button size
  const textSizeClass = useMemo(() => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      default: return 'text-base';
    }
  }, [size]);

  // Combine all animated styles
  const combinedStyle = useMemo(() => {
    if (!animated) return style;
    return [entranceStyle, animatedButtonStyle, style].filter(Boolean);
  }, [animated, entranceStyle, animatedButtonStyle, style]);

  const isIconOnly = size === 'icon' && !children;

  return (
    <AnimatedPressable
      ref={ref as any}
      style={combinedStyle}
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
      className={cn(
        // Base styles
        'flex-row items-center justify-center rounded-md font-medium transition-colors overflow-hidden',
        // Platform-specific styles
        'web:transition-all web:duration-200',
        'ios:active:scale-95',
        'android:active:opacity-80',
        // Variant styles
        buttonVariants[variant],
        // Density-aware size styles
        densityButtonSizes[density][size],
        // State styles
        (isDisabled || isLoading) && 'opacity-50 cursor-not-allowed',
        // Full width
        fullWidth && 'w-full',
        // Focus styles for accessibility
        'web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
        // Custom className
        className
      )}
      {...props}
    >
      {/* Android ripple effect */}
      {rippleEffect && Platform.OS === 'android' && animated && (
        <Animated.View style={rippleStyle as any} pointerEvents="none" />
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
            <View className={cn(
              'flex-row items-center',
              children && 'mr-2'
            )}>
              {leftIcon}
            </View>
          )}
          
          {!isIconOnly && children && (
            <Text 
              className={cn(
                'text-center font-medium',
                textSizeClass,
                // Inherit text color from button variant
                variant === 'link' && 'underline-offset-4',
                textClassName
              )}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {children}
            </Text>
          )}
          
          {rightIcon && (
            <View className={cn(
              'flex-row items-center',
              children && 'ml-2'
            )}>
              {rightIcon}
            </View>
          )}
        </>
      )}
    </AnimatedPressable>
  );
});

Button.displayName = 'Button';