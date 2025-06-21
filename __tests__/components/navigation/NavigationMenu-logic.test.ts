import { describe, it, expect } from '@jest/globals';

describe('NavigationMenu Component Logic', () => {
  describe('Menu State Management', () => {
    interface MenuState {
      value: string;
      items: MenuItem[];
      orientation: 'horizontal' | 'vertical';
    }

    interface MenuItem {
      value: string;
      label: string;
      disabled?: boolean;
      items?: MenuItem[];
    }

    const findMenuItem = (items: MenuItem[], value: string): MenuItem | null => {
      for (const item of items) {
        if (item.value === value) return item;
        if (item.items) {
          const found = findMenuItem(item.items, value);
          if (found) return found;
        }
      }
      return null;
    };

    const getMenuPath = (items: MenuItem[], targetValue: string): string[] => {
      const path: string[] = [];
      
      const findPath = (currentItems: MenuItem[], currentPath: string[]): boolean => {
        for (const item of currentItems) {
          const newPath = [...currentPath, item.value];
          
          if (item.value === targetValue) {
            path.push(...newPath);
            return true;
          }
          
          if (item.items && findPath(item.items, newPath)) {
            return true;
          }
        }
        return false;
      };
      
      findPath(items, []);
      return path;
    };

    const isMenuItemActive = (item: MenuItem, activeValue: string): boolean => {
      if (item.value === activeValue) return true;
      if (item.items) {
        return item.items.some(child => isMenuItemActive(child, activeValue));
      }
      return false;
    };

    it('finds menu item by value', () => {
      const items: MenuItem[] = [
        { value: 'file', label: 'File' },
        {
          value: 'edit',
          label: 'Edit',
          items: [
            { value: 'undo', label: 'Undo' },
            { value: 'redo', label: 'Redo' },
          ],
        },
      ];
      
      expect(findMenuItem(items, 'undo')?.label).toBe('Undo');
      expect(findMenuItem(items, 'invalid')).toBeNull();
    });

    it('builds path to nested menu item', () => {
      const items: MenuItem[] = [
        {
          value: 'view',
          label: 'View',
          items: [
            {
              value: 'appearance',
              label: 'Appearance',
              items: [
                { value: 'theme', label: 'Theme' },
              ],
            },
          ],
        },
      ];
      
      const path = getMenuPath(items, 'theme');
      expect(path).toEqual(['view', 'appearance', 'theme']);
    });

    it('checks if parent item is active based on children', () => {
      const item: MenuItem = {
        value: 'format',
        label: 'Format',
        items: [
          { value: 'bold', label: 'Bold' },
          { value: 'italic', label: 'Italic' },
        ],
      };
      
      expect(isMenuItemActive(item, 'bold')).toBe(true);
      expect(isMenuItemActive(item, 'underline')).toBe(false);
    });
  });

  describe('Submenu Behavior', () => {
    interface SubmenuState {
      openMenus: Set<string>;
      hoveredItem?: string;
      focusedItem?: string;
      delay: number;
    }

    const shouldOpenSubmenu = (
      itemValue: string,
      state: SubmenuState,
      trigger: 'hover' | 'click' | 'focus'
    ): boolean => {
      if (trigger === 'click') {
        return !state.openMenus.has(itemValue);
      }
      
      if (trigger === 'hover') {
        return state.hoveredItem === itemValue && !state.openMenus.has(itemValue);
      }
      
      if (trigger === 'focus') {
        return state.focusedItem === itemValue;
      }
      
      return false;
    };

    const calculateSubmenuPosition = (
      parentRect: { x: number; y: number; width: number; height: number },
      submenuSize: { width: number; height: number },
      orientation: 'horizontal' | 'vertical',
      viewport: { width: number; height: number }
    ) => {
      let x: number, y: number;
      
      if (orientation === 'horizontal') {
        // Position below parent
        x = parentRect.x;
        y = parentRect.y + parentRect.height;
        
        // Adjust if submenu would overflow viewport
        if (x + submenuSize.width > viewport.width) {
          x = Math.max(0, viewport.width - submenuSize.width);
        }
        
        if (y + submenuSize.height > viewport.height) {
          // Position above if no room below
          y = parentRect.y - submenuSize.height;
        }
      } else {
        // Position to the right of parent
        x = parentRect.x + parentRect.width;
        y = parentRect.y;
        
        // Position to the left if no room on right
        if (x + submenuSize.width > viewport.width) {
          x = parentRect.x - submenuSize.width;
        }
        
        // Adjust vertical position if needed
        if (y + submenuSize.height > viewport.height) {
          y = Math.max(0, viewport.height - submenuSize.height);
        }
      }
      
      return { x, y, placement: orientation === 'horizontal' ? 'bottom' : 'right' };
    };

    it('opens submenu on appropriate trigger', () => {
      const state: SubmenuState = {
        openMenus: new Set(),
        hoveredItem: 'file',
        delay: 200,
      };
      
      expect(shouldOpenSubmenu('file', state, 'hover')).toBe(true);
      expect(shouldOpenSubmenu('edit', state, 'hover')).toBe(false);
      expect(shouldOpenSubmenu('file', state, 'click')).toBe(true);
    });

    it('toggles submenu on click', () => {
      const state: SubmenuState = {
        openMenus: new Set(['file']),
        delay: 200,
      };
      
      expect(shouldOpenSubmenu('file', state, 'click')).toBe(false);
      expect(shouldOpenSubmenu('edit', state, 'click')).toBe(true);
    });

    it('positions submenu to avoid viewport overflow', () => {
      const position = calculateSubmenuPosition(
        { x: 900, y: 100, width: 120, height: 40 },
        { width: 200, height: 150 },
        'horizontal',
        { width: 1024, height: 768 }
      );
      
      expect(position.x).toBe(824); // Adjusted to fit within viewport
      expect(position.y).toBe(140); // Below parent
    });

    it('flips submenu position when necessary', () => {
      const position = calculateSubmenuPosition(
        { x: 950, y: 50, width: 100, height: 40 },
        { width: 150, height: 200 },
        'vertical',
        { width: 1024, height: 768 }
      );
      
      expect(position.x).toBe(800); // Positioned to the left
    });
  });

  describe('Keyboard Navigation', () => {
    interface NavState {
      items: string[];
      activeIndex: number;
      orientation: 'horizontal' | 'vertical';
      loop: boolean;
    }

    const handleKeyNavigation = (
      state: NavState,
      key: string
    ): { newIndex: number; action?: string } | null => {
      const { items, activeIndex, orientation, loop } = state;
      const lastIndex = items.length - 1;
      
      const isNext = (orientation === 'horizontal' && key === 'ArrowRight') ||
                     (orientation === 'vertical' && key === 'ArrowDown');
      const isPrev = (orientation === 'horizontal' && key === 'ArrowLeft') ||
                     (orientation === 'vertical' && key === 'ArrowUp');
      
      if (isNext) {
        let newIndex = activeIndex + 1;
        if (newIndex > lastIndex) {
          newIndex = loop ? 0 : lastIndex;
        }
        return { newIndex };
      }
      
      if (isPrev) {
        let newIndex = activeIndex - 1;
        if (newIndex < 0) {
          newIndex = loop ? lastIndex : 0;
        }
        return { newIndex };
      }
      
      if (key === 'Home') {
        return { newIndex: 0 };
      }
      
      if (key === 'End') {
        return { newIndex: lastIndex };
      }
      
      if (key === 'Enter' || key === ' ') {
        return { newIndex: activeIndex, action: 'select' };
      }
      
      if (key === 'Escape') {
        return { newIndex: activeIndex, action: 'close' };
      }
      
      return null;
    };

    const findNextEnabledIndex = (
      items: { value: string; disabled?: boolean }[],
      startIndex: number,
      direction: 'forward' | 'backward',
      loop: boolean
    ): number => {
      const count = items.length;
      let currentIndex = startIndex;
      let checked = 0;
      
      while (checked < count) {
        if (direction === 'forward') {
          currentIndex = (currentIndex + 1) % count;
        } else {
          currentIndex = (currentIndex - 1 + count) % count;
        }
        
        if (!items[currentIndex].disabled) {
          return currentIndex;
        }
        
        checked++;
        
        if (!loop && ((direction === 'forward' && currentIndex === 0) ||
                      (direction === 'backward' && currentIndex === count - 1))) {
          break;
        }
      }
      
      return startIndex;
    };

    it('navigates with arrow keys based on orientation', () => {
      const horizontalState: NavState = {
        items: ['item1', 'item2', 'item3'],
        activeIndex: 1,
        orientation: 'horizontal',
        loop: false,
      };
      
      expect(handleKeyNavigation(horizontalState, 'ArrowRight')?.newIndex).toBe(2);
      expect(handleKeyNavigation(horizontalState, 'ArrowLeft')?.newIndex).toBe(0);
      expect(handleKeyNavigation(horizontalState, 'ArrowDown')).toBeNull();
    });

    it('handles looping navigation', () => {
      const state: NavState = {
        items: ['item1', 'item2', 'item3'],
        activeIndex: 2,
        orientation: 'horizontal',
        loop: true,
      };
      
      expect(handleKeyNavigation(state, 'ArrowRight')?.newIndex).toBe(0);
    });

    it('navigates to first/last with Home/End', () => {
      const state: NavState = {
        items: ['item1', 'item2', 'item3', 'item4'],
        activeIndex: 2,
        orientation: 'horizontal',
        loop: false,
      };
      
      expect(handleKeyNavigation(state, 'Home')?.newIndex).toBe(0);
      expect(handleKeyNavigation(state, 'End')?.newIndex).toBe(3);
    });

    it('skips disabled items', () => {
      const items = [
        { value: 'item1', disabled: false },
        { value: 'item2', disabled: true },
        { value: 'item3', disabled: false },
        { value: 'item4', disabled: true },
        { value: 'item5', disabled: false },
      ];
      
      expect(findNextEnabledIndex(items, 0, 'forward', false)).toBe(2);
      expect(findNextEnabledIndex(items, 4, 'backward', false)).toBe(2);
    });
  });

  describe('Animation Configurations', () => {
    type AnimationType = 'slide' | 'fade' | 'scale' | 'none';

    const getItemAnimation = (
      type: AnimationType,
      isActive: boolean,
      index: number
    ) => {
      if (type === 'none') {
        return { style: {}, duration: 0 };
      }

      const baseDelay = index * 30;
      
      const animations = {
        slide: {
          style: {
            transform: isActive ? [{ translateY: 0 }] : [{ translateY: -4 }],
            opacity: isActive ? 1 : 0.7,
          },
          duration: 200,
          delay: baseDelay,
        },
        fade: {
          style: {
            opacity: isActive ? 1 : 0.6,
          },
          duration: 150,
          delay: 0,
        },
        scale: {
          style: {
            transform: isActive ? [{ scale: 1.05 }] : [{ scale: 1 }],
            opacity: isActive ? 1 : 0.8,
          },
          duration: 250,
          delay: baseDelay / 2,
        },
      };
      
      return animations[type];
    };

    const getSubmenuAnimation = (type: AnimationType, isOpen: boolean) => {
      if (type === 'none') {
        return { style: {}, duration: 0 };
      }

      const animations = {
        slide: {
          enter: {
            transform: [{ translateY: -10 }],
            opacity: 0,
          },
          active: {
            transform: [{ translateY: 0 }],
            opacity: 1,
          },
          duration: 200,
        },
        fade: {
          enter: { opacity: 0 },
          active: { opacity: 1 },
          duration: 150,
        },
        scale: {
          enter: {
            transform: [{ scale: 0.95 }],
            opacity: 0,
          },
          active: {
            transform: [{ scale: 1 }],
            opacity: 1,
          },
          duration: 200,
        },
      };
      
      const anim = animations[type];
      return {
        style: isOpen ? anim.active : anim.enter,
        duration: anim.duration,
      };
    };

    it('applies item animations based on type', () => {
      const slideActive = getItemAnimation('slide', true, 0);
      expect(slideActive.style.opacity).toBe(1);
      expect(slideActive.duration).toBe(200);
      
      const scaleInactive = getItemAnimation('scale', false, 2);
      expect(scaleInactive.style.transform).toEqual([{ scale: 1 }]);
      expect(scaleInactive.delay).toBe(30); // index * 30 / 2
    });

    it('calculates staggered delays for items', () => {
      const item1 = getItemAnimation('slide', false, 0);
      const item2 = getItemAnimation('slide', false, 1);
      const item3 = getItemAnimation('slide', false, 2);
      
      expect(item1.delay).toBe(0);
      expect(item2.delay).toBe(30);
      expect(item3.delay).toBe(60);
    });

    it('provides submenu animations', () => {
      const openSubmenu = getSubmenuAnimation('slide', true);
      expect(openSubmenu.style.transform).toEqual([{ translateY: 0 }]);
      expect(openSubmenu.style.opacity).toBe(1);
      
      const closedSubmenu = getSubmenuAnimation('scale', false);
      expect(closedSubmenu.style.transform).toEqual([{ scale: 0.95 }]);
      expect(closedSubmenu.style.opacity).toBe(0);
    });
  });

  describe('Accessibility Features', () => {
    interface MenuA11y {
      role: string;
      ariaLabel?: string;
      ariaExpanded?: boolean;
      ariaHasPopup?: boolean;
      ariaDisabled?: boolean;
      ariaCurrent?: string;
    }

    const getMenuItemA11y = (
      item: { label: string; disabled?: boolean; hasSubmenu?: boolean },
      isActive: boolean,
      isOpen?: boolean
    ): MenuA11y => {
      const a11y: MenuA11y = {
        role: 'menuitem',
      };
      
      if (item.hasSubmenu) {
        a11y.ariaHasPopup = true;
        a11y.ariaExpanded = isOpen;
      }
      
      if (item.disabled) {
        a11y.ariaDisabled = true;
      }
      
      if (isActive) {
        a11y.ariaCurrent = 'page';
      }
      
      return a11y;
    };

    const getMenuA11y = (orientation: 'horizontal' | 'vertical', label?: string): MenuA11y => {
      return {
        role: 'menubar',
        ariaLabel: label || `${orientation} navigation menu`,
      };
    };

    const generateMenuDescription = (
      items: { label: string; active?: boolean }[],
      totalCount: number
    ): string => {
      const activeItem = items.find(item => item.active);
      const activeText = activeItem ? `, ${activeItem.label} selected` : '';
      
      return `Menu with ${totalCount} items${activeText}`;
    };

    it('provides correct ARIA attributes for menu items', () => {
      const submenuItem = getMenuItemA11y(
        { label: 'File', hasSubmenu: true },
        false,
        true
      );
      expect(submenuItem.ariaHasPopup).toBe(true);
      expect(submenuItem.ariaExpanded).toBe(true);
      
      const disabledItem = getMenuItemA11y(
        { label: 'Save', disabled: true },
        false
      );
      expect(disabledItem.ariaDisabled).toBe(true);
    });

    it('marks active items appropriately', () => {
      const activeItem = getMenuItemA11y(
        { label: 'Home' },
        true
      );
      expect(activeItem.ariaCurrent).toBe('page');
    });

    it('provides menu container attributes', () => {
      const horizontalMenu = getMenuA11y('horizontal', 'Main navigation');
      expect(horizontalMenu.role).toBe('menubar');
      expect(horizontalMenu.ariaLabel).toBe('Main navigation');
      
      const verticalMenu = getMenuA11y('vertical');
      expect(verticalMenu.ariaLabel).toBe('vertical navigation menu');
    });

    it('generates descriptive menu announcements', () => {
      const items = [
        { label: 'Home' },
        { label: 'About', active: true },
        { label: 'Contact' },
      ];
      
      const description = generateMenuDescription(items, 3);
      expect(description).toBe('Menu with 3 items, About selected');
    });
  });

  describe('Touch and Hover Interactions', () => {
    interface InteractionState {
      touchStart?: { x: number; y: number; time: number };
      touchEnd?: { x: number; y: number; time: number };
      hoverTimeout?: number;
      pressedItem?: string;
    }

    const detectSwipeDirection = (state: InteractionState): string | null => {
      if (!state.touchStart || !state.touchEnd) return null;
      
      const deltaX = state.touchEnd.x - state.touchStart.x;
      const deltaY = state.touchEnd.y - state.touchStart.y;
      const deltaTime = state.touchEnd.time - state.touchStart.time;
      
      // Require minimum distance and maximum time
      const minDistance = 50;
      const maxTime = 300;
      
      if (deltaTime > maxTime) return null;
      
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minDistance) {
        return deltaX > 0 ? 'right' : 'left';
      }
      
      if (Math.abs(deltaY) > minDistance) {
        return deltaY > 0 ? 'down' : 'up';
      }
      
      return null;
    };

    const calculateHoverDelay = (
      hasSubmenu: boolean,
      isClosing: boolean
    ): number => {
      if (!hasSubmenu) return 0;
      
      // Longer delay when closing to prevent accidental closes
      return isClosing ? 300 : 150;
    };

    it('detects swipe gestures', () => {
      const rightSwipe: InteractionState = {
        touchStart: { x: 100, y: 200, time: 1000 },
        touchEnd: { x: 180, y: 205, time: 1200 },
      };
      expect(detectSwipeDirection(rightSwipe)).toBe('right');
      
      const downSwipe: InteractionState = {
        touchStart: { x: 100, y: 100, time: 1000 },
        touchEnd: { x: 105, y: 180, time: 1150 },
      };
      expect(detectSwipeDirection(downSwipe)).toBe('down');
    });

    it('ignores slow or short swipes', () => {
      const slowSwipe: InteractionState = {
        touchStart: { x: 100, y: 100, time: 1000 },
        touchEnd: { x: 200, y: 100, time: 1400 },
      };
      expect(detectSwipeDirection(slowSwipe)).toBeNull();
      
      const shortSwipe: InteractionState = {
        touchStart: { x: 100, y: 100, time: 1000 },
        touchEnd: { x: 130, y: 105, time: 1100 },
      };
      expect(detectSwipeDirection(shortSwipe)).toBeNull();
    });

    it('calculates appropriate hover delays', () => {
      expect(calculateHoverDelay(false, false)).toBe(0);
      expect(calculateHoverDelay(true, false)).toBe(150);
      expect(calculateHoverDelay(true, true)).toBe(300);
    });
  });
});