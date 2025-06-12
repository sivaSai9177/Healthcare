import React, { useEffect } from 'react';
import { View, ViewProps, ViewStyle, Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  SlideInDown,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { 
  designSystem, 
  Shadow, 
  BorderRadius, 
  SpacingScale,
  AnimationVariant,
  getAnimationConfig,
  mergeAnimationConfig,
} from '@/lib/design';
import { useSpacing } from '@/lib/stores/spacing-store';
import { ResponsiveValue } from '@/lib/design/responsive';
import { useResponsiveValue, useIsMobile } from '@/hooks/responsive';
import { useEntranceAnimation } from '@/lib/ui/animations/hooks';
// eslint-disable-next-line import/no-unresolved
import { createAnimationStyle } from '@/lib/ui/animations/platform-animations';
import { haptic } from '@/lib/ui/haptics';
import { useAnimationStore } from '@/lib/stores/animation-store';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface BoxProps extends ViewProps {
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: 'fade' | 'scale' | 'slide' | 'fadeScale' | 'fadeSlide' | 'bounce' | 'none';
  animationDuration?: ResponsiveValue<number>;
  animationDelay?: ResponsiveValue<number>;
  animationDirection?: 'up' | 'down' | 'left' | 'right';
  
  // Entrance/Exit animations
  entranceAnimation?: 'fade' | 'zoom' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'none';
  exitAnimation?: 'fade' | 'zoom' | 'none';
  animateOnMount?: boolean;
  
  // Interactive animations
  onPress?: () => void;
  animateOnPress?: boolean;
  animateOnHover?: boolean;
  pressAnimation?: 'scale' | 'opacity' | 'both';
  useHaptics?: boolean;
  
  // Animation config overrides
  animationConfig?: {
    hoverScale?: number;
    pressScale?: number;
    duration?: number;
    spring?: {
      damping?: number;
      stiffness?: number;
    };
  };
  
  // Platform-specific styles
  webStyle?: ViewStyle;
  nativeStyle?: ViewStyle;
  // Spacing - Now supports responsive values
  p?: ResponsiveValue<SpacingScale>;
  px?: ResponsiveValue<SpacingScale>;
  py?: ResponsiveValue<SpacingScale>;
  pt?: ResponsiveValue<SpacingScale>;
  pr?: ResponsiveValue<SpacingScale>;
  pb?: ResponsiveValue<SpacingScale>;
  pl?: ResponsiveValue<SpacingScale>;
  m?: ResponsiveValue<SpacingScale>;
  mx?: ResponsiveValue<SpacingScale>;
  my?: ResponsiveValue<SpacingScale>;
  mt?: ResponsiveValue<SpacingScale>;
  mr?: ResponsiveValue<SpacingScale>;
  mb?: ResponsiveValue<SpacingScale>;
  ml?: ResponsiveValue<SpacingScale>;
  
  // Layout - Now supports responsive values
  flex?: ResponsiveValue<number>;
  flexDirection?: ResponsiveValue<ViewStyle['flexDirection']>;
  justifyContent?: ResponsiveValue<ViewStyle['justifyContent']>;
  alignItems?: ResponsiveValue<ViewStyle['alignItems']>;
  alignSelf?: ResponsiveValue<ViewStyle['alignSelf']>;
  flexWrap?: ResponsiveValue<ViewStyle['flexWrap']>;
  gap?: ResponsiveValue<SpacingScale>;
  
  // Dimensions - Now supports responsive values
  width?: ResponsiveValue<ViewStyle['width']>;
  height?: ResponsiveValue<ViewStyle['height']>;
  minWidth?: ResponsiveValue<ViewStyle['minWidth']>;
  minHeight?: ResponsiveValue<ViewStyle['minHeight']>;
  maxWidth?: ResponsiveValue<ViewStyle['maxWidth']>;
  maxHeight?: ResponsiveValue<ViewStyle['maxHeight']>;
  
  // Visual - Now supports responsive values
  bg?: string;
  bgTheme?: 'background' | 'card' | 'popover' | 'primary' | 'secondary' | 'muted' | 'accent' | 'destructive';
  rounded?: ResponsiveValue<BorderRadius>;
  shadow?: ResponsiveValue<Shadow>;
  opacity?: ResponsiveValue<ViewStyle['opacity']>;
  
  // Border - Now supports responsive values
  borderWidth?: ResponsiveValue<number>;
  borderColor?: string;
  borderTheme?: 'border' | 'input' | 'ring';
  borderTopWidth?: ResponsiveValue<number>;
  borderRightWidth?: ResponsiveValue<number>;
  borderBottomWidth?: ResponsiveValue<number>;
  borderLeftWidth?: ResponsiveValue<number>;
  
  // Position - Now supports responsive values
  position?: ViewStyle['position'];
  top?: ResponsiveValue<ViewStyle['top']>;
  right?: ResponsiveValue<ViewStyle['right']>;
  bottom?: ResponsiveValue<ViewStyle['bottom']>;
  left?: ResponsiveValue<ViewStyle['left']>;
  zIndex?: ViewStyle['zIndex'];
  
  // Other
  overflow?: ViewStyle['overflow'];
  pointerEvents?: ViewProps['pointerEvents'];
}

export const Box = React.forwardRef<View, BoxProps>(({
  // Animation props
  animated = false,
  animationVariant = 'moderate',
  animationType = 'fade',
  animationDuration: animationDurationProp,
  animationDelay: animationDelayProp,
  animationDirection = 'up',
  entranceAnimation,
  exitAnimation,
  animateOnMount = true,
  onPress,
  animateOnPress = true,
  animateOnHover = true,
  pressAnimation = 'scale',
  useHaptics = true,
  animationConfig,
  webStyle,
  nativeStyle,
  
  // Spacing
  p, px, py, pt, pr, pb, pl,
  m, mx, my, mt, mr, mb, ml,
  
  // Layout
  flex,
  flexDirection,
  justifyContent,
  alignItems,
  alignSelf,
  flexWrap,
  gap,
  
  // Dimensions
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  
  // Visual
  bg,
  bgTheme,
  rounded,
  shadow,
  opacity,
  
  // Border
  borderWidth,
  borderColor,
  borderTheme,
  borderTopWidth,
  borderRightWidth,
  borderBottomWidth,
  borderLeftWidth,
  
  // Position
  position,
  top,
  right,
  bottom,
  left,
  zIndex,
  
  // Other
  overflow,
  pointerEvents,
  style,
  children,
  ...props
}, ref) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const isMobile = useIsMobile();
  
  // Get animation config from variant
  const baseConfig = getAnimationConfig(animationVariant);
  const config = animationConfig ? mergeAnimationConfig(animationVariant, {
    scale: {
      hover: animationConfig.hoverScale ?? baseConfig.scale.hover,
      press: animationConfig.pressScale ?? baseConfig.scale.press,
    },
    duration: animationConfig.duration ? {
      ...baseConfig.duration,
      normal: animationConfig.duration,
    } : baseConfig.duration,
    spring: animationConfig.spring ? {
      ...baseConfig.spring,
      ...animationConfig.spring,
    } : baseConfig.spring,
  }) : baseConfig;
  
  // Get responsive animation values
  const animationDuration = useResponsiveValue(animationDurationProp ?? config.duration.normal);
  const animationDelay = useResponsiveValue(animationDelayProp ?? 0);
  
  // Use config values
  const hoverScale = config.scale.hover;
  const pressScale = config.scale.press;
  const springConfig = config.spring;
  
  // Animation values for interactive animations
  const scale = useSharedValue(1);
  const animatedOpacity = useSharedValue(1);
  
  // Entrance animation hook - always call it at top level
  const entranceAnimationResult = useEntranceAnimation({
    type: animationType as any,
    duration: animationDuration,
    delay: animationDelay,
    direction: animationDirection,
  });
  
  // Effect for entrance animation - always at top level
  useEffect(() => {
    if (animated && shouldAnimate() && Platform.OS !== 'web' && animateOnMount) {
      entranceAnimationResult.animateIn();
    }
  }, [animateOnMount, animated, entranceAnimationResult, shouldAnimate]);
  
  // Get responsive values
  const responsiveP = useResponsiveValue(p);
  const responsivePx = useResponsiveValue(px);
  const responsivePy = useResponsiveValue(py);
  const responsivePt = useResponsiveValue(pt);
  const responsivePr = useResponsiveValue(pr);
  const responsivePb = useResponsiveValue(pb);
  const responsivePl = useResponsiveValue(pl);
  const responsiveM = useResponsiveValue(m);
  const responsiveMx = useResponsiveValue(mx);
  const responsiveMy = useResponsiveValue(my);
  const responsiveMt = useResponsiveValue(mt);
  const responsiveMr = useResponsiveValue(mr);
  const responsiveMb = useResponsiveValue(mb);
  const responsiveMl = useResponsiveValue(ml);
  const responsiveFlex = useResponsiveValue(flex);
  const responsiveFlexDirection = useResponsiveValue(flexDirection);
  const responsiveJustifyContent = useResponsiveValue(justifyContent);
  const responsiveAlignItems = useResponsiveValue(alignItems);
  const responsiveAlignSelf = useResponsiveValue(alignSelf);
  const responsiveFlexWrap = useResponsiveValue(flexWrap);
  const responsiveGap = useResponsiveValue(gap);
  const responsiveWidth = useResponsiveValue(width);
  const responsiveHeight = useResponsiveValue(height);
  const responsiveMinWidth = useResponsiveValue(minWidth);
  const responsiveMinHeight = useResponsiveValue(minHeight);
  const responsiveMaxWidth = useResponsiveValue(maxWidth);
  const responsiveMaxHeight = useResponsiveValue(maxHeight);
  const responsiveRounded = useResponsiveValue(rounded);
  const responsiveShadow = useResponsiveValue(shadow);
  const responsiveOpacity = useResponsiveValue(opacity);
  const responsiveBorderWidth = useResponsiveValue(borderWidth);
  const responsiveBorderTopWidth = useResponsiveValue(borderTopWidth);
  const responsiveBorderRightWidth = useResponsiveValue(borderRightWidth);
  const responsiveBorderBottomWidth = useResponsiveValue(borderBottomWidth);
  const responsiveBorderLeftWidth = useResponsiveValue(borderLeftWidth);
  const responsiveTop = useResponsiveValue(top);
  const responsiveRight = useResponsiveValue(right);
  const responsiveBottom = useResponsiveValue(bottom);
  const responsiveLeft = useResponsiveValue(left);
  
  // Build style object
  const boxStyle: ViewStyle = {
    // Spacing
    ...(responsiveP !== undefined && { padding: spacing[responsiveP] }),
    ...(responsivePx !== undefined && { paddingHorizontal: spacing[responsivePx] }),
    ...(responsivePy !== undefined && { paddingVertical: spacing[responsivePy] }),
    ...(responsivePt !== undefined && { paddingTop: spacing[responsivePt] }),
    ...(responsivePr !== undefined && { paddingRight: spacing[responsivePr] }),
    ...(responsivePb !== undefined && { paddingBottom: spacing[responsivePb] }),
    ...(responsivePl !== undefined && { paddingLeft: spacing[responsivePl] }),
    ...(responsiveM !== undefined && { margin: spacing[responsiveM] }),
    ...(responsiveMx !== undefined && { marginHorizontal: spacing[responsiveMx] }),
    ...(responsiveMy !== undefined && { marginVertical: spacing[responsiveMy] }),
    ...(responsiveMt !== undefined && { marginTop: spacing[responsiveMt] }),
    ...(responsiveMr !== undefined && { marginRight: spacing[responsiveMr] }),
    ...(responsiveMb !== undefined && { marginBottom: spacing[responsiveMb] }),
    ...(responsiveMl !== undefined && { marginLeft: spacing[responsiveMl] }),
    
    // Layout
    ...(responsiveFlex !== undefined && { flex: responsiveFlex }),
    ...(responsiveFlexDirection && { flexDirection: responsiveFlexDirection }),
    ...(responsiveJustifyContent && { justifyContent: responsiveJustifyContent }),
    ...(responsiveAlignItems && { alignItems: responsiveAlignItems }),
    ...(responsiveAlignSelf && { alignSelf: responsiveAlignSelf }),
    ...(responsiveFlexWrap && { flexWrap: responsiveFlexWrap }),
    ...(responsiveGap !== undefined && { gap: spacing[responsiveGap] }),
    
    // Dimensions
    ...(responsiveWidth !== undefined && { width: responsiveWidth }),
    ...(responsiveHeight !== undefined && { height: responsiveHeight }),
    ...(responsiveMinWidth !== undefined && { minWidth: responsiveMinWidth }),
    ...(responsiveMinHeight !== undefined && { minHeight: responsiveMinHeight }),
    ...(responsiveMaxWidth !== undefined && { maxWidth: responsiveMaxWidth }),
    ...(responsiveMaxHeight !== undefined && { maxHeight: responsiveMaxHeight }),
    
    // Visual
    ...(bg && { backgroundColor: bg }),
    ...(bgTheme && { backgroundColor: theme[bgTheme] }),
    ...(responsiveRounded !== undefined && { borderRadius: designSystem.borderRadius[responsiveRounded] }),
    ...(responsiveShadow && designSystem.shadows[responsiveShadow]),
    ...(responsiveOpacity !== undefined && { opacity: responsiveOpacity }),
    
    // Border
    ...(responsiveBorderWidth !== undefined && { borderWidth: responsiveBorderWidth }),
    ...(borderColor && { borderColor }),
    ...(borderTheme && { borderColor: theme[borderTheme] }),
    ...(responsiveBorderTopWidth !== undefined && { borderTopWidth: responsiveBorderTopWidth }),
    ...(responsiveBorderRightWidth !== undefined && { borderRightWidth: responsiveBorderRightWidth }),
    ...(responsiveBorderBottomWidth !== undefined && { borderBottomWidth: responsiveBorderBottomWidth }),
    ...(responsiveBorderLeftWidth !== undefined && { borderLeftWidth: responsiveBorderLeftWidth }),
    
    // Position
    ...(position && { position }),
    ...(responsiveTop !== undefined && { top: responsiveTop }),
    ...(responsiveRight !== undefined && { right: responsiveRight }),
    ...(responsiveBottom !== undefined && { bottom: responsiveBottom }),
    ...(responsiveLeft !== undefined && { left: responsiveLeft }),
    ...(zIndex !== undefined && { zIndex }),
    
    // Other
    ...(overflow && { overflow }),
  };
  
  // Handle press animations
  const handlePressIn = () => {
    if (animated && animateOnPress && onPress && shouldAnimate()) {
      if (useHaptics && isMobile) {
        haptic('impact');
      }
      
      if (pressAnimation === 'scale' || pressAnimation === 'both') {
        scale.value = withSpring(pressScale, springConfig);
      }
      
      if (pressAnimation === 'opacity' || pressAnimation === 'both') {
        animatedOpacity.value = withTiming(0.7, { duration: config.duration.fast });
      }
    }
  };
  
  const handlePressOut = () => {
    if (animated && animateOnPress && onPress && shouldAnimate()) {
      if (pressAnimation === 'scale' || pressAnimation === 'both') {
        scale.value = withSpring(1, springConfig);
      }
      
      if (pressAnimation === 'opacity' || pressAnimation === 'both') {
        animatedOpacity.value = withTiming(1, { duration: config.duration.fast });
      }
    }
  };
  
  // Animated style for interactive animations
  const interactiveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: animatedOpacity.value,
  }));
  
  // Web implementation with CSS animations
  if (animated && shouldAnimate() && Platform.OS === 'web') {
    const animationStyle = createAnimationStyle(
      animationType as any,
      { duration: animationDuration, delay: animationDelay, direction: animationDirection }
    );
    
    const interactiveStyle = onPress && animateOnHover ? {
      cursor: 'pointer',
      transition: `transform ${config.duration.fast}ms ease-out, opacity ${config.duration.fast}ms ease-out`,
      ':hover': pressAnimation?.includes('scale') ? {
        transform: `scale(${hoverScale})`,
      } : {},
      ':active': {
        transform: pressAnimation?.includes('scale') ? `scale(${pressScale})` : undefined,
        opacity: pressAnimation?.includes('opacity') ? 0.7 : undefined,
      },
    } : {};
    
    const Component = onPress ? 'button' : 'div';
    
    return (
      <Component
        ref={ref as any}
        style={[
          boxStyle,
          animationStyle,
          interactiveStyle,
          webStyle,
          style,
        ] as any}
        onClick={onPress}
        {...props}
      >
        {children}
      </Component>
    );
  }
  
  // Native implementation with Reanimated
  if (animated && shouldAnimate() && Platform.OS !== 'web') {
    const { animatedStyle, animateIn: _animateIn } = entranceAnimationResult;
    
    // Entrance animations
    let entering;
    let exiting;
    
    // Use variant-based entrance if not explicitly set
    const entrance = entranceAnimation || (
      config.entrance.scale ? 'zoom' : 
      config.entrance.slide ? 'slideUp' : 
      'fade'
    );
    
    if (entrance && entrance !== 'none') {
      switch (entrance) {
        case 'fade':
          entering = FadeIn.duration(animationDuration).delay(animationDelay);
          break;
        case 'zoom':
          entering = ZoomIn.duration(animationDuration).delay(animationDelay);
          break;
        case 'slideUp':
          entering = SlideInUp.duration(animationDuration).delay(animationDelay);
          break;
        case 'slideDown':
          entering = SlideInDown.duration(animationDuration).delay(animationDelay);
          break;
        case 'slideLeft':
          entering = SlideInLeft.duration(animationDuration).delay(animationDelay);
          break;
        case 'slideRight':
          entering = SlideInRight.duration(animationDuration).delay(animationDelay);
          break;
      }
    }
    
    if (exitAnimation && exitAnimation !== 'none') {
      switch (exitAnimation) {
        case 'fade':
          exiting = FadeOut.duration(animationDuration);
          break;
        case 'zoom':
          exiting = ZoomOut.duration(animationDuration);
          break;
      }
    }
    
    const AnimatedComponent = onPress ? AnimatedPressable : Animated.View;
    
    return (
      <AnimatedComponent
        ref={ref as any}
        style={[
          boxStyle,
          animatedStyle,
          onPress ? interactiveAnimatedStyle : {},
          nativeStyle,
          style,
        ]}
        entering={entering}
        exiting={exiting}
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        pointerEvents={pointerEvents}
        {...props}
      >
        {children}
      </AnimatedComponent>
    );
  }
  
  // Default non-animated implementation
  const Component = onPress ? Pressable : View;
  
  return (
    <Component
      ref={ref as any}
      style={[boxStyle, style]}
      onPress={onPress}
      pointerEvents={pointerEvents}
      {...props}
    >
      {children}
    </Component>
  );
});

Box.displayName = 'Box';