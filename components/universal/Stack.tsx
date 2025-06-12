import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
} from 'react-native-reanimated';
// eslint-disable-next-line import/no-unresolved
import { Layout, type LayoutAnimationFunction } from '@/lib/ui/animations/layout-animations';
import { Box, BoxProps } from './Box';
import { SpacingScale } from '@/lib/design';
import { ResponsiveValue } from '@/lib/design/responsive';
import { useResponsiveValue } from '@/hooks/responsive';
import { DURATIONS } from '@/lib/ui/animations/constants';
import { useAnimationStore } from '@/lib/stores/animation-store';

interface StackProps extends BoxProps {
  spacing?: ResponsiveValue<SpacingScale>;
  direction?: 'horizontal' | 'vertical';
  divider?: React.ReactNode;
  children?: React.ReactNode;
  
  // Animation props
  animated?: boolean;
  animateOnMount?: boolean;
  
  // Stagger animation
  stagger?: number;
  staggerDirection?: 'forward' | 'reverse' | 'center';
  staggerDelay?: number;
  
  // Children animations
  childAnimation?: 'fade' | 'slide' | 'scale' | 'none';
  childAnimationDirection?: 'up' | 'down' | 'left' | 'right';
  childAnimationDuration?: number;
  
  // Layout animations
  enableLayoutAnimation?: boolean;
  layoutAnimation?: LayoutAnimationFunction;
  
  // Collapse/Expand
  collapsed?: boolean;
  collapseDuration?: number;
}

const AnimatedView = Animated.View;

// Animated child wrapper
const AnimatedChild = ({ 
  children, 
  index, 
  totalChildren,
  stagger,
  staggerDirection,
  staggerDelay,
  childAnimation,
  childAnimationDirection,
  childAnimationDuration,
  animate,
}: {
  children: React.ReactNode;
  index: number;
  totalChildren: number;
  stagger?: number;
  staggerDirection?: 'forward' | 'reverse' | 'center';
  staggerDelay?: number;
  childAnimation?: 'fade' | 'slide' | 'scale' | 'none';
  childAnimationDirection?: 'up' | 'down' | 'left' | 'right';
  childAnimationDuration?: number;
  animate?: boolean;
}) => {
  const { shouldAnimate } = useAnimationStore();
  const opacity = useSharedValue(childAnimation === 'fade' && animate && shouldAnimate() ? 0 : 1);
  const scale = useSharedValue(childAnimation === 'scale' && animate && shouldAnimate() ? 0.8 : 1);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  
  // Calculate stagger delay
  const getStaggerDelay = () => {
    if (!stagger) return 0;
    
    const baseDelay = staggerDelay || 0;
    
    switch (staggerDirection) {
      case 'reverse':
        return baseDelay + (totalChildren - index - 1) * stagger;
      case 'center':
        const center = Math.floor(totalChildren / 2);
        const distance = Math.abs(index - center);
        return baseDelay + distance * stagger;
      case 'forward':
      default:
        return baseDelay + index * stagger;
    }
  };
  
  useEffect(() => {
    if (!animate || !shouldAnimate()) return;
    
    const delay = getStaggerDelay();
    const duration = childAnimationDuration || DURATIONS.normal;
    
    if (childAnimation === 'fade') {
      opacity.value = withDelay(delay, withTiming(1, { duration }));
    }
    
    if (childAnimation === 'scale') {
      scale.value = withDelay(delay, withSpring(1, {
        damping: 15,
        stiffness: 150,
      }));
    }
    
    if (childAnimation === 'slide') {
      const slideDistance = 30;
      
      switch (childAnimationDirection) {
        case 'up':
          translateY.value = slideDistance;
          translateY.value = withDelay(delay, withSpring(0));
          break;
        case 'down':
          translateY.value = -slideDistance;
          translateY.value = withDelay(delay, withSpring(0));
          break;
        case 'left':
          translateX.value = slideDistance;
          translateX.value = withDelay(delay, withSpring(0));
          break;
        case 'right':
          translateX.value = -slideDistance;
          translateX.value = withDelay(delay, withSpring(0));
          break;
      }
    }
  }, [animate]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));
  
  if (Platform.OS === 'web') {
    const delay = getStaggerDelay();
    const duration = childAnimationDuration || DURATIONS.normal;
    
    return (
      <div
        style={{
          opacity: animate && shouldAnimate() && childAnimation === 'fade' ? 0 : 1,
          transform: animate && shouldAnimate() && childAnimation === 'scale' ? 'scale(0.8)' : 'scale(1)',
          animation: animate && shouldAnimate() && childAnimation !== 'none' 
            ? `${childAnimation}In ${duration}ms ease-out ${delay}ms both`
            : undefined,
        } as any}
      >
        {children}
      </div>
    );
  }
  
  return (
    <AnimatedView style={animatedStyle}>
      {children}
    </AnimatedView>
  );
};

