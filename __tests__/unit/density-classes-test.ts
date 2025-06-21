import { renderHook } from '@testing-library/react-native';
import {
  getDensityClass,
  useDensityClasses,
  getGapClass,
  getGapClassSafe,
  getPaddingClass,
} from '@/lib/core/utils/density-classes';
import { useSpacingStore } from '@/lib/stores/spacing-store';

// Mock the spacing store
jest.mock('@/lib/stores/spacing-store');

describe('density-classes', () => {
  const mockUseSpacingStore = useSpacingStore as jest.MockedFunction<typeof useSpacingStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to comfortable density
    mockUseSpacingStore.mockReturnValue({
      density: 'comfortable',
      setDensity: jest.fn(),
    });
  });

  describe('getDensityClass', () => {
    it('returns correct class for padding with different densities', () => {
      expect(getDensityClass('p', 4, 'compact')).toBe('p-3');
      expect(getDensityClass('p', 4, 'comfortable')).toBe('p-4');
      expect(getDensityClass('p', 4, 'spacious')).toBe('p-5');
    });

    it('returns correct class for margin with different densities', () => {
      expect(getDensityClass('m', 2, 'compact')).toBe('m-1');
      expect(getDensityClass('m', 2, 'comfortable')).toBe('m-2');
      expect(getDensityClass('m', 2, 'spacious')).toBe('m-3');
    });

    it('returns correct class for gap with different densities', () => {
      expect(getDensityClass('gap', 6, 'compact')).toBe('gap-4');
      expect(getDensityClass('gap', 6, 'comfortable')).toBe('gap-6');
      expect(getDensityClass('gap', 6, 'spacious')).toBe('gap-8');
    });

    it('returns correct class for space with different densities', () => {
      expect(getDensityClass('space-y', 8, 'compact')).toBe('space-y-6');
      expect(getDensityClass('space-y', 8, 'comfortable')).toBe('space-y-8');
      expect(getDensityClass('space-y', 8, 'spacious')).toBe('space-y-10');
    });

    it('handles edge cases for size adjustments', () => {
      // Very small sizes
      expect(getDensityClass('p', 0, 'compact')).toBe('p-0');
      expect(getDensityClass('p', 0, 'spacious')).toBe('p-0');
      
      // Large sizes
      expect(getDensityClass('p', 16, 'compact')).toBe('p-14');
      expect(getDensityClass('p', 16, 'comfortable')).toBe('p-16');
      expect(getDensityClass('p', 16, 'spacious')).toBe('p-20');
    });
  });

  describe('useDensityClasses', () => {
    it('uses current density from store', () => {
      const { result } = renderHook(() => useDensityClasses());
      
      expect(result.current.getDensityClass('p', 4)).toBe('p-4');
      expect(mockUseSpacingStore).toHaveBeenCalled();
    });

    it('updates when density changes', () => {
      const { result, rerender } = renderHook(() => useDensityClasses());
      
      expect(result.current.getDensityClass('p', 4)).toBe('p-4');
      
      // Change density
      mockUseSpacingStore.mockReturnValue({
        density: 'compact',
        setDensity: jest.fn(),
      });
      rerender();
      
      expect(result.current.getDensityClass('p', 4)).toBe('p-3');
    });
  });

  describe('getGapClass', () => {
    it('maps numeric gap to Tailwind class', () => {
      expect(getGapClass(0)).toBe('gap-0');
      expect(getGapClass(4)).toBe('gap-1');
      expect(getGapClass(8)).toBe('gap-2');
      expect(getGapClass(12)).toBe('gap-3');
      expect(getGapClass(16)).toBe('gap-4');
      expect(getGapClass(24)).toBe('gap-6');
      expect(getGapClass(32)).toBe('gap-8');
    });

    it('applies density adjustments', () => {
      expect(getGapClass(16, 'compact')).toBe('gap-3');
      expect(getGapClass(16, 'comfortable')).toBe('gap-4');
      expect(getGapClass(16, 'spacious')).toBe('gap-5');
    });

    it('returns default for unmapped values', () => {
      expect(getGapClass(999)).toBe('gap-4');
      expect(getGapClass(-1)).toBe('gap-4');
    });
  });

  describe('getGapClassSafe', () => {
    it('uses current density from store', () => {
      const { result } = renderHook(() => getGapClassSafe(16));
      
      expect(result.current).toBe('gap-4');
      expect(mockUseSpacingStore).toHaveBeenCalled();
    });

    it('updates when density changes', () => {
      const { result, rerender } = renderHook(() => getGapClassSafe(16));
      
      expect(result.current).toBe('gap-4');
      
      // Change density
      mockUseSpacingStore.mockReturnValue({
        density: 'spacious',
        setDensity: jest.fn(),
      });
      rerender();
      
      expect(result.current).toBe('gap-5');
    });
  });

  describe('getPaddingClass', () => {
    it('maps numeric padding to Tailwind class', () => {
      expect(getPaddingClass(0)).toBe('p-0');
      expect(getPaddingClass(4)).toBe('p-1');
      expect(getPaddingClass(8)).toBe('p-2');
      expect(getPaddingClass(16)).toBe('p-4');
      expect(getPaddingClass(32)).toBe('p-8');
    });

    it('applies density adjustments', () => {
      expect(getPaddingClass(24, 'compact')).toBe('p-5');
      expect(getPaddingClass(24, 'comfortable')).toBe('p-6');
      expect(getPaddingClass(24, 'spacious')).toBe('p-7');
    });

    it('handles directional padding', () => {
      expect(getPaddingClass(16, 'comfortable', 'x')).toBe('px-4');
      expect(getPaddingClass(16, 'comfortable', 'y')).toBe('py-4');
      expect(getPaddingClass(16, 'comfortable', 't')).toBe('pt-4');
      expect(getPaddingClass(16, 'comfortable', 'b')).toBe('pb-4');
      expect(getPaddingClass(16, 'comfortable', 'l')).toBe('pl-4');
      expect(getPaddingClass(16, 'comfortable', 'r')).toBe('pr-4');
    });

    it('returns default for unmapped values', () => {
      expect(getPaddingClass(999)).toBe('p-4');
      expect(getPaddingClass(-1)).toBe('p-4');
    });
  });
});