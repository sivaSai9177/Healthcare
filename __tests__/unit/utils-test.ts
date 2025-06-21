import { describe, it, expect, jest } from '@jest/globals';
import { cn } from '../../lib/core/utils';
import { generateUUID } from '../../lib/core/crypto';
import { Platform } from 'react-native';
import {
  getDensityClass,
  getGapClass,
  getPaddingClass,
} from '../../lib/core/utils/density-classes';

// Mock React Native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

// Mock crypto for UUID tests
global.crypto = {
  randomUUID: jest.fn(() => 'mock-uuid-1234'),
  getRandomValues: jest.fn((array) => {
    // Simple mock implementation
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
} as any;

describe('cn (className utility)', () => {
  it('should combine class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active')).toBe('base active');
    expect(cn('base', false && 'inactive')).toBe('base');
    expect(cn('base', undefined)).toBe('base');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
    expect(cn('base', ['mod1', 'mod2'])).toBe('base mod1 mod2');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({
      'base': true,
      'active': true,
      'disabled': false,
    })).toBe('base active');
  });

  it('should merge tailwind classes correctly', () => {
    // This tests tailwind-merge functionality
    expect(cn('p-4', 'p-2')).toBe('p-2'); // Later class wins
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('bg-red-500 hover:bg-red-600', 'bg-blue-500')).toBe('hover:bg-red-600 bg-blue-500');
  });

  it('should handle empty and null values', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null)).toBe('');
    expect(cn(undefined)).toBe('');
    expect(cn('base', null, 'end')).toBe('base end');
  });

  it('should handle complex combinations', () => {
    const result = cn(
      'base',
      true && 'active',
      false && 'disabled',
      ['array1', 'array2'],
      {
        'object1': true,
        'object2': false,
      }
    );
    expect(result).toBe('base active array1 array2 object1');
  });
});

describe('generateUUID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use crypto.randomUUID when available', () => {
    const uuid = generateUUID();
    
    expect(crypto.randomUUID).toHaveBeenCalled();
    expect(uuid).toBe('mock-uuid-1234');
  });

  it('should fallback to custom implementation when randomUUID is not available', () => {
    // Remove randomUUID
    const originalRandomUUID = crypto.randomUUID;
    (crypto as any).randomUUID = undefined;

    const uuid = generateUUID();
    
    expect(crypto.getRandomValues).toHaveBeenCalled();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

    // Restore
    (crypto as any).randomUUID = originalRandomUUID;
  });

  it('should generate valid UUID v4 format', () => {
    (crypto as any).randomUUID = undefined;

    // Generate multiple UUIDs to test randomness
    const uuids = Array.from({ length: 10 }, () => generateUUID());
    
    // All should match UUID v4 format
    uuids.forEach(uuid => {
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    // All should be unique
    const uniqueUuids = new Set(uuids);
    expect(uniqueUuids.size).toBe(10);
  });

  it('should handle React Native environment', () => {
    // Simulate React Native environment without crypto
    const originalCrypto = global.crypto;
    (global as any).crypto = undefined;

    // Should not throw
    expect(() => generateUUID()).not.toThrow();

    // Restore
    global.crypto = originalCrypto;
  });
});

