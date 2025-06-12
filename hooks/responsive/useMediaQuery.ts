import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { BREAKPOINTS } from '@/lib/design/responsive';

export function useMediaQuery(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const checkMatch = () => {
      const { width } = Dimensions.get('window');
      setMatches(width >= BREAKPOINTS[breakpoint]);
    };

    checkMatch();
    
    const subscription = Dimensions.addEventListener('change', checkMatch);
    return () => subscription?.remove();
  }, [breakpoint]);

  return matches;
}

export function useIsMobile(): boolean {
  return !useMediaQuery('md');
}

export function useIsTablet(): boolean {
  const isAtLeastMd = useMediaQuery('md');
  const isAtLeastLg = useMediaQuery('lg');
  return isAtLeastMd && !isAtLeastLg;
}

export function useIsDesktop(): boolean {
  return useMediaQuery('lg');
}