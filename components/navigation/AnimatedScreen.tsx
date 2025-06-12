import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useEntranceAnimation } from '@/lib/ui/animations/hooks';
import { Box } from '@/components/universal/Box';

interface AnimatedScreenProps {
  children: React.ReactNode;
  type?: 'fade' | 'scale' | 'slide' | 'fadeScale' | 'fadeSlide';
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  style?: ViewStyle;
  flex?: number | boolean;
}

export function AnimatedScreen({
  children,
  type = 'fadeScale',
  duration = 300,
  delay = 0,
  direction = 'up',
  style,
  flex = 1,
}: AnimatedScreenProps) {
  const { animatedStyle, animateIn } = useEntranceAnimation({
    type,
    duration,
    delay,
    direction,
  });
  
  useEffect(() => {
    animateIn();
  }, [animateIn]);
  
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
  type = 'fadeSlide',
  duration = 300,
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