import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { BREAKPOINTS } from '@/lib/design/responsive';

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<keyof typeof BREAKPOINTS>('xs');

  useEffect(() => {
    const updateBreakpoint = () => {
      const { width } = Dimensions.get('window');
      
      if (width >= BREAKPOINTS['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= BREAKPOINTS.xl) {
        setBreakpoint('xl');
      } else if (width >= BREAKPOINTS.lg) {
        setBreakpoint('lg');
      } else if (width >= BREAKPOINTS.md) {
        setBreakpoint('md');
      } else if (width >= BREAKPOINTS.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };

    updateBreakpoint();
    
    const subscription = Dimensions.addEventListener('change', updateBreakpoint);
    return () => subscription?.remove();
  }, []);

  return breakpoint;
}