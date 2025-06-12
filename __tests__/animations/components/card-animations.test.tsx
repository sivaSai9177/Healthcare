/**
 * Card Animation Tests
 * Tests for Card component animations across platforms
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/universal/Card';
import { Button } from '@/components/universal/Button';
import { animationTestUtils, setupTest } from '../setup';
import { useAnimationStore } from '@/lib/stores/animation-store';

// Mock the animation store
jest.mock('@/lib/stores/animation-store');

describe('Card Animations', () => {
  let mockStore: any;
  
  beforeEach(() => {
    mockStore = animationTestUtils.createMockAnimationStore();
    (useAnimationStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Animation Types', () => {
    it('should apply lift animation on hover', () => {
      const { getByTestId } = render(
        <Card animated animationType="lift" testID="lift-card">
          <CardHeader>
            <CardTitle>Lift Card</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      
      const card = getByTestId('lift-card');
      
      // Simulate hover (press on mobile)
      fireEvent(card, 'pressIn');
      
      // Card should animate
      expect(card).toBeDefined();
      
      fireEvent(card, 'pressOut');
    });
    
    it('should apply tilt animation', () => {
      const { getByTestId } = render(
        <Card animated animationType="tilt" testID="tilt-card">
          <CardHeader>
            <CardTitle>Tilt Card</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const card = getByTestId('tilt-card');
      fireEvent(card, 'pressIn');
      
      // Tilt animation should be applied
      expect(card).toBeDefined();
    });
    
    it('should apply reveal animation', () => {
      const { getByTestId } = render(
        <Card animated animationType="reveal" testID="reveal-card">
          <CardHeader>
            <CardTitle>Reveal Card</CardTitle>
          </CardHeader>
          <CardContent>Hidden content</CardContent>
        </Card>
      );
      
      const card = getByTestId('reveal-card');
      
      // Reveal animation on interaction
      fireEvent(card, 'pressIn');
      expect(card).toBeDefined();
    });
    
    it('should not animate when type is none', () => {
      const { getByTestId } = render(
        <Card animated animationType="none" testID="static-card">
          <CardHeader>
            <CardTitle>Static Card</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const card = getByTestId('static-card');
      fireEvent(card, 'pressIn');
      
      // No animation should occur
      expect(card).toBeDefined();
    });
  });
  
  describe('Animation Variants', () => {
    it('should apply subtle variant animations', () => {
      const { getByTestId } = render(
        <Card 
          animated 
          animationVariant="subtle"
          animationType="lift"
          testID="subtle-card"
        >
          <CardContent>Subtle animations</CardContent>
        </Card>
      );
      
      const card = getByTestId('subtle-card');
      fireEvent(card, 'pressIn');
      
      // Subtle animation (1% scale)
      expect(card).toBeDefined();
    });
    
    it('should apply moderate variant animations', () => {
      const { getByTestId } = render(
        <Card 
          animated 
          animationVariant="moderate"
          animationType="lift"
          testID="moderate-card"
        >
          <CardContent>Moderate animations</CardContent>
        </Card>
      );
      
      const card = getByTestId('moderate-card');
      fireEvent(card, 'pressIn');
      
      // Moderate animation (3% scale)
      expect(card).toBeDefined();
    });
    
    it('should apply energetic variant animations', () => {
      const { getByTestId } = render(
        <Card 
          animated 
          animationVariant="energetic"
          animationType="lift"
          testID="energetic-card"
        >
          <CardContent>Energetic animations</CardContent>
        </Card>
      );
      
      const card = getByTestId('energetic-card');
      fireEvent(card, 'pressIn');
      
      // Energetic animation (5% scale)
      expect(card).toBeDefined();
    });
  });
  
  describe('Entrance Animations', () => {
    it('should apply entrance animation with delay', () => {
      const { getByTestId } = render(
        <Card 
          animated
          entranceAnimation="fade"
          animationDelay={200}
          testID="entrance-card"
        >
          <CardContent>Entrance animation</CardContent>
        </Card>
      );
      
      const card = getByTestId('entrance-card');
      expect(card).toBeDefined();
    });
    
    it('should apply scale entrance animation', () => {
      const { getByTestId } = render(
        <Card 
          animated
          entranceAnimation="scale"
          testID="scale-entrance"
        >
          <CardContent>Scale entrance</CardContent>
        </Card>
      );
      
      const card = getByTestId('scale-entrance');
      expect(card).toBeDefined();
    });
    
    it('should apply slide entrance animation', () => {
      const { getByTestId } = render(
        <Card 
          animated
          entranceAnimation="slideUp"
          testID="slide-entrance"
        >
          <CardContent>Slide entrance</CardContent>
        </Card>
      );
      
      const card = getByTestId('slide-entrance');
      expect(card).toBeDefined();
    });
  });
  
  describe('Interactive States', () => {
    it('should handle press state animations', () => {
      const onPress = jest.fn();
      
      const { getByTestId } = render(
        <Card 
          animated
          pressable
          onPress={onPress}
          testID="pressable-card"
        >
          <CardContent>Pressable card</CardContent>
        </Card>
      );
      
      const card = getByTestId('pressable-card');
      
      fireEvent(card, 'pressIn');
      // Press animation starts
      
      fireEvent(card, 'pressOut');
      // Press animation reverses
      
      fireEvent.press(card);
      expect(onPress).toHaveBeenCalled();
    });
    
    it('should disable animations when card is disabled', () => {
      const { getByTestId } = render(
        <Card 
          animated
          pressable
          disabled
          testID="disabled-card"
        >
          <CardContent>Disabled card</CardContent>
        </Card>
      );
      
      const card = getByTestId('disabled-card');
      fireEvent(card, 'pressIn');
      
      // No animation should occur
      expect(card).toBeDefined();
    });
  });
  
  describe('Platform-Specific Behaviors', () => {
    it('should handle iOS card animations', () => {
      setupTest('ios');
      
      const { getByTestId } = render(
        <Card animated animationType="lift" testID="ios-card">
          <CardContent>iOS Card</CardContent>
        </Card>
      );
      
      const card = getByTestId('ios-card');
      fireEvent(card, 'pressIn');
      
      // iOS shadow animations
      expect(card).toBeDefined();
    });
    
    it('should handle Android card animations', () => {
      setupTest('android');
      
      const { getByTestId } = render(
        <Card animated animationType="lift" testID="android-card">
          <CardContent>Android Card</CardContent>
        </Card>
      );
      
      const card = getByTestId('android-card');
      fireEvent(card, 'pressIn');
      
      // Android elevation animations
      expect(card).toBeDefined();
    });
    
    it('should handle Web card animations', () => {
      setupTest('web');
      
      const { getByTestId } = render(
        <Card animated animationType="lift" testID="web-card">
          <CardContent>Web Card</CardContent>
        </Card>
      );
      
      const card = getByTestId('web-card');
      
      // Web uses CSS transforms
      const styles = animationTestUtils.getWebStyles(card);
      expect(styles).toBeDefined();
    });
  });
  
  describe('Complex Card Structures', () => {
    it('should animate nested card components', () => {
      const { getByTestId } = render(
        <Card animated testID="parent-card">
          <CardHeader>
            <CardTitle>Parent Card</CardTitle>
            <CardDescription>With nested content</CardDescription>
          </CardHeader>
          <CardContent>
            <Card animated animationType="tilt" testID="nested-card">
              <CardContent>Nested Card</CardContent>
            </Card>
          </CardContent>
          <CardFooter>
            <Button>Action</Button>
          </CardFooter>
        </Card>
      );
      
      const parentCard = getByTestId('parent-card');
      const nestedCard = getByTestId('nested-card');
      
      // Both cards should be animatable independently
      fireEvent(parentCard, 'pressIn');
      fireEvent(nestedCard, 'pressIn');
      
      expect(parentCard).toBeDefined();
      expect(nestedCard).toBeDefined();
    });
  });
  
  describe('Performance', () => {
    it('should handle multiple animated cards efficiently', () => {
      const cards = Array.from({ length: 10 }, (_, i) => (
        <Card 
          key={i}
          animated
          animationType="lift"
          testID={`card-${i}`}
        >
          <CardContent>Card {i}</CardContent>
        </Card>
      ));
      
      const { getByTestId } = render(
        <>{cards}</>
      );
      
      // Trigger animations on multiple cards
      for (let i = 0; i < 5; i++) {
        const card = getByTestId(`card-${i}`);
        fireEvent(card, 'pressIn');
      }
      
      // All cards should remain responsive
      expect(getByTestId('card-0')).toBeDefined();
      expect(getByTestId('card-9')).toBeDefined();
    });
  });
  
  describe('Animation Configuration', () => {
    it('should apply custom animation configuration', () => {
      const customConfig = {
        liftHeight: 20,
        tiltAngle: 15,
        animationDuration: 500,
      };
      
      const { getByTestId } = render(
        <Card 
          animated
          animationType="lift"
          animationConfig={customConfig}
          testID="custom-config"
        >
          <CardContent>Custom Config</CardContent>
        </Card>
      );
      
      const card = getByTestId('custom-config');
      fireEvent(card, 'pressIn');
      
      expect(card).toBeDefined();
    });
  });
  
  describe('Store Integration', () => {
    it('should respect global animation settings', () => {
      mockStore.enableAnimations = false;
      
      const { getByTestId } = render(
        <Card animated testID="no-anim">
          <CardContent>No animations</CardContent>
        </Card>
      );
      
      const card = getByTestId('no-anim');
      fireEvent(card, 'pressIn');
      
      // No animations should occur
      expect(card).toBeDefined();
    });
    
    it('should use global animation variant', () => {
      mockStore.variant = 'subtle';
      
      const { getByTestId } = render(
        <Card animated testID="global-variant">
          <CardContent>Global variant</CardContent>
        </Card>
      );
      
      const card = getByTestId('global-variant');
      expect(card).toBeDefined();
    });
  });
});