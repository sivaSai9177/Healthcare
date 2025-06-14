import React from 'react';
import { View, ViewProps, ViewStyle, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, FadeIn, FadeOut } from 'react-native-reanimated';
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';

export interface ThemedViewProps extends ViewProps {
  // Modern props
  className?: string;
  animated?: boolean;
  animateOnMount?: boolean;
  shadow?: 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | 'inner' | 'none';
  variant?: 'default' | 'card' | 'surface' | 'subtle';
  
  // Legacy props - will be deprecated
  lightColor?: string;
  darkColor?: string;
}

// Variant to Tailwind classes mapping
const variantClasses = {
  default: 'bg-background',
  card: 'bg-card',
  surface: 'bg-muted/40',
  subtle: 'bg-muted/10',
};

// Variant to native styles
const variantStyles: Record<string, ViewStyle> = {
  default: {},
  card: {
    borderRadius: 12,
  },
  surface: {
    borderRadius: 8,
  },
  subtle: {
    borderRadius: 6,
  },
};

export function ThemedView({ 
  style, 
  className,
  animated = false,
  animateOnMount = false,
  shadow,
  variant = 'default',
  lightColor, // Ignored - for backward compatibility
  darkColor,  // Ignored - for backward compatibility
  ...otherProps 
}: ThemedViewProps) {
  const shadowStyle = useShadow(shadow || 'none');
  
  const animatedStyle = useAnimatedStyle(() => {
    if (!animated) return {};
    return {
      transform: [{ scale: withSpring(1) }],
    };
  });
  
  // Combine styles
  const combinedStyle = [
    variantStyles[variant],
    shadowStyle,
    style,
  ];
  
  if (animated || animateOnMount) {
    return (
      <Animated.View
        className={cn(variantClasses[variant], className)}
        style={[combinedStyle, animated ? animatedStyle : undefined]}
        entering={animateOnMount ? FadeIn.duration(300) : undefined}
        exiting={animateOnMount ? FadeOut.duration(200) : undefined}
        {...otherProps}
      />
    );
  }
  
  return (
    <View 
      className={cn(variantClasses[variant], className)}
      style={combinedStyle}
      {...otherProps} 
    />
  );
}