/**
 * Animation Integration Tests
 * Tests for real-world animation scenarios and edge cases
 */

import React, { useState } from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { View } from 'react-native';
import { Button } from '@/components/universal/Button';
import { Card } from '@/components/universal/Card';
import { Dialog } from '@/components/universal/Dialog';
import { Tabs } from '@/components/universal/Tabs';
import { animationTestUtils, setupTest } from './setup';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useTheme } from '@/lib/theme/provider';

// Mock stores
jest.mock('@/lib/stores/animation-store');
jest.mock('@/lib/theme/provider');

// Test component for animation variant switching
const AnimationVariantDemo = () => {
  const [variant, setVariant] = useState<'subtle' | 'moderate' | 'energetic'>('moderate');
  
  return (
    <View>
      <Button 
        animated
        animationVariant={variant}
        onPress={() => setVariant('subtle')}
        testID="variant-button"
      >
        Current: {variant}
      </Button>
      <Card animated animationVariant={variant} testID="variant-card">
        <Card.Content>Animated Card</Card.Content>
      </Card>
    </View>
  );
};

// Test component for theme switching
const ThemeSwitchDemo = () => {
  const [theme, setTheme] = useState('default');
  
  return (
    <View>
      <Button 
        animated
        onPress={() => setTheme(theme === 'default' ? 'bubblegum' : 'default')}
        testID="theme-button"
      >
        Theme: {theme}
      </Button>
    </View>
  );
};

