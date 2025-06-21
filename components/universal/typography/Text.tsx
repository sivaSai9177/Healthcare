import React, { useCallback, useState, useMemo } from 'react';
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
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useResponsive, useResponsiveValue } from '@/hooks/responsive';
import { useTypography, useSystemFontScale } from '@/hooks/useTypography';
import { 
  TypographySize, 
  FontWeight, 
  LineHeight, 
  LetterSpacing,
  TypographyPreset,
  typographySystem 
} from '@/lib/design/typography';

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
  size?: TypographySize;
  weight?: FontWeight;
  align?: TextStyle['textAlign'];
  transform?: TextStyle['textTransform'];
  decoration?: TextStyle['textDecorationLine'];
  letterSpacing?: LetterSpacing;
  lineHeight?: LineHeight;
  
  // Typography preset (overrides individual props)
  preset?: TypographyPreset;
  
  // Color - Now using Tailwind classes
  color?: 'foreground' | 'muted' | 'primary' | 'secondary' | 'destructive' | 'accent' | 'success' | 'warning' | 'info';
  
  // Font family
  font?: 'sans' | 'serif' | 'mono' | 'display' | 'text';
  
  // Interactive
  selectable?: boolean;
  onPress?: () => void;
  href?: string; // For link-like behavior
  
  // Animation
  animated?: boolean;
  animateOnPress?: boolean;
  animateOnHover?: boolean; // Web only
  copyable?: boolean; // Adds copy-to-clipboard functionality
  
  // Accessibility
  respectSystemScale?: boolean; // Apply system font scaling
  
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
const sizeClasses: Record<TypographySize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
  '7xl': 'text-7xl',
  '8xl': 'text-8xl',
  '9xl': 'text-9xl',
};

const weightClasses: Record<FontWeight, string> = {
  thin: 'font-thin',
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  black: 'font-black',
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
  sans: Platform.OS === 'web' ? 'font-sans' : '',
  serif: Platform.OS === 'web' ? 'font-serif' : '',
  mono: Platform.OS === 'web' ? 'font-mono' : '',
  display: Platform.OS === 'web' ? 'font-sans' : '',
  text: Platform.OS === 'web' ? 'font-sans' : '',
};

const letterSpacingClasses: Record<LetterSpacing, string> = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
  widest: 'tracking-widest',
};

const lineHeightClasses: Record<LineHeight, string> = {
  none: 'leading-none',
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
};

export const Text = React.forwardRef<RNText, TextProps>(({
  // Typography
  preset,
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
  
  // Accessibility
  respectSystemScale = true,
  
  // Style
  className,
  style,
  children,
  
  // Legacy spacing props (ignored)
  mt, mr, mb, ml,
  
  ...props
}, ref) => {
  const { enableAnimations } = useAnimationStore();
  const typography = useTypography();
  const systemScale = useSystemFontScale();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Always call hooks - resolve responsive values
  const responsiveSize = useResponsiveValue(typeof size === 'object' && size !== null ? size : undefined) || size;
  const responsiveWeight = useResponsiveValue(typeof weight === 'object' && weight !== null ? weight : undefined) || weight;
  const responsiveAlign = useResponsiveValue(typeof align === 'object' && align !== null ? align : undefined) || align;
  
  // Animation values - create only when needed
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const [copied, setCopied] = useState(false);
  
  // Handle legacy colorTheme prop
  const finalColor = colorTheme ? 'foreground' : color;
  
  // Compute typography properties from preset or individual props
  const typographyProps = useMemo(() => {
    if (preset) {
      const presetStyle = typography.getPresetStyle(preset);
      return {
        size: responsiveSize || (typographySystem.presets[preset].size as TypographySize),
        weight: responsiveWeight || (typographySystem.presets[preset].weight as FontWeight),
        font: font || typographySystem.presets[preset].family,
        lineHeight: lineHeight || typographySystem.presets[preset].lineHeight,
        letterSpacing: letterSpacing || typographySystem.presets[preset].letterSpacing,
        transform: transform || typographySystem.presets[preset].transform,
        decoration: decoration || typographySystem.presets[preset].decoration,
      };
    }
    return {
      size: responsiveSize || size,
      weight: responsiveWeight || weight,
      font,
      lineHeight,
      letterSpacing,
      transform,
      decoration,
    };
  }, [preset, responsiveSize, responsiveWeight, size, weight, font, lineHeight, letterSpacing, transform, decoration, typography]);
  
  // Build className
  const textClassName = cn(
    // Base styles - use computed typography props
    sizeClasses[typographyProps.size] || sizeClasses.base,
    weightClasses[typographyProps.weight] || weightClasses.normal,
    colorClasses[finalColor] || colorClasses.foreground,
    fontClasses[typographyProps.font] || fontClasses.sans,
    letterSpacingClasses[typographyProps.letterSpacing] || letterSpacingClasses.normal,
    lineHeightClasses[typographyProps.lineHeight] || lineHeightClasses.normal,
    
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
  const nativeStyle: TextStyle = useMemo(() => {
    const fontSize = typography.sizes[typographyProps.size];
    const scaledFontSize = respectSystemScale ? systemScale.scaleFont(fontSize) : fontSize;
    
    return {
      ...((responsiveAlign || align) && { textAlign: responsiveAlign || align }),
      ...(typographyProps.transform && { textTransform: typographyProps.transform }),
      ...(typographyProps.decoration && { textDecorationLine: typographyProps.decoration }),
      // Apply actual font size and weight for native
      ...(Platform.OS !== 'web' && {
        fontSize: scaledFontSize,
        fontWeight: typographySystem.fontWeights[typographyProps.weight] as TextStyle['fontWeight'],
        fontFamily: typographySystem.getFontFamily(typographyProps.font as any),
        lineHeight: typography.getLineHeight(fontSize, typographyProps.lineHeight),
        letterSpacing: typography.getLetterSpacing(fontSize, typographyProps.letterSpacing),
      }),
    };
  }, [
    typography, 
    typographyProps, 
    responsiveAlign, 
    align, 
    respectSystemScale, 
    systemScale
  ]);
  
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

// Convenience components using typography presets
export const Heading = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="h1" {...props} />
));
Heading.displayName = 'Heading';

export const Heading1 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="h1" {...props} />
));
Heading1.displayName = 'Heading1';

