/**
 * Typography Design System
 * Density-aware typography tokens and utilities
 */

import { Platform } from 'react-native';
import { SpacingDensity } from '@/lib/design/spacing';

// Platform-specific font families
export const fontFamilies = {
  sans: Platform.select({
    ios: ['SF Pro Text', 'SF Pro Display', 'System', '-apple-system', 'sans-serif'],
    android: ['Roboto', 'System', 'sans-serif'],
    web: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
  }) || ['System', 'sans-serif'],
  
  serif: Platform.select({
    ios: ['Georgia', 'Charter', 'Times New Roman', 'serif'],
    android: ['Noto Serif', 'Droid Serif', 'Times New Roman', 'serif'],
    web: ['Georgia', 'Times New Roman', 'serif'],
  }) || ['Georgia', 'serif'],
  
  mono: Platform.select({
    ios: ['SF Mono', 'Monaco', 'Courier New', 'monospace'],
    android: ['Roboto Mono', 'Droid Sans Mono', 'Courier New', 'monospace'],
    web: ['SF Mono', 'Monaco', 'Menlo', 'Consolas', 'Courier New', 'monospace'],
  }) || ['Courier New', 'monospace'],
};

// Font weight tokens (platform-optimized)
export const fontWeights = {
  thin: Platform.select({ ios: '100', android: '100', web: 100 }) as any,
  light: Platform.select({ ios: '300', android: '300', web: 300 }) as any,
  normal: Platform.select({ ios: '400', android: '400', web: 400 }) as any,
  medium: Platform.select({ ios: '500', android: '500', web: 500 }) as any,
  semibold: Platform.select({ ios: '600', android: '600', web: 600 }) as any,
  bold: Platform.select({ ios: '700', android: '700', web: 700 }) as any,
  extrabold: Platform.select({ ios: '800', android: '800', web: 800 }) as any,
  black: Platform.select({ ios: '900', android: '900', web: 900 }) as any,
};

// Base typography scale (in pixels)
export const typographyScale = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
  '8xl': 96,
  '9xl': 128,
};

// Typography size type
export type TypographySize = keyof typeof typographyScale;

// Font weight type
export type FontWeight = keyof typeof fontWeights;

// Line height type
export type LineHeight = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';

// Letter spacing type
export type LetterSpacing = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';

// Line height multipliers by density
export const lineHeightMultipliers: Record<SpacingDensity, Record<string, number>> = {
  compact: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.375,
    relaxed: 1.5,
    loose: 1.75,
  },
  medium: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  large: {
    tight: 1.375,
    snug: 1.5,
    normal: 1.625,
    relaxed: 1.75,
    loose: 2.25,
  },
};

// Letter spacing multipliers by density (em units)
export const letterSpacingMultipliers: Record<SpacingDensity, Record<string, number>> = {
  compact: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
  medium: {
    tighter: -0.04,
    tight: -0.02,
    normal: 0,
    wide: 0.03,
    wider: 0.06,
    widest: 0.12,
  },
  large: {
    tighter: -0.03,
    tight: -0.015,
    normal: 0,
    wide: 0.04,
    wider: 0.08,
    widest: 0.15,
  },
};

// Typography presets for common use cases
export interface TypographyPreset {
  fontSize: number;
  fontWeight: string | number;
  lineHeight: number;
  letterSpacing: number;
  fontFamily?: string[];
}

