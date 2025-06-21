import { renderHook } from '@testing-library/react-hooks';
import { Platform } from 'react-native';
import { useShadow, useShadowClass, useInteractiveShadow, shadowPresets } from '@/hooks/useShadow';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useThemeStore } from '@/lib/stores/theme-store';

// Mock dependencies
jest.mock('@/lib/stores/spacing-store');
jest.mock('@/lib/stores/theme-store');
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
}));

const mockUseSpacing = useSpacing as jest.MockedFunction<typeof useSpacing>;
const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;

describe('useShadow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSpacing.mockReturnValue({ density: 'medium' } as any);
    mockUseThemeStore.mockReturnValue({ colorScheme: 'light' } as any);
  });

  describe('Basic functionality', () => {
    it('should return empty style for undefined options', () => {
      const { result } = renderHook(() => useShadow());
      expect(result.current).toEqual({
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      });
    });

    it('should return empty style for "none" size', () => {
      const { result } = renderHook(() => useShadow('none'));
      expect(result.current).toEqual({});
    });

    it('should handle string size parameter (legacy support)', () => {
      const { result } = renderHook(() => useShadow('lg'));
      expect(result.current).toEqual({
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      });
    });

    it('should handle options object', () => {
      const { result } = renderHook(() => useShadow({ size: 'xl' }));
      expect(result.current).toEqual({
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      });
    });
  });

  describe('Platform-specific behavior', () => {
    it('should return iOS shadow properties on iOS', () => {
      (Platform as any).OS = 'ios';
      const { result } = renderHook(() => useShadow({ size: 'md' }));
      
      expect(result.current).toHaveProperty('shadowColor');
      expect(result.current).toHaveProperty('shadowOffset');
      expect(result.current).toHaveProperty('shadowOpacity');
      expect(result.current).toHaveProperty('shadowRadius');
      expect(result.current).not.toHaveProperty('elevation');
      expect(result.current).not.toHaveProperty('boxShadow');
    });

    it('should return Android elevation on Android', () => {
      (Platform as any).OS = 'android';
      const { result } = renderHook(() => useShadow({ size: 'md' }));
      
      expect(result.current).toEqual({
        elevation: 4,
        shadowColor: '#000000',
      });
    });

    it('should return web box-shadow on web', () => {
      (Platform as any).OS = 'web';
      (Platform.select as jest.Mock).mockImplementation((obj) => obj.web || obj.default);
      
      const { result } = renderHook(() => useShadow({ size: 'md' }));
      
      expect(result.current).toHaveProperty('boxShadow');
      expect(result.current.boxShadow).toBe('0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)');
    });

    it('should handle unknown platform gracefully', () => {
      (Platform as any).OS = 'unknown';
      const { result } = renderHook(() => useShadow({ size: 'md' }));
      
      expect(result.current).toEqual({});
    });
  });

  describe('Density variations', () => {
    it('should adjust shadow based on compact density', () => {
      mockUseSpacing.mockReturnValue({ density: 'compact' } as any);
      const { result } = renderHook(() => useShadow({ size: 'md' }));
      
      expect(result.current.shadowOpacity).toBe(0.08);
      expect(result.current.shadowRadius).toBe(2);
    });

    it('should adjust shadow based on large density', () => {
      mockUseSpacing.mockReturnValue({ density: 'large' } as any);
      const { result } = renderHook(() => useShadow({ size: 'md' }));
      
      expect(result.current.shadowOpacity).toBe(0.12);
      expect(result.current.shadowRadius).toBe(6);
    });

    it('should use custom density over store density', () => {
      mockUseSpacing.mockReturnValue({ density: 'medium' } as any);
      const { result } = renderHook(() => 
        useShadow({ size: 'md', density: 'compact' })
      );
      
      expect(result.current.shadowOpacity).toBe(0.08);
    });
  });

  describe('Color variations', () => {
    it('should apply default black shadow color', () => {
      const { result } = renderHook(() => useShadow({ size: 'md' }));
      expect(result.current.shadowColor).toBe('#000000');
    });

    it('should apply custom shadow colors', () => {
      const colorTests = [
        { color: 'primary', expected: '#3b82f6' },
        { color: 'secondary', expected: '#8b5cf6' },
        { color: 'destructive', expected: '#ef4444' },
        { color: 'success', expected: '#10b981' },
        { color: 'warning', expected: '#f59e0b' },
      ];

      colorTests.forEach(({ color, expected }) => {
        const { result } = renderHook(() => 
          useShadow({ size: 'md', color: color as any })
        );
        expect(result.current.shadowColor).toBe(expected);
      });
    });

    it('should apply colored shadows on web', () => {
      (Platform as any).OS = 'web';
      const { result } = renderHook(() => 
        useShadow({ size: 'md', color: 'primary' })
      );
      
      expect(result.current.boxShadow).toContain('rgba(59, 130, 246,');
    });

    it('should handle colored shadows on Android', () => {
      (Platform as any).OS = 'android';
      const { result } = renderHook(() => 
        useShadow({ size: 'md', color: 'primary' })
      );
      
      expect(result.current.shadowColor).toBe('#3b82f6');
      expect(result.current.elevation).toBe(4);
    });
  });

  describe('Dark mode adjustments', () => {
    it('should increase opacity in dark mode', () => {
      mockUseThemeStore.mockReturnValue({ colorScheme: 'dark' } as any);
      const { result } = renderHook(() => useShadow({ size: 'md' }));
      
      // Medium density md shadow has 0.10 opacity, dark mode multiplies by 1.5
      expect(result.current.shadowOpacity).toBe(0.15);
    });

    it('should maintain light mode opacity', () => {
      mockUseThemeStore.mockReturnValue({ colorScheme: 'light' } as any);
      const { result } = renderHook(() => useShadow({ size: 'md' }));
      
      expect(result.current.shadowOpacity).toBe(0.10);
    });
  });

  describe('Inset shadows', () => {
    it('should invert shadow offset for inset on iOS', () => {
      (Platform as any).OS = 'ios';
      const { result } = renderHook(() => 
        useShadow({ size: 'md', inset: true })
      );
      
      expect(result.current.shadowOffset).toEqual({ width: 0, height: -2 });
    });

    it('should remove elevation for inset on Android', () => {
      (Platform as any).OS = 'android';
      const { result } = renderHook(() => 
        useShadow({ size: 'md', inset: true })
      );
      
      expect(result.current.elevation).toBe(0);
    });

    it('should add inset keyword on web', () => {
      (Platform as any).OS = 'web';
      const { result } = renderHook(() => 
        useShadow({ size: 'md', inset: true })
      );
      
      expect(result.current.boxShadow).toStartWith('inset ');
    });
  });

  describe('Animated shadows', () => {
    it('should add transition on web when animated', () => {
      (Platform as any).OS = 'web';
      const { result } = renderHook(() => 
        useShadow({ size: 'md', animated: true })
      );
      
      expect(result.current.transition).toBe('box-shadow 0.3s ease-in-out');
    });

    it('should not add transition on native platforms', () => {
      (Platform as any).OS = 'ios';
      const { result } = renderHook(() => 
        useShadow({ size: 'md', animated: true })
      );
      
      expect(result.current).not.toHaveProperty('transition');
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid size gracefully', () => {
      const { result } = renderHook(() => 
        useShadow({ size: 'invalid' as any })
      );
      
      // Should fall back to medium.md config
      expect(result.current.shadowOpacity).toBe(0.1);
      expect(result.current.shadowRadius).toBe(4);
    });

    it('should handle invalid density gracefully', () => {
      const { result } = renderHook(() => 
        useShadow({ size: 'md', density: 'invalid' as any })
      );
      
      // Should still work with invalid density
      expect(result.current).toBeDefined();
    });

    it('should handle all shadow sizes', () => {
      const sizes = ['none', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
      
      sizes.forEach(size => {
        const { result } = renderHook(() => useShadow({ size }));
        if (size === 'none') {
          expect(result.current).toEqual({});
        } else {
          expect(result.current).toBeDefined();
          expect(Object.keys(result.current).length).toBeGreaterThan(0);
        }
      });
    });
  });
});

