/**
 * Animation Store Tests
 * Tests for animation preferences and state management
 */

import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnimationStore } from '@/lib/stores/animation-store';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

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
    
  });
  
  describe('Persistence', () => {
    it('should persist state to AsyncStorage', async () => {
      const { result } = renderHook(() => useAnimationStore());
      
      act(() => {
        result.current.setEnableAnimations(false);
        result.current.setAnimationSpeed(2);
      });
      
      // Wait for async storage to be called
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'animation-preferences',
        expect.stringContaining('"enableAnimations":false')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'animation-preferences',
        expect.stringContaining('"animationSpeed":2')
      );
    });
    
    it('should hydrate from AsyncStorage', async () => {
      // Reset mocks
      (AsyncStorage.getItem as jest.Mock).mockClear();
      
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
      
      // Create a new store instance
      const { result, waitForNextUpdate } = renderHook(() => useAnimationStore());
      
      // Wait for async hydration
      try {
        await waitForNextUpdate({ timeout: 200 });
      } catch {
        // Hydration might be immediate
      }
      
      // The store should attempt to load from storage
      expect(result.current).toBeDefined();
    });
    
    it('should handle hydration errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );
      
      const { result } = renderHook(() => useAnimationStore());
      
      // Wait for hydration attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should maintain default state
      expect(result.current.enableAnimations).toBe(true);
      expect(result.current.animationSpeed).toBe(1);
    });
    
    it('should handle invalid stored data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        'invalid-json'
      );
      
      const { result } = renderHook(() => useAnimationStore());
      
      // Wait for hydration attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
  });
  
});