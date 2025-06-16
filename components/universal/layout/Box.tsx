import React, { useMemo } from 'react';
import { View, ViewProps, Platform } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  SlideInDown,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { cn } from '@/lib/core/utils';
import { LayoutStyleProps, layoutPropsToStyle } from './types';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface BoxProps extends ViewProps, LayoutStyleProps {
  // Style props
  className?: string;
  
  // Animation props
  animated?: boolean;
  entranceAnimation?: 'fade' | 'zoom' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'none';
  exitAnimation?: 'fade' | 'zoom' | 'none';
  animationDuration?: number;
  animationDelay?: number;
  
  // Content
  children?: React.ReactNode;
}

// Map entrance animations to Reanimated entering animations
const entranceAnimations = {
  fade: FadeIn,
  zoom: ZoomIn,
  slideUp: SlideInUp,
  slideDown: SlideInDown,
  slideLeft: SlideInLeft,
  slideRight: SlideInRight,
  none: undefined,
};

// Map exit animations to Reanimated exiting animations
const exitAnimations = {
  fade: FadeOut,
  zoom: ZoomOut,
  none: undefined,
};

export const Box = React.forwardRef<View, BoxProps>(({
  className,
  animated = false,
  entranceAnimation = 'none',
  exitAnimation = 'none',
  animationDuration = 300,
  animationDelay = 0,
  children,
  style,
  // Extract layout props
  p, px, py, pt, pr, pb, pl, padding,
  m, mx, my, mt, mr, mb, ml, margin,
  flex, flexDirection, flexWrap, flexGrow, flexShrink, flexBasis,
  alignItems, alignSelf, justifyContent,
  width, height, minWidth, minHeight, maxWidth, maxHeight,
  position, top, right, bottom, left, zIndex,
  borderWidth, borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth,
  borderRadius, borderTheme, rounded,
  bg, bgTheme, backgroundColor,
  opacity, overflow, gap,
  ...props
}, ref) => {
  // Get entrance and exit animations
  const entering = useMemo(() => {
    if (!animated || entranceAnimation === 'none') return undefined;
    const AnimationClass = entranceAnimations[entranceAnimation];
    if (!AnimationClass) return undefined;
    return AnimationClass.duration(animationDuration).delay(animationDelay);
  }, [animated, entranceAnimation, animationDuration, animationDelay]);

  const exiting = useMemo(() => {
    if (!animated || exitAnimation === 'none') return undefined;
    const AnimationClass = exitAnimations[exitAnimation];
    if (!AnimationClass) return undefined;
    return AnimationClass.duration(animationDuration);
  }, [animated, exitAnimation, animationDuration]);

  // Collect all layout props
  const layoutProps: LayoutStyleProps = {
    p, px, py, pt, pr, pb, pl, padding,
    m, mx, my, mt, mr, mb, ml, margin,
    flex, flexDirection, flexWrap, flexGrow, flexShrink, flexBasis,
    alignItems, alignSelf, justifyContent,
    width, height, minWidth, minHeight, maxWidth, maxHeight,
    position, top, right, bottom, left, zIndex,
    borderWidth, borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth,
    borderRadius, borderTheme, rounded,
    bg, bgTheme, backgroundColor,
    opacity, overflow, gap,
  };

  // Convert layout props to styles
  const layoutStyles = layoutPropsToStyle(layoutProps);
  
  // Combine styles and filter out falsy values
  const combinedStyle = React.useMemo(() => {
    const styles = [layoutStyles, style].filter(Boolean);
    if (styles.length === 0) return undefined;
    if (styles.length === 1) return styles[0];
    return styles;
  }, [layoutStyles, style]);

  // Base classes - handle bgTheme and borderTheme via className
  const boxClasses = cn(
    bgTheme && `bg-${bgTheme}`,
    borderTheme && `border-${borderTheme}`,
    rounded && `rounded-${rounded}`,
    className
  );

  if (animated) {
    return (
      <AnimatedView
        ref={ref as any}
        entering={entering}
        exiting={exiting}
        className={Platform.OS === 'web' ? boxClasses : undefined}
        style={combinedStyle}
        {...props}
      >
        {children}
      </AnimatedView>
    );
  }

  return (
    <View
      ref={ref}
      className={boxClasses}
      style={combinedStyle}
      {...props}
    >
      {children}
    </View>
  );
});

Box.displayName = 'Box';

// Convenience layout components using Box
export const Center = React.forwardRef<View, BoxProps>(({ className, ...props }, ref) => (
  <Box
    ref={ref}
    className={cn('items-center justify-center', className)}
    {...props}
  />
));
Center.displayName = 'Center';

export const Row = React.forwardRef<View, BoxProps>(({ className, ...props }, ref) => (
  <Box
    ref={ref}
    className={cn('flex-row', className)}
    {...props}
  />
));
Row.displayName = 'Row';

export const Column = React.forwardRef<View, BoxProps>(({ className, ...props }, ref) => (
  <Box
    ref={ref}
    className={cn('flex-col', className)}
    {...props}
  />
));
Column.displayName = 'Column';

export const Absolute = React.forwardRef<View, BoxProps>(({ className, ...props }, ref) => (
  <Box
    ref={ref}
    className={cn('absolute', className)}
    {...props}
  />
));
Absolute.displayName = 'Absolute';