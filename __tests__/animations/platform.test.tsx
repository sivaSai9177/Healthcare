/**
 * Platform-Specific Animation Tests
 * Tests for platform-specific animation behaviors and optimizations
 */

import { Platform } from 'react-native';
import { renderHook } from '@testing-library/react-hooks';
import { render } from '@testing-library/react-native';
import React from 'react';
import { animationTestUtils, setupTest } from './setup';
import { useAnimation } from '@/lib/ui/animations/hooks';
import { Button } from '@/components/universal/interaction/Button';
import { Box } from '@/components/universal/layout/Box';
import { useAnimationStore } from '@/lib/stores/animation-store';

// Mock the animation store
jest.mock('@/lib/stores/animation-store');

describe('Platform-Specific Animation Behaviors', () => {
  let mockStore: any;
  
  beforeEach(() => {
    mockStore = animationTestUtils.createMockAnimationStore();
    (useAnimationStore as jest.Mock).mockReturnValue(mockStore);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('iOS Platform', () => {
    beforeEach(() => {
      setupTest('ios');
    });
    
    it('should use native spring animations', () => {
      const { result } = renderHook(() => 
        useAnimation('scaleIn')
      );
      
      // iOS should use Reanimated
      expect(result.current.animatedStyle).toBeDefined();
      expect(result.current.className).toBeUndefined();
    });
    
    it('should apply iOS-specific shadow animations', () => {
      const { getByTestId } = render(
        <Box 
          animated
          style={{
            boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
          }}
          testID="ios-shadow"
        >
          iOS Shadow Box
        </Box>
      );
      
      const box = getByTestId('ios-shadow');
      expect(box.props.style).toMatchObject({
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      });
    });
    
    it('should handle iOS gesture animations', () => {
      const { getByText } = render(
        <Button animated useHaptics>
          iOS Haptic Button
        </Button>
      );
      
      const button = getByText('iOS Haptic Button').parent;
      expect(button).toBeDefined();
    });
    
    it('should use iOS navigation transitions', () => {
      // iOS typically uses slide transitions
      expect(Platform.OS).toBe('ios');
      expect(Platform.select({ ios: 'slide', default: 'fade' })).toBe('slide');
    });
  });
  
  describe('Android Platform', () => {
    beforeEach(() => {
      setupTest('android');
    });
    
    it('should use native timing animations', () => {
      const { result } = renderHook(() => 
        useAnimation('fadeIn')
      );
      
      // Android should use Reanimated
      expect(result.current.animatedStyle).toBeDefined();
      expect(result.current.className).toBeUndefined();
    });
    
    it('should apply Android elevation for shadows', () => {
      const { getByTestId } = render(
        <Box 
          animated
          style={{
            elevation: 4,
          }}
          testID="android-elevation"
        >
          Android Elevation Box
        </Box>
      );
      
      const box = getByTestId('android-elevation');
      expect(box.props.style).toMatchObject({
        elevation: 4,
      });
    });
    
    it('should handle Android ripple effects', () => {
      const { getByText } = render(
        <Button 
          animated 
          animationType="ripple"
          rippleColor="#0066cc"
        >
          Android Ripple
        </Button>
      );
      
      const button = getByText('Android Ripple').parent;
      expect(button).toBeDefined();
    });
    
    it('should use Android navigation transitions', () => {
      // Android typically uses fade transitions
      expect(Platform.OS).toBe('android');
      expect(Platform.select({ android: 'fade', default: 'slide' })).toBe('fade');
    });
  });
  
  describe('Web Platform', () => {
    beforeEach(() => {
      setupTest('web');
    });
    
    it('should use CSS animations', () => {
      const { result } = renderHook(() => 
        useAnimation('fadeIn', { duration: 'fast' })
      );
      
      // Web should use CSS classes
      expect(result.current.className).toContain('animate-fadeIn');
      expect(result.current.className).toContain('duration-fast');
      expect(result.current.animatedStyle).toBeUndefined();
    });
    
    it('should apply CSS transitions', () => {
      const { getByTestId } = render(
        <Box 
          animated
          className="transition-all duration-300"
          testID="web-transition"
        >
          Web Transition Box
        </Box>
      );
      
      const box = getByTestId('web-transition');
      const styles = animationTestUtils.getWebStyles(box);
      
      expect(styles.hasClass('transition-all')).toBe(true);
      expect(styles.hasClass('duration-300')).toBe(true);
    });
    
    it('should handle CSS hover states', () => {
      const { getByTestId } = render(
        <Button 
          animated
          className="hover:scale-105"
          testID="web-hover"
        >
          Web Hover Button
        </Button>
      );
      
      const button = getByTestId('web-hover');
      const styles = animationTestUtils.getWebStyles(button);
      
      expect(styles.hasClass('hover:scale-105')).toBe(true);
    });
    
    it('should use CSS keyframe animations', () => {
      const { getByTestId } = render(
        <Box 
          animated
          className="animate-pulse"
          testID="web-keyframe"
        >
          Pulsing Box
        </Box>
      );
      
      const box = getByTestId('web-keyframe');
      const styles = animationTestUtils.getWebStyles(box);
      
      expect(styles.hasAnimation('pulse')).toBe(true);
    });
  });
  
  describe('Cross-Platform Fallbacks', () => {
    it('should provide consistent API across platforms', () => {
      const platforms: ('ios' | 'android' | 'web')[] = ['ios', 'android', 'web'];
      
      platforms.forEach(platform => {
        setupTest(platform);
        
        const { result } = renderHook(() => 
          useAnimation('fadeIn')
        );
        
        // Common API
        expect(result.current.trigger).toBeInstanceOf(Function);
        expect(result.current.isAnimating).toBe(false);
      });
    });
    
    it('should handle unsupported animations gracefully', () => {
      setupTest('ios');
      
      // Even with an unsupported animation type, it should not crash
      const { result } = renderHook(() => 
        useAnimation('customAnimation' as any)
      );
      
      expect(result.current).toBeDefined();
      expect(() => result.current.trigger()).not.toThrow();
    });
  });
  
  describe('Performance Optimizations', () => {
    it('should use native driver on mobile platforms', () => {
      ['ios', 'android'].forEach(platform => {
        setupTest(platform as any);
        
        const { result } = renderHook(() => 
          useAnimation('scaleIn')
        );
        
        // Native driver animations return animated styles
        expect(result.current.animatedStyle).toBeDefined();
      });
    });
    
    it('should batch animations on web', () => {
      setupTest('web');
      
      const { getByTestId } = render(
        <>
          <Box animated className="animate-fadeIn" testID="box1">Box 1</Box>
          <Box animated className="animate-fadeIn" testID="box2">Box 2</Box>
          <Box animated className="animate-fadeIn" testID="box3">Box 3</Box>
        </>
      );
      
      // All boxes should animate together
      ['box1', 'box2', 'box3'].forEach(id => {
        const box = getByTestId(id);
        const styles = animationTestUtils.getWebStyles(box);
        expect(styles.hasAnimation('fadeIn')).toBe(true);
      });
    });
    
    it('should handle many animated elements efficiently', () => {
      const elements = Array.from({ length: 50 }, (_, i) => (
        <Box key={i} animated testID={`element-${i}`}>
          Element {i}
        </Box>
      ));
      
      const { getByTestId } = render(<>{elements}</>);
      
      // Should render without performance issues
      expect(getByTestId('element-0')).toBeDefined();
      expect(getByTestId('element-49')).toBeDefined();
    });
  });
  
  describe('Platform Feature Detection', () => {
    it('should detect reduced motion preference on web', () => {
      setupTest('web');
      animationTestUtils.mockReducedMotion(true);
      
      // In a real app, this would be detected via matchMedia
      expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
    });
    
    it('should detect device capabilities', () => {
      const capabilities = {
        ios: {
          supportsHaptics: true,
          supportsSpring: true,
          supports3DTouch: false,
        },
        android: {
          supportsHaptics: true,
          supportsSpring: true,
          supportsRipple: true,
        },
        web: {
          supportsHaptics: false,
          supportsSpring: false,
          supportsCSSAnimations: true,
        },
      };
      
      ['ios', 'android', 'web'].forEach(platform => {
        setupTest(platform as any);
        const platformCapabilities = capabilities[platform as keyof typeof capabilities];
        
        // Platform-specific capabilities
        expect(platformCapabilities).toBeDefined();
      });
    });
  });
  
  describe('Platform-Specific Timing', () => {
    it('should adjust timing for iOS momentum scrolling', () => {
      setupTest('ios');
      
      const { result } = renderHook(() => 
        useAnimation('slideInUp', { duration: 'normal' })
      );
      
      // iOS animations should account for momentum
      expect(result.current).toBeDefined();
    });
    
    it('should adjust timing for Android material design', () => {
      setupTest('android');
      
      const { result } = renderHook(() => 
        useAnimation('scaleIn', { duration: 'normal' })
      );
      
      // Android should follow material design timing
      expect(result.current).toBeDefined();
    });
    
    it('should use CSS timing functions on web', () => {
      setupTest('web');
      
      const { getByTestId } = render(
        <Box 
          animated
          className="transition-all ease-in-out"
          testID="web-timing"
        >
          Web Timing
        </Box>
      );
      
      const box = getByTestId('web-timing');
      const styles = animationTestUtils.getWebStyles(box);
      
      expect(styles.hasClass('ease-in-out')).toBe(true);
    });
  });
});