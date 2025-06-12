import { Platform, Dimensions } from 'react-native';

// Breakpoint tokens
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Get current screen dimensions
export function getScreenDimensions() {
  return Dimensions.get('window');
}

// Get current breakpoint
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS {
  const { width } = getScreenDimensions();
  
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

// Responsive value type
export type ResponsiveValue<T> = T | {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
};

// Get responsive value based on current breakpoint
export function getResponsiveValue<T>(value: ResponsiveValue<T>): T {
  if (typeof value !== 'object' || value === null) {
    return value as T;
  }
  
  const breakpoint = getCurrentBreakpoint();
  const breakpointOrder: (keyof typeof BREAKPOINTS)[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  // Find the value for current or smaller breakpoint
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (bp in value && value[bp as keyof typeof value] !== undefined) {
      return value[bp as keyof typeof value] as T;
    }
  }
  
  // Fallback to largest defined value
  for (let i = breakpointOrder.length - 1; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (bp in value && value[bp as keyof typeof value] !== undefined) {
      return value[bp as keyof typeof value] as T;
    }
  }
  
  return value as T;
}

// Platform-specific tokens
export const PLATFORM_TOKENS = {
  // Font families
  fontFamily: Platform.select({
    ios: {
      sans: 'System',
      serif: 'Georgia',
      mono: 'Menlo',
    },
    android: {
      sans: 'Roboto',
      serif: 'serif',
      mono: 'monospace',
    },
    web: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      serif: 'Georgia, serif',
      mono: 'Menlo, Monaco, Consolas, monospace',
    },
  }),
  
  // Shadow tokens
  shadow: Platform.select({
    ios: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
    },
    android: {
      sm: { elevation: 2 },
      md: { elevation: 4 },
      lg: { elevation: 8 },
      xl: { elevation: 16 },
    },
    web: {
      sm: { boxShadow: '0 1px 2px theme.mutedForeground + "10"' },
      md: { boxShadow: '0 2px 4px theme.mutedForeground + "10"' },
      lg: { boxShadow: '0 4px 8px theme.mutedForeground + "10"' },
      xl: { boxShadow: '0 8px 16px theme.mutedForeground + "40"' },
    },
  }),
  
  // Safe area insets
  safeArea: Platform.select({
    ios: { useSafeArea: true },
    android: { useSafeArea: true },
    web: { useSafeArea: false },
  }),
} as const;

// Responsive spacing tokens
export const RESPONSIVE_SPACING = {
  container: {
    paddingX: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 32,
      xl: 40,
      '2xl': 48,
    },
    maxWidth: {
      xs: '100%',
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    },
  },
  
  grid: {
    gap: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 32,
    },
    columns: {
      xs: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      '2xl': 6,
    },
  },
  
  card: {
    padding: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 32,
    },
  },
} as const;

// Responsive typography scale
export const RESPONSIVE_TYPOGRAPHY = {
  // Heading sizes
  h1: {
    xs: { fontSize: 28, lineHeight: 36 },
    sm: { fontSize: 32, lineHeight: 40 },
    md: { fontSize: 36, lineHeight: 44 },
    lg: { fontSize: 40, lineHeight: 48 },
    xl: { fontSize: 48, lineHeight: 56 },
  },
  h2: {
    xs: { fontSize: 24, lineHeight: 32 },
    sm: { fontSize: 28, lineHeight: 36 },
    md: { fontSize: 32, lineHeight: 40 },
    lg: { fontSize: 36, lineHeight: 44 },
  },
  h3: {
    xs: { fontSize: 20, lineHeight: 28 },
    sm: { fontSize: 24, lineHeight: 32 },
    md: { fontSize: 28, lineHeight: 36 },
  },
  h4: {
    xs: { fontSize: 18, lineHeight: 24 },
    sm: { fontSize: 20, lineHeight: 28 },
    md: { fontSize: 24, lineHeight: 32 },
  },
  
  // Body sizes
  body: {
    xs: { fontSize: 14, lineHeight: 20 },
    sm: { fontSize: 16, lineHeight: 24 },
    md: { fontSize: 18, lineHeight: 28 },
  },
  
  // Small text
  small: {
    xs: { fontSize: 12, lineHeight: 16 },
    sm: { fontSize: 14, lineHeight: 20 },
  },
} as const;

// Media query helpers for web
export const mediaQuery = {
  xs: '@media (min-width: 0px)',
  sm: '@media (min-width: 640px)',
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 1024px)',
  xl: '@media (min-width: 1280px)',
  '2xl': '@media (min-width: 1536px)',
} as const;

// CSS-in-JS helper for responsive styles (web only)
export function responsiveStyle<T extends Record<string, any>>(
  styles: ResponsiveValue<T>
): T | Record<string, T> {
  if (Platform.OS !== 'web') {
    return getResponsiveValue(styles);
  }
  
  if (typeof styles !== 'object' || styles === null) {
    return styles;
  }
  
  // For web, return media query object
  const result: any = {};
  const breakpoints = Object.keys(BREAKPOINTS) as (keyof typeof BREAKPOINTS)[];
  
  breakpoints.forEach(bp => {
    if (bp in styles) {
      if (bp === 'xs') {
        Object.assign(result, styles[bp]);
      } else {
        result[mediaQuery[bp]] = styles[bp];
      }
    }
  });
  
  return result;
}