// @ts-nocheck
import React from 'react';
import { create, act } from 'react-test-renderer';
import { Platform, PixelRatio } from 'react-native';
import { useSpacing } from '@/lib/stores/spacing-store';
import {
  useTypography,
  useResponsiveTypography,
  useSystemFontScale,
  useTypographySystem,
} from '@/hooks/useTypography';

// Mock dependencies
jest.mock('@/lib/stores/spacing-store');
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  default: jest.fn(() => ({ width: 375, height: 812 })),
}));

// Helper to test hooks
function renderHook<T>(hook: () => T) {
  let result: { current: T } = {} as any;
  
  function TestComponent() {
    const hookResult = hook();
    result.current = hookResult;
    return null;
  }
  
  let root;
  act(() => {
    root = create(React.createElement(TestComponent));
  });
  
  return { result };
}

describe('useTypography hooks', () => {
  const mockUseSpacing = useSpacing as jest.MockedFunction<typeof useSpacing>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSpacing.mockReturnValue({
      density: 'medium' as const,
      setDensity: jest.fn(),
      spacing: {},
      componentSpacing: {},
      typographyScale: {},
      componentSizes: {},
      getSpacingValue: jest.fn(),
    });
  });

  describe('useTypography', () => {
    it('returns typography system with current density', () => {
      const { result } = renderHook(() => useTypography());
      
      expect(result.current).toHaveProperty('scale');
      expect(result.current).toHaveProperty('sizes');
      expect(result.current).toHaveProperty('presets');
      expect(result.current).toHaveProperty('fontFamilies');
      expect(result.current).toHaveProperty('fontWeights');
      expect(result.current.density).toBe('medium');
    });

    it('updates presets when density changes', () => {
      const { result } = renderHook(() => useTypography());
      
      const comfortableH1 = result.current.presets.h1;
      
      // Change density
      mockUseSpacing.mockReturnValue({
        density: 'compact' as const,
        setDensity: jest.fn(),
        spacing: {},
        componentSpacing: {},
        typographyScale: {},
        componentSizes: {},
        getSpacingValue: jest.fn(),
      });
      
      const { result: newResult } = renderHook(() => useTypography());
      
      const compactH1 = newResult.current.presets.h1;
      
      // Font sizes stay the same, but line height and letter spacing change
      expect(compactH1.fontSize).toBe(comfortableH1.fontSize);
      expect(compactH1.lineHeight).toBeLessThan(comfortableH1.lineHeight);
      expect(compactH1.letterSpacing).toBeLessThan(comfortableH1.letterSpacing);
    });

    it('returns correct preset styles', () => {
      const { result } = renderHook(() => useTypography());
      
      const h1Style = result.current.getPresetStyle('h1');
      expect(h1Style).toHaveProperty('fontSize');
      expect(h1Style).toHaveProperty('fontWeight');
      expect(h1Style).toHaveProperty('lineHeight');
      expect(h1Style).toHaveProperty('letterSpacing');
    });

    it('warns and returns default for invalid preset', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { result } = renderHook(() => useTypography());
      
      const invalidStyle = result.current.getPresetStyle('invalid' as any);
      
      expect(consoleSpy).toHaveBeenCalledWith('Typography preset "invalid" not found');
      expect(invalidStyle).toEqual(result.current.presets.body);
      
      consoleSpy.mockRestore();
    });

    it('calculates line height based on density', () => {
      const { result } = renderHook(() => useTypography());
      
      const tightLineHeight = result.current.getLineHeight(16, 'tight');
      const normalLineHeight = result.current.getLineHeight(16, 'normal');
      const looseLineHeight = result.current.getLineHeight(16, 'loose');
      
      expect(tightLineHeight).toBeLessThan(normalLineHeight);
      expect(normalLineHeight).toBeLessThan(looseLineHeight);
    });

    it('calculates letter spacing based on density', () => {
      const { result } = renderHook(() => useTypography());
      
      const tightSpacing = result.current.getLetterSpacing(16, 'tight');
      const normalSpacing = result.current.getLetterSpacing(16, 'normal');
      const wideSpacing = result.current.getLetterSpacing(16, 'wide');
      
      expect(tightSpacing).toBeLessThan(normalSpacing);
      expect(normalSpacing).toBeLessThan(wideSpacing);
    });
  });

  describe('useResponsiveTypography', () => {
    it('returns base size on mobile platforms', () => {
      Platform.OS = 'ios' as any;
      const { result } = renderHook(() => useResponsiveTypography());
      
      const size = result.current.getResponsiveSize(16, 18, 20);
      expect(size).toBe(16);
    });

    it('returns responsive sizes on web platform', () => {
      const originalOS = Platform.OS;
      Platform.OS = 'web' as any;
      
      try {
        // Mobile size
        const mockDimensions = require('react-native/Libraries/Utilities/useWindowDimensions').default;
        mockDimensions.mockReturnValue({ width: 320, height: 640 });
        const { result: mobileResult } = renderHook(() => useResponsiveTypography());
        expect(mobileResult.current.getResponsiveSize(16, 18, 20)).toBe(16);
        expect(mobileResult.current.isTablet).toBe(false);
        expect(mobileResult.current.isDesktop).toBe(false);
        
        // Tablet size
        mockDimensions.mockReturnValue({ width: 768, height: 1024 });
        const { result: tabletResult } = renderHook(() => useResponsiveTypography());
        expect(tabletResult.current.getResponsiveSize(16, 18, 20)).toBe(18);
        expect(tabletResult.current.isTablet).toBe(true);
        expect(tabletResult.current.isDesktop).toBe(false);
        
        // Desktop size
        mockDimensions.mockReturnValue({ width: 1024, height: 768 });
        const { result: desktopResult } = renderHook(() => useResponsiveTypography());
        expect(desktopResult.current.getResponsiveSize(16, 18, 20)).toBe(20);
        expect(desktopResult.current.isTablet).toBe(true);
        expect(desktopResult.current.isDesktop).toBe(true);
      } finally {
        Platform.OS = originalOS;
      }
    });

    it('calculates fluid sizes correctly', () => {
      const originalOS = Platform.OS;
      Platform.OS = 'web' as any;
      
      try {
        const mockDimensions = require('react-native/Libraries/Utilities/useWindowDimensions').default;
        
        // Minimum width
        mockDimensions.mockReturnValue({ width: 320, height: 640 });
        const { result: minResult } = renderHook(() => useResponsiveTypography());
        expect(minResult.current.getFluidSize(16, 24)).toBe(16);
        
        // Maximum width
        mockDimensions.mockReturnValue({ width: 1200, height: 800 });
        const { result: maxResult } = renderHook(() => useResponsiveTypography());
        expect(maxResult.current.getFluidSize(16, 24)).toBe(24);
        
        // Mid width
        mockDimensions.mockReturnValue({ width: 760, height: 800 });
        const { result: midResult } = renderHook(() => useResponsiveTypography());
        const midSize = midResult.current.getFluidSize(16, 24);
        expect(midSize).toBeGreaterThan(16);
        expect(midSize).toBeLessThan(24);
      } finally {
        Platform.OS = originalOS;
      }
    });

    it('returns min size for mobile platforms', () => {
      Platform.OS = 'ios' as any;
      const { result } = renderHook(() => useResponsiveTypography());
      
      const fluidSize = result.current.getFluidSize(16, 24);
      expect(fluidSize).toBe(16);
    });
  });

  describe('useSystemFontScale', () => {
    it('returns system font scale', () => {
      jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.2);
      const { result } = renderHook(() => useSystemFontScale());
      
      expect(result.current.fontScale).toBe(1.2);
      expect(result.current.isLargeText).toBe(false);
      expect(result.current.isExtraLargeText).toBe(false);
    });

    it('detects large text settings', () => {
      jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.3);
      const { result } = renderHook(() => useSystemFontScale());
      
      expect(result.current.isLargeText).toBe(true);
      expect(result.current.isExtraLargeText).toBe(false);
    });

    it('detects extra large text settings', () => {
      jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.6);
      const { result } = renderHook(() => useSystemFontScale());
      
      expect(result.current.isLargeText).toBe(true);
      expect(result.current.isExtraLargeText).toBe(true);
    });

    it('scales font based on system settings', () => {
      jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.5);
      const { result } = renderHook(() => useSystemFontScale());
      
      expect(result.current.scaleFont(16)).toBe(24); // 16 * 1.5
      expect(result.current.scaleFont(16, false)).toBe(16); // Don't respect system scale
    });

    it('does not scale fonts on web', () => {
      Platform.OS = 'web' as any;
      jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.5);
      const { result } = renderHook(() => useSystemFontScale());
      
      expect(result.current.scaleFont(16)).toBe(16);
    });
  });

  describe('useTypographySystem', () => {
    beforeEach(() => {
      Platform.OS = 'ios' as any;
      jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1);
      jest.mocked(require('react-native/Libraries/Utilities/useWindowDimensions').default).mockReturnValue({ width: 375, height: 812 });
    });

    it('combines all typography hooks', () => {
      const { result } = renderHook(() => useTypographySystem());
      
      // Has all properties from individual hooks
      expect(result.current).toHaveProperty('scale');
      expect(result.current).toHaveProperty('presets');
      expect(result.current).toHaveProperty('fontFamilies');
      expect(result.current).toHaveProperty('getResponsiveSize');
      expect(result.current).toHaveProperty('getFluidSize');
      expect(result.current).toHaveProperty('fontScale');
      expect(result.current).toHaveProperty('scaleFont');
      expect(result.current).toHaveProperty('getPreset');
    });

    it('gets preset with default options', () => {
      const { result } = renderHook(() => useTypographySystem());
      
      const h1Preset = result.current.getPreset('h1');
      
      expect(h1Preset).toHaveProperty('fontSize');
      expect(h1Preset).toHaveProperty('fontWeight');
      expect(h1Preset).toHaveProperty('lineHeight');
      expect(h1Preset).toHaveProperty('letterSpacing');
    });

    it('applies responsive sizing to presets on web', () => {
      const originalOS = Platform.OS;
      Platform.OS = 'web' as any;
      
      try {
        jest.mocked(require('react-native/Libraries/Utilities/useWindowDimensions').default).mockReturnValue({ width: 1024, height: 768 });
        
        const { result } = renderHook(() => useTypographySystem());
        
        const h1Base = result.current.getPreset('h1');
        const h1Responsive = result.current.getPreset('h1', {
          responsive: { tablet: 36, desktop: 48 }
        });
        
        expect(h1Responsive.fontSize).toBe(48); // Desktop size
        expect(h1Base.fontSize).toBe(48); // Base h1 is also 48 (5xl)
      } finally {
        Platform.OS = originalOS;
      }
    });

    it('applies system font scaling', () => {
      jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.5);
      
      const { result } = renderHook(() => useTypographySystem());
      
      const h1Normal = result.current.getPreset('h1', { respectSystemScale: false });
      const h1Scaled = result.current.getPreset('h1', { respectSystemScale: true });
      
      expect(h1Scaled.fontSize).toBe(h1Normal.fontSize * 1.5);
    });

    it('combines responsive and system scaling', () => {
      const originalOS = Platform.OS;
      Platform.OS = 'web' as any;
      
      try {
        jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.2);
        jest.mocked(require('react-native/Libraries/Utilities/useWindowDimensions').default).mockReturnValue({ width: 768, height: 1024 });
        
        const { result } = renderHook(() => useTypographySystem());
        
        const preset = result.current.getPreset('body', {
          responsive: { tablet: 18, desktop: 20 },
          respectSystemScale: true,
        });
        
        // Should apply tablet size (18) but not system scale on web
        expect(preset.fontSize).toBe(18);
      } finally {
        Platform.OS = originalOS;
      }
    });

    it('handles invalid preset names', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { result } = renderHook(() => useTypographySystem());
      
      const invalidPreset = result.current.getPreset('invalid' as any);
      
      expect(consoleSpy).toHaveBeenCalledWith('Typography preset "invalid" not found');
      expect(invalidPreset).toMatchObject(result.current.presets.body);
      
      consoleSpy.mockRestore();
    });
  });
});