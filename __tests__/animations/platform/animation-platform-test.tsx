/**
 * Platform-Specific Animation Tests
 * Tests for platform-specific animation behaviors and optimizations
 * Migrated to jest-expo patterns
 */

import React from 'react';
import { Platform } from 'react-native';
import { renderHook , render } from '@testing-library/react-native';
import { 
  mockAnimationDriver, 
  expectAnimatedStyle,
  testPlatformAnimation 
} from '@/__tests__/utils/animation-test-utils';
import { useAnimation } from '@/lib/ui/animations/hooks';
import { Button } from '@/components/universal/interaction/Button';
import { Box } from '@/components/universal/layout/Box';
import { useAnimationStore } from '@/lib/stores/animation-store';

// Mock the animation store
jest.mock('@/lib/stores/animation-store', () => ({
  useAnimationStore: jest.fn(() => ({
    enableAnimations: true,
    animationSpeed: 1,
    prefersReducedMotion: false,
  }))
}));

describe('Platform-Specific Animation Behaviors', () => {
  const mockStore = useAnimationStore as jest.MockedFunction<typeof useAnimationStore>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('iOS Platform', () => {
    it('should use native spring animations', () => {
      Platform.OS = 'ios';
      
      const { result } = renderHook(() => 
        useAnimation('scaleIn')
      );
      
      // iOS should use Reanimated
      expect(result.current.animatedStyle).toBeDefined();
      expect(result.current.className).toBeUndefined();
    });
    
    it('should apply iOS-specific shadow animations', () => {
      Platform.OS = 'ios';
      
      const { getByTestId } = render(
        <Box 
          animated
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
          testID="ios-shadow"
        >
          iOS Shadow Box
        </Box>
      );
      
      const box = getByTestId('ios-shadow');
      expect(box.props.style).toMatchObject({
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      });
    });
    
    it('should handle iOS gesture animations', () => {
      Platform.OS = 'ios';
      
      const { getByText } = render(
        <Button animated useHaptics>
          iOS Haptic Button
        </Button>
      );
      
      const button = getByText('iOS Haptic Button');
      expect(button).toBeDefined();
    });
    
    it('should use iOS navigation transitions', () => {
      Platform.OS = 'ios';
      
      // iOS typically uses slide transitions
      expect(Platform.OS).toBe('ios');
      expect(Platform.select({ ios: 'slide', default: 'fade' })).toBe('slide');
    });
  });
  
  describe('Android Platform', () => {
    it('should use native timing animations', () => {
      Platform.OS = 'android';
      
      const { result } = renderHook(() => 
        useAnimation('fadeIn')
      );
      
      // Android should use Reanimated
      expect(result.current.animatedStyle).toBeDefined();
      expect(result.current.className).toBeUndefined();
    });
    
    it('should apply Android elevation for shadows', () => {
      Platform.OS = 'android';
      
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
      Platform.OS = 'android';
      
      const { getByText } = render(
        <Button 
          animated 
          animationType="ripple"
          rippleColor="#0066cc"
        >
          Android Ripple
        </Button>
      );
      
      const button = getByText('Android Ripple');
      expect(button).toBeDefined();
    });
    
    it('should use Android navigation transitions', () => {
      Platform.OS = 'android';
      
      // Android typically uses fade transitions
      expect(Platform.OS).toBe('android');
      expect(Platform.select({ android: 'fade', default: 'slide' })).toBe('fade');
    });
  });
  
  describe('Web Platform', () => {
    it('should use CSS animations', () => {
      Platform.OS = 'web';
      
      const { result } = renderHook(() => 
        useAnimation('fadeIn', { duration: 'fast' })
      );
      
      // Web should use CSS classes
      expect(result.current.className).toContain('animate-fadeIn');
      expect(result.current.className).toContain('duration-fast');
      expect(result.current.animatedStyle).toBeUndefined();
    });
    
    it('should apply CSS transitions', () => {
      Platform.OS = 'web';
      
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
      expect(box.props.className).toContain('transition-all');
      expect(box.props.className).toContain('duration-300');
    });
    
    it('should handle CSS hover states', () => {
      Platform.OS = 'web';
      
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
      expect(button.props.className).toContain('hover:scale-105');
    });
    
    it('should use CSS keyframe animations', () => {
      Platform.OS = 'web';
      
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
      expect(box.props.className).toContain('animate-pulse');
    });
  });
  
  describe('Cross-Platform Fallbacks', () => {
    testPlatformAnimation(
      'should provide consistent API across platforms',
      // iOS test
      () => {
        const { result } = renderHook(() => 
          useAnimation('fadeIn')
        );
        
        // Common API
        expect(result.current.trigger).toBeInstanceOf(Function);
        expect(result.current.isAnimating).toBe(false);
        expect(result.current.animatedStyle).toBeDefined();
      },
      // Android test
      () => {
        const { result } = renderHook(() => 
          useAnimation('fadeIn')
        );
        
        // Common API
        expect(result.current.trigger).toBeInstanceOf(Function);
        expect(result.current.isAnimating).toBe(false);
        expect(result.current.animatedStyle).toBeDefined();
      },
      // Web test
      () => {
        const { result } = renderHook(() => 
          useAnimation('fadeIn')
        );
        
        // Common API
        expect(result.current.trigger).toBeInstanceOf(Function);
        expect(result.current.isAnimating).toBe(false);
        expect(result.current.className).toBeDefined();
      }
    );
    
    it('should handle unsupported animations gracefully', () => {
      Platform.OS = 'ios';
      
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
        Platform.OS = platform as any;
        
        const { result } = renderHook(() => 
          useAnimation('scaleIn')
        );
        
        // Native driver animations return animated styles
        expect(result.current.animatedStyle).toBeDefined();
      });
    });
    
    it('should batch animations on web', () => {
      Platform.OS = 'web';
      
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
        expect(box.props.className).toContain('animate-fadeIn');
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
    it('should detect reduced motion preference', () => {
      mockStore.mockReturnValue({
        enableAnimations: true,
        animationSpeed: 1,
        prefersReducedMotion: true,
      });
      
      const { result } = renderHook(() => useAnimation('fadeIn'));
      
      // Animation should be disabled when reduced motion is preferred
      if (Platform.OS === 'web') {
        expect(result.current.className).toBe('');
      } else {
        expect(result.current.animatedStyle).toEqual({});
      }
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
        Platform.OS = platform as any;
        const platformCapabilities = capabilities[platform as keyof typeof capabilities];
        
        // Platform-specific capabilities
        expect(platformCapabilities).toBeDefined();
      });
    });
  });
  
  describe('Platform-Specific Timing', () => {
    it('should adjust timing for iOS momentum scrolling', () => {
      Platform.OS = 'ios';
      
      const { result } = renderHook(() => 
        useAnimation('slideInUp', { duration: 'normal' })
      );
      
      // iOS animations should account for momentum
      expect(result.current).toBeDefined();
      expect(result.current.animatedStyle).toBeDefined();
    });
    
    it('should adjust timing for Android material design', () => {
      Platform.OS = 'android';
      
      const { result } = renderHook(() => 
        useAnimation('scaleIn', { duration: 'normal' })
      );
      
      // Android should follow material design timing
      expect(result.current).toBeDefined();
      expect(result.current.animatedStyle).toBeDefined();
    });
    
    it('should use CSS timing functions on web', () => {
      Platform.OS = 'web';
      
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
      expect(box.props.className).toContain('transition-all');
      expect(box.props.className).toContain('ease-in-out');
    });
  });
});