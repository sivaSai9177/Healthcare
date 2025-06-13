import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { designSystem, FontSize, FontWeight, SpacingScale } from '@/lib/design';
import { useSpacing } from '@/lib/stores/spacing-store';

export interface TextProps extends RNTextProps {
  // Typography
  size?: FontSize;
  weight?: FontWeight;
  align?: TextStyle['textAlign'];
  transform?: TextStyle['textTransform'];
  decoration?: TextStyle['textDecorationLine'];
  letterSpacing?: keyof typeof designSystem.typography.letterSpacing;
  lineHeight?: keyof typeof designSystem.typography.lineHeight;
  
  // Color
  color?: string;
  colorTheme?: 'foreground' | 'mutedForeground' | 'cardForeground' | 'primaryForeground' | 'secondaryForeground' | 'destructiveForeground' | 'accentForeground' | 'primary' | 'secondary' | 'destructive' | 'accent' | 'success' | 'popoverForeground';
  
  // Spacing (for inline text)
  mt?: SpacingScale;
  mr?: SpacingScale;
  mb?: SpacingScale;
  ml?: SpacingScale;
  
  // Font family
  font?: 'regular' | 'medium' | 'semibold' | 'bold' | 'mono';
  
  // Other
  opacity?: TextStyle['opacity'];
  selectable?: boolean;
  numberOfLines?: number;
  ellipsizeMode?: RNTextProps['ellipsizeMode'];
}

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
  color,
  colorTheme = 'foreground',
  
  // Spacing
  mt,
  mr,
  mb,
  ml,
  
  // Font family
  font = 'regular',
  
  // Other
  opacity,
  selectable,
  numberOfLines,
  ellipsizeMode,
  style,
  children,
  ...props
}, ref) => {
  const theme = useTheme();
  const { spacing, typographyScale } = useSpacing();
  
  // Build style object
  const textStyle: TextStyle = {
    // Typography
    fontSize: typographyScale[size],
    fontWeight: designSystem.typography.fontWeight[weight],
    fontFamily: designSystem.typography.fontFamily[font],
    ...(align && { textAlign: align }),
    ...(transform && { textTransform: transform }),
    ...(decoration && { textDecorationLine: decoration }),
    letterSpacing: designSystem.typography.letterSpacing[letterSpacing],
    lineHeight: typographyScale[size] * designSystem.typography.lineHeight[lineHeight],
    
    // Color
    color: color || theme[colorTheme] || theme.foreground,
    
    // Spacing
    ...(mt !== undefined && { marginTop: spacing[mt] }),
    ...(mr !== undefined && { marginRight: spacing[mr] }),
    ...(mb !== undefined && { marginBottom: spacing[mb] }),
    ...(ml !== undefined && { marginLeft: spacing[ml] }),
    
    // Other
    ...(opacity !== undefined && { opacity }),
  };
  
  return (
    <RNText
      ref={ref}
      style={[textStyle, style]}
      numberOfLines={truncate ? 1 : props.numberOfLines}
      ellipsizeMode={truncate ? 'tail' : props.ellipsizeMode}
      {...props}
    >
      {children}
    </RNText>
  );
});

Text.displayName = 'Text';

// Convenience components for common text styles
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
  <Text ref={ref} size="base" weight="normal" className={cn('leading-relaxed', props.className)} {...props} />
));
Paragraph.displayName = 'Paragraph';

export const Caption = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="sm" weight="normal" variant="muted" {...props} />
));
Caption.displayName = 'Caption';

export const TextLabel = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} size="sm" weight="medium" {...props} />
));
TextLabel.displayName = 'TextLabel';

export const Code = React.forwardRef<RNText, TextProps>((props, ref) => (
  <Text ref={ref} className={cn('font-mono bg-muted px-1 py-0.5 rounded', props.className)} {...props} />
));
Code.displayName = 'Code';