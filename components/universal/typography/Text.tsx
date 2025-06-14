import React, { useCallback, useState } from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, Platform, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { cn } from '@/lib/core/utils';
import { FontSize, FontWeight } from '@/lib/design';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useResponsive, useResponsiveValue } from '@/hooks/responsive';

// Create animated components with proper type handling
const AnimatedText = Animated.createAnimatedComponent(RNText);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Helper to ensure style arrays are properly formatted
const flattenStyle = (style: any): any => {
  if (!style) return undefined;
  if (!Array.isArray(style)) return style;
  
  const flattened = style.flat(Infinity).filter(Boolean);
  if (flattened.length === 0) return undefined;
  if (flattened.length === 1) return flattened[0];
  
  // Merge all styles into a single object
  return Object.assign({}, ...flattened);
};

export interface TextProps extends RNTextProps {
  // Typography
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: TextStyle['textAlign'];
  transform?: TextStyle['textTransform'];
  decoration?: TextStyle['textDecorationLine'];
  letterSpacing?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';
  lineHeight?: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
  
  // Color - Now using Tailwind classes
  color?: 'foreground' | 'muted' | 'primary' | 'secondary' | 'destructive' | 'accent' | 'success' | 'warning' | 'info';
  
  // Font family
  font?: 'sans' | 'serif' | 'mono';
  
  // Interactive
  selectable?: boolean;
  onPress?: () => void;
  href?: string; // For link-like behavior
  
  // Animation
  animated?: boolean;
  animateOnPress?: boolean;
  animateOnHover?: boolean; // Web only
  copyable?: boolean; // Adds copy-to-clipboard functionality
  
  // Style
  className?: string;
  style?: TextStyle;
  
  // Legacy props for backward compatibility
  colorTheme?: string;
  mt?: any;
  mr?: any;
  mb?: any;
  ml?: any;
}

// Tailwind class mappings
const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
};

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const colorClasses = {
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
  destructive: 'text-destructive',
  accent: 'text-accent',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
};

const fontClasses = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
};

const letterSpacingClasses = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
  widest: 'tracking-widest',
};

const lineHeightClasses = {
  none: 'leading-none',
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
};

// Font size mapping for native
const fontSizeMap = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Font weight mapping for native
const fontWeightMap = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const Text = React.forwardRef<RNText, TextProps>(({
  // Typography
  size = 'base',
  weight = 'normal',
  align,
  transform,
  decoration,
  letterSpacing = 'normal',
  lineHeight = 'normal',
  
  // Color
  color = 'foreground',
  colorTheme, // Legacy support
  
  // Font family
  font = 'sans',
  
  // Interactive
  selectable,
  onPress,
  href,
  
  // Animation
  animated = false,
  animateOnPress = true,
  animateOnHover = false,
  copyable = false,
  
  // Style
  className,
  style,
  children,
  
  // Legacy spacing props (ignored)
  mt, mr, mb, ml,
  
  ...props
}, ref) => {
  const { enableAnimations } = useAnimationStore();
  const { typographyScale } = useSpacing();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Always call hooks - resolve responsive values
  const responsiveSize = useResponsiveValue(typeof size === 'object' && size !== null ? size : undefined) || size;
  const responsiveWeight = useResponsiveValue(typeof weight === 'object' && weight !== null ? weight : undefined) || weight;
  const responsiveAlign = useResponsiveValue(typeof align === 'object' && align !== null ? align : undefined) || align;
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const [copied, setCopied] = useState(false);
  
  // Handle legacy colorTheme prop
  const finalColor = colorTheme ? 'foreground' : color;
  
  // Build className
  const textClassName = cn(
    // Base styles - use resolved responsive values
    sizeClasses[responsiveSize || size] || sizeClasses.base,
    weightClasses[responsiveWeight || weight] || weightClasses.normal,
    colorClasses[finalColor] || colorClasses.foreground,
    fontClasses[font] || fontClasses.sans,
    letterSpacingClasses[letterSpacing] || letterSpacingClasses.normal,
    lineHeightClasses[lineHeight] || lineHeightClasses.normal,
    
    // Interactive styles
    onPress && 'active:opacity-80',
    onPress && Platform.OS === 'web' && 'hover:opacity-80 transition-opacity duration-200 cursor-pointer',
    href && 'underline underline-offset-2',
    
    // Platform-specific
    Platform.OS === 'web' && selectable && 'select-text',
    Platform.OS === 'web' && !selectable && 'select-none',
    
    // Custom className
    className
  );
  
  // Native style override for properties not supported by NativeWind
  const nativeStyle: TextStyle = {
    ...((responsiveAlign || align) && { textAlign: responsiveAlign || align }),
    ...(transform && { textTransform: transform }),
    ...(decoration && { textDecorationLine: decoration }),
    // Apply actual font size and weight for native
    ...(Platform.OS !== 'web' && {
      fontSize: fontSizeMap[responsiveSize || size] || fontSizeMap.base,
      fontWeight: fontWeightMap[responsiveWeight || weight] as TextStyle['fontWeight'],
    }),
  };
  
  // Handle style prop safely
  const finalStyle = React.useMemo(() => {
    if (!style) return nativeStyle;
    if (Array.isArray(style)) {
      // Flatten style array and filter out invalid values
      const flattened = style.flat().filter(s => s && typeof s === 'object');
      return Object.assign({}, nativeStyle, ...flattened);
    }
    if (typeof style === 'object') {
      return { ...nativeStyle, ...style };
    }
    return nativeStyle;
  }, [style, align, responsiveAlign, transform, decoration, responsiveSize, size, responsiveWeight, weight]);
  
  // Animated styles - only create if needed
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });
  
  // Handle press animation
  const handlePressIn = useCallback(() => {
    if (enableAnimations && animateOnPress) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(0.8, { duration: 100 });
    }
  }, [enableAnimations, animateOnPress]);
  
  const handlePressOut = useCallback(() => {
    if (enableAnimations && animateOnPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 100 });
    }
  }, [enableAnimations, animateOnPress]);
  
  const handlePress = useCallback(async () => {
    if (copyable && !onPress) {
      // Copy to clipboard functionality
      if (Platform.OS === 'web') {
        try {
          await navigator.clipboard.writeText(children?.toString() || '');
          setCopied(true);
          haptic('light');
          
          // Reset copied state after animation
          setTimeout(() => setCopied(false), 2000);
          
          // Animate copy feedback
          scale.value = withSequence(
            withSpring(1.1, { damping: 10, stiffness: 400 }),
            withSpring(1, { damping: 15, stiffness: 300 })
          );
        } catch (error) {
          console.error('Failed to copy text:', error);
        }
      }
    }
    
    onPress?.();
  }, [copyable, onPress, children]);
  
  // Copy feedback animation
  React.useEffect(() => {
    if (copied) {
      opacity.value = withSequence(
        withTiming(0.5, { duration: 100 }),
        withTiming(1, { duration: 400 })
      );
    }
  }, [copied]);
  
  const TextComponent = animated && enableAnimations ? AnimatedText : RNText;
  
  // Interactive text (pressable)
  if (onPress || copyable) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        <TextComponent
          ref={ref}
          className={textClassName}
          style={finalStyle}
          selectable={selectable}
          {...props}
        >
          {children}
          {copied && ' ✓'}
        </TextComponent>
      </AnimatedPressable>
    );
  }
  
  // Regular text - with or without animation
  if (animated && enableAnimations) {
    return (
      <AnimatedText
        ref={ref}
        className={textClassName}
        style={flattenStyle([animatedStyle, finalStyle])}
        selectable={selectable}
        {...props}
      >
        {children}
      </AnimatedText>
    );
  }
  
  return (
    <TextComponent
      ref={ref}
      className={textClassName}
      style={finalStyle}
      selectable={selectable}
      {...props}
    >
      {children}
    </TextComponent>
  );
});

