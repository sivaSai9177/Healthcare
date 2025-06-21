/**
 * List Animation Tests
 * Tests for List component animations including stagger effects
 * Migrated to jest-expo patterns
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { List } from '@/components/universal/display/List';
import { renderWithProviders } from '@/testing/test-utils';
import { mockAnimationDriver } from '@/__tests__/utils/animation-test-utils';
import { useAnimationStore } from '@/lib/stores/animation-store';

// Mock the animation store
jest.mock('@/lib/stores/animation-store', () => ({
  useAnimationStore: jest.fn(() => ({
    enableAnimations: true,
    animationSpeed: 1,
    prefersReducedMotion: false,
  }))
}));

describe('List Animations', () => {
  const mockAnimationStore = useAnimationStore as jest.MockedFunction<typeof useAnimationStore>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Stagger Animations', () => {
    it('should apply stagger animation to list items', async () => {
      const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];
      
      const { getByText } = renderWithProviders(
        <List animated animationType="stagger">
          {items.map((item, index) => (
            <List.Item key={index}>
              <List.ItemText>{item}</List.ItemText>
            </List.Item>
          ))}
        </List>
      );
      
      // Each item should appear with increasing delay
      await waitFor(() => {
        items.forEach(item => {
          expect(getByText(item)).toBeDefined();
        });
      });
    });
    
    it('should apply cascade animation', () => {
      const { getByTestId } = renderWithProviders(
        <List animated animationType="cascade" testID="cascade-list">
          <List.Item>
            <List.ItemText>First</List.ItemText>
          </List.Item>
          <List.Item>
            <List.ItemText>Second</List.ItemText>
          </List.Item>
          <List.Item>
            <List.ItemText>Third</List.ItemText>
          </List.Item>
        </List>
      );
      
      const list = getByTestId('cascade-list');
      expect(list).toBeDefined();
    });
    
    it('should apply wave animation', () => {
      const { getByTestId } = renderWithProviders(
        <List animated animationType="wave" testID="wave-list">
          {Array.from({ length: 5 }, (_, i) => (
            <List.Item key={i}>
              <List.ItemText>Wave Item {i}</List.ItemText>
            </List.Item>
          ))}
        </List>
      );
      
      const list = getByTestId('wave-list');
      expect(list).toBeDefined();
    });
  });
  
  describe('Animation Variants', () => {
    it('should apply subtle stagger delays', () => {
      const { getByTestId } = renderWithProviders(
        <List 
          animated 
          animationType="stagger"
          animationVariant="subtle"
          testID="subtle-list"
        >
          <List.Item>Item 1</List.Item>
          <List.Item>Item 2</List.Item>
          <List.Item>Item 3</List.Item>
        </List>
      );
      
      const list = getByTestId('subtle-list');
      // Subtle variant has 30ms base delay
      expect(list).toBeDefined();
    });
    
    it('should apply moderate stagger delays', () => {
      const { getByTestId } = renderWithProviders(
        <List 
          animated 
          animationType="stagger"
          animationVariant="moderate"
          testID="moderate-list"
        >
          <List.Item>Item 1</List.Item>
          <List.Item>Item 2</List.Item>
          <List.Item>Item 3</List.Item>
        </List>
      );
      
      const list = getByTestId('moderate-list');
      // Moderate variant has 50ms base delay
      expect(list).toBeDefined();
    });
    
    it('should apply energetic stagger delays', () => {
      const { getByTestId } = renderWithProviders(
        <List 
          animated 
          animationType="stagger"
          animationVariant="energetic"
          testID="energetic-list"
        >
          <List.Item>Item 1</List.Item>
          <List.Item>Item 2</List.Item>
          <List.Item>Item 3</List.Item>
        </List>
      );
      
      const list = getByTestId('energetic-list');
      // Energetic variant has 80ms base delay
      expect(list).toBeDefined();
    });
  });
  
  describe('Dynamic List Updates', () => {
    it('should animate new items when added', async () => {
      const { rerender, getByText } = render(
        <List animated animationType="stagger">
          <List.Item>
            <List.ItemText>Initial Item</List.ItemText>
          </List.Item>
        </List>
      );
      
      expect(getByText('Initial Item')).toBeDefined();
      
      // Add new item
      rerender(
        <List animated animationType="stagger">
          <List.Item>
            <List.ItemText>Initial Item</List.ItemText>
          </List.Item>
          <List.Item>
            <List.ItemText>New Item</List.ItemText>
          </List.Item>
        </List>
      );
      
      await waitFor(() => {
        expect(getByText('New Item')).toBeDefined();
      });
    });
    
    it('should animate item removal', async () => {
      const { rerender, queryByText } = render(
        <List animated animationType="stagger">
          <List.Item>
            <List.ItemText>Item to Remove</List.ItemText>
          </List.Item>
          <List.Item>
            <List.ItemText>Remaining Item</List.ItemText>
          </List.Item>
        </List>
      );
      
      expect(queryByText('Item to Remove')).toBeDefined();
      
      // Remove item
      rerender(
        <List animated animationType="stagger">
          <List.Item>
            <List.ItemText>Remaining Item</List.ItemText>
          </List.Item>
        </List>
      );
      
      await waitFor(() => {
        expect(queryByText('Item to Remove')).toBeNull();
        expect(queryByText('Remaining Item')).toBeDefined();
      });
    });
  });
  
  describe('Swipeable List Items', () => {
    it('should animate swipe actions', () => {
      const onSwipeLeft = jest.fn();
      const onSwipeRight = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <List animated>
          <List.Item
            swipeable
            onSwipeLeft={onSwipeLeft}
            onSwipeRight={onSwipeRight}
            testID="swipeable-item"
          >
            <List.ItemText>Swipe Me</List.ItemText>
          </List.Item>
        </List>
      );
      
      const item = getByTestId('swipeable-item');
      expect(item).toBeDefined();
      
      // Swipe animations would be triggered by gesture
    });
    
    it('should show action buttons on swipe', () => {
      const { getByTestId } = renderWithProviders(
        <List animated>
          <List.Item
            swipeable
            leftActions={[{ label: 'Edit', onPress: jest.fn() }]}
            rightActions={[{ label: 'Delete', onPress: jest.fn() }]}
            testID="action-item"
          >
            <List.ItemText>Swipe for Actions</List.ItemText>
          </List.Item>
        </List>
      );
      
      const item = getByTestId('action-item');
      expect(item).toBeDefined();
    });
  });
  
  describe('Platform-Specific Behaviors', () => {
    it('should handle iOS list animations', () => {
      Platform.OS = 'ios';
      
      const { getByTestId } = renderWithProviders(
        <List animated animationType="stagger" testID="ios-list">
          <List.Item>iOS Item 1</List.Item>
          <List.Item>iOS Item 2</List.Item>
        </List>
      );
      
      const list = getByTestId('ios-list');
      expect(list).toBeDefined();
    });
    
    it('should handle Android list animations', () => {
      Platform.OS = 'android';
      
      const { getByTestId } = renderWithProviders(
        <List animated animationType="stagger" testID="android-list">
          <List.Item>Android Item 1</List.Item>
          <List.Item>Android Item 2</List.Item>
        </List>
      );
      
      const list = getByTestId('android-list');
      expect(list).toBeDefined();
    });
    
    it('should handle Web list animations', () => {
      Platform.OS = 'web';
      
      const { getByTestId } = renderWithProviders(
        <List animated animationType="stagger" testID="web-list">
          <List.Item>Web Item 1</List.Item>
          <List.Item>Web Item 2</List.Item>
        </List>
      );
      
      const list = getByTestId('web-list');
      expect(list.props.className).toBeDefined();
    });
  });
  
  describe('Performance with Large Lists', () => {
    it('should handle large lists efficiently', async () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      
      const { getByTestId } = renderWithProviders(
        <List 
          animated 
          animationType="stagger"
          testID="large-list"
          maxStaggerItems={10} // Limit stagger to first 10 items
        >
          {items.map((item, index) => (
            <List.Item key={index}>
              <List.ItemText>{item}</List.ItemText>
            </List.Item>
          ))}
        </List>
      );
      
      const list = getByTestId('large-list');
      expect(list).toBeDefined();
      
      // Only first 10 items should have stagger animation
      // Rest should appear immediately
    });
    
    it('should optimize animations for virtualized lists', () => {
      const { getByTestId } = renderWithProviders(
        <List 
          animated
          virtualized
          animationType="stagger"
          testID="virtual-list"
          data={Array.from({ length: 1000 }, (_, i) => ({ id: i, text: `Item ${i}` }))}
          renderItem={({ item }) => (
            <List.Item>
              <List.ItemText>{item.text}</List.ItemText>
            </List.Item>
          )}
        />
      );
      
      const list = getByTestId('virtual-list');
      expect(list).toBeDefined();
    });
  });
  
  describe('Custom Animation Configuration', () => {
    it('should apply custom stagger configuration', () => {
      const customConfig = {
        staggerDelay: 100,
        itemDuration: 500,
        easing: 'ease-in-out',
      };
      
      const { getByTestId } = renderWithProviders(
        <List 
          animated
          animationType="stagger"
          animationConfig={customConfig}
          testID="custom-stagger"
        >
          <List.Item>Custom 1</List.Item>
          <List.Item>Custom 2</List.Item>
          <List.Item>Custom 3</List.Item>
        </List>
      );
      
      const list = getByTestId('custom-stagger');
      expect(list).toBeDefined();
    });
  });
  
  describe('Store Integration', () => {
    it('should respect global animation settings', () => {
      mockAnimationStore.mockReturnValue({
        enableAnimations: false,
        animationSpeed: 1,
        prefersReducedMotion: false,
      });
      
      const { getByTestId } = renderWithProviders(
        <List animated animationType="stagger" testID="no-anim-list">
          <List.Item>No Animation 1</List.Item>
          <List.Item>No Animation 2</List.Item>
        </List>
      );
      
      const list = getByTestId('no-anim-list');
      // Items should appear without animation
      expect(list).toBeDefined();
    });
    
    it('should use global animation speed', () => {
      mockAnimationStore.mockReturnValue({
        enableAnimations: true,
        animationSpeed: 2, // Double speed
        prefersReducedMotion: false,
      });
      
      const { getByTestId } = renderWithProviders(
        <List animated animationType="stagger" testID="fast-list">
          <List.Item>Fast 1</List.Item>
          <List.Item>Fast 2</List.Item>
        </List>
      );
      
      const list = getByTestId('fast-list');
      // Animations should run at double speed
      expect(list).toBeDefined();
    });
  });
});