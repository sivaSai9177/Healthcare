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

// Utility hooks for common breakpoints
export const useIsMobile = () => !useMediaQuery('md');
export const useIsTablet = () => useMediaQuery('md') && !useMediaQuery('lg');
export const useIsDesktop = () => useMediaQuery('lg');

// Unified responsive hook that returns all responsive utilities
export function useResponsive() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const breakpoint = useBreakpoint();
  
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
    isAtLeast: (bp: keyof typeof BREAKPOINTS) => useMediaQuery(bp),
    isAtMost: (bp: keyof typeof BREAKPOINTS) => {
      const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
      const currentIndex = breakpoints.indexOf(breakpoint);
      const targetIndex = breakpoints.indexOf(bp);
      return currentIndex <= targetIndex;
    },
  };
}