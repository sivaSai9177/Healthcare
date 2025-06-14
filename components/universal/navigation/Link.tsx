import React, { useEffect } from 'react';
import { 
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  Platform,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Link as ExpoLink, Href } from 'expo-router';
import { Text, TextProps } from '@/components/universal/typography/Text';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { cn } from '@/lib/core/utils';
import { sanitizeStyleForWeb } from '@/lib/core/platform/style-fixes';

// Only import Reanimated on native platforms
let Animated: any;
let useSharedValue: any;
let useAnimatedStyle: any;
let withSpring: any;
let withTiming: any;

if (Platform.OS !== 'web') {
  const ReanimatedModule = require('react-native-reanimated');
  Animated = ReanimatedModule.default;
  useSharedValue = ReanimatedModule.useSharedValue;
  useAnimatedStyle = ReanimatedModule.useAnimatedStyle;
  withSpring = ReanimatedModule.withSpring;
  withTiming = ReanimatedModule.withTiming;
}

const AnimatedPressable = Platform.OS !== 'web' && Animated ? Animated.createAnimatedComponent(Pressable) : Pressable;
const AnimatedView = Platform.OS !== 'web' && Animated ? Animated.View : View;

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
  className?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: LinkAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
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
  className,
  textProps = {},
  variant = 'primary',
  animated = true,
  animationType = 'scale',
  animationDuration = 300,
  useHaptics = true,
  ...props
}, ref) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const { shouldAnimate } = useAnimationStore();
  
  // Skip animations on web
  const useAnimations = Platform.OS !== 'web' && shouldAnimate() && animated;
  
  // Animation values (only create on native)
  const scale = useAnimations && useSharedValue ? useSharedValue(1) : null;
  const opacity = useAnimations && useSharedValue ? useSharedValue(1) : null;
  const underlineWidth = useAnimations && useSharedValue ? useSharedValue(0) : null;

  // Spring config
  const springConfig = {
    damping: 20,
    stiffness: 300,
  };

  // Get variant classes for Tailwind
  const variantClasses = {
    default: {
      text: 'text-foreground',
      hoverText: 'hover:text-primary',
      pressedText: 'active:text-primary/80',
    },
    primary: {
      text: 'text-primary underline',
      hoverText: 'hover:text-primary/80',
      pressedText: 'active:text-primary/70',
    },
    destructive: {
      text: 'text-destructive underline',
      hoverText: 'hover:text-destructive/80',
      pressedText: 'active:text-destructive/70',
    },
    ghost: {
      text: 'text-muted-foreground',
      hoverText: 'hover:text-foreground',
      pressedText: 'active:text-foreground/80',
    },
  };

  const currentVariant = variantClasses[variant] || variantClasses.default;
  
  // Update animations when hover/press state changes (native only)
  useEffect(() => {
    if (useAnimations && animationType !== 'none' && withSpring && withTiming) {
      if (animationType === 'scale' && scale) {
        scale.value = withSpring(isPressed ? 0.95 : (isHovered ? 1.05 : 1), springConfig);
      }
      if (animationType === 'fade' && opacity) {
        opacity.value = withTiming(isPressed ? 0.7 : (isHovered ? 0.8 : 1), { duration: animationDuration });
      }
      if (animationType === 'underline' && underlineWidth) {
        underlineWidth.value = withTiming(isHovered || isPressed ? 100 : 0, { duration: animationDuration });
      }
    }
  }, [isHovered, isPressed, useAnimations, animationType, animationDuration]);

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
  
  // Create animated style only for native
  const animatedStyle = useAnimations && useAnimatedStyle ? 
    useAnimatedStyle(() => {
      const styles: any = {};
      
      if (animationType === 'scale' && scale) {
        styles.transform = [{ scale: scale.value }];
      }
      
      if (animationType === 'fade' && opacity) {
        styles.opacity = opacity.value;
      }
      
      return styles;
    }) : {};
  
  // Create underline style only for native
  const underlineStyle = useAnimations && underlineWidth && useAnimatedStyle ? 
    useAnimatedStyle(() => ({
      position: 'absolute' as const,
      bottom: -2,
      left: 0,
      height: 1,
      backgroundColor: 'currentColor',
      transform: [{
        scaleX: underlineWidth.value / 100,
      }],
      width: '100%',
    })) : {};

  // Component declarations moved here to avoid hoisting issues
  const PressableComponent = useAnimations && animationType !== 'none' 
    ? AnimatedPressable 
    : Pressable;

  // Wrap content with underline animation if needed
  const wrapWithUnderline = (content: React.ReactNode) => {
    if (useAnimations && animationType === 'underline') {
      return (
        <AnimatedView style={{ position: 'relative' }}>
          {content}
          <AnimatedView style={underlineStyle} />
        </AnimatedView>
      );
    }
    return content;
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
            style={(() => {
              const baseStyles = [combinedStyle];
              if (useAnimations && animationType !== 'none' && animationType !== 'underline') {
                baseStyles.push(animatedStyle);
              }
              return Platform.OS === 'web' ? sanitizeStyleForWeb(baseStyles) : baseStyles;
            })()}
            {...props}
          >
            {wrapWithUnderline(children)}
          </PressableComponent>
        ) : (
          <PressableComponent
            ref={ref}
            disabled={disabled}
            style={({ pressed }) => {
              const pressedStyles = [
                combinedStyle,
                { opacity: pressed && !useAnimations ? 0.7 : 1 },
                useAnimations && animationType !== 'none' && animationType !== 'underline' 
                  ? animatedStyle 
                  : {},
              ];
              return pressedStyles;
            }}
            {...props}
          >
            {wrapWithUnderline(children)}
          </PressableComponent>
        )}
      </ExpoLink>
    );
  }
  
  // Text classes based on state
  const textClasses = cn(
    currentVariant.text,
    isPressed && currentVariant.pressedText,
    isHovered && !isPressed && currentVariant.hoverText,
    disabled && 'opacity-50',
    className
  );
  
  // Default behavior - render text as link
  const content = typeof children === 'string' ? (
    <Text 
      {...textProps}
      className={cn(textClasses, textProps.className)}
      style={textProps.style}
    >
      {children}
    </Text>
  ) : children;
  
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
          style={(() => {
            const baseStyles = [combinedStyle];
            if (useAnimations && animationType !== 'none' && animationType !== 'underline') {
              baseStyles.push(animatedStyle);
            }
            return Platform.OS === 'web' ? sanitizeStyleForWeb(baseStyles) : baseStyles;
          })()}
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
        style={({ pressed }) => {
          const pressedStyles = [
            combinedStyle,
            { opacity: pressed && !useAnimations ? 0.7 : 1 },
            useAnimations && animationType !== 'none' && animationType !== 'underline' 
              ? animatedStyle 
              : {},
          ];
          return pressedStyles;
        }}
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