import { useBreakpoint } from './useBreakpoint';
import { BREAKPOINTS } from '@/lib/design/responsive';

type ResponsiveValue<T> = {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
};

export function useResponsiveValue<T>(values: ResponsiveValue<T> | undefined | null): T | undefined {
  const breakpoint = useBreakpoint();
  
  // Handle undefined or null values
  if (!values) {
    return undefined;
  }
  
  const breakpointOrder: (keyof typeof BREAKPOINTS)[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  // Start from current breakpoint and work backwards to find a value
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  // If no value found, return the first available value
  for (const bp of breakpointOrder) {
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return undefined;
}