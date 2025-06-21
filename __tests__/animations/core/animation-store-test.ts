/**
 * Animation Store Tests
 * Tests for animation preferences and state management
 * Migrated to jest-expo patterns
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnimationStore } from '@/lib/stores/animation-store';

// AsyncStorage is already mocked in jest.setup.js

describe('Animation Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAnimationStore.setState({
      enableAnimations: true,
      animationSpeed: 1,
      reducedMotion: false,
      debugMode: false,
    });
  });

  describe('Initial State', () => {
    it('should have correct default values', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      expect(result.current.enableAnimations).toBe(true);
      expect(result.current.animationSpeed).toBe(1);
      expect(result.current.reducedMotion).toBe(false);
      expect(result.current.debugMode).toBe(false);
    });
  });

  describe('State Updates', () => {
    it('should update enableAnimations', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      act(() => {
        result.current.setEnableAnimations(false);
      });
      
      expect(result.current.enableAnimations).toBe(false);
    });

    it('should update animationSpeed', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      act(() => {
        result.current.setAnimationSpeed(0.5);
      });
      
      expect(result.current.animationSpeed).toBe(0.5);
    });

    it('should update reducedMotion', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      act(() => {
        result.current.setReducedMotion(true);
      });
      
      expect(result.current.reducedMotion).toBe(true);
    });

    it('should update debugMode', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      act(() => {
        result.current.setDebugMode(true);
      });
      
      expect(result.current.debugMode).toBe(true);
    });

    it('should batch multiple updates', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      act(() => {
        result.current.setEnableAnimations(false);
        result.current.setAnimationSpeed(2);
        result.current.setReducedMotion(true);
        result.current.setDebugMode(true);
      });
      
      expect(result.current.enableAnimations).toBe(false);
      expect(result.current.animationSpeed).toBe(2);
      expect(result.current.reducedMotion).toBe(true);
      expect(result.current.debugMode).toBe(true);
    });
  });

  describe('Persistence', () => {
    it('should persist state to AsyncStorage', async () => {
      const { result } = renderHook(() => useAnimationStore());
      
      act(() => {
        result.current.setEnableAnimations(false);
        result.current.setAnimationSpeed(2);
      });
      
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'animation-preferences',
          expect.stringContaining('"enableAnimations":false')
        );
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'animation-preferences',
          expect.stringContaining('"animationSpeed":2')
        );
      });
    });

    it('should hydrate from AsyncStorage', async () => {
      const storedState = {
        state: {
          enableAnimations: false,
          animationSpeed: 0.5,
          reducedMotion: true,
          debugMode: true,
        },
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(storedState)
      );
      
      // Force store recreation to trigger hydration
      useAnimationStore.setState({});
      
      const { result } = renderHook(() => useAnimationStore());
      
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('animation-preferences');
      });
      
      // The store should have loaded the persisted state
      expect(result.current).toBeDefined();
    });

    it('should handle hydration errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );
      
      const { result } = renderHook(() => useAnimationStore());
      
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalled();
      });
      
      // Should maintain default state
      expect(result.current.enableAnimations).toBe(true);
      expect(result.current.animationSpeed).toBe(1);
    });

    it('should handle invalid stored data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid-json');
      
      const { result } = renderHook(() => useAnimationStore());
      
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalled();
      });
      
      // Should maintain default state
      expect(result.current.enableAnimations).toBe(true);
    });
  });

  describe('Animation Speed Calculations', () => {
    it('should calculate correct duration with speed multiplier', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      // Normal speed
      expect(result.current.getAnimationDuration(300)).toBe(300);
      
      // Half speed (animations take twice as long)
      act(() => {
        result.current.setAnimationSpeed(0.5);
      });
      expect(result.current.getAnimationDuration(300)).toBe(600);
      
      // Double speed (animations are twice as fast)
      act(() => {
        result.current.setAnimationSpeed(2);
      });
      expect(result.current.getAnimationDuration(300)).toBe(150);
    });

    it('should return 0 duration when animations are disabled', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      act(() => {
        result.current.setEnableAnimations(false);
      });
      
      expect(result.current.getAnimationDuration(300)).toBe(0);
    });

    it('should return 0 duration in debug mode', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      act(() => {
        result.current.setDebugMode(true);
      });
      
      expect(result.current.getAnimationDuration(300)).toBe(0);
    });

    it('should clamp animation speed to valid range', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      // Test minimum speed
      act(() => {
        result.current.setAnimationSpeed(0.1);
      });
      expect(result.current.animationSpeed).toBe(0.1);
      
      // Test maximum speed
      act(() => {
        result.current.setAnimationSpeed(5);
      });
      expect(result.current.animationSpeed).toBe(5);
      
      // Test invalid speeds
      act(() => {
        result.current.setAnimationSpeed(-1);
      });
      expect(result.current.animationSpeed).toBe(0.1); // Should clamp to minimum
      
      act(() => {
        result.current.setAnimationSpeed(10);
      });
      expect(result.current.animationSpeed).toBe(5); // Should clamp to maximum
    });
  });

  describe('Reduced Motion', () => {
    it('should disable animations when reduced motion is enabled', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      act(() => {
        result.current.setReducedMotion(true);
      });
      
      expect(result.current.shouldAnimate()).toBe(false);
    });

    it('should respect enableAnimations setting', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      act(() => {
        result.current.setEnableAnimations(false);
      });
      
      expect(result.current.shouldAnimate()).toBe(false);
    });

    it('should allow animations when both settings permit', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      expect(result.current.shouldAnimate()).toBe(true);
    });

    it('should handle system reduced motion preference', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      // Simulate system preference
      act(() => {
        result.current.setReducedMotion(true);
      });
      
      expect(result.current.shouldAnimate()).toBe(false);
      expect(result.current.getAnimationDuration(300)).toBe(0);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all settings to defaults', () => {
      const { result } = renderHook(() => useAnimationStore());
      
      // Change all settings
      act(() => {
        result.current.setEnableAnimations(false);
        result.current.setAnimationSpeed(2);
        result.current.setReducedMotion(true);
        result.current.setDebugMode(true);
      });
      
      // Reset
      act(() => {
        result.current.resetToDefaults();
      });
      
      expect(result.current.enableAnimations).toBe(true);
      expect(result.current.animationSpeed).toBe(1);
      expect(result.current.reducedMotion).toBe(false);
      expect(result.current.debugMode).toBe(false);
    });
  });
});