Text.displayName = 'Text';

// Convenience components
export const Heading = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="3xl" weight="bold" {...props} />
));
Heading.displayName = 'Heading';

export const Heading1 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="4xl" weight="bold" {...props} />
));
Heading1.displayName = 'Heading1';

export const Heading2 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="3xl" weight="bold" {...props} />
));
Heading2.displayName = 'Heading2';

export const Heading3 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="2xl" weight="semibold" {...props} />
));
Heading3.displayName = 'Heading3';

export const Heading4 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="xl" weight="semibold" {...props} />
));
Heading4.displayName = 'Heading4';

export const Heading5 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="lg" weight="medium" {...props} />
));
Heading5.displayName = 'Heading5';

export const Heading6 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="base" weight="medium" {...props} />
));
Heading6.displayName = 'Heading6';

export const Title = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="2xl" weight="semibold" {...props} />
));
Title.displayName = 'Title';

export const Subtitle = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="xl" weight="medium" {...props} />
));
Subtitle.displayName = 'Subtitle';

export const Body = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="base" weight="normal" {...props} />
));
Body.displayName = 'Body';

export const Paragraph = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="base" weight="normal" lineHeight="relaxed" {...props} />
));
Paragraph.displayName = 'Paragraph';

export const Caption = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="sm" weight="normal" color="muted" {...props} />
));
Caption.displayName = 'Caption';

export const TextLabel = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="sm" weight="medium" {...props} />
));
TextLabel.displayName = 'TextLabel';

export const Code = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text 
    ref={ref} 
    font="mono"
    className={cn('bg-muted px-1 py-0.5 rounded', props.className)}
    copyable
    animated
    {...props} 
  />
));
Code.displayName = 'Code';

// Animated text variants
export const AnimatedHeading = React.forwardRef<RNText, TextProps & { delay?: number }>((
  { delay = 0, ...props }, 
  ref
) => {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);
  
  React.useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 12, stiffness: 100 })
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 600 })
    );
  }, [delay, translateY, opacity]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View style={animatedStyle}>
      <Heading1 ref={ref} {...props} />
    </Animated.View>
  );
});
AnimatedHeading.displayName = 'AnimatedHeading';

export const FadeInText = React.forwardRef<RNText, TextProps & { delay?: number; duration?: number }>((
  { delay = 0, duration = 600, style, className, ...props }, 
  ref
) => {
  const opacity = useSharedValue(0);
  
  React.useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
  }, [delay, duration, opacity]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  return (
    <AnimatedText
      ref={ref}
      className={className}
      style={[animatedStyle, style]}
      {...props}
    />
  );
});
FadeInText.displayName = 'FadeInText';

// Link component with animations
export const Link = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text 
    ref={ref} 
    color="primary"
    className={cn('underline underline-offset-2', props.className)}
    animateOnPress
    animated
    {...props} 
  />
));
Link.displayName = 'Link';