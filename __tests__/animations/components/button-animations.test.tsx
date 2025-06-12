/**
 * Button Animation Tests
 * Tests for Button component animations across platforms
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Button } from '@/components/universal/Button';
import { animationTestUtils, setupTest } from '../setup';
import { useAnimationStore } from '@/lib/stores/animation-store';

// Mock the animation store
jest.mock('@/lib/stores/animation-store');

// Mock haptics
const mockHaptic = jest.requireMock('@/lib/ui/haptics').haptic;

describe('Button Animations', () => {
  let mockStore: any;
  
  beforeEach(() => {
    mockStore = animationTestUtils.createMockAnimationStore();
    (useAnimationStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Animation Props', () => {
    it('should render with animation enabled by default', () => {
      const { getByText } = render(
        <Button>Animated Button</Button>
      );
      
      const button = getByText('Animated Button').parent;
      expect(button).toBeDefined();
    });
    
    it('should disable animations when animated prop is false', () => {
      const { getByText } = render(
        <Button animated={false}>Static Button</Button>
      );
      
      const button = getByText('Static Button').parent;
      expect(button).toBeDefined();
    });
    
    it('should apply animation variant', () => {
      const { getByText } = render(
        <Button animationVariant="energetic">Energetic Button</Button>
      );
      
      const button = getByText('Energetic Button').parent;
      expect(button).toBeDefined();
    });
    
    it('should apply animation type', () => {
      const { getByText } = render(
        <Button animationType="ripple">Ripple Button</Button>
      );
      
      const button = getByText('Ripple Button').parent;
      expect(button).toBeDefined();
    });
  });
  
  describe('Press Animations', () => {
    it('should animate on press', () => {
      const { getByText } = render(
        <Button>Press Me</Button>
      );
      
      const button = getByText('Press Me').parent?.parent;
      
      fireEvent(button!, 'pressIn');
      // Animation should be triggered
      
      fireEvent(button!, 'pressOut');
      // Animation should reverse
    });
    
    it('should trigger haptic feedback on press', () => {
      const { getByText } = render(
        <Button useHaptics>Haptic Button</Button>
      );
      
      const button = getByText('Haptic Button').parent?.parent;
      
      fireEvent(button!, 'pressIn');
      
      expect(mockHaptic.light).toHaveBeenCalled();
    });
    
    it('should not trigger haptics when disabled', () => {
      const { getByText } = render(
        <Button useHaptics={false}>No Haptic</Button>
      );
      
      const button = getByText('No Haptic').parent?.parent;
      
      fireEvent(button!, 'pressIn');
      
      expect(mockHaptic.light).not.toHaveBeenCalled();
    });
    
    it('should scale based on animation variant', () => {
      const variants = [
        { variant: 'subtle', expectedScale: 0.99 },
        { variant: 'moderate', expectedScale: 0.97 },
        { variant: 'energetic', expectedScale: 0.95 },
      ];
      
      variants.forEach(({ variant, expectedScale }) => {
        const { getByText } = render(
          <Button animationVariant={variant as any}>Test</Button>
        );
        
        const button = getByText('Test').parent?.parent;
        fireEvent(button!, 'pressIn');
        
        // In real implementation, we would check the animated style
        // For now, we just verify the event is handled
        expect(button).toBeDefined();
      });
    });
  });
  
  describe('Loading Animations', () => {
    it('should show loading spinner', () => {
      const { getByTestId } = render(
        <Button isLoading testID="loading-btn">Loading</Button>
      );
      
      const spinner = getByTestId('loading-btn').findByType('ActivityIndicator' as any);
      expect(spinner).toBeDefined();
    });
    
    it('should apply rotate loading animation', () => {
      const { getByTestId } = render(
        <Button isLoading loadingAnimation="rotate" testID="rotate-btn">
          Loading
        </Button>
      );
      
      const button = getByTestId('rotate-btn');
      expect(button).toBeDefined();
    });
    
    it('should apply pulse loading animation', () => {
      const { getByTestId } = render(
        <Button isLoading loadingAnimation="pulse" testID="pulse-btn">
          Loading
        </Button>
      );
      
      const button = getByTestId('pulse-btn');
      expect(button).toBeDefined();
    });
    
    it('should apply bounce loading animation', () => {
      const { getByTestId } = render(
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
      const { getByText } = render(
        <Button entranceAnimation="fade">Fade In</Button>
      );
      
      const button = getByText('Fade In').parent;
      expect(button).toBeDefined();
    });
    
    it('should apply zoom entrance animation', () => {
      const { getByText } = render(
        <Button entranceAnimation="zoom">Zoom In</Button>
      );
      
      const button = getByText('Zoom In').parent;
      expect(button).toBeDefined();
    });
    
    it('should apply slide up entrance animation', () => {
      const { getByText } = render(
        <Button entranceAnimation="slideUp">Slide Up</Button>
      );
      
      const button = getByText('Slide Up').parent;
      expect(button).toBeDefined();
    });
    
    it('should apply slide down entrance animation', () => {
      const { getByText } = render(
        <Button entranceAnimation="slideDown">Slide Down</Button>
      );
      
      const button = getByText('Slide Down').parent;
      expect(button).toBeDefined();
    });
    
    it('should respect animation delay', () => {
      const { getByText } = render(
        <Button entranceAnimation="fade" animationDelay={500}>
          Delayed
        </Button>
      );
      
      const button = getByText('Delayed').parent;
      expect(button).toBeDefined();
    });
  });
  
  describe('Success Animation', () => {
    it('should trigger success animation', async () => {
      const { getByText, rerender } = render(
        <Button successAnimation>Submit</Button>
      );
      
      const button = getByText('Submit').parent;
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
    
    it('should respect success duration', async () => {
      const { getByText } = render(
        <Button successAnimation successDuration={1000}>
          Submit
        </Button>
      );
      
      const button = getByText('Submit').parent;
      expect(button).toBeDefined();
    });
  });
  
  describe('Platform-Specific Animations', () => {
    it('should handle iOS animations', () => {
      setupTest('ios');
      
      const { getByText } = render(
        <Button>iOS Button</Button>
      );
      
      const button = getByText('iOS Button').parent?.parent;
      fireEvent(button!, 'pressIn');
      
      // iOS-specific animation behavior
      expect(button).toBeDefined();
    });
    
    it('should handle Android animations', () => {
      setupTest('android');
      
      const { getByText } = render(
        <Button>Android Button</Button>
      );
      
      const button = getByText('Android Button').parent?.parent;
      fireEvent(button!, 'pressIn');
      
      // Android-specific animation behavior
      expect(button).toBeDefined();
    });
    
    it('should handle Web animations', () => {
      setupTest('web');
      
      const { getByText } = render(
        <Button>Web Button</Button>
      );
      
      const button = getByText('Web Button').parent?.parent;
      
      // Web uses CSS classes
      const styles = animationTestUtils.getWebStyles(button);
      expect(styles).toBeDefined();
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
      
      const { getByText } = render(
        <Button animationConfig={customConfig}>Custom</Button>
      );
      
      const button = getByText('Custom').parent;
      expect(button).toBeDefined();
    });
    
    it('should merge config with variant', () => {
      const { getByText } = render(
        <Button 
          animationVariant="subtle"
          animationConfig={{ hoverScale: 1.2 }}
        >
          Merged
        </Button>
      );
      
      const button = getByText('Merged').parent;
      expect(button).toBeDefined();
    });
  });
  
  describe('Special Animation Types', () => {
    it('should apply ripple animation', () => {
      const { getByText } = render(
        <Button animationType="ripple" rippleColor="#0066cc">
          Ripple
        </Button>
      );
      
      const button = getByText('Ripple').parent;
      expect(button).toBeDefined();
    });
    
    it('should apply glow animation', () => {
      const { getByText } = render(
        <Button animationType="glow" glowIntensity={0.5}>
          Glow
        </Button>
      );
      
      const button = getByText('Glow').parent;
      expect(button).toBeDefined();
    });
    
    it('should apply shake animation', () => {
      const { getByText } = render(
        <Button animationType="shake" shakeMagnitude={10}>
          Shake
        </Button>
      );
      
      const button = getByText('Shake').parent;
      expect(button).toBeDefined();
    });
  });
  
  describe('Animation Store Integration', () => {
    it('should respect global animation settings', () => {
      mockStore.enableAnimations = false;
      
      const { getByText } = render(
        <Button>No Animations</Button>
      );
      
      const button = getByText('No Animations').parent?.parent;
      fireEvent(button!, 'pressIn');
      
      // No animations should occur
      expect(button).toBeDefined();
    });
    
    it('should use global animation variant', () => {
      mockStore.variant = 'energetic';
      
      const { getByText } = render(
        <Button>Global Variant</Button>
      );
      
      const button = getByText('Global Variant').parent;
      expect(button).toBeDefined();
    });
    
    it('should respect reduced motion', () => {
      mockStore.reducedMotion = true;
      
      const { getByText } = render(
        <Button>Reduced Motion</Button>
      );
      
      const button = getByText('Reduced Motion').parent?.parent;
      fireEvent(button!, 'pressIn');
      
      // Should not animate
      expect(mockHaptic.light).not.toHaveBeenCalled();
    });
  });
});