import React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/core/utils';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  interpolate,
} from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  indicatorClassName?: string;
  showPercentage?: boolean;
  height?: number;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  className,
  indicatorClassName,
  showPercentage = false,
  height = 8,
  animated = true,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  const animatedStyle = useAnimatedStyle(() => {
    const width = animated 
      ? withSpring(clampedProgress, {
          damping: 20,
          stiffness: 90,
        })
      : clampedProgress;
      
    return {
      width: `${width}%`,
    };
  });
  
  return (
    <View 
      className={cn(
        "bg-muted rounded-full overflow-hidden",
        className
      )}
      style={{ height }}
    >
      <Animated.View
        className={cn(
          "h-full bg-primary rounded-full",
          indicatorClassName
        )}
        style={animatedStyle}
      />
    </View>
  );
}