export const Stack = React.forwardRef<View, StackProps>(({
  spacing: spacingProp = 0,
  direction = 'vertical',
  divider,
  children,
  // Animation props
  animated = false,
  animateOnMount = true,
  stagger = 50,
  staggerDirection = 'forward',
  staggerDelay = 0,
  childAnimation = 'fade',
  childAnimationDirection = 'up',
  childAnimationDuration,
  enableLayoutAnimation = false,
  layoutAnimation,
  collapsed = false,
  collapseDuration = DURATIONS.normal,
  ...props
}, ref) => {
  const { shouldAnimate } = useAnimationStore();
  const spacing = useResponsiveValue(spacingProp);
  const childrenArray = React.Children.toArray(children).filter(Boolean);
  const height = useSharedValue(collapsed ? 0 : 'auto');
  
  // Collapse animation
  useEffect(() => {
    if (animated && shouldAnimate() && typeof collapsed === 'boolean') {
      height.value = withTiming(
        collapsed ? 0 : 'auto',
        { duration: collapseDuration }
      );
    }
  }, [collapsed, animated]);
  
  const collapsedStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
  }));
  
  const content = childrenArray.map((child, index) => {
    const isLastChild = index === childrenArray.length - 1;
    const childElement = animated && shouldAnimate() ? (
      <AnimatedChild
        key={index}
        index={index}
        totalChildren={childrenArray.length}
        stagger={stagger}
        staggerDirection={staggerDirection}
        staggerDelay={staggerDelay}
        childAnimation={childAnimation}
        childAnimationDirection={childAnimationDirection}
        childAnimationDuration={childAnimationDuration}
        animate={animateOnMount}
      >
        {child}
      </AnimatedChild>
    ) : (
      child
    );
    
    return (
      <React.Fragment key={index}>
        {childElement}
        {divider && !isLastChild && divider}
      </React.Fragment>
    );
  });
  
  const BoxComponent = animated && shouldAnimate() && enableLayoutAnimation ? 
    Animated.createAnimatedComponent(Box) : Box;
  
  return (
    <BoxComponent
      ref={ref as any}
      flexDirection={direction === 'horizontal' ? 'row' : 'column'}
      gap={spacing}
      style={[animated && shouldAnimate() && collapsed !== undefined ? collapsedStyle : {}, props.style]}
      layout={animated && shouldAnimate() && enableLayoutAnimation && Layout ? (layoutAnimation || Layout.duration(DURATIONS.normal)) : undefined}
      {...props}
    >
      {content}
    </BoxComponent>
  );
});

Stack.displayName = 'Stack';

// Convenience components
export const VStack = React.forwardRef<View, Omit<StackProps, 'direction'>>((props, ref) => (
  <Stack ref={ref} direction="vertical" {...props} />
));

export const HStack = React.forwardRef<View, Omit<StackProps, 'direction'>>((props, ref) => (
  <Stack ref={ref} direction="horizontal" {...props} />
));

VStack.displayName = 'VStack';
HStack.displayName = 'HStack';