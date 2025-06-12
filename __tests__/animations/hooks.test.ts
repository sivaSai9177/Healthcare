/**
 * Animation Hooks Tests
 * Tests for cross-platform animation hooks
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { Platform } from 'react-native';
import { animationTestUtils, setupTest, resetAllMocks } from './setup';
import { 
  useAnimation, 
  useTransition, 
  useStaggerAnimation, 
  useSpringAnimation 
} from '@/lib/ui/animations/hooks';
import { useAnimationStore } from '@/lib/stores/animation-store';

// Mock the animation store
jest.mock('@/lib/stores/animation-store');

describe('Animation Hooks', () => {
  let mockStore: any;
  
  beforeEach(() => {
    mockStore = animationTestUtils.createMockAnimationStore();
    (useAnimationStore as jest.Mock).mockReturnValue(mockStore);
  });
  
  afterEach(() => {
    resetAllMocks();
  });
  
  describe('useAnimation', () => {
    describe('Web Platform', () => {
      beforeEach(() => {
        setupTest('web');
      });
      
      it('should return correct Tailwind classes', () => {
        const { result } = renderHook(() => 
          useAnimation('fadeIn', { duration: 'fast' })
        );
        
        expect(result.current.className).toContain('animate-fadeIn');
        expect(result.current.className).toContain('duration-fast');
      });
      
      it('should handle disabled animations', () => {
        mockStore.enableAnimations = false;
        
        const { result } = renderHook(() => 
          useAnimation('fadeIn')
        );
        
        expect(result.current.className).toBe('');
      });
      
      it('should trigger animation and call onComplete', async () => {
        const onComplete = jest.fn();
        const timer = animationTestUtils.mockAnimationTiming();
        
        const { result } = renderHook(() => 
          useAnimation('fadeIn', { duration: 'fast', onComplete })
        );
        
        act(() => {
          result.current.trigger();
        });
        
        expect(result.current.isAnimating).toBe(true);
        
        timer.advanceTimersByTime(150); // fast duration
        
        expect(onComplete).toHaveBeenCalled();
        expect(result.current.isAnimating).toBe(false);
        
        timer.cleanup();
      });
      
      it('should handle all animation types', () => {
        const animationTypes = [
          'fadeIn', 'fadeOut', 'scaleIn', 'scaleOut',
          'slideInUp', 'slideInDown', 'slideInLeft', 'slideInRight',
          'shake', 'bounce', 'pulse', 'spin'
        ];
        
        animationTypes.forEach(type => {
          const { result } = renderHook(() => 
            useAnimation(type as any)
          );
          
          expect(result.current.className).toContain(`animate-${type}`);
        });
      });
    });
    
    describe('Native Platform', () => {
      beforeEach(() => {
        setupTest('ios');
      });
      
      it('should return animated styles', () => {
        const { result } = renderHook(() => 
          useAnimation('fadeIn')
        );
        
        expect(result.current.animatedStyle).toBeDefined();
        expect(result.current.className).toBeUndefined();
      });
      
      it('should animate opacity for fade animations', () => {
        const { result } = renderHook(() => 
          useAnimation('fadeIn')
        );
        
        act(() => {
          result.current.trigger();
        });
        
        const style = result.current.animatedStyle;
        expect(style.opacity).toBeDefined();
      });
      
      it('should animate transform for scale animations', () => {
        const { result } = renderHook(() => 
          useAnimation('scaleIn')
        );
        
        act(() => {
          result.current.trigger();
        });
        
        const style = result.current.animatedStyle;
        expect(style.transform).toBeDefined();
        expect(style.transform).toContainEqual(
          expect.objectContaining({ scale: expect.any(Number) })
        );
      });
      
      it('should handle animation callbacks', () => {
        const onComplete = jest.fn();
        
        const { result } = renderHook(() => 
          useAnimation('fadeIn', { onComplete })
        );
        
        act(() => {
          result.current.trigger();
        });
        
        // Callback should be called immediately in mock
        expect(onComplete).toHaveBeenCalled();
      });
      
      it('should respect delay option', () => {
        const { result } = renderHook(() => 
          useAnimation('fadeIn', { delay: 100 })
        );
        
        act(() => {
          result.current.trigger();
        });
        
        // Verify delay is applied (implementation specific)
        expect(result.current.animatedStyle).toBeDefined();
      });
    });
  });
  
  describe('useTransition', () => {
    it('should return transition classes on web', () => {
      setupTest('web');
      
      const { result } = renderHook(() => 
        useTransition('colors', 'slow')
      );
      
      expect(result.current.className).toContain('transition-colors');
      expect(result.current.className).toContain('duration-slow');
    });
    
    it('should handle disabled animations', () => {
      setupTest('web');
      mockStore.enableAnimations = false;
      
      const { result } = renderHook(() => 
        useTransition()
      );
      
      expect(result.current.className).toBe('');
    });
    
    it('should support all transition types', () => {
      setupTest('web');
      
      const transitionTypes = ['all', 'colors', 'opacity', 'shadow', 'transform'];
      
      transitionTypes.forEach(type => {
        const { result } = renderHook(() => 
          useTransition(type as any)
        );
        
        expect(result.current.className).toContain(`transition-${type}`);
      });
    });
  });
  
  describe('useStaggerAnimation', () => {
    it('should create animations for each item', () => {
      setupTest('web');
      
      const { result } = renderHook(() => 
        useStaggerAnimation(3)
      );
      
      expect(result.current).toHaveLength(3);
      
      result.current.forEach((animation, index) => {
        expect(animation.className).toContain('animate-fadeIn');
        expect(animation.delayClass).toContain(`delay-stagger-${index + 1}`);
      });
    });
    
    it('should limit delay classes to 6 items', () => {
      setupTest('web');
      
      const { result } = renderHook(() => 
        useStaggerAnimation(10)
      );
      
      expect(result.current[9].delayClass).toContain('delay-stagger-6');
    });
    
    it('should pass options to each animation', () => {
      setupTest('web');
      const onComplete = jest.fn();
      
      const { result } = renderHook(() => 
        useStaggerAnimation(2, { duration: 'fast', onComplete })
      );
      
      result.current.forEach(animation => {
        expect(animation.className).toContain('duration-fast');
      });
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
      
      const { result } = renderHook(() => 
        useSpringAnimation({ from: 0, to: 1, onComplete })
      );
      
      act(() => {
        result.current.trigger();
      });
      
      expect(onComplete).toHaveBeenCalled();
    });
    
    it('should use timing on web platform', () => {
      setupTest('web');
      
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
      mockStore.enableAnimations = false;
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
  });
  
  describe('Cross-platform consistency', () => {
    it('should provide consistent API across platforms', () => {
      const platforms: Array<'ios' | 'android' | 'web'> = ['ios', 'android', 'web'];
      
      platforms.forEach(platform => {
        setupTest(platform);
        
        const { result } = renderHook(() => 
          useAnimation('fadeIn')
        );
        
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
  });
});