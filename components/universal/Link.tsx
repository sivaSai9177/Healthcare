import React, { useEffect } from 'react';
import { 
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  Platform,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Link as ExpoLink, Href } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';
import { Text, TextProps } from './Text';
import { 
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type LinkAnimationType = 'scale' | 'fade' | 'underline' | 'none';

export interface UniversalLinkProps extends Omit<PressableProps, 'onPress' | 'style'> {
  href: Href;
  onPress?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  underlayColor?: string;
  hoverStyle?: ViewStyle;
  pressStyle?: ViewStyle;
  disabled?: boolean;
  asChild?: boolean;
  replace?: boolean;
  push?: boolean;
  children?: React.ReactNode;
  textProps?: TextProps;
  variant?: 'default' | 'primary' | 'destructive' | 'ghost';
  style?: ViewStyle | ((state: PressableStateCallbackType) => ViewStyle);
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: LinkAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const UniversalLink = React.forwardRef<any, UniversalLinkProps>(({
  href,
  onPress,
  onHoverIn,
  onHoverOut,
  onPressIn,
  onPressOut,
  underlayColor,
  hoverStyle,
  pressStyle,
  disabled = false,
  asChild = false,
  replace = false,
  push = false,
  children,
  style,
  textProps = {},
  variant = 'primary',
  animated = true,
  animationVariant = 'moderate',
  animationType = 'scale',
  animationDuration,
  useHaptics = true,
  animationConfig,
  ...props
}, ref) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const underlineWidth = useSharedValue(0);

  // Get variant colors with hover states using theme colors
  const variantColors = React.useMemo(() => {
    return {
      default: {
        text: theme.foreground,
        hoverText: theme.primary,
        underline: 'none' as const,
      },
      primary: {
        text: theme.primary, // Use theme primary instead of hardcoded blue
        hoverText: theme.primary + 'dd', // Slightly darker on hover (87% opacity)
        underline: 'underline' as const,
      },
      destructive: {
        text: theme.destructive,
        hoverText: theme.destructive + 'dd', // Slightly darker on hover
        underline: 'underline' as const,
      },
      ghost: {
        text: theme.mutedForeground,
        hoverText: theme.foreground,
        underline: 'none' as const,
      },
    };
  }, [theme]);

  const currentVariant = variantColors[variant] || variantColors.default;
  
  // Update animations when hover/press state changes
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate() && animationType !== 'none') {
      if (animationType === 'scale') {
        scale.value = withSpring(isPressed ? 0.95 : (isHovered ? 1.05 : 1), config.spring);
      }
      if (animationType === 'fade') {
        opacity.value = withTiming(isPressed ? 0.7 : (isHovered ? 0.8 : 1), { duration: config.duration.fast });
      }
      if (animationType === 'underline') {
        underlineWidth.value = withTiming(isHovered || isPressed ? 100 : 0, { duration: config.duration.normal });
      }
    }
  }, [isHovered, isPressed, animated, isAnimated, shouldAnimate, animationType, config]);

  const handleHoverIn = () => {
    setIsHovered(true);
    onHoverIn?.();
  };

  const handleHoverOut = () => {
    setIsHovered(false);
    onHoverOut?.();
  };

  const handlePressIn = () => {
    // Haptic feedback
    if (useHaptics && Platform.OS !== 'web') {
      haptic('selection');
    }
    
    setIsPressed(true);
    onPressIn?.();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    onPressOut?.();
  };

  const combinedStyle = React.useMemo(() => {
    const styles = [
      style,
      isHovered && hoverStyle,
      isPressed && pressStyle,
    ].filter(Boolean);
    
    return styles.length > 0 ? StyleSheet.flatten(styles) : undefined;
  }, [style, isHovered, hoverStyle, isPressed, pressStyle]);
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    const styles: any = {};
    
    if (animationType === 'scale') {
      styles.transform = [{ scale: scale.value }];
    }
    
    if (animationType === 'fade') {
      styles.opacity = opacity.value;
    }
    
    return styles;
  });
  
  const underlineStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    bottom: -2,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: currentVariant.hoverText,
    width: `${underlineWidth.value}%`,
  }));

  const linkTextStyle: TextStyle = {
    color: isPressed ? currentVariant.hoverText : (isHovered ? currentVariant.hoverText : currentVariant.text),
    textDecorationLine: animated && isAnimated && shouldAnimate() && animationType === 'underline' 
      ? 'none' 
      : (isHovered ? currentVariant.underline : 'none'),
    opacity: disabled ? 0.5 : (animated && isAnimated && shouldAnimate() && animationType === 'fade' ? 1 : (isPressed ? 0.8 : 1)),
  };

  // If asChild is true, render children directly in the link
  if (asChild) {
    return (
      <ExpoLink
        href={href}
        replace={replace}
        push={push}
        asChild
        disabled={disabled}
        onPress={onPress}
        {...(Platform.OS === 'web' && {
          onMouseEnter: handleHoverIn,
          onMouseLeave: handleHoverOut,
        })}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {Platform.OS === 'web' ? (
          <PressableComponent
            ref={ref}
            disabled={disabled}
            style={[
              combinedStyle,
              animated && isAnimated && shouldAnimate() && animationType !== 'none' && animationType !== 'underline' 
                ? animatedStyle 
                : {},
              Platform.OS === 'web' && animated && isAnimated && shouldAnimate() && {
                transition: 'all 0.2s ease',
              } as any,
            ]}
            {...props}
          >
            {wrapWithUnderline(children)}
          </PressableComponent>
        ) : (
          <PressableComponent
            ref={ref}
            disabled={disabled}
            style={({ pressed }) => [
              combinedStyle,
              { opacity: pressed && !animated ? 0.7 : 1 },
              animated && isAnimated && shouldAnimate() && animationType !== 'none' && animationType !== 'underline' 
                ? animatedStyle 
                : {},
            ] as ViewStyle}
            {...props}
          >
            {wrapWithUnderline(children)}
          </PressableComponent>
        )}
      </ExpoLink>
    );
  }

  // Wrap content with underline animation if needed
  const wrapWithUnderline = (content: React.ReactNode) => {
    if (animated && isAnimated && shouldAnimate() && animationType === 'underline') {
      return (
        <Animated.View style={{ position: 'relative' }}>
          {content}
          <Animated.View style={underlineStyle} />
        </Animated.View>
      );
    }
    return content;
  };
  
  // Default behavior - render text as link
  const content = typeof children === 'string' ? (
    <Text 
      {...textProps}
      style={StyleSheet.flatten([textProps.style, linkTextStyle])}
    >
      {children}
    </Text>
  ) : children;

  const PressableComponent = animated && isAnimated && shouldAnimate() && animationType !== 'none' 
    ? AnimatedPressable 
    : Pressable;
  
  if (Platform.OS === 'web') {
    return (
      <ExpoLink
        href={href}
        replace={replace}
        push={push}
        asChild
        disabled={disabled}
        onPress={onPress}
      >
        <PressableComponent
          ref={ref}
          disabled={disabled}
          style={[
            combinedStyle,
            animated && isAnimated && shouldAnimate() && animationType !== 'none' && animationType !== 'underline' 
              ? animatedStyle 
              : {},
            Platform.OS === 'web' && animated && isAnimated && shouldAnimate() && {
              transition: 'all 0.2s ease',
            } as any,
          ]}
          onHoverIn={handleHoverIn}
          onHoverOut={handleHoverOut}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          {...props}
        >
          {wrapWithUnderline(content)}
        </PressableComponent>
      </ExpoLink>
    );
  }

  return (
    <ExpoLink
      href={href}
      replace={replace}
      push={push}
      asChild
      disabled={disabled}
      onPress={onPress}
    >
      <PressableComponent
        ref={ref}
        disabled={disabled}
        style={({ pressed }) => [
          combinedStyle,
          { opacity: pressed && !animated ? 0.7 : 1 },
          animated && isAnimated && shouldAnimate() && animationType !== 'none' && animationType !== 'underline' 
            ? animatedStyle 
            : {},
        ] as ViewStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {wrapWithUnderline(content)}
      </PressableComponent>
    </ExpoLink>
  );
});

UniversalLink.displayName = 'UniversalLink';

// Convenience component for inline text links
export const TextLink: React.FC<UniversalLinkProps & { size?: TextProps['size']; weight?: TextProps['weight'] }> = ({
  children,
  size = 'sm',
  weight = 'medium',
  animated = true,
  animationType = 'underline',
  ...props
}) => {
  return (
    <UniversalLink
      {...props}
      animated={animated}
      animationType={animationType}
      textProps={{ size, weight }}
    >
      {children}
    </UniversalLink>
  );
};