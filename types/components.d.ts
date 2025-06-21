/**
 * Common component type definitions
 */

import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';

// Spacing types
export type SpacingValue = number | string | 'auto';
export type SpacingScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;

// Common component props
export interface BaseComponentProps {
  className?: string;
  style?: ViewStyle | TextStyle | ImageStyle | any;
  children?: React.ReactNode;
  testID?: string;
}

// Layout props
export interface LayoutProps extends BaseComponentProps {
  gap?: SpacingValue;
  padding?: SpacingValue;
  margin?: SpacingValue;
  p?: SpacingValue;
  m?: SpacingValue;
  px?: SpacingValue;
  py?: SpacingValue;
  mx?: SpacingValue;
  my?: SpacingValue;
  pt?: SpacingValue;
  pr?: SpacingValue;
  pb?: SpacingValue;
  pl?: SpacingValue;
  mt?: SpacingValue;
  mr?: SpacingValue;
  mb?: SpacingValue;
  ml?: SpacingValue;
}

// Button variants
export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'error' | 'success' | 'warning' | 'glass' | 'glass-primary';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

// Badge variants
export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'error' | 'success' | 'warning';

// Avatar sizes
export type AvatarSize = 'xs' | 'sm' | 'default' | 'lg' | 'xl';

// Typography sizes
export type TypographySize = '2xs' | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
export type FontWeight = 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';

// Animation props for tests
export interface AnimationTestProps {
  animationVariant?: string;
  animationType?: string;
  loadingAnimation?: string;
  entranceAnimation?: string;
  successAnimation?: boolean;
  animationConfig?: any;
  animationDelay?: number;
  successDuration?: number;
  rippleColor?: string;
  glowIntensity?: number;
  shakeMagnitude?: number;
}

// Flex alignment types
export type FlexAlignType = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';