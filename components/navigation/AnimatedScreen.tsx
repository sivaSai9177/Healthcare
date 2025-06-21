import React from 'react';
import { ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useEntranceAnimation } from '@/lib/ui/animations';
import { Box } from '@/components/universal/layout/Box';

interface AnimatedScreenProps {
  children: React.ReactNode;
  type?: 'fade' | 'scale' | 'slide' | 'scale-fade';
  duration?: 'instant' | 'fast' | 'normal' | 'slow' | 'slower' | 'slowest';
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  style?: ViewStyle;
  flex?: number | boolean;
}

export function AnimatedScreen({
  children,
  type = 'scale-fade',
  duration = 'normal',
  delay = 0,
  direction = 'up',
  style,
  flex = 1,
}: AnimatedScreenProps) {
  const { animatedStyle } = useEntranceAnimation({
    type,
    duration,
    delay,
    from: direction,
  });
  
  return (
    <Animated.View 
      style={[
        { flex: flex === true ? 1 : flex === false ? 0 : flex },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Screen wrapper with consistent padding and background
export function AnimatedPageContainer({
  children,
  type = 'slide',
  duration = 'normal',
  delay = 0,
  direction = 'up',
  style,
  bgTheme = 'background',
  p = 4,
}: AnimatedScreenProps & {
  bgTheme?: string;
  p?: number;
}) {
  return (
    <AnimatedScreen
      type={type}
      duration={duration}
      delay={delay}
      direction={direction}
      flex={1}
      style={style}
    >
      <Box flex={1} bgTheme={bgTheme} p={p}>
        {children}
      </Box>
    </AnimatedScreen>
  );
}