import React, { useEffect } from 'react';
import { View, ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
} from 'react-native-reanimated';
import { useSpacing } from '@/lib/stores/spacing-store';
import { SpacingScale } from '@/lib/design';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { cn } from '@/lib/core/utils';


export interface SeparatorProps extends ViewProps {
  // Orientation
  orientation?: 'horizontal' | 'vertical';
  
  // Spacing
  my?: SpacingScale; // margin top/bottom for horizontal
  mx?: SpacingScale; // margin left/right for vertical
  
  // Styling
  thickness?: number;
  variant?: 'default' | 'muted' | 'primary' | 'secondary' | 'dashed' | 'dotted';
  className?: string;
  
  // Decorative
  decorative?: boolean;
  
  // Layout
  flex?: boolean;
  
  // Animation
  animated?: boolean;
  animationType?: 'none' | 'fade' | 'shimmer' | 'pulse' | 'width';
  animationDuration?: number;
  animationDelay?: number;
  shimmerSpeed?: number;
  pulseIntensity?: number;
}

// Variant classes
const variantClasses = {
  default: 'bg-border',
  muted: 'bg-muted',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  dashed: 'bg-border border-dashed',
  dotted: 'bg-border border-dotted',
};

const AnimatedView = Animated.View;

export const Separator = React.forwardRef<View, SeparatorProps>(({
  orientation = 'horizontal',
  my,
  mx,
  thickness = 1,
  variant = 'default',
  className,
  decorative = true,
  flex = false,
  style,
  // Animation props
  animated = false,
  animationType = 'none',
  animationDuration = 500,
  animationDelay = 0,
  shimmerSpeed = 2000,
  pulseIntensity = 0.7,
  ...props
}, ref) => {
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  
  const isHorizontal = orientation === 'horizontal';
  
  // Animation values
  const shimmerTranslate = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);
  const widthScale = useSharedValue(0);
  
  // Start animations
  useEffect(() => {
    if (animated && shouldAnimate()) {
      if (animationType === 'shimmer') {
        shimmerTranslate.value = withRepeat(
          withTiming(1, {
            duration: shimmerSpeed,
            easing: Easing.linear,
          }),
          -1,
          false
        );
      } else if (animationType === 'pulse') {
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(pulseIntensity, { duration: animationDuration / 2 }),
            withTiming(1, { duration: animationDuration / 2 })
          ),
          -1,
          true
        );
      } else if (animationType === 'width') {
        widthScale.value = withDelay(
          animationDelay,
          withTiming(1, {
            duration: animationDuration,
            easing: Easing.out(Easing.ease),
          })
        );
      } else if (animationType === 'fade') {
        widthScale.value = withDelay(
          animationDelay,
          withTiming(1, { duration: animationDuration })
        );
      }
    } else {
      widthScale.value = 1;
      pulseOpacity.value = 1;
    }
  }, [animated, shouldAnimate, animationType, shimmerSpeed, animationDuration, pulseIntensity, animationDelay]);
  
  const animatedStyle = useAnimatedStyle(() => {
    if (!animated || !shouldAnimate()) {
      return {};
    }
    
    if (animationType === 'shimmer') {
      return {
        overflow: 'hidden',
      };
    } else if (animationType === 'pulse') {
      return {
        opacity: pulseOpacity.value,
      };
    } else if (animationType === 'width' || animationType === 'fade') {
      return {
        transform: [{ scaleX: widthScale.value }],
        opacity: animationType === 'fade' ? widthScale.value : 1,
      };
    }
    
    return {};
  });
  
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        shimmerTranslate.value,
        [0, 1],
        [-200, 200]
      ),
    }],
  }));
  
  // Calculate margins based on orientation
  const marginVertical = isHorizontal && my !== undefined ? spacing[my] : 0;
  const marginHorizontal = !isHorizontal && mx !== undefined ? spacing[mx] : 0;
  
  // Build classes
  const separatorClasses = cn(
    variantClasses[variant],
    isHorizontal ? 'w-full' : 'h-full',
    flex && 'flex-1',
    className
  );
  
  // Build style object
  const separatorStyle: ViewProps['style'] = {
    // Dimensions
    width: isHorizontal ? '100%' : thickness,
    height: isHorizontal ? thickness : '100%',
    
    // Margins
    ...(marginVertical > 0 && {
      marginTop: marginVertical,
      marginBottom: marginVertical,
    }),
    ...(marginHorizontal > 0 && {
      marginLeft: marginHorizontal,
      marginRight: marginHorizontal,
    }),
  };
  
  const ViewComponent = animated && shouldAnimate() ? AnimatedView : View;
  
  const content = (
    <ViewComponent
      ref={ref}
      className={separatorClasses}
      style={[
        separatorStyle,
        animated && shouldAnimate() ? animatedStyle : {},
        style
      ]}
      accessibilityRole={decorative ? 'none' : 'separator'}
      aria-hidden={decorative}
      {...props}
    />
  );
  
  // Add shimmer overlay if needed
  if (animated && shouldAnimate() && animationType === 'shimmer') {
    return (
      <View 
        className={cn(separatorClasses, 'overflow-hidden') as string}
        style={[separatorStyle, style] as any}
      >
        {content}
        <AnimatedView
          className="absolute inset-0 bg-white/50 dark:bg-white/20"
          style={shimmerStyle}
        />
      </View>
    );
  }
  
  return content;
});

Separator.displayName = 'Separator';

// Convenience components
export const HSeparator = React.forwardRef<View, Omit<SeparatorProps, 'orientation'>>((props, ref) => (
  <Separator ref={ref} orientation="horizontal" {...props} />
));

export const VSeparator = React.forwardRef<View, Omit<SeparatorProps, 'orientation'>>((props, ref) => (
  <Separator ref={ref} orientation="vertical" {...props} />
));

HSeparator.displayName = 'HSeparator';
VSeparator.displayName = 'VSeparator';