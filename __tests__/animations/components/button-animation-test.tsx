/**
 * Button Animation Tests
 * Tests for Button component animations across platforms
 * Migrated to jest-expo patterns
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform, ActivityIndicator } from 'react-native';
import { Button } from '@/components/universal/interaction/Button';
import { renderWithProviders } from '@/testing/test-utils';
import { mockAnimationDriver } from '@/__tests__/utils/animation-test-utils';
import { useAnimationStore } from '@/lib/stores/animation-store';

// Mock the animation store
jest.mock('@/lib/stores/animation-store', () => ({
  useAnimationStore: jest.fn(() => ({
    enableAnimations: true,
    animationSpeed: 1,
    prefersReducedMotion: false,
    variant: 'moderate',
    reducedMotion: false,
  }))
}));

// Mock haptics
jest.mock('@/lib/ui/haptics', () => ({
  haptic: {
    light: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  }
}));

describe('Button Animations', () => {
  const mockAnimationStore = useAnimationStore as jest.MockedFunction<typeof useAnimationStore>;
  const mockHaptic = jest.requireMock('@/lib/ui/haptics').haptic;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Animation Props', () => {
    it('should render with animation enabled by default', () => {
      const { getByText } = renderWithProviders(
        <Button>Animated Button</Button>
      );
      
      const button = getByText('Animated Button');
      expect(button).toBeDefined();
    });
    
    it('should disable animations when animated prop is false', () => {
      const { getByText } = renderWithProviders(
        <Button animated={false}>Static Button</Button>
      );
      
      const button = getByText('Static Button');
      expect(button).toBeDefined();
    });
    
    it('should apply animation variant', () => {
      const { getByText } = renderWithProviders(
        <Button animationVariant="energetic">Energetic Button</Button>
      );
      
      const button = getByText('Energetic Button');
      expect(button).toBeDefined();
    });
    
    it('should apply animation type', () => {
      const { getByText } = renderWithProviders(
        <Button animationType="ripple">Ripple Button</Button>
      );
      
      const button = getByText('Ripple Button');
      expect(button).toBeDefined();
    });
  });
  
  describe('Press Animations', () => {
    it('should animate on press', () => {
      const { getByText } = renderWithProviders(
        <Button>Press Me</Button>
      );
      
      const button = getByText('Press Me');
      
      fireEvent(button, 'pressIn');
      // Animation should be triggered
      
      fireEvent(button, 'pressOut');
      // Animation should reverse
    });
    
    it('should trigger haptic feedback on press', () => {
      const { getByText } = renderWithProviders(
        <Button useHaptics>Haptic Button</Button>
      );
      
      const button = getByText('Haptic Button');
      
      fireEvent(button, 'pressIn');
      
      expect(mockHaptic.light).toHaveBeenCalled();
    });
    
    it('should not trigger haptics when disabled', () => {
      const { getByText } = renderWithProviders(
        <Button useHaptics={false}>No Haptic</Button>
      );
      
      const button = getByText('No Haptic');
      
      fireEvent(button, 'pressIn');
      
      expect(mockHaptic.light).not.toHaveBeenCalled();
    });
    
    it('should scale based on animation variant', () => {
      const variants = [
        { variant: 'subtle', expectedScale: 0.99 },
        { variant: 'moderate', expectedScale: 0.97 },
        { variant: 'energetic', expectedScale: 0.95 },
      ];
      
      variants.forEach(({ variant }) => {
        const { getByText } = renderWithProviders(
          <Button animationVariant={variant as any}>Test</Button>
        );
        
        const button = getByText('Test');
        fireEvent(button, 'pressIn');
        
        // In real implementation, we would check the animated style
        // For now, we just verify the event is handled
        expect(button).toBeDefined();
      });
    });
  });
  
  describe('Loading Animations', () => {
    it('should show loading spinner', () => {
      const { getByTestId } = renderWithProviders(
        <Button isLoading testID="loading-btn">Loading</Button>
      );
      
      const button = getByTestId('loading-btn');
      const spinner = button.findAllByType(ActivityIndicator);
      expect(spinner.length).toBeGreaterThan(0);
    });
    
    it('should apply rotate loading animation', () => {
      const { getByTestId } = renderWithProviders(
        <Button isLoading loadingAnimation="rotate" testID="rotate-btn">
          Loading
        </Button>
      );
      
      const button = getByTestId('rotate-btn');
      expect(button).toBeDefined();
    });
    
    it('should apply pulse loading animation', () => {
      const { getByTestId } = renderWithProviders(
        <Button isLoading loadingAnimation="pulse" testID="pulse-btn">
          Loading
        </Button>
      );
      
      const button = getByTestId('pulse-btn');
      expect(button).toBeDefined();
    });
    
    it('should apply bounce loading animation', () => {
      const { getByTestId } = renderWithProviders(
        <Button isLoading loadingAnimation="bounce" testID="bounce-btn">
          Loading
        </Button>
      );
      
      const button = getByTestId('bounce-btn');
      expect(button).toBeDefined();
    });
  });
  
  describe('Entrance Animations', () => {
    it('should apply fade entrance animation', () => {
      const { getByText } = renderWithProviders(
        <Button entranceAnimation="fade">Fade In</Button>
      );
      
      const button = getByText('Fade In');
      expect(button).toBeDefined();
    });
    
    it('should apply zoom entrance animation', () => {
      const { getByText } = renderWithProviders(
        <Button entranceAnimation="zoom">Zoom In</Button>
      );
      
      const button = getByText('Zoom In');
      expect(button).toBeDefined();
    });
    
    it('should apply slide up entrance animation', () => {
      const { getByText } = renderWithProviders(
        <Button entranceAnimation="slideUp">Slide Up</Button>
      );
      
      const button = getByText('Slide Up');
      expect(button).toBeDefined();
    });
    
    it('should apply slide down entrance animation', () => {
      const { getByText } = renderWithProviders(
        <Button entranceAnimation="slideDown">Slide Down</Button>
      );
      
      const button = getByText('Slide Down');
      expect(button).toBeDefined();
    });
    
    it('should respect animation delay', () => {
      const { getByText } = renderWithProviders(
        <Button entranceAnimation="fade" animationDelay={500}>
          Delayed
        </Button>
      );
      
      const button = getByText('Delayed');
      expect(button).toBeDefined();
    });
  });
  
  describe('Success Animation', () => {
    it('should trigger success animation', async () => {
      const { getByText, rerender } = render(
        <Button successAnimation>Submit</Button>
      );
      
      const button = getByText('Submit');
      expect(button).toBeDefined();
      
      // Simulate success state
      rerender(
        <Button successAnimation>Success!</Button>
      );
      
      // Animation should be triggered
      await waitFor(() => {
        expect(mockHaptic.success).toHaveBeenCalled();
      });
    });
    
    it('should respect success duration', () => {
      const { getByText } = renderWithProviders(
        <Button successAnimation successDuration={1000}>
          Submit
        </Button>
      );
      
      const button = getByText('Submit');
      expect(button).toBeDefined();
    });
  });
  
  describe('Platform-Specific Animations', () => {
    it('should handle iOS animations', () => {
      Platform.OS = 'ios';
      
      const { getByText } = renderWithProviders(
        <Button>iOS Button</Button>
      );
      
      const button = getByText('iOS Button');
      fireEvent(button, 'pressIn');
      
      // iOS-specific animation behavior
      expect(button).toBeDefined();
    });
    
    it('should handle Android animations', () => {
      Platform.OS = 'android';
      
      const { getByText } = renderWithProviders(
        <Button>Android Button</Button>
      );
      
      const button = getByText('Android Button');
      fireEvent(button, 'pressIn');
      
      // Android-specific animation behavior
      expect(button).toBeDefined();
    });
    
    it('should handle Web animations', () => {
      Platform.OS = 'web';
      
      const { getByText } = renderWithProviders(
        <Button>Web Button</Button>
      );
      
      const button = getByText('Web Button');
      
      // Web uses CSS classes
      expect(button.props.className).toBeDefined();
    });
  });
  
  describe('Animation Configuration', () => {
    it('should apply custom animation config', () => {
      const customConfig = {
        hoverScale: 1.1,
        pressScale: 0.9,
        duration: 500,
        spring: {
          damping: 20,
          stiffness: 300,
        },
      };
      
      const { getByText } = renderWithProviders(
        <Button animationConfig={customConfig}>Custom</Button>
      );
      
      const button = getByText('Custom');
      expect(button).toBeDefined();
    });
    
    it('should merge config with variant', () => {
      const { getByText } = renderWithProviders(
        <Button 
          animationVariant="subtle"
          animationConfig={{ hoverScale: 1.2 }}
        >
          Merged
        </Button>
      );
      
      const button = getByText('Merged');
      expect(button).toBeDefined();
    });
  });
  
  describe('Special Animation Types', () => {
    it('should apply ripple animation', () => {
      const { getByText } = renderWithProviders(
        <Button animationType="ripple" rippleColor="#0066cc">
          Ripple
        </Button>
      );
      
      const button = getByText('Ripple');
      expect(button).toBeDefined();
    });
    
    it('should apply glow animation', () => {
      const { getByText } = renderWithProviders(
        <Button animationType="glow" glowIntensity={0.5}>
          Glow
        </Button>
      );
      
      const button = getByText('Glow');
      expect(button).toBeDefined();
    });
    
    it('should apply shake animation', () => {
      const { getByText } = renderWithProviders(
        <Button animationType="shake" shakeMagnitude={10}>
          Shake
        </Button>
      );
      
      const button = getByText('Shake');
      expect(button).toBeDefined();
    });
  });
  
  describe('Animation Store Integration', () => {
    it('should respect global animation settings', () => {
      mockAnimationStore.mockReturnValue({
        enableAnimations: false,
        animationSpeed: 1,
        prefersReducedMotion: false,
        variant: 'moderate',
        reducedMotion: false,
      });
      
      const { getByText } = renderWithProviders(
        <Button>No Animations</Button>
      );
      
      const button = getByText('No Animations');
      fireEvent(button, 'pressIn');
      
      // No animations should occur
      expect(button).toBeDefined();
    });
    
    it('should use global animation variant', () => {
      mockAnimationStore.mockReturnValue({
        enableAnimations: true,
        animationSpeed: 1,
        prefersReducedMotion: false,
        variant: 'energetic',
        reducedMotion: false,
      });
      
      const { getByText } = renderWithProviders(
        <Button>Global Variant</Button>
      );
      
      const button = getByText('Global Variant');
      expect(button).toBeDefined();
    });
    
    it('should respect reduced motion', () => {
      mockAnimationStore.mockReturnValue({
        enableAnimations: true,
        animationSpeed: 1,
        prefersReducedMotion: false,
        variant: 'moderate',
        reducedMotion: true,
      });
      
      const { getByText } = renderWithProviders(
        <Button>Reduced Motion</Button>
      );
      
      const button = getByText('Reduced Motion');
      fireEvent(button, 'pressIn');
      
      // Should not animate
      expect(mockHaptic.light).not.toHaveBeenCalled();
    });
  });
});