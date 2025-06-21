import { Platform, Dimensions } from 'react-native';
import { SpacingScale, spacingScales } from './spacing';

// Breakpoint definitions for responsive design
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
  ultrawide: 1920,
} as const;

// Screen size categories
export type ScreenSize = 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide';

// Content width constraints for readability
export const MAX_CONTENT_WIDTH = {
  mobile: '100%',
  tablet: 768,
  desktop: 1024,
  wide: 1200,
  ultrawide: 1440,
  article: 720, // Optimal reading width
  form: 640,     // Form content width
} as const;

// Container padding scales based on screen size
export const CONTAINER_PADDING: Record<ScreenSize, SpacingScale> = {
  mobile: 4,    // 16px
  tablet: 6,    // 24px
  desktop: 8,   // 32px
  wide: 10,     // 40px
  ultrawide: 12 // 48px
};

// Grid gaps for different screen sizes
export const GRID_GAPS: Record<ScreenSize, SpacingScale> = {
  mobile: 3,    // 12px
  tablet: 4,    // 16px
  desktop: 6,   // 24px
  wide: 8,      // 32px
  ultrawide: 10 // 40px
};

// Component spacing multipliers
export const SPACING_MULTIPLIERS = {
  mobile: 1,
  tablet: 1.2,
  desktop: 1.5,
  wide: 1.8,
  ultrawide: 2,
} as const;

/**
 * Get current screen size category
 */
export function getScreenSize(): ScreenSize {
  const { width } = Dimensions.get('window');
  
  if (width >= BREAKPOINTS.ultrawide) return 'ultrawide';
  if (width >= BREAKPOINTS.wide) return 'wide';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

/**
 * Get responsive spacing value
 */
export function getResponsiveSpacing(
  baseScale: SpacingScale,
  screenSize?: ScreenSize
): number {
  const size = screenSize || getScreenSize();
  const multiplier = SPACING_MULTIPLIERS[size];
  return spacingScales.medium[baseScale] * multiplier;
}

/**
 * Get container padding for current screen size
 */
export function getContainerPadding(screenSize?: ScreenSize): number {
  const size = screenSize || getScreenSize();
  const paddingScale = CONTAINER_PADDING[size];
  return spacingScales.medium[paddingScale];
}

/**
 * Get max content width for current screen size
 */
export function getMaxContentWidth(
  variant: keyof typeof MAX_CONTENT_WIDTH = 'desktop'
): number | string {
  const screenSize = getScreenSize();
  
  // On mobile, always use 100%
  if (screenSize === 'mobile') {
    return '100%';
  }
  
  const maxWidth = MAX_CONTENT_WIDTH[variant];
  return typeof maxWidth === 'string' ? maxWidth : maxWidth;
}

/**
 * Responsive spacing configuration
 */
export interface ResponsiveSpacingConfig {
  mobile?: SpacingScale;
  tablet?: SpacingScale;
  desktop?: SpacingScale;
  wide?: SpacingScale;
  ultrawide?: SpacingScale;
}

/**
 * Get responsive spacing based on screen size
 */
export function useResponsiveSpacing(config: ResponsiveSpacingConfig): number {
  const screenSize = getScreenSize();
  const scale = config[screenSize] || config.mobile || 4;
  return spacingScales.medium[scale];
}

/**
 * Layout utilities for large screens
 */
export const largeScreenStyles = {
  // Center content with max width
  centerContent: (maxWidth: number = MAX_CONTENT_WIDTH.wide) => ({
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto' as const,
  }),
  
  // Add responsive padding
  responsivePadding: (screenSize?: ScreenSize) => ({
    paddingHorizontal: getContainerPadding(screenSize),
  }),
  
  // Grid container for widgets
  widgetGrid: (screenSize?: ScreenSize) => {
    const size = screenSize || getScreenSize();
    const gap = spacingScales.medium[GRID_GAPS[size]];
    
    return {
      display: 'grid' as const,
      gridTemplateColumns: {
        mobile: '1fr',
        tablet: 'repeat(2, 1fr)',
        desktop: 'repeat(3, 1fr)',
        wide: 'repeat(4, 1fr)',
        ultrawide: 'repeat(5, 1fr)',
      }[size],
      gap,
    };
  },
  
  // Sidebar layout
  sidebarLayout: {
    display: 'flex' as const,
    flexDirection: 'row' as const,
    height: '100%',
  },
  
  // Main content area next to sidebar
  mainContent: (sidebarWidth: number = 280) => ({
    flex: 1,
    marginLeft: Platform.OS === 'web' ? sidebarWidth : 0,
    overflow: 'auto' as const,
  }),
};

/**
 * Responsive font size multipliers
 */
export const FONT_SIZE_MULTIPLIERS: Record<ScreenSize, number> = {
  mobile: 1,
  tablet: 1.05,
  desktop: 1.1,
  wide: 1.15,
  ultrawide: 1.2,
};

/**
 * Get responsive font size
 */
export function getResponsiveFontSize(baseSize: number, screenSize?: ScreenSize): number {
  const size = screenSize || getScreenSize();
  return Math.round(baseSize * FONT_SIZE_MULTIPLIERS[size]);
}