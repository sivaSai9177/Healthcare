import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { cn } from '@/lib/core/utils';
import { useAnimationStore } from '@/lib/stores/animation-store';

export type DividerVariant = 'default' | 'muted' | 'primary' | 'secondary';
export type DividerAnimationType = 'none' | 'fade' | 'width' | 'slide';

export interface DividerProps {
  variant?: DividerVariant;
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  children?: React.ReactNode; // For text/content in divider
  textAlign?: 'left' | 'center' | 'right';
  className?: string;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationType?: DividerAnimationType;
  animationDuration?: number;
  animationDelay?: number;
}

// Variant classes
const variantClasses = {
  default: 'bg-border',
  muted: 'bg-muted',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
};

const AnimatedView = Animated.View;

export const Divider = React.forwardRef<View, DividerProps>(({
  variant = 'default',
  orientation = 'horizontal',
  thickness = 1,
  children,
  textAlign = 'center',
  className,
  style,
  // Animation props
  animated = false,
  animationType = 'fade',
  animationDuration = 500,
  animationDelay = 0,
}, ref) => {
  const { shouldAnimate } = useAnimationStore();
  const isHorizontal = orientation === 'horizontal';
  
  // Animation values
  const opacity = useSharedValue(animationType === 'fade' ? 0 : 1);
  const scaleX = useSharedValue(animationType === 'width' ? 0 : 1);
  const translateX = useSharedValue(animationType === 'slide' ? -50 : 0);
  
  // Spring config
  const springConfig = {
    damping: 20,
    stiffness: 200,
  };
  
  // Initialize animations
  useEffect(() => {
    if (animated && shouldAnimate()) {
      setTimeout(() => {
        if (animationType === 'fade') {
          opacity.value = withTiming(1, { duration: animationDuration });
        } else if (animationType === 'width') {
          scaleX.value = withSpring(1, springConfig);
        } else if (animationType === 'slide') {
          translateX.value = withSpring(0, springConfig);
          opacity.value = withTiming(1, { duration: animationDuration });
        }
      }, animationDelay);
    } else {
      opacity.value = 1;
      scaleX.value = 1;
      translateX.value = 0;
    }
  }, [animated, shouldAnimate, animationType, animationDuration, animationDelay]);
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scaleX: scaleX.value },
      { translateX: translateX.value },
    ],
  }));
  
  // Line classes
  const lineClasses = cn(
    variantClasses[variant],
    isHorizontal ? 'flex-1 h-px' : 'flex-1 w-px',
    className
  );
  
  // Container classes
  const containerClasses = cn(
    'flex items-center',
    isHorizontal ? 'flex-row w-full' : 'flex-col h-full'
  );
  
  if (children) {
    // Divider with content
    const textClasses = cn(
      'px-4',
      textAlign === 'left' && 'pr-8',
      textAlign === 'right' && 'pl-8'
    );
    
    return (
      <View ref={ref} className={containerClasses} style={style}>
        {(textAlign === 'center' || textAlign === 'right') && (
          <AnimatedView 
            className={lineClasses}
            style={[
              { height: thickness },
              animated && shouldAnimate() ? animatedStyle : {}
            ]} 
          />
        )}
        
        <View className={textClasses}>
          {typeof children === 'string' ? (
            <Text size="sm" className="text-muted-foreground">
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
        
        {(textAlign === 'center' || textAlign === 'left') && (
          <AnimatedView 
            className={lineClasses}
            style={[
              { height: thickness },
              animated && shouldAnimate() ? animatedStyle : {}
            ]} 
          />
        )}
      </View>
    );
  }
  
  // Simple divider
  return (
    <AnimatedView
      ref={ref}
      className={cn(
        variantClasses[variant],
        isHorizontal ? 'w-full' : 'h-full',
        className
      )}
      style={[
        {
          [isHorizontal ? 'height' : 'width']: thickness,
        },
        animated && shouldAnimate() ? animatedStyle : {},
        style,
      ]}
      entering={animated && shouldAnimate() ? FadeIn.duration(animationDuration).delay(animationDelay) : undefined}
      layout={animated && shouldAnimate() ? Layout.springify() : undefined}
    />
  );
});

Divider.displayName = 'Divider';

// Convenience components
export const HDivider = React.forwardRef<View, Omit<DividerProps, 'orientation'>>((props, ref) => (
  <Divider ref={ref} orientation="horizontal" {...props} />
));

export const VDivider = React.forwardRef<View, Omit<DividerProps, 'orientation'>>((props, ref) => (
  <Divider ref={ref} orientation="vertical" {...props} />
));

HDivider.displayName = 'HDivider';
VDivider.displayName = 'VDivider';