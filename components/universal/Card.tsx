import React, { useCallback, useMemo } from 'react';
import { View, ViewProps, Pressable, Platform } from 'react-native';
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
import { useSpacing } from '@/lib/stores/spacing-store';
import { getPaddingClass } from '@/lib/core/utils/density-classes';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface CardProps extends ViewProps {
  // Interaction props
  pressable?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  
  // Style props
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  
  // Animation props
  animated?: boolean;
  animationType?: 'lift' | 'scale' | 'tilt' | 'glow' | 'none';
  useHaptics?: boolean;
  
  // Content props
  children: React.ReactNode;
}

// Card variants using Tailwind
const cardVariants = {
  default: 'bg-card text-card-foreground shadow-sm',
  outline: 'border border-border bg-transparent',
  ghost: 'bg-transparent',
};

// Platform-specific shadow styles
const shadowStyles = {
  ios: 'ios:shadow-sm',
  android: 'android:elevation-1',
  web: 'web:shadow-sm web:hover:shadow-md web:transition-shadow',
};

export const Card = React.forwardRef<View, CardProps>(({
  pressable = false,
  onPress,
  onLongPress,
  className,
  variant = 'default',
  animated = true,
  animationType = 'lift',
  useHaptics = true,
  children,
  style,
  ...props
}, ref) => {
  const { shouldAnimate, getAnimationDuration } = useAnimationStore();
  const { density } = useSpacing();
  
  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.1);
  const glowOpacity = useSharedValue(0);
  const isPressed = useSharedValue(0);
  const isHovered = useSharedValue(0);
  
  // Use entrance animation
  const { animatedStyle: entranceStyle } = useAnimation('fadeIn', {
    duration: 'normal',
  });

  // Handle hover (web)
  const handleHoverIn = useCallback(() => {
    if (!animated || !shouldAnimate() || Platform.OS !== 'web') return;
    
    isHovered.value = withTiming(1, { duration: 200 });
    
    switch (animationType) {
      case 'lift':
        translateY.value = withSpring(-4, { damping: 15, stiffness: 300 });
        shadowOpacity.value = withSpring(0.2, { damping: 15, stiffness: 300 });
        break;
      case 'scale':
        scale.value = withSpring(1.02, { damping: 15, stiffness: 300 });
        break;
      case 'tilt':
        rotateX.value = withSpring(-5, { damping: 15, stiffness: 300 });
        break;
      case 'glow':
        glowOpacity.value = withSpring(0.3, { damping: 15, stiffness: 300 });
        break;
    }
  }, [animated, shouldAnimate, animationType, isHovered, translateY, shadowOpacity, scale, rotateX, glowOpacity]);

  const handleHoverOut = useCallback(() => {
    if (!animated || !shouldAnimate() || Platform.OS !== 'web') return;
    
    isHovered.value = withTiming(0, { duration: 200 });
    
    // Reset all animations
    translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
    shadowOpacity.value = withSpring(0.1, { damping: 15, stiffness: 300 });
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    rotateX.value = withSpring(0, { damping: 15, stiffness: 300 });
    glowOpacity.value = withSpring(0, { damping: 15, stiffness: 300 });
  }, [animated, shouldAnimate, isHovered, translateY, shadowOpacity, scale, rotateX, glowOpacity]);

  // Handle press
  const handlePressIn = useCallback(() => {
    if (!animated || !shouldAnimate()) return;
    
    isPressed.value = withTiming(1, { duration: 100 });
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    
    if (useHaptics && pressable) {
      haptic('light');
    }
  }, [animated, shouldAnimate, isPressed, scale, useHaptics, pressable]);

  const handlePressOut = useCallback(() => {
    if (!animated || !shouldAnimate()) return;
    
    isPressed.value = withTiming(0, { duration: 100 });
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [animated, shouldAnimate, isPressed, scale]);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    }
  }, [onPress]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      if (useHaptics) {
        haptic('medium');
      }
      onLongPress();
    }
  }, [onLongPress, useHaptics]);

  // Animated card style
  const animatedCardStyle = useAnimatedStyle(() => {
    const perspective = Platform.OS === 'web' ? 1000 : undefined;
    
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        { perspective },
        { rotateX: `${rotateX.value}deg` },
      ],
      // Dynamic shadow for iOS
      ...(Platform.OS === 'ios' && {
        shadowOpacity: interpolate(
          shadowOpacity.value,
          [0, 1],
          [0, 0.3],
          Extrapolation.CLAMP
        ),
        shadowRadius: interpolate(
          shadowOpacity.value,
          [0.1, 0.3],
          [3, 8],
          Extrapolation.CLAMP
        ),
        shadowOffset: {
          width: 0,
          height: interpolate(
            translateY.value,
            [-4, 0],
            [4, 2],
            Extrapolation.CLAMP
          ),
        },
      }),
      // Dynamic elevation for Android
      ...(Platform.OS === 'android' && {
        elevation: interpolate(
          isPressed.value,
          [0, 1],
          [2, 1],
          Extrapolation.CLAMP
        ),
      }),
    };
  });

  // Glow overlay style
  const glowStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: glowOpacity.value,
    pointerEvents: 'none' as const,
  }));

  // Combine all animated styles
  const combinedStyle = useMemo(() => {
    if (!animated) return style;
    return [entranceStyle, animatedCardStyle, style].filter(Boolean);
  }, [animated, entranceStyle, animatedCardStyle, style]);

  // Base card classes
  const cardClasses = cn(
    // Base styles
    'rounded-lg relative overflow-hidden',
    // Density-aware padding
    getPaddingClass(16, density), // 16px base = p-4 in medium density
    // Variant styles
    cardVariants[variant],
    // Platform shadows
    variant === 'default' && shadowStyles[Platform.OS as keyof typeof shadowStyles],
    // Interactive states
    pressable && 'active:scale-[0.98] cursor-pointer',
    // Focus styles for accessibility
    pressable && 'web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
    // Custom className
    className
  );

  // Render pressable or regular card
  if (pressable) {
    return (
      <AnimatedPressable
        ref={ref as any}
        style={combinedStyle}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        accessibilityRole="button"
        className={cardClasses}
        {...props}
      >
        {children}
        {animated && animationType === 'glow' && (
          <Animated.View style={glowStyle} />
        )}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedView
      ref={ref as any}
      style={combinedStyle}
      onPointerEnter={handleHoverIn}
      onPointerLeave={handleHoverOut}
      className={cardClasses}
      {...props}
    >
      {children}
      {animated && animationType === 'glow' && (
        <Animated.View style={glowStyle} />
      )}
    </AnimatedView>
  );
});

Card.displayName = 'Card';

// Card sub-components for composition
export const CardHeader = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<View, { children: React.ReactNode; className?: string }>(
  ({ className, children, ...props }, ref) => (
    <Text
      ref={ref as any}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </Text>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<View, { children: React.ReactNode; className?: string }>(
  ({ className, children, ...props }, ref) => (
    <Text
      ref={ref as any}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </Text>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('flex-row items-center pt-4', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';