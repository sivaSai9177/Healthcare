import { describe, it, expect } from '@jest/globals';

describe('Breadcrumb Component Logic', () => {
  describe('Navigation Path Management', () => {
    interface BreadcrumbItem {
      label: string;
      href?: string;
      onPress?: () => void;
      current?: boolean;
    }

    const buildBreadcrumbPath = (
      currentPath: string,
      basePaths: { [key: string]: string } = {}
    ): BreadcrumbItem[] => {
      const segments = currentPath.split('/').filter(Boolean);
      const items: BreadcrumbItem[] = [];
      
      // Always add home
      items.push({
        label: 'Home',
        href: '/',
      });
      
      // Build path progressively
      let accumulatedPath = '';
      segments.forEach((segment, index) => {
        accumulatedPath += `/${segment}`;
        const isLast = index === segments.length - 1;
        
        items.push({
          label: basePaths[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
          href: isLast ? undefined : accumulatedPath,
          current: isLast,
        });
      });
      
      return items;
    };

    const truncateBreadcrumbs = (
      items: BreadcrumbItem[],
      maxItems: number
    ): (BreadcrumbItem | { isEllipsis: true })[] => {
      if (items.length <= maxItems) return items;
      
      const firstItem = items[0];
      const lastItems = items.slice(-(maxItems - 2));
      
      return [firstItem, { isEllipsis: true }, ...lastItems];
    };

    it('builds breadcrumb path from URL', () => {
      const path = '/dashboard/alerts/123';
      const items = buildBreadcrumbPath(path);
      
      expect(items).toHaveLength(4);
      expect(items[0]).toEqual({ label: 'Home', href: '/' });
      expect(items[1]).toEqual({ label: 'Dashboard', href: '/dashboard', current: false });
      expect(items[2]).toEqual({ label: 'Alerts', href: '/dashboard/alerts', current: false });
      expect(items[3]).toEqual({ label: '123', href: undefined, current: true });
    });

    it('uses custom labels for path segments', () => {
      const path = '/org/settings/billing';
      const basePaths = {
        org: 'Organization',
        settings: 'Settings',
        billing: 'Billing & Payments',
      };
      
      const items = buildBreadcrumbPath(path, basePaths);
      expect(items[1].label).toBe('Organization');
      expect(items[3].label).toBe('Billing & Payments');
    });

    it('truncates long paths with ellipsis', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Reports', href: '/dashboard/reports' },
        { label: 'Annual', href: '/dashboard/reports/annual' },
        { label: '2024', href: '/dashboard/reports/annual/2024' },
        { label: 'Q4', current: true },
      ];
      
      const truncated = truncateBreadcrumbs(items, 4);
      expect(truncated).toHaveLength(4);
      expect(truncated[0]).toEqual(items[0]);
      expect(truncated[1]).toEqual({ isEllipsis: true });
      expect(truncated[2]).toEqual(items[4]);
      expect(truncated[3]).toEqual(items[5]);
    });
  });

  describe('Animation Timing', () => {
    interface AnimationConfig {
      type: 'stagger' | 'fade' | 'none';
      duration: number;
      itemCount: number;
    }

    const calculateAnimationTimings = (config: AnimationConfig) => {
      if (config.type === 'none') {
        return {
          totalDuration: 0,
          itemDelays: [],
        };
      }

      if (config.type === 'stagger') {
        const staggerDelay = 50;
        const itemDelays = Array.from({ length: config.itemCount }, (_, i) => i * staggerDelay);
        const totalDuration = config.duration + itemDelays[itemDelays.length - 1];
        
        return {
          totalDuration,
          itemDelays,
          staggerDelay,
        };
      }

      // Fade - all items animate simultaneously
      return {
        totalDuration: config.duration,
        itemDelays: Array(config.itemCount).fill(0),
      };
    };

    it('calculates stagger animation timing', () => {
      const timing = calculateAnimationTimings({
        type: 'stagger',
        duration: 300,
        itemCount: 5,
      });
      
      expect(timing.itemDelays).toEqual([0, 50, 100, 150, 200]);
      expect(timing.totalDuration).toBe(500); // 300 + 200
      expect(timing.staggerDelay).toBe(50);
    });

    it('calculates fade animation timing', () => {
      const timing = calculateAnimationTimings({
        type: 'fade',
        duration: 300,
        itemCount: 5,
      });
      
      expect(timing.itemDelays).toEqual([0, 0, 0, 0, 0]);
      expect(timing.totalDuration).toBe(300);
    });

    it('disables animation when type is none', () => {
      const timing = calculateAnimationTimings({
        type: 'none',
        duration: 300,
        itemCount: 5,
      });
      
      expect(timing.totalDuration).toBe(0);
      expect(timing.itemDelays).toEqual([]);
    });
  });

  describe('Separator Configuration', () => {
    type SeparatorType = 'chevron' | 'slash' | 'arrow' | 'dot' | 'custom';

    const getSeparatorConfig = (type: SeparatorType, custom?: string) => {
      const separators = {
        chevron: { icon: 'chevron.right', size: 16 },
        slash: { text: '/', size: 14 },
        arrow: { icon: 'arrow.right', size: 14 },
        dot: { text: '•', size: 12 },
        custom: { text: custom || '/', size: 14 },
      };

      return {
        ...separators[type],
        spacing: 8,
        color: 'text-muted-foreground',
      };
    };

    it('provides different separator styles', () => {
      expect(getSeparatorConfig('chevron').icon).toBe('chevron.right');
      expect(getSeparatorConfig('slash').text).toBe('/');
      expect(getSeparatorConfig('dot').text).toBe('•');
      expect(getSeparatorConfig('custom', '>').text).toBe('>');
    });

    it('maintains consistent spacing and color', () => {
      const configs = ['chevron', 'slash', 'arrow', 'dot'].map(type => 
        getSeparatorConfig(type as SeparatorType)
      );
      
      configs.forEach(config => {
        expect(config.spacing).toBe(8);
        expect(config.color).toBe('text-muted-foreground');
      });
    });
  });

  describe('Accessibility', () => {
    interface A11yItem {
      label: string;
      current?: boolean;
      disabled?: boolean;
    }

    const generateAriaLabel = (items: A11yItem[]) => {
      const parts = items.map((item, index) => {
        let label = item.label;
        if (item.current) label += ' (current page)';
        if (item.disabled) label += ' (disabled)';
        return label;
      });
      
      return `Breadcrumb navigation: ${parts.join(' › ')}`;
    };

    const getItemRole = (item: A11yItem) => {
      if (item.current) return 'none';
      if (item.disabled) return 'none';
      return 'link';
    };

    it('generates descriptive aria labels', () => {
      const items: A11yItem[] = [
        { label: 'Home' },
        { label: 'Products' },
        { label: 'Electronics' },
        { label: 'Phones', current: true },
      ];
      
      const ariaLabel = generateAriaLabel(items);
      expect(ariaLabel).toBe('Breadcrumb navigation: Home › Products › Electronics › Phones (current page)');
    });

    it('assigns correct roles to items', () => {
      expect(getItemRole({ label: 'Home' })).toBe('link');
      expect(getItemRole({ label: 'Current', current: true })).toBe('none');
      expect(getItemRole({ label: 'Disabled', disabled: true })).toBe('none');
    });

    it('includes disabled state in aria label', () => {
      const items: A11yItem[] = [
        { label: 'Home' },
        { label: 'Admin', disabled: true },
        { label: 'Users' },
      ];
      
      const ariaLabel = generateAriaLabel(items);
      expect(ariaLabel).toContain('Admin (disabled)');
    });
  });

  describe('Responsive Behavior', () => {
    interface ResponsiveConfig {
      screenWidth: number;
      itemCount: number;
      itemAverageWidth: number;
    }

    const calculateResponsiveLayout = (config: ResponsiveConfig) => {
      const padding = 32; // Horizontal padding
      const separatorWidth = 24; // Width including spacing
      const availableWidth = config.screenWidth - padding;
      
      const totalItemsWidth = config.itemCount * config.itemAverageWidth;
      const totalSeparatorsWidth = (config.itemCount - 1) * separatorWidth;
      const totalWidth = totalItemsWidth + totalSeparatorsWidth;
      
      const shouldScroll = totalWidth > availableWidth;
      const maxVisibleItems = shouldScroll 
        ? Math.floor(availableWidth / (config.itemAverageWidth + separatorWidth))
        : config.itemCount;
      
      return {
        shouldScroll,
        maxVisibleItems,
        totalWidth,
        availableWidth,
      };
    };

    it('enables scrolling when content exceeds width', () => {
      const layout = calculateResponsiveLayout({
        screenWidth: 320,
        itemCount: 6,
        itemAverageWidth: 80,
      });
      
      expect(layout.shouldScroll).toBe(true);
      expect(layout.maxVisibleItems).toBeLessThan(6);
    });

    it('disables scrolling when content fits', () => {
      const layout = calculateResponsiveLayout({
        screenWidth: 768,
        itemCount: 4,
        itemAverageWidth: 80,
      });
      
      expect(layout.shouldScroll).toBe(false);
      expect(layout.maxVisibleItems).toBe(4);
    });

    it('calculates correct total width', () => {
      const layout = calculateResponsiveLayout({
        screenWidth: 500,
        itemCount: 5,
        itemAverageWidth: 70,
      });
      
      // 5 items * 70px + 4 separators * 24px = 350 + 96 = 446
      expect(layout.totalWidth).toBe(446);
    });
  });

  describe('Icon Support', () => {
    interface IconBreadcrumbItem {
      label: string;
      icon?: string;
      iconPosition?: 'left' | 'right';
    }

    const formatIconItem = (item: IconBreadcrumbItem) => {
      if (!item.icon) {
        return { content: item.label, hasIcon: false };
      }

      const spacing = 4;
      return {
        content: {
          icon: item.icon,
          label: item.label,
          spacing,
          layout: item.iconPosition || 'left',
        },
        hasIcon: true,
        iconSize: 16,
      };
    };

    it('formats items with icons', () => {
      const item = formatIconItem({
        label: 'Dashboard',
        icon: 'house',
      });
      
      expect(item.hasIcon).toBe(true);
      expect(item.content).toEqual({
        icon: 'house',
        label: 'Dashboard',
        spacing: 4,
        layout: 'left',
      });
    });

    it('handles items without icons', () => {
      const item = formatIconItem({ label: 'Settings' });
      
      expect(item.hasIcon).toBe(false);
      expect(item.content).toBe('Settings');
    });

    it('supports right-aligned icons', () => {
      const item = formatIconItem({
        label: 'External',
        icon: 'arrow.up.right',
        iconPosition: 'right',
      });
      
      expect(item.content.layout).toBe('right');
    });
  });
});