/**
 * Theme System exports
 */

// Provider exports
export { 
  useTheme, 
  useThemeContext, 
  EnhancedThemeProvider,
  ShadcnThemeProvider,
  type Theme 
} from './provider';

// Registry exports
export { 
  themes, 
  getTheme, 
  getThemeOptions,
  defaultTheme,
  bubblegumTheme,
  oceanTheme,
  forestTheme,
  sunsetTheme,
  type ThemeDefinition,
  type ExtendedTheme 
} from './registry';