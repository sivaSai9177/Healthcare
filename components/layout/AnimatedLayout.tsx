import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { useEntranceAnimation } from '@/lib/ui/animations';
import { cn } from '@/lib/core/utils';

interface AnimatedLayoutProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'scale-fade';
  delay?: number;
  className?: string;
  style?: any;
}

/**
 * AnimatedLayout Component
 * Provides entrance animations for page content
 */
export function AnimatedLayout({ 
  children, 
  type = 'fade', 
  delay = 0,
  className,
  style,
}: AnimatedLayoutProps) {
  if (Platform.OS === 'web') {
    // Web implementation - use Tailwind classes
    const animationMap = {
      fade: 'animate-fade-in',
      slide: 'animate-slide-in-up',
      scale: 'animate-scale-in',
      'scale-fade': 'animate-scale-fade-in',
    };
    
    return (
      <View 
        className={cn(
          'flex-1',
          animationMap[type],
          'duration-normal',
          className
        )}
        style={style}
      >
        {children}
      </View>
    );
  }
  
  // Native implementation - use Reanimated
  const { animatedStyle } = useEntranceAnimation({
    type,
    delay,
    duration: 'normal',
  });
  
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle, style]} className={className}>
      {children}
    </Animated.View>
  );
}

/**
 * PageContainer Component
 * Standard page wrapper with animations
 */
export function PageContainer({ 
  children, 
  className,
  style,
  animate = true,
}: {
  children: React.ReactNode;
  className?: string;
  style?: any;
  animate?: boolean;
}) {
  if (!animate) {
    return (
      <View className={cn('flex-1', className)} style={style}>
        {children}
      </View>
    );
  }
  
  return (
    <AnimatedLayout type="fade" className={className} style={style}>
      {children}
    </AnimatedLayout>
  );
}

/**
 * StaggeredList Component
 * Animated list with staggered item animations
 */
export function StaggeredList({ 
  children, 
  className,
  staggerDelay = 50,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const childArray = React.Children.toArray(children);
  
  return (
    <View className={cn('flex-1', className)}>
      {childArray.map((child, index) => (
        <AnimatedLayout 
          key={index} 
          type="slide" 
          delay={index * staggerDelay}
        >
          {child}
        </AnimatedLayout>
      ))}
    </View>
  );
}