/**
 * Contexts Barrel Export
 * Central export point for all React contexts
 */

// Theme & Styling Contexts
export {
  ColorSchemeContext,
  ColorSchemeProvider,
  useColorSchemeContext,
} from './ColorSchemeContext';

export {
  SpacingContext,
  SpacingProvider,
  useSpacing,
  SPACING_THEMES,
  type SpacingTheme,
} from './SpacingContext';

// Animation Context (re-export from lib)
export {
  AnimationProvider,
  useAnimationContext,
} from '@/lib/ui/animations/AnimationContext';

// Theme Provider (re-export from lib)
export {
  ThemeProvider,
  useTheme,
  useThemeToggle,
} from '@/lib/theme/provider';

// Type exports
export type { ColorScheme } from './ColorSchemeContext';
export type { SpacingValue } from './SpacingContext';