import React, { useEffect } from 'react';
import { View, ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
} from 'react-native-reanimated';

import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { SpacingScale, AnimationVariant } from '@/lib/design';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';


export interface SeparatorProps extends ViewProps {
  // Orientation
  orientation?: 'horizontal' | 'vertical';
  
  // Spacing
  my?: SpacingScale; // margin top/bottom for horizontal
  mx?: SpacingScale; // margin left/right for vertical
  
  // Styling
  thickness?: number;
  colorTheme?: 'border' | 'muted' | 'primary' | 'secondary';
  opacity?: number;
  
  // Decorative
  decorative?: boolean;
  
  // Layout
  flex?: boolean;
  
  // Animation
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: 'none' | 'fade' | 'shimmer' | 'pulse';
  animationDuration?: number;
  animationDelay?: number;
  shimmerSpeed?: number;
  pulseScale?: number;
  animationConfig?: {
    duration?: { normal?: number };
    scale?: { hover?: number; press?: number };
  };
}

export const Separator = React.forwardRef<View, SeparatorProps>(({
  orientation = 'horizontal',
  my,
  mx,
  thickness = 1,
  colorTheme = 'border',
  opacity = 1,
  decorative = true,
  flex = false,
  style,
  // Animation props
  animated = false,
  animationVariant = 'moderate',
  animationType = 'none',
  animationDuration,
  animationDelay = 0,
  shimmerSpeed = 2000,
  pulseScale = 1.05,
  animationConfig,
  ...props
}, ref) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.normal;
  
  const isHorizontal = orientation === 'horizontal';
  
  // Animation values
  const shimmerTranslate = useSharedValue(0);
  const pulseOpacity = useSharedValue(opacity);
  const widthScale = useSharedValue(0);
  
  // Start animations
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
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
            withTiming(opacity * 0.3, { duration: duration / 2 }),
            withTiming(opacity, { duration: duration / 2 })
          ),
          -1,
          true
        );
      } else if (animationType === 'width') {
        widthScale.value = withDelay(
          animationDelay,
          withTiming(1, {
            duration: duration,
            easing: Easing.out(Easing.ease),
          })
        );
      }
    }
  }, [animated, isAnimated, shouldAnimate, animationType, shimmerSpeed, duration, opacity, animationDelay]);
  
  const animatedStyle = useAnimatedStyle(() => {
    if (!animated || !isAnimated || !shouldAnimate()) {
      return {};
    }
    
    if (animationType === 'shimmer') {
      const translateX = interpolate(
        shimmerTranslate.value,
        [0, 1],
        [-200, 200]
      );
      return {
        overflow: 'hidden',
      };
    } else if (animationType === 'pulse') {
      return {
        opacity: pulseOpacity.value,
      };
    } else if (animationType === 'width') {
      return {
        transform: [{ scaleX: widthScale.value }],
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
    
    // Color
    backgroundColor: theme[colorTheme] || theme.border,
    opacity,
    
    // Flex
    ...(flex && { flex: 1 }),
  };
  
  const ViewComponent = animated && isAnimated && shouldAnimate() ? AnimatedView : View;
  
  const content = (
    <ViewComponent
      ref={ref}
      style={[separatorStyle, animated && isAnimated && shouldAnimate() ? animatedStyle : {}, style]}
      accessibilityRole={decorative ? 'none' : 'separator'}
      aria-hidden={decorative}
      {...props}
    />
  );
  
  // Add shimmer overlay if needed
  if (animated && isAnimated && shouldAnimate() && animationType === 'shimmer') {
    return (
      <View style={[separatorStyle, { overflow: 'hidden' }, style]}>
        {content}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.background,
              opacity: 0.5,
            },
            shimmerStyle,
          ]}
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