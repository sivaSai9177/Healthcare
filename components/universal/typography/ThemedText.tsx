import React from 'react';
import { Text, TextProps, TextStyle, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { cn } from '@/lib/core/utils';

const AnimatedText = Animated.createAnimatedComponent(Text);

export interface ThemedTextProps extends TextProps {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  animated?: boolean;
  className?: string;
  
  // Legacy props - will be deprecated
  lightColor?: string;
  darkColor?: string;
}

// Map type to Tailwind classes
const typeToClasses = {
  default: 'text-base text-foreground',
  title: 'text-3xl font-bold text-foreground',
  defaultSemiBold: 'text-base font-semibold text-foreground',
  subtitle: 'text-xl font-bold text-foreground',
  link: 'text-base text-primary underline',
};

// Map type to native styles (for React Native)
const typeToStyles: Record<string, TextStyle> = {
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    fontSize: 16,
    lineHeight: 30,
    textDecorationLine: 'underline',
  },
};

export function ThemedText({
  style,
  type = 'default',
  animated = false,
  className,
  lightColor, // Ignored - for backward compatibility
  darkColor,  // Ignored - for backward compatibility
  ...rest
}: ThemedTextProps) {
  const TextComponent = animated ? AnimatedText : Text;
  
  const animatedStyle = useAnimatedStyle(() => {
    if (!animated) return {};
    return {
      transform: [{ scale: withSpring(1) }],
    };
  });
  
  // Apply theme-aware styles
  const combinedStyle = [
    typeToStyles[type],
    style,
  ];
  
  if (animated) {
    return (
      <AnimatedText
        className={cn(typeToClasses[type], className)}
        style={[combinedStyle, animatedStyle]}
        {...rest}
      />
    );
  }
  
  return (
    <Text
      className={cn(typeToClasses[type], className)}
      style={combinedStyle}
      {...rest}
    />
  );
}