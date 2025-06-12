import { 
  getResponsiveValue, 
  RESPONSIVE_SPACING, 
  RESPONSIVE_TYPOGRAPHY, 
  PLATFORM_TOKENS,
  ResponsiveValue,
  responsiveStyle,
} from '@/lib/design/responsive';
import { Platform } from 'react-native';

/**
 * Hook for accessing responsive design utilities
 * Provides responsive values, spacing, typography, and platform tokens
 */
export function useResponsiveUtils() {
  return {
    // Get responsive value for current breakpoint
    getResponsiveValue,
    
    // Responsive spacing tokens
    responsiveSpacing: RESPONSIVE_SPACING,
    
    // Responsive typography tokens
    responsiveTypography: RESPONSIVE_TYPOGRAPHY,
    
    // Platform-specific tokens (shadows, fonts, etc.)
    platformTokens: PLATFORM_TOKENS,
    
    // Helper to get platform-specific shadow
    getPlatformShadow: (size: 'sm' | 'md' | 'lg' | 'xl') => {
      return Platform.select({
        ios: PLATFORM_TOKENS.shadow?.ios?.[size],
        android: PLATFORM_TOKENS.shadow?.android?.[size],
        web: PLATFORM_TOKENS.shadow?.web?.[size],
        default: {},
      });
    },
    
    // Helper for responsive styles (web CSS-in-JS)
    responsiveStyle,
    
    // Type helper for responsive props
    makeResponsive: <T>(value: T | ResponsiveValue<T>): ResponsiveValue<T> => {
      if (typeof value === 'object' && value !== null && ('xs' in value || 'sm' in value || 'md' in value)) {
        return value as ResponsiveValue<T>;
      }
      return value as T;
    },
  };
}