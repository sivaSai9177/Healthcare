import { describe, it, expect } from '@jest/globals';

describe('Sidebar Component Logic', () => {
  describe('Collapse/Expand State', () => {
    interface SidebarState {
      isCollapsed: boolean;
      width: number;
      collapsedWidth: number;
      expandedWidth: number;
      isMobile: boolean;
    }

    const calculateSidebarDimensions = (state: SidebarState) => {
      if (state.isMobile) {
        return {
          width: 0,
          visible: false,
          useDrawer: true,
        };
      }

      const currentWidth = state.isCollapsed ? state.collapsedWidth : state.expandedWidth;
      const contentVisible = !state.isCollapsed;
      const iconOnly = state.isCollapsed;
      
      return {
        width: currentWidth,
        visible: true,
        useDrawer: false,
        contentVisible,
        iconOnly,
        transition: {
          property: 'width',
          duration: 300,
          easing: 'ease-in-out',
        },
      };
    };

    const getIconDisplayMode = (isCollapsed: boolean) => {
      if (isCollapsed) {
        return {
          size: 24,
          showTooltip: true,
          centerAlign: true,
          hideLabels: true,
        };
      }
      
      return {
        size: 20,
        showTooltip: false,
        centerAlign: false,
        hideLabels: false,
      };
    };

    it('calculates dimensions for expanded state', () => {
      const dimensions = calculateSidebarDimensions({
        isCollapsed: false,
        width: 280,
        collapsedWidth: 60,
        expandedWidth: 280,
        isMobile: false,
      });
      
      expect(dimensions.width).toBe(280);
      expect(dimensions.contentVisible).toBe(true);
      expect(dimensions.iconOnly).toBe(false);
    });

    it('calculates dimensions for collapsed state', () => {
      const dimensions = calculateSidebarDimensions({
        isCollapsed: true,
        width: 60,
        collapsedWidth: 60,
        expandedWidth: 280,
        isMobile: false,
      });
      
      expect(dimensions.width).toBe(60);
      expect(dimensions.contentVisible).toBe(false);
      expect(dimensions.iconOnly).toBe(true);
    });

    it('uses drawer on mobile', () => {
      const dimensions = calculateSidebarDimensions({
        isCollapsed: false,
        width: 280,
        collapsedWidth: 60,
        expandedWidth: 280,
        isMobile: true,
      });
      
      expect(dimensions.width).toBe(0);
      expect(dimensions.visible).toBe(false);
      expect(dimensions.useDrawer).toBe(true);
    });

    it('adjusts icon display for collapsed state', () => {
      const collapsed = getIconDisplayMode(true);
      expect(collapsed.size).toBe(24);
      expect(collapsed.showTooltip).toBe(true);
      expect(collapsed.hideLabels).toBe(true);
      
      const expanded = getIconDisplayMode(false);
      expect(expanded.size).toBe(20);
      expect(expanded.showTooltip).toBe(false);
      expect(expanded.hideLabels).toBe(false);
    });
  });

  describe('Navigation Group Management', () => {
    interface NavGroup {
      id: string;
      title: string;
      items: NavItem[];
      collapsible?: boolean;
    }

    interface NavItem {
      id: string;
      title: string;
      href?: string;
      items?: NavItem[];
    }

    interface GroupState {
      expandedGroups: Set<string>;
      activeItem?: string;
    }

    const toggleGroup = (state: GroupState, groupId: string): GroupState => {
      const newExpanded = new Set(state.expandedGroups);
      
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      
      return {
        ...state,
        expandedGroups: newExpanded,
      };
    };

    const isGroupExpanded = (state: GroupState, groupId: string): boolean => {
      return state.expandedGroups.has(groupId);
    };

    const getVisibleItems = (group: NavGroup, state: GroupState): NavItem[] => {
      if (!group.collapsible || isGroupExpanded(state, group.id)) {
        return group.items;
      }
      return [];
    };

    const countNestedItems = (items: NavItem[]): number => {
      return items.reduce((count, item) => {
        return count + 1 + (item.items ? countNestedItems(item.items) : 0);
      }, 0);
    };

    it('toggles group expansion state', () => {
      let state: GroupState = {
        expandedGroups: new Set(['group1']),
      };
      
      // Collapse existing
      state = toggleGroup(state, 'group1');
      expect(state.expandedGroups.has('group1')).toBe(false);
      
      // Expand new
      state = toggleGroup(state, 'group2');
      expect(state.expandedGroups.has('group2')).toBe(true);
    });

    it('shows items only when group is expanded', () => {
      const group: NavGroup = {
        id: 'settings',
        title: 'Settings',
        items: [
          { id: 'general', title: 'General' },
          { id: 'security', title: 'Security' },
        ],
        collapsible: true,
      };
      
      const collapsed = getVisibleItems(group, { expandedGroups: new Set() });
      expect(collapsed).toHaveLength(0);
      
      const expanded = getVisibleItems(group, { expandedGroups: new Set(['settings']) });
      expect(expanded).toHaveLength(2);
    });

    it('counts nested items recursively', () => {
      const items: NavItem[] = [
        { id: '1', title: 'Item 1' },
        {
          id: '2',
          title: 'Item 2',
          items: [
            { id: '2.1', title: 'Subitem 1' },
            {
              id: '2.2',
              title: 'Subitem 2',
              items: [
                { id: '2.2.1', title: 'Deep item' },
              ],
            },
          ],
        },
      ];
      
      expect(countNestedItems(items)).toBe(5);
    });
  });

  describe('Active Item Tracking', () => {
    interface NavPath {
      items: { id: string; href?: string }[];
      currentPath: string;
    }

    const findActiveItem = (navPath: NavPath): string | null => {
      // Exact match first
      const exactMatch = navPath.items.find(item => item.href === navPath.currentPath);
      if (exactMatch) return exactMatch.id;
      
      // Find best partial match
      let bestMatch = null;
      let bestMatchLength = 0;
      
      for (const item of navPath.items) {
        if (item.href && navPath.currentPath.startsWith(item.href)) {
          if (item.href.length > bestMatchLength) {
            bestMatch = item.id;
            bestMatchLength = item.href.length;
          }
        }
      }
      
      return bestMatch;
    };

    const getItemState = (itemId: string, activeId: string | null) => {
      const isActive = itemId === activeId;
      
      return {
        isActive,
        className: isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        ariaCurrent: isActive ? 'page' : undefined,
        weight: isActive ? 'medium' : 'normal',
      };
    };

    it('finds exact path match', () => {
      const navPath: NavPath = {
        items: [
          { id: 'home', href: '/' },
          { id: 'dashboard', href: '/dashboard' },
          { id: 'settings', href: '/settings' },
        ],
        currentPath: '/dashboard',
      };
      
      expect(findActiveItem(navPath)).toBe('dashboard');
    });

    it('finds best partial match', () => {
      const navPath: NavPath = {
        items: [
          { id: 'dashboard', href: '/dashboard' },
          { id: 'alerts', href: '/dashboard/alerts' },
          { id: 'reports', href: '/dashboard/reports' },
        ],
        currentPath: '/dashboard/alerts/123',
      };
      
      expect(findActiveItem(navPath)).toBe('alerts');
    });

    it('applies correct styles to active item', () => {
      const activeState = getItemState('settings', 'settings');
      expect(activeState.isActive).toBe(true);
      expect(activeState.className).toContain('bg-accent');
      expect(activeState.ariaCurrent).toBe('page');
      expect(activeState.weight).toBe('medium');
      
      const inactiveState = getItemState('home', 'settings');
      expect(inactiveState.isActive).toBe(false);
      expect(inactiveState.className).toContain('text-muted-foreground');
      expect(inactiveState.ariaCurrent).toBeUndefined();
    });
  });

  describe('Badge and Icon Support', () => {
    interface SidebarItem {
      title: string;
      icon?: string;
      badge?: string | number;
      badgeVariant?: 'default' | 'destructive' | 'secondary';
    }

    const formatItemContent = (item: SidebarItem, isCollapsed: boolean) => {
      const showIcon = !!item.icon;
      const showBadge = item.badge !== undefined && !isCollapsed;
      const showTitle = !isCollapsed;
      
      return {
        icon: showIcon ? {
          name: item.icon,
          size: isCollapsed ? 24 : 20,
          className: 'flex-shrink-0',
        } : null,
        title: showTitle ? {
          text: item.title,
          className: 'flex-1 truncate',
        } : null,
        badge: showBadge ? {
          value: item.badge,
          variant: item.badgeVariant || 'default',
          size: 'sm',
        } : null,
        layout: 'horizontal',
        gap: 12,
      };
    };

    const shouldShowTooltip = (item: SidebarItem, isCollapsed: boolean): boolean => {
      return isCollapsed && (!!item.title || item.badge !== undefined);
    };

    const getTooltipContent = (item: SidebarItem): string => {
      let content = item.title;
      
      if (item.badge !== undefined) {
        content += ` (${item.badge})`;
      }
      
      return content;
    };

    it('formats item with icon and badge', () => {
      const item: SidebarItem = {
        title: 'Messages',
        icon: 'envelope',
        badge: 5,
        badgeVariant: 'destructive',
      };
      
      const expanded = formatItemContent(item, false);
      expect(expanded.icon?.name).toBe('envelope');
      expect(expanded.icon?.size).toBe(20);
      expect(expanded.title?.text).toBe('Messages');
      expect(expanded.badge?.value).toBe(5);
      expect(expanded.badge?.variant).toBe('destructive');
    });

    it('hides text and badge when collapsed', () => {
      const item: SidebarItem = {
        title: 'Settings',
        icon: 'gear',
        badge: 'new',
      };
      
      const collapsed = formatItemContent(item, true);
      expect(collapsed.icon?.size).toBe(24);
      expect(collapsed.title).toBeNull();
      expect(collapsed.badge).toBeNull();
    });

    it('shows tooltip with badge info when collapsed', () => {
      const item: SidebarItem = {
        title: 'Notifications',
        badge: 12,
      };
      
      expect(shouldShowTooltip(item, true)).toBe(true);
      expect(getTooltipContent(item)).toBe('Notifications (12)');
      
      expect(shouldShowTooltip(item, false)).toBe(false);
    });
  });

  describe('Responsive Behavior', () => {
    interface ResponsiveConfig {
      windowWidth: number;
      breakpoints: {
        mobile: number;
        tablet: number;
        desktop: number;
      };
    }

    const getSidebarMode = (config: ResponsiveConfig) => {
      const { windowWidth, breakpoints } = config;
      
      if (windowWidth < breakpoints.mobile) {
        return {
          mode: 'drawer',
          visible: false,
          width: 0,
          overlay: true,
          swipeToOpen: true,
        };
      } else if (windowWidth < breakpoints.tablet) {
        return {
          mode: 'floating',
          visible: true,
          width: 280,
          overlay: true,
          swipeToOpen: false,
        };
      } else {
        return {
          mode: 'docked',
          visible: true,
          width: 280,
          overlay: false,
          swipeToOpen: false,
        };
      }
    };

    const calculateContentMargin = (
      sidebarWidth: number,
      mode: 'drawer' | 'floating' | 'docked',
      isCollapsed: boolean
    ) => {
      if (mode === 'drawer') return 0;
      if (mode === 'floating') return 0;
      
      return isCollapsed ? 60 : sidebarWidth;
    };

    it('uses drawer mode on mobile', () => {
      const mode = getSidebarMode({
        windowWidth: 375,
        breakpoints: { mobile: 640, tablet: 1024, desktop: 1280 },
      });
      
      expect(mode.mode).toBe('drawer');
      expect(mode.visible).toBe(false);
      expect(mode.swipeToOpen).toBe(true);
    });

    it('uses floating mode on tablet', () => {
      const mode = getSidebarMode({
        windowWidth: 768,
        breakpoints: { mobile: 640, tablet: 1024, desktop: 1280 },
      });
      
      expect(mode.mode).toBe('floating');
      expect(mode.overlay).toBe(true);
    });

    it('uses docked mode on desktop', () => {
      const mode = getSidebarMode({
        windowWidth: 1440,
        breakpoints: { mobile: 640, tablet: 1024, desktop: 1280 },
      });
      
      expect(mode.mode).toBe('docked');
      expect(mode.overlay).toBe(false);
    });

    it('calculates content margin based on mode', () => {
      expect(calculateContentMargin(280, 'drawer', false)).toBe(0);
      expect(calculateContentMargin(280, 'floating', false)).toBe(0);
      expect(calculateContentMargin(280, 'docked', false)).toBe(280);
      expect(calculateContentMargin(280, 'docked', true)).toBe(60);
    });
  });

  describe('Rail Animation', () => {
    interface RailState {
      isCollapsed: boolean;
      hovered: boolean;
      pressed: boolean;
    }

    const getRailButtonState = (state: RailState) => {
      const rotation = state.isCollapsed ? 0 : 180;
      const scale = state.pressed ? 0.9 : state.hovered ? 1.1 : 1;
      const opacity = state.hovered ? 1 : 0.8;
      
      return {
        rotation,
        scale,
        opacity,
        icon: 'chevron.right',
        size: 16,
        transition: {
          rotation: { duration: 300, easing: 'ease-in-out' },
          scale: { duration: 150, easing: 'ease-out' },
          opacity: { duration: 200, easing: 'ease' },
        },
      };
    };

    const calculateRailPosition = (isCollapsed: boolean, sidebarWidth: number) => {
      const offset = isCollapsed ? 48 : sidebarWidth - 12;
      
      return {
        right: -12,
        top: '50%',
        translateY: -12,
        position: 'absolute' as const,
      };
    };

    it('rotates rail icon based on collapsed state', () => {
      const collapsed = getRailButtonState({
        isCollapsed: true,
        hovered: false,
        pressed: false,
      });
      expect(collapsed.rotation).toBe(0);
      
      const expanded = getRailButtonState({
        isCollapsed: false,
        hovered: false,
        pressed: false,
      });
      expect(expanded.rotation).toBe(180);
    });

    it('applies hover and press effects', () => {
      const hovered = getRailButtonState({
        isCollapsed: false,
        hovered: true,
        pressed: false,
      });
      expect(hovered.scale).toBe(1.1);
      expect(hovered.opacity).toBe(1);
      
      const pressed = getRailButtonState({
        isCollapsed: false,
        hovered: true,
        pressed: true,
      });
      expect(pressed.scale).toBe(0.9);
    });

    it('positions rail button correctly', () => {
      const collapsed = calculateRailPosition(true, 280);
      expect(collapsed.right).toBe(-12);
      
      const expanded = calculateRailPosition(false, 280);
      expect(expanded.right).toBe(-12);
    });
  });
});