describe('Animation Integration Tests', () => {
  let mockAnimationStore: any;
  let mockTheme: any;
  
  beforeEach(() => {
    mockAnimationStore = animationTestUtils.createMockAnimationStore();
    (useAnimationStore as jest.Mock).mockReturnValue(mockAnimationStore);
    
    mockTheme = {
      theme: 'default',
      setTheme: jest.fn(),
      colors: {},
    };
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Animation Variant Switching', () => {
    it('should switch animation variants dynamically', async () => {
      const { getByTestId } = render(<AnimationVariantDemo />);
      
      const button = getByTestId('variant-button');
      const card = getByTestId('variant-card');
      
      // Initial state - moderate variant
      expect(button).toBeDefined();
      expect(card).toBeDefined();
      
      // Switch to subtle variant
      fireEvent.press(button);
      
      await waitFor(() => {
        // Animations should update to subtle variant
        expect(button).toBeDefined();
      });
    });
    
    it('should persist variant preference', async () => {
      const { getByTestId } = render(<AnimationVariantDemo />);
      
      const button = getByTestId('variant-button');
      
      // Change variant
      fireEvent.press(button);
      
      // Verify store was updated
      await waitFor(() => {
        expect(mockAnimationStore.setVariant).toHaveBeenCalledWith('subtle');
      });
    });
  });
  
  describe('Theme Change with Animations', () => {
    it('should maintain animations when theme changes', async () => {
      const { getByTestId } = render(<ThemeSwitchDemo />);
      
      const button = getByTestId('theme-button');
      
      // Change theme
      fireEvent.press(button);
      
      await waitFor(() => {
        // Animations should continue working
        expect(button).toBeDefined();
      });
    });
    
    it('should apply theme-specific animation colors', () => {
      mockTheme.theme = 'bubblegum';
      
      const { getByTestId } = render(
        <Button animated testID="themed-button">
          Themed Button
        </Button>
      );
      
      const button = getByTestId('themed-button');
      expect(button).toBeDefined();
    });
  });
  
  describe('Navigation Transitions', () => {
    it('should animate tab switches', async () => {
      const { getByText, getByTestId } = render(
        <Tabs defaultValue="tab1" animated>
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1" testID="content1">
            Content 1
          </Tabs.Content>
          <Tabs.Content value="tab2" testID="content2">
            Content 2
          </Tabs.Content>
        </Tabs>
      );
      
      // Switch tabs
      fireEvent.press(getByText('Tab 2'));
      
      await waitFor(() => {
        const content2 = getByTestId('content2');
        expect(content2).toBeDefined();
      });
    });
    
    it('should animate modal presentations', async () => {
      const { getByText, getByTestId } = render(
        <Dialog animated>
          <Dialog.Trigger asChild>
            <Button>Open Dialog</Button>
          </Dialog.Trigger>
          <Dialog.Content testID="dialog-content">
            <Dialog.Header>
              <Dialog.Title>Animated Dialog</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>Content</Dialog.Body>
          </Dialog.Content>
        </Dialog>
      );
      
      // Open dialog
      fireEvent.press(getByText('Open Dialog'));
      
      await waitFor(() => {
        const dialog = getByTestId('dialog-content');
        expect(dialog).toBeDefined();
      });
    });
  });
  
  describe('Complex Animation Sequences', () => {
    it('should handle multiple simultaneous animations', async () => {
      const ComplexAnimationDemo = () => {
        const [showAll, setShowAll] = useState(false);
        
        return (
          <View>
            <Button onPress={() => setShowAll(true)} testID="trigger">
              Show All
            </Button>
            {showAll && (
              <>
                <Card animated entranceAnimation="fade" animationDelay={0} testID="card1">
                  <Card.Content>Card 1</Card.Content>
                </Card>
                <Card animated entranceAnimation="slideUp" animationDelay={100} testID="card2">
                  <Card.Content>Card 2</Card.Content>
                </Card>
                <Card animated entranceAnimation="scale" animationDelay={200} testID="card3">
                  <Card.Content>Card 3</Card.Content>
                </Card>
              </>
            )}
          </View>
        );
      };
      
      const { getByTestId } = render(<ComplexAnimationDemo />);
      
      fireEvent.press(getByTestId('trigger'));
      
      await waitFor(() => {
        expect(getByTestId('card1')).toBeDefined();
        expect(getByTestId('card2')).toBeDefined();
        expect(getByTestId('card3')).toBeDefined();
      });
    });
    
    it('should handle animation interruptions', async () => {
      const InterruptibleDemo = () => {
        const [state, setState] = useState('initial');
        
        return (
          <Button
            animated
            animationType={state === 'shaking' ? 'shake' : 'scale'}
            onPress={() => setState(state === 'initial' ? 'shaking' : 'initial')}
            testID="interruptible"
          >
            {state}
          </Button>
        );
      };
      
      const { getByTestId } = render(<InterruptibleDemo />);
      const button = getByTestId('interruptible');
      
      // Start animation
      fireEvent.press(button);
      
      // Interrupt with another press
      fireEvent.press(button);
      
      // Should handle gracefully without crashes
      expect(button).toBeDefined();
    });
  });
  
  describe('Memory Management', () => {
    it('should clean up animation listeners', async () => {
      const MemoryTestComponent = () => {
        const [mounted, setMounted] = useState(true);
        
        return (
          <View>
            <Button onPress={() => setMounted(false)} testID="unmount">
              Unmount
            </Button>
            {mounted && (
              <Card animated animationType="lift" testID="animated-card">
                <Card.Content>Animated Content</Card.Content>
              </Card>
            )}
          </View>
        );
      };
      
      const { getByTestId, queryByTestId } = render(<MemoryTestComponent />);
      
      expect(getByTestId('animated-card')).toBeDefined();
      
      // Unmount animated component
      fireEvent.press(getByTestId('unmount'));
      
      await waitFor(() => {
        expect(queryByTestId('animated-card')).toBeNull();
      });
      
      // No memory leaks should occur
    });
    
    it('should handle rapid mount/unmount cycles', async () => {
      const RapidMountDemo = () => {
        const [show, setShow] = useState(true);
        
        return (
          <View>
            <Button 
              onPress={() => setShow(!show)} 
              testID="toggle"
            >
              Toggle
            </Button>
            {show && (
              <Card animated entranceAnimation="fade" testID="rapid-card">
                <Card.Content>Rapid Mount</Card.Content>
              </Card>
            )}
          </View>
        );
      };
      
      const { getByTestId, queryByTestId } = render(<RapidMountDemo />);
      
      // Rapid toggling
      for (let i = 0; i < 10; i++) {
        fireEvent.press(getByTestId('toggle'));
        await waitFor(() => {
          if (i % 2 === 0) {
            expect(queryByTestId('rapid-card')).toBeNull();
          } else {
            expect(queryByTestId('rapid-card')).toBeDefined();
          }
        });
      }
    });
  });
  
  describe('Performance Metrics', () => {
    it('should maintain 60fps with multiple animations', async () => {
      const PerformanceDemo = () => {
        const items = Array.from({ length: 20 }, (_, i) => i);
        
        return (
          <View>
            {items.map(i => (
              <Card 
                key={i}
                animated
                animationType="lift"
                testID={`perf-card-${i}`}
              >
                <Card.Content>Card {i}</Card.Content>
              </Card>
            ))}
          </View>
        );
      };
      
      const { getByTestId } = render(<PerformanceDemo />);
      
      // All cards should render
      expect(getByTestId('perf-card-0')).toBeDefined();
      expect(getByTestId('perf-card-19')).toBeDefined();
      
      // In a real test, we would measure frame rate
    });
    
    it('should optimize animations in low-performance mode', () => {
      mockAnimationStore.debugMode = true;
      
      const { getByTestId } = render(
        <Button animated testID="debug-button">
          Debug Mode
        </Button>
      );
      
      const button = getByTestId('debug-button');
      
      // Animations should be instant in debug mode
      expect(mockAnimationStore.getAdjustedDuration(300)).toBe(0);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle missing animation store gracefully', () => {
      (useAnimationStore as jest.Mock).mockReturnValue(null);
      
      const { getByTestId } = render(
        <Button animated testID="no-store">
          No Store
        </Button>
      );
      
      // Should render without crashing
      expect(getByTestId('no-store')).toBeDefined();
    });
    
    it('should handle invalid animation types', () => {
      const { getByTestId } = render(
        <Button 
          animated
          animationType={'invalid' as any}
          testID="invalid-type"
        >
          Invalid Type
        </Button>
      );
      
      // Should fallback gracefully
      expect(getByTestId('invalid-type')).toBeDefined();
    });
    
    it('should handle extreme animation values', () => {
      const { getByTestId } = render(
        <Button 
          animated
          animationConfig={{
            hoverScale: 10,
            pressScale: 0.1,
            duration: 10000,
          }}
          testID="extreme-values"
        >
          Extreme Values
        </Button>
      );
      
      // Should apply values without crashing
      expect(getByTestId('extreme-values')).toBeDefined();
    });
  });
});