export const getTypographyPresets = (density: SpacingDensity = 'medium'): Record<string, TypographyPreset> => {
  // Ensure density is defined
  const safeDensity = density || 'medium';
  
  return {
  // Display styles
  display1: {
    fontSize: typographyScale['8xl'],
    fontWeight: fontWeights.bold,
    lineHeight: typographyScale['8xl'] * lineHeightMultipliers[safeDensity].tight,
    letterSpacing: typographyScale['8xl'] * letterSpacingMultipliers[safeDensity].tight,
  },
  display2: {
    fontSize: typographyScale['7xl'],
    fontWeight: fontWeights.bold,
    lineHeight: typographyScale['7xl'] * lineHeightMultipliers[safeDensity].tight,
    letterSpacing: typographyScale['7xl'] * letterSpacingMultipliers[safeDensity].tight,
  },
  
  // Heading styles
  h1: {
    fontSize: typographyScale['5xl'],
    fontWeight: fontWeights.bold,
    lineHeight: typographyScale['5xl'] * lineHeightMultipliers[safeDensity].snug,
    letterSpacing: typographyScale['5xl'] * letterSpacingMultipliers[safeDensity].tight,
  },
  h2: {
    fontSize: typographyScale['4xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: typographyScale['4xl'] * lineHeightMultipliers[safeDensity].snug,
    letterSpacing: typographyScale['4xl'] * letterSpacingMultipliers[safeDensity].tight,
  },
  h3: {
    fontSize: typographyScale['3xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: typographyScale['3xl'] * lineHeightMultipliers[safeDensity].normal,
    letterSpacing: typographyScale['3xl'] * letterSpacingMultipliers[safeDensity].normal,
  },
  h4: {
    fontSize: typographyScale['2xl'],
    fontWeight: fontWeights.medium,
    lineHeight: typographyScale['2xl'] * lineHeightMultipliers[safeDensity].normal,
    letterSpacing: typographyScale['2xl'] * letterSpacingMultipliers[safeDensity].normal,
  },
  h5: {
    fontSize: typographyScale.xl,
    fontWeight: fontWeights.medium,
    lineHeight: typographyScale.xl * lineHeightMultipliers[safeDensity].normal,
    letterSpacing: typographyScale.xl * letterSpacingMultipliers[safeDensity].normal,
  },
  h6: {
    fontSize: typographyScale.lg,
    fontWeight: fontWeights.medium,
    lineHeight: typographyScale.lg * lineHeightMultipliers[safeDensity].normal,
    letterSpacing: typographyScale.lg * letterSpacingMultipliers[safeDensity].wide,
  },
  
  // Body text
  bodyLarge: {
    fontSize: typographyScale.lg,
    fontWeight: fontWeights.normal,
    lineHeight: typographyScale.lg * lineHeightMultipliers[safeDensity].relaxed,
    letterSpacing: typographyScale.lg * letterSpacingMultipliers[safeDensity].normal,
  },
  body: {
    fontSize: typographyScale.base,
    fontWeight: fontWeights.normal,
    lineHeight: typographyScale.base * lineHeightMultipliers[safeDensity].relaxed,
    letterSpacing: typographyScale.base * letterSpacingMultipliers[safeDensity].normal,
  },
  bodySmall: {
    fontSize: typographyScale.sm,
    fontWeight: fontWeights.normal,
    lineHeight: typographyScale.sm * lineHeightMultipliers[safeDensity].relaxed,
    letterSpacing: typographyScale.sm * letterSpacingMultipliers[safeDensity].normal,
  },
  
  // UI text
  label: {
    fontSize: typographyScale.sm,
    fontWeight: fontWeights.medium,
    lineHeight: typographyScale.sm * lineHeightMultipliers[safeDensity].normal,
    letterSpacing: typographyScale.sm * letterSpacingMultipliers[safeDensity].wide,
  },
  caption: {
    fontSize: typographyScale.xs,
    fontWeight: fontWeights.normal,
    lineHeight: typographyScale.xs * lineHeightMultipliers[safeDensity].normal,
    letterSpacing: typographyScale.xs * letterSpacingMultipliers[safeDensity].wide,
  },
  overline: {
    fontSize: typographyScale.xs,
    fontWeight: fontWeights.medium,
    lineHeight: typographyScale.xs * lineHeightMultipliers[safeDensity].loose,
    letterSpacing: typographyScale.xs * letterSpacingMultipliers[safeDensity].widest,
  },
  
  // Button text
  button: {
    fontSize: typographyScale.sm,
    fontWeight: fontWeights.medium,
    lineHeight: typographyScale.sm * lineHeightMultipliers[safeDensity].normal,
    letterSpacing: typographyScale.sm * letterSpacingMultipliers[safeDensity].wide,
  },
  buttonLarge: {
    fontSize: typographyScale.base,
    fontWeight: fontWeights.medium,
    lineHeight: typographyScale.base * lineHeightMultipliers[safeDensity].normal,
    letterSpacing: typographyScale.base * letterSpacingMultipliers[safeDensity].wide,
  },
  
  // Code
  code: {
    fontSize: typographyScale.sm,
    fontWeight: fontWeights.normal,
    lineHeight: typographyScale.sm * lineHeightMultipliers[safeDensity].normal,
    letterSpacing: typographyScale.sm * letterSpacingMultipliers[safeDensity].normal,
    fontFamily: fontFamilies.mono,
  },
  codeBlock: {
    fontSize: typographyScale.sm,
    fontWeight: fontWeights.normal,
    lineHeight: typographyScale.sm * lineHeightMultipliers[safeDensity].relaxed,
    letterSpacing: typographyScale.sm * letterSpacingMultipliers[safeDensity].normal,
    fontFamily: fontFamilies.mono,
  },
  };
};

// Helper to get computed line height
export const getLineHeight = (fontSize: number, lineHeightType: keyof typeof lineHeightMultipliers.medium, density: SpacingDensity): number => {
  const safeDensity = density || 'medium';
  return fontSize * lineHeightMultipliers[safeDensity][lineHeightType];
};

// Helper to get computed letter spacing
export const getLetterSpacing = (fontSize: number, spacingType: keyof typeof letterSpacingMultipliers.medium, density: SpacingDensity): number => {
  const safeDensity = density || 'medium';
  return fontSize * letterSpacingMultipliers[safeDensity][spacingType];
};

// Text truncation utilities
export const textTruncation = {
  singleLine: {
    numberOfLines: 1,
    ellipsizeMode: 'tail' as const,
  },
  twoLines: {
    numberOfLines: 2,
    ellipsizeMode: 'tail' as const,
  },
  threeLines: {
    numberOfLines: 3,
    ellipsizeMode: 'tail' as const,
  },
};

// Web-specific text styles
export const webTextStyles = {
  // Selection styles
  selectable: {
    userSelect: 'text',
    WebkitUserSelect: 'text',
  },
  nonSelectable: {
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  
  // Font smoothing
  smooth: {
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  
  // Text rendering
  optimizeLegibility: {
    textRendering: 'optimizeLegibility',
  },
};

// Typography preset names
export type TypographyPresetName = 
  | 'display1' | 'display2'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'bodyLarge' | 'body' | 'bodySmall'
  | 'label' | 'caption' | 'overline'
  | 'button' | 'buttonLarge'
  | 'code' | 'codeBlock'
  | 'link';

// Get font family helper
export const getFontFamily = (family: 'sans' | 'serif' | 'mono' | 'display' | 'text'): string => {
  const families = fontFamilies[family === 'display' || family === 'text' ? 'sans' : family];
  if (Array.isArray(families)) {
    return families[0];
  }
  return families;
};

// Create mapped presets for legacy compatibility
const createLegacyPresets = () => {
  const basePresets = getTypographyPresets('medium');
  const legacyPresets: Record<string, any> = {};
  
  // Map each preset to legacy format
  Object.entries(basePresets).forEach(([name, preset]) => {
    const sizeKey = Object.entries(typographyScale).find(([_, value]) => value === preset.fontSize)?.[0] || 'base';
    const weightKey = Object.entries(fontWeights).find(([_, value]) => value === preset.fontWeight)?.[0] || 'normal';
    
    legacyPresets[name] = {
      size: sizeKey as TypographySize,
      weight: weightKey as FontWeight,
      family: preset.fontFamily?.[0] || 'sans',
      lineHeight: 'normal' as LineHeight,
      letterSpacing: 'normal' as LetterSpacing,
      transform: undefined,
      decoration: undefined,
    };
  });
  
  // Add link preset
  legacyPresets.link = {
    size: 'base' as TypographySize,
    weight: 'normal' as FontWeight,
    family: 'sans',
    lineHeight: 'normal' as LineHeight,
    letterSpacing: 'normal' as LetterSpacing,
    transform: undefined,
    decoration: 'underline',
  };
  
  return legacyPresets;
};

// Typography system export
export const typographySystem = {
  // Core tokens
  fontFamilies,
  fontWeights,
  sizes: typographyScale,
  scale: typographyScale,
  
  // Presets (using medium density as default)
  presets: createLegacyPresets(),
  
  // Helpers
  getFontFamily,
  getLineHeight,
  getLetterSpacing,
  getTypographyPresets,
  
  // Web styles
  webTextStyles,
  
  // Truncation utilities
  textTruncation,
};