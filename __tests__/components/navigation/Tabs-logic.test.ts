import { describe, it, expect } from '@jest/globals';

describe('Tabs Component Logic', () => {
  describe('Tab State Management', () => {
    interface TabState {
      value: string;
      tabs: string[];
      disabled?: Set<string>;
    }

    const getActiveTabIndex = (state: TabState): number => {
      return state.tabs.indexOf(state.value);
    };

    const getNextTab = (state: TabState): string | null => {
      const currentIndex = getActiveTabIndex(state);
      
      for (let i = currentIndex + 1; i < state.tabs.length; i++) {
        const tab = state.tabs[i];
        if (!state.disabled?.has(tab)) {
          return tab;
        }
      }
      
      return null;
    };

    const getPreviousTab = (state: TabState): string | null => {
      const currentIndex = getActiveTabIndex(state);
      
      for (let i = currentIndex - 1; i >= 0; i--) {
        const tab = state.tabs[i];
        if (!state.disabled?.has(tab)) {
          return tab;
        }
      }
      
      return null;
    };

    const isValidTab = (state: TabState, value: string): boolean => {
      return state.tabs.includes(value) && !state.disabled?.has(value);
    };

    it('tracks active tab index', () => {
      const state: TabState = {
        value: 'settings',
        tabs: ['profile', 'settings', 'billing', 'security'],
      };
      
      expect(getActiveTabIndex(state)).toBe(1);
    });

    it('finds next available tab', () => {
      const state: TabState = {
        value: 'profile',
        tabs: ['profile', 'settings', 'billing', 'security'],
        disabled: new Set(['settings']),
      };
      
      expect(getNextTab(state)).toBe('billing');
    });

    it('finds previous available tab', () => {
      const state: TabState = {
        value: 'security',
        tabs: ['profile', 'settings', 'billing', 'security'],
        disabled: new Set(['billing']),
      };
      
      expect(getPreviousTab(state)).toBe('settings');
    });

    it('validates tab selection', () => {
      const state: TabState = {
        value: 'profile',
        tabs: ['profile', 'settings', 'billing'],
        disabled: new Set(['billing']),
      };
      
      expect(isValidTab(state, 'settings')).toBe(true);
      expect(isValidTab(state, 'billing')).toBe(false);
      expect(isValidTab(state, 'invalid')).toBe(false);
    });

    it('returns null when no next/previous tab available', () => {
      const state: TabState = {
        value: 'security',
        tabs: ['profile', 'settings', 'billing', 'security'],
        disabled: new Set(['profile', 'settings', 'billing']),
      };
      
      expect(getNextTab(state)).toBeNull();
      expect(getPreviousTab(state)).toBeNull();
    });
  });

  describe('Indicator Animation', () => {
    interface TabLayout {
      value: string;
      position: number;
      width: number;
    }

    const calculateIndicatorPosition = (
      tabs: TabLayout[],
      activeValue: string,
      animationType: 'slide' | 'fade' | 'scale' | 'none'
    ) => {
      if (animationType !== 'slide') {
        return { position: 0, width: 0, visible: false };
      }

      const activeTab = tabs.find(tab => tab.value === activeValue);
      if (!activeTab) {
        return { position: 0, width: 0, visible: false };
      }

      return {
        position: activeTab.position,
        width: activeTab.width,
        visible: true,
        duration: 300,
      };
    };

    const calculateIndicatorPath = (
      fromTab: TabLayout,
      toTab: TabLayout
    ) => {
      const distance = Math.abs(toTab.position - fromTab.position);
      const direction = toTab.position > fromTab.position ? 'right' : 'left';
      const stretchFactor = 1.2; // Indicator stretches during animation
      
      return {
        distance,
        direction,
        maxWidth: Math.max(fromTab.width, toTab.width) * stretchFactor,
        duration: Math.min(300 + distance * 0.5, 500), // Longer animation for larger distances
      };
    };

    it('calculates indicator position for active tab', () => {
      const tabs: TabLayout[] = [
        { value: 'tab1', position: 0, width: 80 },
        { value: 'tab2', position: 88, width: 100 },
        { value: 'tab3', position: 196, width: 90 },
      ];
      
      const indicator = calculateIndicatorPosition(tabs, 'tab2', 'slide');
      expect(indicator.position).toBe(88);
      expect(indicator.width).toBe(100);
      expect(indicator.visible).toBe(true);
    });

    it('hides indicator for non-slide animations', () => {
      const tabs: TabLayout[] = [
        { value: 'tab1', position: 0, width: 80 },
      ];
      
      const indicator = calculateIndicatorPosition(tabs, 'tab1', 'fade');
      expect(indicator.visible).toBe(false);
    });

    it('calculates animation path between tabs', () => {
      const fromTab = { value: 'tab1', position: 0, width: 80 };
      const toTab = { value: 'tab3', position: 200, width: 90 };
      
      const path = calculateIndicatorPath(fromTab, toTab);
      expect(path.distance).toBe(200);
      expect(path.direction).toBe('right');
      expect(path.maxWidth).toBe(108); // 90 * 1.2
      expect(path.duration).toBe(400); // 300 + 200 * 0.5
    });
  });

  describe('Tab Icons and Badges', () => {
    interface TabConfig {
      label: string;
      icon?: string;
      badge?: string | number;
      badgeVariant?: 'default' | 'destructive' | 'secondary';
    }

    const formatTabContent = (config: TabConfig) => {
      const parts = [];
      
      if (config.icon) {
        parts.push({
          type: 'icon',
          value: config.icon,
          size: 20,
        });
      }
      
      parts.push({
        type: 'text',
        value: config.label,
      });
      
      if (config.badge !== undefined) {
        parts.push({
          type: 'badge',
          value: config.badge.toString(),
          variant: config.badgeVariant || 'default',
          maxDisplay: 99,
        });
      }
      
      return {
        parts,
        spacing: 8,
        alignment: 'center',
      };
    };

    const formatBadgeValue = (value: string | number): string => {
      if (typeof value === 'number') {
        if (value > 99) return '99+';
        if (value < 0) return '0';
        return value.toString();
      }
      return value;
    };

    it('formats tab with icon and text', () => {
      const content = formatTabContent({
        label: 'Messages',
        icon: 'envelope',
      });
      
      expect(content.parts).toHaveLength(2);
      expect(content.parts[0]).toEqual({
        type: 'icon',
        value: 'envelope',
        size: 20,
      });
      expect(content.parts[1]).toEqual({
        type: 'text',
        value: 'Messages',
      });
    });

    it('formats tab with badge', () => {
      const content = formatTabContent({
        label: 'Notifications',
        badge: 5,
        badgeVariant: 'destructive',
      });
      
      expect(content.parts).toHaveLength(2);
      expect(content.parts[1]).toEqual({
        type: 'badge',
        value: '5',
        variant: 'destructive',
        maxDisplay: 99,
      });
    });

    it('formats large badge numbers', () => {
      expect(formatBadgeValue(150)).toBe('99+');
      expect(formatBadgeValue(99)).toBe('99');
      expect(formatBadgeValue(-5)).toBe('0');
      expect(formatBadgeValue('new')).toBe('new');
    });
  });

  describe('Keyboard Navigation', () => {
    interface KeyboardState {
      tabs: string[];
      activeTab: string;
      disabled: Set<string>;
      orientation: 'horizontal' | 'vertical';
    }

    const handleKeyPress = (
      state: KeyboardState,
      key: string
    ): { action: string; newTab?: string } | null => {
      const currentIndex = state.tabs.indexOf(state.activeTab);
      
      const navigationKeys = {
        horizontal: {
          next: 'ArrowRight',
          previous: 'ArrowLeft',
        },
        vertical: {
          next: 'ArrowDown',
          previous: 'ArrowUp',
        },
      };
      
      const keys = navigationKeys[state.orientation];
      
      if (key === keys.next) {
        for (let i = currentIndex + 1; i < state.tabs.length; i++) {
          if (!state.disabled.has(state.tabs[i])) {
            return { action: 'navigate', newTab: state.tabs[i] };
          }
        }
      } else if (key === keys.previous) {
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (!state.disabled.has(state.tabs[i])) {
            return { action: 'navigate', newTab: state.tabs[i] };
          }
        }
      } else if (key === 'Home') {
        const firstEnabled = state.tabs.find(tab => !state.disabled.has(tab));
        if (firstEnabled && firstEnabled !== state.activeTab) {
          return { action: 'navigate', newTab: firstEnabled };
        }
      } else if (key === 'End') {
        const lastEnabled = state.tabs.slice().reverse().find(tab => !state.disabled.has(tab));
        if (lastEnabled && lastEnabled !== state.activeTab) {
          return { action: 'navigate', newTab: lastEnabled };
        }
      }
      
      return null;
    };

    it('navigates with arrow keys in horizontal orientation', () => {
      const state: KeyboardState = {
        tabs: ['tab1', 'tab2', 'tab3'],
        activeTab: 'tab1',
        disabled: new Set(),
        orientation: 'horizontal',
      };
      
      const result = handleKeyPress(state, 'ArrowRight');
      expect(result).toEqual({ action: 'navigate', newTab: 'tab2' });
    });

    it('navigates with arrow keys in vertical orientation', () => {
      const state: KeyboardState = {
        tabs: ['tab1', 'tab2', 'tab3'],
        activeTab: 'tab2',
        disabled: new Set(),
        orientation: 'vertical',
      };
      
      const result = handleKeyPress(state, 'ArrowUp');
      expect(result).toEqual({ action: 'navigate', newTab: 'tab1' });
    });

    it('skips disabled tabs', () => {
      const state: KeyboardState = {
        tabs: ['tab1', 'tab2', 'tab3', 'tab4'],
        activeTab: 'tab1',
        disabled: new Set(['tab2', 'tab3']),
        orientation: 'horizontal',
      };
      
      const result = handleKeyPress(state, 'ArrowRight');
      expect(result).toEqual({ action: 'navigate', newTab: 'tab4' });
    });

    it('navigates to first/last with Home/End', () => {
      const state: KeyboardState = {
        tabs: ['tab1', 'tab2', 'tab3', 'tab4'],
        activeTab: 'tab3',
        disabled: new Set(['tab1']),
        orientation: 'horizontal',
      };
      
      expect(handleKeyPress(state, 'Home')).toEqual({ action: 'navigate', newTab: 'tab2' });
      expect(handleKeyPress(state, 'End')).toEqual({ action: 'navigate', newTab: 'tab4' });
    });
  });

  describe('Scrollable Tabs', () => {
    interface ScrollableConfig {
      containerWidth: number;
      tabWidths: number[];
      activeIndex: number;
      padding: number;
    }

    const calculateScrollPosition = (config: ScrollableConfig) => {
      const totalWidth = config.tabWidths.reduce((sum, width) => sum + width, 0);
      const scrollable = totalWidth + config.padding * 2 > config.containerWidth;
      
      if (!scrollable) {
        return { scrollX: 0, scrollable: false };
      }
      
      // Calculate position to center active tab
      let offsetToActive = config.padding;
      for (let i = 0; i < config.activeIndex; i++) {
        offsetToActive += config.tabWidths[i];
      }
      
      const activeTabWidth = config.tabWidths[config.activeIndex];
      const centerOffset = offsetToActive + activeTabWidth / 2;
      const scrollX = Math.max(0, centerOffset - config.containerWidth / 2);
      
      return {
        scrollX,
        scrollable: true,
        maxScroll: Math.max(0, totalWidth + config.padding * 2 - config.containerWidth),
      };
    };

    it('calculates scroll position to center active tab', () => {
      const scroll = calculateScrollPosition({
        containerWidth: 300,
        tabWidths: [80, 100, 120, 90, 110],
        activeIndex: 2, // 120px tab
        padding: 16,
      });
      
      expect(scroll.scrollable).toBe(true);
      expect(scroll.scrollX).toBe(106); // Positions to center the 120px tab
    });

    it('disables scrolling when tabs fit', () => {
      const scroll = calculateScrollPosition({
        containerWidth: 500,
        tabWidths: [80, 80, 80],
        activeIndex: 1,
        padding: 16,
      });
      
      expect(scroll.scrollable).toBe(false);
      expect(scroll.scrollX).toBe(0);
    });

    it('limits scroll to valid range', () => {
      const scroll = calculateScrollPosition({
        containerWidth: 200,
        tabWidths: [100, 100, 100, 100],
        activeIndex: 3,
        padding: 16,
      });
      
      expect(scroll.maxScroll).toBe(232); // 400 + 32 - 200
    });
  });

  describe('Content Animation', () => {
    type AnimationType = 'slide' | 'fade' | 'scale' | 'none';

    const getContentAnimation = (
      type: AnimationType,
      direction: 'forward' | 'backward'
    ) => {
      const animations = {
        slide: {
          enter: {
            translateX: direction === 'forward' ? 100 : -100,
            opacity: 0,
          },
          active: {
            translateX: 0,
            opacity: 1,
          },
          exit: {
            translateX: direction === 'forward' ? -100 : 100,
            opacity: 0,
          },
          duration: 300,
        },
        fade: {
          enter: { opacity: 0 },
          active: { opacity: 1 },
          exit: { opacity: 0 },
          duration: 200,
        },
        scale: {
          enter: {
            scale: 0.95,
            opacity: 0,
          },
          active: {
            scale: 1,
            opacity: 1,
          },
          exit: {
            scale: 0.95,
            opacity: 0,
          },
          duration: 250,
        },
        none: {
          enter: {},
          active: {},
          exit: {},
          duration: 0,
        },
      };
      
      return animations[type];
    };

    it('provides slide animations with direction', () => {
      const forward = getContentAnimation('slide', 'forward');
      expect(forward.enter.translateX).toBe(100);
      expect(forward.exit.translateX).toBe(-100);
      
      const backward = getContentAnimation('slide', 'backward');
      expect(backward.enter.translateX).toBe(-100);
      expect(backward.exit.translateX).toBe(100);
    });

    it('provides fade animations', () => {
      const fade = getContentAnimation('fade', 'forward');
      expect(fade.enter.opacity).toBe(0);
      expect(fade.active.opacity).toBe(1);
      expect(fade.duration).toBe(200);
    });

    it('provides scale animations', () => {
      const scale = getContentAnimation('scale', 'forward');
      expect(scale.enter.scale).toBe(0.95);
      expect(scale.active.scale).toBe(1);
      expect(scale.duration).toBe(250);
    });

    it('disables animations when type is none', () => {
      const none = getContentAnimation('none', 'forward');
      expect(none.duration).toBe(0);
      expect(none.enter).toEqual({});
    });
  });
});