describe('Density Classes', () => {
  describe('getDensityClass', () => {
    it('should return correct density classes', () => {
      expect(getDensityClass('compact')).toBe('density-compact');
      expect(getDensityClass('comfortable')).toBe('density-comfortable');
      expect(getDensityClass('spacious')).toBe('density-spacious');
    });

    it('should default to comfortable', () => {
      expect(getDensityClass()).toBe('density-comfortable');
      expect(getDensityClass(undefined)).toBe('density-comfortable');
    });

    it('should handle invalid density', () => {
      expect(getDensityClass('invalid' as any)).toBe('density-comfortable');
    });
  });

  describe('getGapClass', () => {
    it('should map numeric values to tailwind gap classes', () => {
      expect(getGapClass(0)).toBe('gap-0');
      expect(getGapClass(1)).toBe('gap-0.5');
      expect(getGapClass(2)).toBe('gap-1');
      expect(getGapClass(4)).toBe('gap-2');
      expect(getGapClass(8)).toBe('gap-4');
      expect(getGapClass(16)).toBe('gap-8');
    });

    it('should adjust gaps based on density', () => {
      expect(getGapClass(4, 'compact')).toBe('gap-1');
      expect(getGapClass(4, 'comfortable')).toBe('gap-2');
      expect(getGapClass(4, 'spacious')).toBe('gap-3');
    });

    it('should handle edge cases', () => {
      expect(getGapClass(0)).toBe('gap-0');
      expect(getGapClass(-5)).toBe('gap-0');
      expect(getGapClass(100)).toBe('gap-8'); // Max value
    });

    it('should handle undefined values', () => {
      expect(getGapClass(undefined as any)).toBe('gap-0');
      expect(getGapClass(null as any)).toBe('gap-0');
    });
  });

  describe('getPaddingClass', () => {
    it('should map numeric values to tailwind padding classes', () => {
      expect(getPaddingClass(0)).toBe('p-0');
      expect(getPaddingClass(2)).toBe('p-0.5');
      expect(getPaddingClass(4)).toBe('p-1');
      expect(getPaddingClass(8)).toBe('p-2');
      expect(getPaddingClass(16)).toBe('p-4');
      expect(getPaddingClass(32)).toBe('p-8');
    });

    it('should support directional padding', () => {
      expect(getPaddingClass(16, 'comfortable', 'x')).toBe('px-4');
      expect(getPaddingClass(16, 'comfortable', 'y')).toBe('py-4');
      expect(getPaddingClass(16, 'comfortable', 't')).toBe('pt-4');
      expect(getPaddingClass(16, 'comfortable', 'b')).toBe('pb-4');
      expect(getPaddingClass(16, 'comfortable', 'l')).toBe('pl-4');
      expect(getPaddingClass(16, 'comfortable', 'r')).toBe('pr-4');
    });

    it('should adjust padding based on density', () => {
      expect(getPaddingClass(16, 'compact')).toBe('p-3');
      expect(getPaddingClass(16, 'comfortable')).toBe('p-4');
      expect(getPaddingClass(16, 'spacious')).toBe('p-5');
    });

    it('should handle edge cases', () => {
      expect(getPaddingClass(0)).toBe('p-0');
      expect(getPaddingClass(-10)).toBe('p-0');
      expect(getPaddingClass(200)).toBe('p-16'); // Max value
    });
  });
});

describe('Platform-specific utilities', () => {
  it('should handle iOS platform', () => {
    (Platform.OS as any) = 'ios';
    
    // Test platform-specific behavior
    const uuid = generateUUID();
    expect(uuid).toBeDefined();
  });

  it('should handle Android platform', () => {
    (Platform.OS as any) = 'android';
    
    // Test platform-specific behavior
    const uuid = generateUUID();
    expect(uuid).toBeDefined();
  });

  it('should handle Web platform', () => {
    (Platform.OS as any) = 'web';
    
    // Test platform-specific behavior
    const uuid = generateUUID();
    expect(uuid).toBeDefined();
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle very long class name lists', () => {
    const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);
    const result = cn(...classes);
    
    expect(result).toContain('class-0');
    expect(result).toContain('class-99');
  });

  it('should handle special characters in class names', () => {
    expect(cn('hover:bg-red-500', 'focus:ring-2')).toContain('hover:bg-red-500');
    expect(cn('sm:text-lg', 'md:text-xl')).toContain('sm:text-lg');
  });

  it('should handle numeric values in density functions', () => {
    expect(getGapClass(3.14)).toBe('gap-1');
    expect(getGapClass(Infinity)).toBe('gap-8');
    expect(getGapClass(NaN)).toBe('gap-0');
  });

  it('should be pure functions without side effects', () => {
    const input = ['class1', 'class2'];
    cn(...input);
    expect(input).toEqual(['class1', 'class2']); // Input unchanged

    const gap1 = getGapClass(4);
    const gap2 = getGapClass(4);
    expect(gap1).toBe(gap2); // Same input, same output
  });
});