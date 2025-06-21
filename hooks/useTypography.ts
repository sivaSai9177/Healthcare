/**
 * Typography Hooks
 * Provides access to density-aware typography system
 */

import { useMemo } from 'react';
import { Platform, PixelRatio, useWindowDimensions } from 'react-native';
import { useSpacing } from '@/lib/stores/spacing-store';
import { 
  typographyScale, 
  getTypographyPresets, 
  fontFamilies,
  fontWeights,
  getLineHeight,
  getLetterSpacing,
  TypographyPreset
} from '@/lib/design/typography';

// Typography tokens based on current density
export const useTypography = () => {
  const { density } = useSpacing();
  
  const presets = useMemo(() => getTypographyPresets(density), [density]);
  
  // Get preset style helper
  const getPresetStyle = (presetName: keyof ReturnType<typeof getTypographyPresets>) => {
    const preset = presets[presetName];
    if (!preset) {
      console.warn(`Typography preset "${presetName}" not found`);
      return presets.body;
    }
    return preset;
  };
  
  return {
    scale: typographyScale,
    sizes: typographyScale, // Alias for compatibility
    presets,
    fontFamilies,
    fontWeights,
    density,
    // Helper functions
    getPresetStyle,
    getLineHeight: (fontSize: number, type: 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose' = 'normal') => 
      getLineHeight(fontSize, type, density),
    getLetterSpacing: (fontSize: number, type: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest' = 'normal') => 
      getLetterSpacing(fontSize, type, density),
  };
};

// Responsive typography hook
export const useResponsiveTypography = () => {
  const dimensions = useWindowDimensions();
  const { density } = useSpacing();
  
  const getResponsiveSize = useMemo(() => {
    return (base: number, tablet?: number, desktop?: number) => {
      if (Platform.OS !== 'web') return base;
      
      // Breakpoints
      const isTablet = dimensions.width >= 768;
      const isDesktop = dimensions.width >= 1024;
      
      if (isDesktop && desktop) return desktop;
      if (isTablet && tablet) return tablet;
      return base;
    };
  }, [dimensions.width]);
  
  const getFluidSize = useMemo(() => {
    return (minSize: number, maxSize: number, minWidth: number = 320, maxWidth: number = 1200) => {
      if (Platform.OS !== 'web') return minSize;
      
      const width = dimensions.width;
      const scale = (width - minWidth) / (maxWidth - minWidth);
      const clampedScale = Math.max(0, Math.min(1, scale));
      
      return minSize + (maxSize - minSize) * clampedScale;
    };
  }, [dimensions.width]);
  
  return {
    getResponsiveSize,
    getFluidSize,
    isTablet: dimensions.width >= 768,
    isDesktop: dimensions.width >= 1024,
  };
};

// System font scale hook (for accessibility)
export const useSystemFontScale = () => {
  const fontScale = PixelRatio.getFontScale();
  
  const scaleFont = useMemo(() => {
    return (size: number, respectSystemScale: boolean = true) => {
      if (!respectSystemScale || Platform.OS === 'web') return size;
      return size * fontScale;
    };
  }, [fontScale]);
  
  return {
    fontScale,
    scaleFont,
    isLargeText: fontScale > 1.2,
    isExtraLargeText: fontScale > 1.5,
  };
};

// Combined typography system hook
export const useTypographySystem = () => {
  const typography = useTypography();
  const responsive = useResponsiveTypography();
  const systemScale = useSystemFontScale();
  
  // Get a preset with responsive and system scaling
  const getPreset = useMemo(() => {
    return (
      presetName: keyof ReturnType<typeof getTypographyPresets>,
      options?: {
        responsive?: { tablet?: number; desktop?: number };
        respectSystemScale?: boolean;
      }
    ): TypographyPreset => {
      const preset = typography.presets[presetName];
      if (!preset) {
        console.warn(`Typography preset "${presetName}" not found`);
        return typography.presets.body;
      }
      
      let fontSize = preset.fontSize;
      
      // Apply responsive sizing
      if (options?.responsive) {
        fontSize = responsive.getResponsiveSize(
          fontSize,
          options.responsive.tablet,
          options.responsive.desktop
        );
      }
      
      // Apply system scaling
      if (options?.respectSystemScale !== false) {
        fontSize = systemScale.scaleFont(fontSize);
      }
      
      // Recalculate line height and letter spacing based on new size
      return {
        ...preset,
        fontSize,
        lineHeight: typography.getLineHeight(fontSize, 'normal'),
        letterSpacing: typography.getLetterSpacing(fontSize, 'normal'),
      };
    };
  }, [typography, responsive, systemScale]);
  
  return {
    ...typography,
    ...responsive,
    ...systemScale,
    getPreset,
  };
};