describe('useShadowClass', () => {
  beforeEach(() => {
    mockUseSpacing.mockReturnValue({ density: 'medium' } as any);
    mockUseThemeStore.mockReturnValue({ colorScheme: 'light' } as any);
  });

  it('should return appropriate Tailwind classes', () => {
    const { result } = renderHook(() => useShadowClass({ size: 'md' }));
    expect(result.current).toBe('shadow-md');
  });

  it('should include color classes', () => {
    const { result } = renderHook(() => 
      useShadowClass({ size: 'md', color: 'primary' })
    );
    expect(result.current).toBe('shadow-md shadow-blue-500/25');
  });

  it('should include inset class', () => {
    const { result } = renderHook(() => 
      useShadowClass({ size: 'md', inset: true })
    );
    expect(result.current).toBe('shadow-md shadow-inner');
  });

  it('should include dark mode class', () => {
    mockUseThemeStore.mockReturnValue({ colorScheme: 'dark' } as any);
    const { result } = renderHook(() => useShadowClass({ size: 'md' }));
    expect(result.current).toBe('shadow-md dark:shadow-white/10');
  });

  it('should handle density variations', () => {
    mockUseSpacing.mockReturnValue({ density: 'compact' } as any);
    const { result } = renderHook(() => useShadowClass({ size: 'lg' }));
    expect(result.current).toBe('shadow-md');
  });

  it('should combine multiple classes correctly', () => {
    mockUseThemeStore.mockReturnValue({ colorScheme: 'dark' } as any);
    const { result } = renderHook(() => 
      useShadowClass({ 
        size: 'xl', 
        color: 'primary', 
        inset: true 
      })
    );
    expect(result.current).toBe('shadow-xl shadow-blue-500/25 shadow-inner dark:shadow-white/10');
  });
});

