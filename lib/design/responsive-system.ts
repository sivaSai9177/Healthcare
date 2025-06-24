/**
 * Advanced Responsive Design System
 * Provides adaptive layouts and components for all platforms and screen sizes
 */

import { Dimensions, Platform } from 'react-native';

// Device detection
export const DevicePlatform = {
  isWeb: Platform.OS === 'web',
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isMobile: Platform.OS === 'ios' || Platform.OS === 'android',
  isDesktop: Platform.OS === 'web' && !('ontouchstart' in window || navigator.maxTouchPoints > 0),
  isTablet: Platform.OS === 'web' ? false : Dimensions.get('window').width >= 768,
  isTouchDevice: Platform.OS !== 'web' || ('ontouchstart' in window || navigator.maxTouchPoints > 0),
} as const;

// Breakpoints following industry standards
export const Breakpoints = {
  xs: 0,     // Mobile portrait
  sm: 576,   // Mobile landscape
  md: 768,   // Tablet portrait
  lg: 1024,  // Tablet landscape / Small laptop
  xl: 1280,  // Desktop
  xxl: 1536, // Large desktop
  xxxl: 1920 // Ultra-wide
} as const;

// Get current breakpoint
export const getCurrentBreakpoint = () => {
  const width = Dimensions.get('window').width;
  
  if (width >= Breakpoints.xxxl) return 'xxxl';
  if (width >= Breakpoints.xxl) return 'xxl';
  if (width >= Breakpoints.xl) return 'xl';
  if (width >= Breakpoints.lg) return 'lg';
  if (width >= Breakpoints.md) return 'md';
  if (width >= Breakpoints.sm) return 'sm';
  return 'xs';
};

// Responsive value helper
export function responsive<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  xxl?: T;
  xxxl?: T;
}): T {
  const breakpoint = getCurrentBreakpoint();
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const;
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  // Find the value for current breakpoint or fall back to smaller breakpoints
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp]!;
    }
  }
  
  // Default to first available value
  return Object.values(values)[0] as T;
}

// Spacing system
export const SpacingScale = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
} as const;

// Typography scale
export const TypographyScale = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 30, lineHeight: 36 },
  '4xl': { fontSize: 36, lineHeight: 40 },
  '5xl': { fontSize: 48, lineHeight: 48 },
  '6xl': { fontSize: 60, lineHeight: 60 },
  '7xl': { fontSize: 72, lineHeight: 72 },
  '8xl': { fontSize: 96, lineHeight: 96 },
  '9xl': { fontSize: 128, lineHeight: 128 },
} as const;

// Responsive typography
export const getResponsiveFontSize = (size: keyof typeof TypographyScale) => {
  const baseSize = TypographyScale[size];
  
  return responsive({
    xs: baseSize,
    sm: baseSize,
    md: {
      fontSize: baseSize.fontSize * 1.05,
      lineHeight: baseSize.lineHeight * 1.05,
    },
    lg: {
      fontSize: baseSize.fontSize * 1.1,
      lineHeight: baseSize.lineHeight * 1.1,
    },
    xl: {
      fontSize: baseSize.fontSize * 1.15,
      lineHeight: baseSize.lineHeight * 1.15,
    },
  });
};

// Container widths
export const ContainerWidths = {
  xs: '100%',
  sm: 540,
  md: 720,
  lg: 960,
  xl: 1140,
  xxl: 1320,
  xxxl: 1536,
} as const;

// Grid system
export const GridSystem = {
  columns: 12,
  gutterWidth: responsive({
    xs: 16,
    sm: 16,
    md: 24,
    lg: 24,
    xl: 32,
    xxl: 32,
  }),
  containerPadding: responsive({
    xs: 16,
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
    xxl: 80,
  }),
};

// Shadow system
export const ShadowScale = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 16,
  },
  '3xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 24,
  },
};

// Border radius scale
export const BorderRadiusScale = {
  none: 0,
  sm: 2,
  base: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
} as const;

// Animation durations
export const AnimationDurations = {
  instant: 0,
  fast: 150,
  base: 250,
  slow: 350,
  slower: 500,
  slowest: 750,
} as const;

// Z-index scale
export const ZIndexScale = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  notification: 1700,
} as const;

// Responsive helpers
export const ResponsiveHelpers = {
  // Hide/show based on breakpoint
  hideOn: (breakpoint: keyof typeof Breakpoints) => ({
    display: getCurrentBreakpoint() === breakpoint ? 'none' : 'flex',
  }),
  
  showOn: (breakpoint: keyof typeof Breakpoints) => ({
    display: getCurrentBreakpoint() === breakpoint ? 'flex' : 'none',
  }),
  
  // Responsive padding
  padding: (values: Parameters<typeof responsive>[0]) => ({
    padding: responsive(values),
  }),
  
  // Responsive margin
  margin: (values: Parameters<typeof responsive>[0]) => ({
    margin: responsive(values),
  }),
  
  // Responsive width
  width: (values: Parameters<typeof responsive>[0]) => ({
    width: responsive(values),
  }),
  
  // Responsive height
  height: (values: Parameters<typeof responsive>[0]) => ({
    height: responsive(values),
  }),
};

// Platform-specific styles
export const PlatformStyles = {
  // Safe area handling
  safeArea: {
    ios: {
      paddingTop: 44, // Status bar
      paddingBottom: 34, // Home indicator
    },
    android: {
      paddingTop: 24, // Status bar
      paddingBottom: 0,
    },
    web: {
      paddingTop: 0,
      paddingBottom: 0,
    },
  },
  
  // Scroll behavior
  scroll: {
    ios: {
      bounces: true,
      showsVerticalScrollIndicator: false,
    },
    android: {
      overScrollMode: 'never',
      showsVerticalScrollIndicator: true,
    },
    web: {
      scrollbarWidth: 'thin',
      overflowY: 'auto',
    },
  },
  
  // Touch feedback
  touchFeedback: {
    ios: {
      activeOpacity: 0.7,
    },
    android: {
      android_ripple: {
        color: 'rgba(0, 0, 0, 0.1)',
        borderless: false,
      },
    },
    web: {
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'all 0.2s ease',
    },
  },
};

// Adaptive layouts
export const AdaptiveLayouts = {
  // Stack on mobile, row on desktop
  stackToRow: responsive({
    xs: { flexDirection: 'column' as const },
    md: { flexDirection: 'row' as const },
  }),
  
  // Full width on mobile, constrained on desktop
  containerWidth: responsive({
    xs: '100%',
    sm: '100%',
    md: ContainerWidths.md,
    lg: ContainerWidths.lg,
    xl: ContainerWidths.xl,
    xxl: ContainerWidths.xxl,
  }),
  
  // Responsive grid columns
  gridColumns: responsive({
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4,
    xxl: 5,
  }),
  
  // Sidebar layout
  sidebarLayout: responsive({
    xs: {
      sidebar: { display: 'none' },
      main: { width: '100%' },
    },
    lg: {
      sidebar: { width: 280, display: 'flex' },
      main: { flex: 1, marginLeft: 280 },
    },
  }),
};

// Export everything
export default {
  DevicePlatform,
  Breakpoints,
  getCurrentBreakpoint,
  responsive,
  SpacingScale,
  TypographyScale,
  getResponsiveFontSize,
  ContainerWidths,
  GridSystem,
  ShadowScale,
  BorderRadiusScale,
  AnimationDurations,
  ZIndexScale,
  ResponsiveHelpers,
  PlatformStyles,
  AdaptiveLayouts,
};