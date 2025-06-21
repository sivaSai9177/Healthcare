/**
 * Animation Hooks Tests
 * Tests for cross-platform animation hooks
 * Migrated to jest-expo patterns
 */

import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { 
  mockAnimationDriver, 
  expectAnimatedStyle,
  testPlatformAnimation 
} from '@/__tests__/utils/animation-test-utils';
import { 
  useAnimation, 
  useTransition, 
  useStaggerAnimation, 
  useSpringAnimation 
} from '@/lib/ui/animations/hooks';
import { useAnimationStore } from '@/lib/stores/animation-store';

// Mock the animation store
jest.mock('@/lib/stores/animation-store', () => ({
  useAnimationStore: jest.fn(() => ({
    enableAnimations: true,
    animationSpeed: 1,
    prefersReducedMotion: false,
  }))
}));

describe('Animation Hooks', () => {
  const mockStore = useAnimationStore as jest.MockedFunction<typeof useAnimationStore>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAnimation', () => {
    testPlatformAnimation(
      'should handle fadeIn animation',
      // iOS test
      () => {
        const { result } = renderHook(() => useAnimation('fadeIn'));
        
        expect(result.current.animatedStyle).toBeDefined();
        expect(result.current.trigger).toBeInstanceOf(Function);
        expect(result.current.isAnimating).toBe(false);
        
        act(() => {
          result.current.trigger();
        });
        
        expect(result.current.isAnimating).toBe(true);
      },
      // Android test
      () => {
        const { result } = renderHook(() => useAnimation('fadeIn'));
        
        expect(result.current.animatedStyle).toBeDefined();
        expect(result.current.trigger).toBeInstanceOf(Function);
      },
      // Web test
      () => {
        const { result } = renderHook(() => useAnimation('fadeIn'));
        
        expect(result.current.className).toContain('animate-fadeIn');
        expect(result.current.animatedStyle).toBeUndefined();
      }
    );

    it('should handle disabled animations', () => {
      mockStore.mockReturnValue({
        enableAnimations: false,
        animationSpeed: 1,
        prefersReducedMotion: false,
      });

      const { result } = renderHook(() => useAnimation('fadeIn'));
      
      if (Platform.OS === 'web') {
        expect(result.current.className).toBe('');
      } else {
        expect(result.current.animatedStyle).toEqual({});
      }
    });

    it('should call onComplete callback', async () => {
      const onComplete = jest.fn();
      const driver = mockAnimationDriver();

      const { result } = renderHook(() => 
        useAnimation('fadeIn', { duration: 'fast', onComplete })
      );

      act(() => {
        result.current.trigger();
      });

      driver.runAnimation(150); // fast duration
      
      expect(onComplete).toHaveBeenCalled();
      expect(result.current.isAnimating).toBe(false);
      
      driver.cleanup();
    });

    it('should support all animation types', () => {
      const animationTypes = [
        'fadeIn', 'fadeOut', 'scaleIn', 'scaleOut',
        'slideInUp', 'slideInDown', 'slideInLeft', 'slideInRight',
        'shake', 'bounce', 'pulse', 'spin'
      ] as const;

      animationTypes.forEach(type => {
        const { result } = renderHook(() => useAnimation(type));
        
        if (Platform.OS === 'web') {
          expect(result.current.className).toContain(`animate-${type}`);
        } else {
          expect(result.current.animatedStyle).toBeDefined();
        }
      });
    });

    it('should respect delay option', () => {
      const { result } = renderHook(() => 
        useAnimation('fadeIn', { delay: 100 })
      );

      act(() => {
        result.current.trigger();
      });

      if (Platform.OS === 'web') {
        expect(result.current.className).toContain('delay-100');
      } else {
        expect(result.current.animatedStyle).toBeDefined();
      }
    });
  });

  describe('useTransition', () => {
    it('should return transition classes on web', () => {
      Platform.OS = 'web';
      
      const { result } = renderHook(() => 
        useTransition('colors', 'slow')
      );
      
      expect(result.current.className).toContain('transition-colors');
      expect(result.current.className).toContain('duration-slow');
    });

    it('should handle disabled animations', () => {
      Platform.OS = 'web';
      mockStore.mockReturnValue({
        enableAnimations: false,
        animationSpeed: 1,
        prefersReducedMotion: false,
      });

      const { result } = renderHook(() => useTransition());
      
      expect(result.current.className).toBe('');
    });

    it('should support all transition types', () => {
      Platform.OS = 'web';
      const transitionTypes = ['all', 'colors', 'opacity', 'shadow', 'transform'] as const;

      transitionTypes.forEach(type => {
        const { result } = renderHook(() => useTransition(type));
        
        expect(result.current.className).toContain(`transition-${type}`);
      });
    });
  });

  describe('useStaggerAnimation', () => {
    it('should create animations for each item', () => {
      Platform.OS = 'web';
      
      const { result } = renderHook(() => useStaggerAnimation(3));
      
      expect(result.current).toHaveLength(3);
      
      result.current.forEach((animation, index) => {
        expect(animation.className).toContain('animate-fadeIn');
        expect(animation.delayClass).toContain(`delay-stagger-${index + 1}`);
      });
    });

    it('should limit delay classes to 6 items', () => {
      Platform.OS = 'web';
      
      const { result } = renderHook(() => useStaggerAnimation(10));
      
      // Last item should cap at delay-stagger-6
      expect(result.current[9].delayClass).toContain('delay-stagger-6');
    });

    it('should pass options to each animation', () => {
      Platform.OS = 'web';
      
      const { result } = renderHook(() => 
        useStaggerAnimation(2, { duration: 'fast' })
      );
      
      result.current.forEach(animation => {
        expect(animation.className).toContain('duration-fast');
      });
    });

    it('should trigger animations in sequence', () => {
      const driver = mockAnimationDriver();
      
      const { result } = renderHook(() => useStaggerAnimation(3));
      
      act(() => {
        result.current.forEach(animation => animation.trigger());
      });
      
      result.current.forEach(animation => {
        expect(animation.isAnimating).toBe(true);
      });
      
      driver.cleanup();
    });
  });

  describe('useSpringAnimation', () => {
    it('should initialize with from value', () => {
      const { result } = renderHook(() => 
        useSpringAnimation({ from: 0, to: 1 })
      );
      
      expect(result.current.value.value).toBe(0);
    });

    it('should animate to target value', () => {
      const onComplete = jest.fn();
      const driver = mockAnimationDriver();
      
      const { result } = renderHook(() => 
        useSpringAnimation({ from: 0, to: 1, onComplete })
      );
      
      act(() => {
        result.current.trigger();
      });
      
      driver.runAnimation(300);
      
      expect(result.current.value.value).toBe(1);
      expect(onComplete).toHaveBeenCalled();
      
      driver.cleanup();
    });

    it('should use timing on web platform', () => {
      Platform.OS = 'web';
      
      const { result } = renderHook(() => 
        useSpringAnimation({ from: 0, to: 1 })
      );
      
      act(() => {
        result.current.trigger();
      });
      
      // On web, should use timing instead of spring
      expect(result.current.value.value).toBeDefined();
    });

    it('should skip animation when disabled', () => {
      mockStore.mockReturnValue({
        enableAnimations: false,
        animationSpeed: 1,
        prefersReducedMotion: false,
      });
      
      const onComplete = jest.fn();
      
      const { result } = renderHook(() => 
        useSpringAnimation({ from: 0, to: 1, onComplete })
      );
      
      act(() => {
        result.current.trigger();
      });
      
      expect(result.current.value.value).toBe(1);
      expect(onComplete).toHaveBeenCalled();
    });

    it('should respect custom spring config', () => {
      const { result } = renderHook(() => 
        useSpringAnimation({ 
          from: 0, 
          to: 1,
          springConfig: {
            damping: 10,
            mass: 1,
            stiffness: 100,
          }
        })
      );
      
      act(() => {
        result.current.trigger();
      });
      
      expect(result.current.value).toBeDefined();
    });
  });

  describe('Cross-platform consistency', () => {
    it('should provide consistent API across platforms', () => {
      const platforms: ('ios' | 'android' | 'web')[] = ['ios', 'android', 'web'];
      
      platforms.forEach(platform => {
        Platform.OS = platform;
        
        const { result } = renderHook(() => useAnimation('fadeIn'));
        
        // All platforms should have trigger and isAnimating
        expect(result.current.trigger).toBeInstanceOf(Function);
        expect(result.current.isAnimating).toBe(false);
        
        // Platform-specific properties
        if (platform === 'web') {
          expect(result.current.className).toBeDefined();
          expect(result.current.animatedStyle).toBeUndefined();
        } else {
          expect(result.current.animatedStyle).toBeDefined();
          expect(result.current.className).toBeUndefined();
        }
      });
    });

    it('should handle animation speed modifier', () => {
      mockStore.mockReturnValue({
        enableAnimations: true,
        animationSpeed: 2, // 2x speed
        prefersReducedMotion: false,
      });

      const { result } = renderHook(() => 
        useAnimation('fadeIn', { duration: 'normal' })
      );

      // Duration should be halved with 2x speed
      if (Platform.OS === 'web') {
        expect(result.current.className).toContain('duration-150'); // 300ms / 2
      }
    });
  });
});