export const Heading2 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="h2" {...props} />
));
Heading2.displayName = 'Heading2';

export const Heading3 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="h3" {...props} />
));
Heading3.displayName = 'Heading3';

export const Heading4 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="h4" {...props} />
));
Heading4.displayName = 'Heading4';

export const Heading5 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="h5" {...props} />
));
Heading5.displayName = 'Heading5';

export const Heading6 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="h6" {...props} />
));
Heading6.displayName = 'Heading6';

// Display headings for marketing
export const Display1 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="display1" {...props} />
));
Display1.displayName = 'Display1';

export const Display2 = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="display2" {...props} />
));
Display2.displayName = 'Display2';

// Body text variants
export const BodyLarge = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="bodyLarge" {...props} />
));
BodyLarge.displayName = 'BodyLarge';

export const Body = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="body" {...props} />
));
Body.displayName = 'Body';

export const BodySmall = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="bodySmall" {...props} />
));
BodySmall.displayName = 'BodySmall';

// UI components
export const Label = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="label" {...props} />
));
Label.displayName = 'Label';

export const Caption = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="caption" color={props.color || "muted"} {...props} />
));
Caption.displayName = 'Caption';

export const Overline = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="overline" {...props} />
));
Overline.displayName = 'Overline';

// Interactive text
export const ButtonText = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="button" {...props} />
));
ButtonText.displayName = 'ButtonText';

export const ButtonLargeText = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} preset="buttonLarge" {...props} />
));
ButtonLargeText.displayName = 'ButtonLargeText';

// Legacy aliases for backward compatibility
export const Title = Heading2;
Title.displayName = 'Title';

export const Subtitle = Heading3;
Subtitle.displayName = 'Subtitle';

export const Paragraph = Body;
Paragraph.displayName = 'Paragraph';

export const TextLabel = Label;
TextLabel.displayName = 'TextLabel';

// Code components
export const Code = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text 
    ref={ref} 
    preset="code"
    className={cn('bg-muted px-1 py-0.5 rounded', props.className) as string}
    copyable
    animated
    {...props} 
  />
));
Code.displayName = 'Code';

export const CodeBlock = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text 
    ref={ref} 
    preset="codeBlock"
    className={cn('bg-muted p-3 rounded-md', props.className) as string}
    copyable
    animated
    {...props} 
  />
));
CodeBlock.displayName = 'CodeBlock';

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
      style={[animatedStyle, style] as any}
      {...props}
    />
  );
});
FadeInText.displayName = 'FadeInText';

// Link component with animations
export const TextLink = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text 
    ref={ref} 
    preset="link"
    color={props.color || "primary"}
    className={cn('underline underline-offset-2', props.className) as string}
    animateOnPress
    animated
    {...props} 
  />
));
TextLink.displayName = 'TextLink';