describe('useInteractiveShadow', () => {
  beforeEach(() => {
    mockUseSpacing.mockReturnValue({ density: 'medium' } as any);
    mockUseThemeStore.mockReturnValue({ colorScheme: 'light' } as any);
  });

  it('should return base shadow initially', () => {
    const { result } = renderHook(() => useInteractiveShadow('md', 'lg'));
    
    expect(result.current.shadowStyle).toEqual({
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    });
    expect(result.current.isHovered).toBe(false);
    expect(result.current.isPressed).toBe(false);
  });

  it('should provide web event handlers on web platform', () => {
    (Platform as any).OS = 'web';
    const { result } = renderHook(() => useInteractiveShadow('md', 'lg'));
    
    expect(result.current.handlers).toHaveProperty('onMouseEnter');
    expect(result.current.handlers).toHaveProperty('onMouseLeave');
    expect(result.current.handlers).toHaveProperty('onMouseDown');
    expect(result.current.handlers).toHaveProperty('onMouseUp');
  });

  it('should provide native event handlers on native platforms', () => {
    (Platform as any).OS = 'ios';
    const { result } = renderHook(() => useInteractiveShadow('md', 'lg'));
    
    expect(result.current.handlers).toHaveProperty('onPressIn');
    expect(result.current.handlers).toHaveProperty('onPressOut');
  });

  it('should handle hover state on web', () => {
    (Platform as any).OS = 'web';
    const { result } = renderHook(() => useInteractiveShadow('md', 'lg'));
    
    // Simulate hover
    result.current.handlers.onMouseEnter?.();
    
    expect(result.current.isHovered).toBe(true);
    expect(result.current.shadowStyle.boxShadow).toContain('0 10px 15px');
    
    // Simulate hover end
    result.current.handlers.onMouseLeave?.();
    
    expect(result.current.isHovered).toBe(false);
  });

  it('should handle press state', () => {
    (Platform as any).OS = 'ios';
    const { result } = renderHook(() => useInteractiveShadow('md', 'lg'));
    
    // Simulate press
    result.current.handlers.onPressIn?.();
    
    expect(result.current.isPressed).toBe(true);
    expect(result.current.shadowStyle.shadowRadius).toBe(2); // sm size
    
    // Simulate release
    result.current.handlers.onPressOut?.();
    
    expect(result.current.isPressed).toBe(false);
  });

  it('should pass through additional options', () => {
    const { result } = renderHook(() => 
      useInteractiveShadow('md', 'lg', { color: 'primary' })
    );
    
    expect(result.current.shadowStyle.shadowColor).toBe('#3b82f6');
  });
});

describe('shadowPresets', () => {
  it('should have all expected presets', () => {
    expect(shadowPresets).toHaveProperty('card');
    expect(shadowPresets).toHaveProperty('button');
    expect(shadowPresets).toHaveProperty('modal');
    expect(shadowPresets).toHaveProperty('dropdown');
    expect(shadowPresets).toHaveProperty('tooltip');
    expect(shadowPresets).toHaveProperty('input');
    expect(shadowPresets).toHaveProperty('elevated');
  });

  it('should have valid configurations', () => {
    expect(shadowPresets.card).toEqual({ size: 'md' });
    expect(shadowPresets.button).toEqual({ size: 'sm' });
    expect(shadowPresets.modal).toEqual({ size: 'xl' });
    expect(shadowPresets.input).toEqual({ size: 'sm', inset: true });
  });

  it('should be usable with useShadow hook', () => {
    const { result } = renderHook(() => useShadow(shadowPresets.card));
    expect(result.current).toBeDefined();
    expect(result.current.shadowRadius).toBe(4); // md size
  });
});