import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { 
  getCurrentBreakpoint, 
  getResponsiveValue, 
  ResponsiveValue,
  BREAKPOINTS 
} from '@/lib/design/responsive';

// Hook to get current breakpoint
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(getCurrentBreakpoint());
  
  useEffect(() => {
    const updateBreakpoint = ({ window }: { window: ScaledSize }) => {
      setBreakpoint(getCurrentBreakpoint());
    };
    
    const subscription = Dimensions.addEventListener('change', updateBreakpoint);
    return () => subscription?.remove();
  }, []);
  
  return breakpoint;
}

// Hook to get responsive value
export function useResponsiveValue<T>(value: ResponsiveValue<T>): T {
  const [responsiveValue, setResponsiveValue] = useState(() => getResponsiveValue(value));
  
  useEffect(() => {
    const updateValue = () => {
      setResponsiveValue(getResponsiveValue(value));
    };
    
    const subscription = Dimensions.addEventListener('change', updateValue);
    return () => subscription?.remove();
  }, [value]);
  
  return responsiveValue;
}

// Hook to check if screen matches breakpoint
export function useMediaQuery(breakpoint: keyof typeof BREAKPOINTS | number): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const checkMatch = () => {
      const { width } = Dimensions.get('window');
      const breakpointValue = typeof breakpoint === 'number' ? breakpoint : BREAKPOINTS[breakpoint];
      setMatches(width >= breakpointValue);
    };
    
    checkMatch();
    const subscription = Dimensions.addEventListener('change', checkMatch);
    return () => subscription?.remove();
  }, [breakpoint]);
  
  return matches;
}

// Hook for responsive styles
export function useResponsiveStyle<T extends Record<string, any>>(
  styles: ResponsiveValue<T>
): T {
  return useResponsiveValue(styles);
}

// Unified responsive hook that returns all responsive utilities
export function useResponsive() {
  const breakpoint = useBreakpoint();
  
  // Call all media queries at the top level to maintain hook order
  const isXs = true; // xs is always true (0px and up)
  const isSm = useMediaQuery('sm');
  const isMd = useMediaQuery('md');
  const isLg = useMediaQuery('lg');
  const isXl = useMediaQuery('xl');
  const is2xl = useMediaQuery('2xl');
  
  // Calculate device type flags based on media queries
  const isMobile = !isMd;
  const isTablet = isMd && !isLg;
  const isDesktop = isLg;
  
  const mediaQueries = {
    xs: isXs,
    sm: isSm,
    md: isMd,
    lg: isLg,
    xl: isXl,
    '2xl': is2xl,
  };
  
  return {
    // Main breakpoint flags
    isMobile,
    isTablet,
    isDesktop,
    
    // Current breakpoint
    breakpoint,
    
    // Convenience aliases
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isDesktop,
    
    // Utility functions
    isBreakpoint: (bp: keyof typeof BREAKPOINTS) => breakpoint === bp,
    isAtLeast: (bp: keyof typeof BREAKPOINTS) => mediaQueries[bp],
    isAtMost: (bp: keyof typeof BREAKPOINTS) => {
      const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
      const currentIndex = breakpoints.indexOf(breakpoint);
      const targetIndex = breakpoints.indexOf(bp);
      return currentIndex <= targetIndex;
    },
  };
}

// Utility hooks for common breakpoints (using the unified hook)
export const useIsMobile = () => useResponsive().isMobile;
export const useIsTablet = () => useResponsive().isTablet;
export const useIsDesktop = () => useResponsive().isDesktop;