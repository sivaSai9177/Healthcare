import React, { useEffect } from 'react';
import { 
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Link as ExpoLink, Href } from 'expo-router';
import { Text, TextProps } from '@/components/universal/typography/Text';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { cn } from '@/lib/core/utils';
import { sanitizeStyleForWeb } from '@/lib/core/platform/style-fixes';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.View;

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
  
  // Animation values - always create hooks
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const underlineWidth = useSharedValue(0);

  // Spring config
  const springConfig = React.useMemo(() => ({
    damping: 20,
    stiffness: 300,
  }), []);

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
  
  // Update animations when hover/press state changes
  useEffect(() => {
    if (useAnimations && animationType !== 'none') {
      if (animationType === 'scale') {
        scale.value = withSpring(isPressed ? 0.95 : (isHovered ? 1.05 : 1), springConfig);
      }
      if (animationType === 'fade') {
        opacity.value = withTiming(isPressed ? 0.7 : (isHovered ? 0.8 : 1), { duration: animationDuration });
      }
      if (animationType === 'underline') {
        underlineWidth.value = withTiming(isHovered || isPressed ? 100 : 0, { duration: animationDuration });
      }
    }
  }, [isHovered, isPressed, useAnimations, animationType, animationDuration, scale, opacity, underlineWidth, springConfig]);

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
  
  // Create animated style
  const animatedStyle = useAnimatedStyle(() => {
    if (!useAnimations) return {};
    
    const styles: any = {};
    
    if (animationType === 'scale') {
      styles.transform = [{ scale: scale.value }];
    }
    
    if (animationType === 'fade') {
      styles.opacity = opacity.value;
    }
    
    return styles;
  });
  
  // Create underline style
  const underlineStyle = useAnimatedStyle(() => {
    if (!useAnimations) return {};
    return {
      position: 'absolute' as const,
      bottom: -2,
      left: 0,
      height: 1,
      backgroundColor: 'currentColor',
      transform: [{
        scaleX: underlineWidth.value / 100,
      }],
      width: '100%',
    };
  });

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
              return Platform.OS === 'web' ? sanitizeStyleForWeb(baseStyles as any) : baseStyles;
            })()}
            {...props}
          >
            {wrapWithUnderline(children)}
          </PressableComponent>
        ) : (
          <PressableComponent
            ref={ref}
            disabled={disabled}
            style={({ pressed }: any) => {
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
      className={cn(textClasses, textProps.className) as string}
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
            return Platform.OS === 'web' ? sanitizeStyleForWeb(baseStyles as any) : baseStyles;
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
        style={({ pressed }: any) => {
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
export const InlineLink: React.FC<UniversalLinkProps & { size?: TextProps['size']; weight?: TextProps['weight'] }> = ({
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