import { Platform } from 'react-native';
import {
  fontFamilies,
  fontWeights,
  typographyScale,
  getTypographyPresets,
  getLineHeight,
  getLetterSpacing,
  getFontFamily,
  webTextStyles,
  textTruncation,
  typographySystem,
  lineHeightMultipliers,
  letterSpacingMultipliers,
} from '@/lib/design/typography';

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
}));

const mockPlatform = Platform as jest.Mocked<typeof Platform>;

describe('Typography System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatform.OS = 'ios';
    (mockPlatform.select as jest.Mock).mockImplementation((obj) => obj.ios || obj.default);
  });

  describe('fontFamilies', () => {
    it('should return iOS font families on iOS', () => {
      mockPlatform.OS = 'ios';
      (mockPlatform.select as jest.Mock).mockImplementation((obj) => obj.ios);
      
      expect(fontFamilies.sans).toEqual(['SF Pro Text', 'SF Pro Display', 'System', '-apple-system', 'sans-serif']);
      expect(fontFamilies.serif).toEqual(['Georgia', 'Charter', 'Times New Roman', 'serif']);
      expect(fontFamilies.mono).toEqual(['SF Mono', 'Monaco', 'Courier New', 'monospace']);
    });

    it('should return Android font families on Android', () => {
      mockPlatform.OS = 'android';
      (mockPlatform.select as jest.Mock).mockImplementation((obj) => obj.android);
      
      expect(fontFamilies.sans).toEqual(['Roboto', 'System', 'sans-serif']);
      expect(fontFamilies.serif).toEqual(['Noto Serif', 'Droid Serif', 'Times New Roman', 'serif']);
      expect(fontFamilies.mono).toEqual(['Roboto Mono', 'Droid Sans Mono', 'Courier New', 'monospace']);
    });

    it('should return web font families on web', () => {
      mockPlatform.OS = 'web';
      (mockPlatform.select as jest.Mock).mockImplementation((obj) => obj.web);
      
      expect(fontFamilies.sans).toContain('system-ui');
      expect(fontFamilies.sans).toContain('-apple-system');
      expect(fontFamilies.sans).toContain('BlinkMacSystemFont');
    });

    it('should fallback to default fonts when platform select returns undefined', () => {
      (mockPlatform.select as jest.Mock).mockReturnValue(undefined);
      
      expect(fontFamilies.sans).toEqual(['System', 'sans-serif']);
      expect(fontFamilies.serif).toEqual(['Georgia', 'serif']);
      expect(fontFamilies.mono).toEqual(['Courier New', 'monospace']);
    });
  });

  describe('fontWeights', () => {
    it('should return platform-specific font weights', () => {
      // iOS
      mockPlatform.OS = 'ios';
      (mockPlatform.select as jest.Mock).mockImplementation((obj) => obj.ios);
      expect(fontWeights.normal).toBe('400');
      expect(fontWeights.bold).toBe('700');
      
      // Android
      mockPlatform.OS = 'android';
      (mockPlatform.select as jest.Mock).mockImplementation((obj) => obj.android);
      expect(fontWeights.normal).toBe('400');
      expect(fontWeights.bold).toBe('700');
      
      // Web
      mockPlatform.OS = 'web';
      (mockPlatform.select as jest.Mock).mockImplementation((obj) => obj.web);
      expect(fontWeights.normal).toBe(400);
      expect(fontWeights.bold).toBe(700);
    });

    it('should have all weight variations', () => {
      const expectedWeights = ['thin', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'];
      expectedWeights.forEach(weight => {
        expect(fontWeights).toHaveProperty(weight);
      });
    });
  });

  describe('typographyScale', () => {
    it('should have all size variations', () => {
      const expectedSizes = ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];
      expectedSizes.forEach(size => {
        expect(typographyScale).toHaveProperty(size);
        expect(typeof typographyScale[size]).toBe('number');
      });
    });

    it('should have increasing size values', () => {
      expect(typographyScale['2xs']).toBeLessThan(typographyScale.xs);
      expect(typographyScale.xs).toBeLessThan(typographyScale.sm);
      expect(typographyScale.sm).toBeLessThan(typographyScale.base);
      expect(typographyScale.base).toBeLessThan(typographyScale.lg);
      expect(typographyScale['8xl']).toBeLessThan(typographyScale['9xl']);
    });
  });

  describe('getTypographyPresets', () => {
    it('should return presets for all densities', () => {
      const densities = ['compact', 'medium', 'large'] as const;
      
      densities.forEach(density => {
        const presets = getTypographyPresets(density);
        expect(presets).toBeDefined();
        expect(Object.keys(presets).length).toBeGreaterThan(0);
      });
    });

    it('should include all preset types', () => {
      const presets = getTypographyPresets('medium');
      const expectedPresets = [
        'display1', 'display2',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'bodyLarge', 'body', 'bodySmall',
        'label', 'caption', 'overline',
        'button', 'buttonLarge',
        'code', 'codeBlock'
      ];
      
      expectedPresets.forEach(preset => {
        expect(presets).toHaveProperty(preset);
        expect(presets[preset]).toHaveProperty('fontSize');
        expect(presets[preset]).toHaveProperty('fontWeight');
        expect(presets[preset]).toHaveProperty('lineHeight');
        expect(presets[preset]).toHaveProperty('letterSpacing');
      });
    });

    it('should apply density variations correctly', () => {
      const compactH1 = getTypographyPresets('compact').h1;
      const mediumH1 = getTypographyPresets('medium').h1;
      const largeH1 = getTypographyPresets('large').h1;
      
      // Same font size
      expect(compactH1.fontSize).toBe(mediumH1.fontSize);
      expect(mediumH1.fontSize).toBe(largeH1.fontSize);
      
      // Different line heights
      expect(compactH1.lineHeight).toBeLessThan(mediumH1.lineHeight);
      expect(mediumH1.lineHeight).toBeLessThan(largeH1.lineHeight);
    });

    it('should apply mono font family to code presets', () => {
      const presets = getTypographyPresets('medium');
      expect(presets.code.fontFamily).toBe(fontFamilies.mono);
      expect(presets.codeBlock.fontFamily).toBe(fontFamilies.mono);
    });
  });

  describe('getLineHeight', () => {
    it('should calculate line height correctly', () => {
      const fontSize = 16;
      const lineHeight = getLineHeight(fontSize, 'normal', 'medium');
      
      expect(lineHeight).toBe(fontSize * lineHeightMultipliers.medium.normal);
      expect(lineHeight).toBe(24); // 16 * 1.5
    });

    it('should handle all line height types', () => {
      const fontSize = 20;
      const types = ['tight', 'snug', 'normal', 'relaxed', 'loose'] as const;
      
      types.forEach(type => {
        const result = getLineHeight(fontSize, type, 'medium');
        expect(result).toBeGreaterThan(0);
        expect(result).toBe(fontSize * lineHeightMultipliers.medium[type]);
      });
    });

    it('should respect density variations', () => {
      const fontSize = 16;
      const compactHeight = getLineHeight(fontSize, 'normal', 'compact');
      const mediumHeight = getLineHeight(fontSize, 'normal', 'medium');
      const largeHeight = getLineHeight(fontSize, 'normal', 'large');
      
      expect(compactHeight).toBeLessThan(mediumHeight);
      expect(mediumHeight).toBeLessThan(largeHeight);
    });
  });

  describe('getLetterSpacing', () => {
    it('should calculate letter spacing correctly', () => {
      const fontSize = 16;
      const spacing = getLetterSpacing(fontSize, 'normal', 'medium');
      
      expect(spacing).toBe(0); // normal spacing is 0
    });

    it('should handle all letter spacing types', () => {
      const fontSize = 20;
      const types = ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest'] as const;
      
      types.forEach(type => {
        const result = getLetterSpacing(fontSize, type, 'medium');
        expect(result).toBe(fontSize * letterSpacingMultipliers.medium[type]);
      });
    });

    it('should apply negative spacing for tight variations', () => {
      const fontSize = 16;
      expect(getLetterSpacing(fontSize, 'tighter', 'medium')).toBeLessThan(0);
      expect(getLetterSpacing(fontSize, 'tight', 'medium')).toBeLessThan(0);
    });

    it('should apply positive spacing for wide variations', () => {
      const fontSize = 16;
      expect(getLetterSpacing(fontSize, 'wide', 'medium')).toBeGreaterThan(0);
      expect(getLetterSpacing(fontSize, 'wider', 'medium')).toBeGreaterThan(0);
      expect(getLetterSpacing(fontSize, 'widest', 'medium')).toBeGreaterThan(0);
    });
  });

  describe('getFontFamily', () => {
    it('should return first font in array', () => {
      mockPlatform.OS = 'ios';
      (mockPlatform.select as jest.Mock).mockImplementation((obj) => obj.ios);
      
      expect(getFontFamily('sans')).toBe('SF Pro Text');
      expect(getFontFamily('serif')).toBe('Georgia');
      expect(getFontFamily('mono')).toBe('SF Mono');
    });

    it('should handle display and text aliases', () => {
      expect(getFontFamily('display')).toBe(getFontFamily('sans'));
      expect(getFontFamily('text')).toBe(getFontFamily('sans'));
    });

    it('should handle string return from fontFamilies', () => {
      // Mock fontFamilies to return string instead of array
      const originalFamilies = { ...fontFamilies };
      (fontFamilies as any).sans = 'System';
      
      expect(getFontFamily('sans')).toBe('System');
      
      // Restore
      Object.assign(fontFamilies, originalFamilies);
    });
  });

  describe('webTextStyles', () => {
    it('should have selection styles', () => {
      expect(webTextStyles.selectable).toEqual({
        userSelect: 'text',
        WebkitUserSelect: 'text',
      });
      
      expect(webTextStyles.nonSelectable).toEqual({
        userSelect: 'none',
        WebkitUserSelect: 'none',
      });
    });

    it('should have font smoothing styles', () => {
      expect(webTextStyles.smooth).toEqual({
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      });
    });

    it('should have text rendering optimization', () => {
      expect(webTextStyles.optimizeLegibility).toEqual({
        textRendering: 'optimizeLegibility',
      });
    });
  });

  describe('textTruncation', () => {
    it('should have single line truncation', () => {
      expect(textTruncation.singleLine).toEqual({
        numberOfLines: 1,
        ellipsizeMode: 'tail',
      });
    });

    it('should have multi-line truncation options', () => {
      expect(textTruncation.twoLines.numberOfLines).toBe(2);
      expect(textTruncation.threeLines.numberOfLines).toBe(3);
      
      expect(textTruncation.twoLines.ellipsizeMode).toBe('tail');
      expect(textTruncation.threeLines.ellipsizeMode).toBe('tail');
    });
  });

  describe('typographySystem', () => {
    it('should export all core tokens', () => {
      expect(typographySystem.fontFamilies).toBe(fontFamilies);
      expect(typographySystem.fontWeights).toBe(fontWeights);
      expect(typographySystem.sizes).toBe(typographyScale);
      expect(typographySystem.scale).toBe(typographyScale);
    });

    it('should export helper functions', () => {
      expect(typographySystem.getFontFamily).toBe(getFontFamily);
      expect(typographySystem.getLineHeight).toBe(getLineHeight);
      expect(typographySystem.getLetterSpacing).toBe(getLetterSpacing);
      expect(typographySystem.getTypographyPresets).toBe(getTypographyPresets);
    });

    it('should export utilities', () => {
      expect(typographySystem.webTextStyles).toBe(webTextStyles);
      expect(typographySystem.textTruncation).toBe(textTruncation);
    });

    it('should have legacy preset format', () => {
      const presets = typographySystem.presets;
      
      expect(presets).toBeDefined();
      expect(presets.h1).toHaveProperty('size');
      expect(presets.h1).toHaveProperty('weight');
      expect(presets.h1).toHaveProperty('family');
      expect(presets.h1).toHaveProperty('lineHeight');
      expect(presets.h1).toHaveProperty('letterSpacing');
    });

    it('should include link preset in legacy format', () => {
      const linkPreset = typographySystem.presets.link;
      
      expect(linkPreset).toBeDefined();
      expect(linkPreset.size).toBe('base');
      expect(linkPreset.weight).toBe('normal');
      expect(linkPreset.decoration).toBe('underline');
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle missing density in multipliers gracefully', () => {
      const invalidDensity = 'invalid' as any;
      
      // These should not throw
      expect(() => getLineHeight(16, 'normal', invalidDensity)).not.toThrow();
      expect(() => getLetterSpacing(16, 'normal', invalidDensity)).not.toThrow();
    });

    it('should create consistent presets across densities', () => {
      const densities = ['compact', 'medium', 'large'] as const;
      
      densities.forEach(density => {
        const presets = getTypographyPresets(density);
        
        // Verify hierarchy is maintained
        expect(presets.h1.fontSize).toBeGreaterThan(presets.h2.fontSize);
        expect(presets.h2.fontSize).toBeGreaterThan(presets.h3.fontSize);
        expect(presets.bodyLarge.fontSize).toBeGreaterThan(presets.body.fontSize);
        expect(presets.body.fontSize).toBeGreaterThan(presets.bodySmall.fontSize);
      });
    });

    it('should apply appropriate font weights in presets', () => {
      const presets = getTypographyPresets('medium');
      
      // Display and headings should be bold/semibold
      expect(presets.display1.fontWeight).toBe(fontWeights.bold);
      expect(presets.h1.fontWeight).toBe(fontWeights.bold);
      expect(presets.h2.fontWeight).toBe(fontWeights.semibold);
      
      // Body text should be normal
      expect(presets.body.fontWeight).toBe(fontWeights.normal);
      expect(presets.bodySmall.fontWeight).toBe(fontWeights.normal);
      
      // UI elements should be medium
      expect(presets.label.fontWeight).toBe(fontWeights.medium);
      expect(presets.button.fontWeight).toBe(fontWeights.medium);
    });
  });
});