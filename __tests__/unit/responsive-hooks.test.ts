import { renderHook } from '@testing-library/react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { useResponsiveUtils } from '@/hooks/responsive/useResponsiveUtils';
import { Dimensions } from 'react-native';

// Mock react-native-responsive-screen
jest.mock('react-native-responsive-screen', () => ({
  widthPercentageToDP: jest.fn((width: string) => parseFloat(width)),
  heightPercentageToDP: jest.fn((height: string) => parseFloat(height)),
  moderateScale: jest.fn((size: number) => size),
  moderateVerticalScale: jest.fn((size: number) => size),
}));

describe('Responsive Hooks', () => {
  describe('useResponsive', () => {
    it('should return correct values for mobile viewport', () => {
      // Mock mobile dimensions
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 375,
        height: 812,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.breakpoint).toBe('xs');
    });

    it('should return correct values for tablet viewport', () => {
      // Mock tablet dimensions
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 768,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.breakpoint).toBe('md');
    });

    it('should return correct values for desktop viewport', () => {
      // Mock desktop dimensions
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 1920,
        height: 1080,
        scale: 1,
        fontScale: 1,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.breakpoint).toBe('2xl');
    });
  });

  describe('useResponsiveUtils', () => {
    it('should provide responsive utilities', () => {
      const { result } = renderHook(() => useResponsiveUtils());

      expect(result.current).toHaveProperty('getResponsiveValue');
      expect(result.current).toHaveProperty('responsiveSpacing');
      expect(result.current).toHaveProperty('responsiveTypography');
      expect(result.current).toHaveProperty('platformTokens');
      expect(result.current).toHaveProperty('getPlatformShadow');
    });

    it('should return correct responsive values', () => {
      const { result } = renderHook(() => useResponsiveUtils());

      // Test getResponsiveValue
      const responsiveValue = result.current.getResponsiveValue({
        xs: 12,
        sm: 16,
        md: 20,
        lg: 24,
      }, 'md');

      expect(responsiveValue).toBe(20);
    });

    it('should return platform-specific shadows', () => {
      const { result } = renderHook(() => useResponsiveUtils());

      const shadow = result.current.getPlatformShadow('md');
      expect(shadow).toBeDefined();
    });
  });
});