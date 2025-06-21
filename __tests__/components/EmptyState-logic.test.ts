import { describe, it, expect } from '@jest/globals';

describe('EmptyState Component Logic', () => {
  describe('EmptyState Variants', () => {
    interface EmptyStateVariant {
      icon: string;
      title: string;
      description: string;
      action?: {
        label: string;
        variant: 'primary' | 'secondary';
      };
    }

    const emptyStateVariants: Record<string, EmptyStateVariant> = {
      'no-data': {
        icon: 'database',
        title: 'No data yet',
        description: 'Start by creating your first item.',
        action: {
          label: 'Create Item',
          variant: 'primary',
        },
      },
      'no-results': {
        icon: 'search',
        title: 'No results found',
        description: 'Try adjusting your search or filters.',
        action: {
          label: 'Clear Filters',
          variant: 'secondary',
        },
      },
      'error': {
        icon: 'alert-circle',
        title: 'Something went wrong',
        description: 'We encountered an error loading this content.',
        action: {
          label: 'Try Again',
          variant: 'primary',
        },
      },
      'offline': {
        icon: 'wifi-off',
        title: "You're offline",
        description: 'Check your connection and try again.',
        action: {
          label: 'Retry',
          variant: 'primary',
        },
      },
      'maintenance': {
        icon: 'wrench',
        title: 'Under maintenance',
        description: "We're working on improvements. Check back soon.",
      },
      'restricted': {
        icon: 'lock',
        title: 'Access restricted',
        description: "You don't have permission to view this content.",
        action: {
          label: 'Request Access',
          variant: 'secondary',
        },
      },
    };

    it('has all common empty state variants', () => {
      const expectedVariants = ['no-data', 'no-results', 'error', 'offline', 'maintenance', 'restricted'];
      expect(Object.keys(emptyStateVariants)).toEqual(expectedVariants);
    });

    it('each variant has appropriate messaging', () => {
      expect(emptyStateVariants['no-data'].title).toBe('No data yet');
      expect(emptyStateVariants['error'].title).toBe('Something went wrong');
      expect(emptyStateVariants['offline'].title).toBe("You're offline");
    });

    it('variants have appropriate icons', () => {
      expect(emptyStateVariants['no-results'].icon).toBe('search');
      expect(emptyStateVariants['error'].icon).toBe('alert-circle');
      expect(emptyStateVariants['offline'].icon).toBe('wifi-off');
    });

    it('some variants have no action', () => {
      expect(emptyStateVariants['maintenance'].action).toBeUndefined();
    });
  });

  describe('EmptyState Layout', () => {
    const getEmptyStateLayout = (props: {
      size?: 'sm' | 'md' | 'lg';
      alignment?: 'left' | 'center' | 'right';
    }) => {
      const size = props.size || 'md';
      const alignment = props.alignment || 'center';

      const sizes = {
        sm: {
          iconSize: 40,
          titleSize: 'text-lg',
          descriptionSize: 'text-sm',
          spacing: 12,
          maxWidth: 300,
        },
        md: {
          iconSize: 64,
          titleSize: 'text-xl',
          descriptionSize: 'text-base',
          spacing: 16,
          maxWidth: 400,
        },
        lg: {
          iconSize: 80,
          titleSize: 'text-2xl',
          descriptionSize: 'text-lg',
          spacing: 24,
          maxWidth: 500,
        },
      };

      const alignments = {
        left: 'items-start text-left',
        center: 'items-center text-center',
        right: 'items-end text-right',
      };

      return {
        ...sizes[size],
        alignment: alignments[alignment],
        container: `flex flex-col ${alignments[alignment]}`,
      };
    };

    it('has progressive sizing', () => {
      const sm = getEmptyStateLayout({ size: 'sm' });
      const md = getEmptyStateLayout({ size: 'md' });
      const lg = getEmptyStateLayout({ size: 'lg' });

      expect(sm.iconSize).toBeLessThan(md.iconSize);
      expect(md.iconSize).toBeLessThan(lg.iconSize);
      expect(sm.maxWidth).toBeLessThan(md.maxWidth);
      expect(md.maxWidth).toBeLessThan(lg.maxWidth);
    });

    it('defaults to medium size and center alignment', () => {
      const layout = getEmptyStateLayout({});
      expect(layout.iconSize).toBe(64);
      expect(layout.alignment).toContain('center');
    });

    it('supports different alignments', () => {
      const left = getEmptyStateLayout({ alignment: 'left' });
      expect(left.alignment).toContain('items-start');
      expect(left.alignment).toContain('text-left');

      const right = getEmptyStateLayout({ alignment: 'right' });
      expect(right.alignment).toContain('items-end');
      expect(right.alignment).toContain('text-right');
    });
  });

  describe('EmptyState Illustration', () => {
    const getIllustrationConfig = (props: {
      type?: 'icon' | 'image' | 'custom';
      source?: string;
      color?: string;
      animated?: boolean;
    }) => {
      const type = props.type || 'icon';

      if (type === 'icon') {
        return {
          type: 'icon',
          color: props.color || 'text-muted-foreground',
          animated: props.animated || false,
          animationClass: props.animated ? 'animate-pulse' : '',
        };
      }

      if (type === 'image') {
        return {
          type: 'image',
          source: props.source || '/default-empty-state.svg',
          alt: 'Empty state illustration',
          loading: 'lazy' as const,
        };
      }

      return {
        type: 'custom',
        render: true,
      };
    };

    it('configures icon illustration', () => {
      const icon = getIllustrationConfig({ type: 'icon' });
      expect(icon.type).toBe('icon');
      expect(icon.color).toBe('text-muted-foreground');
    });

    it('supports animated icons', () => {
      const animated = getIllustrationConfig({ type: 'icon', animated: true });
      expect(animated.animationClass).toBe('animate-pulse');
    });

    it('configures image illustration', () => {
      const image = getIllustrationConfig({ 
        type: 'image', 
        source: '/custom-empty.png' 
      });
      expect(image.type).toBe('image');
      expect(image.source).toBe('/custom-empty.png');
      expect(image.loading).toBe('lazy');
    });

    it('supports custom illustration', () => {
      const custom = getIllustrationConfig({ type: 'custom' });
      expect(custom.type).toBe('custom');
      expect(custom.render).toBe(true);
    });
  });

  describe('EmptyState Actions', () => {
    interface EmptyStateAction {
      label: string;
      onClick: () => void;
      variant?: 'primary' | 'secondary' | 'link';
      icon?: string;
      disabled?: boolean;
    }

    const formatEmptyStateActions = (actions: EmptyStateAction[]) => {
      return actions.map(action => ({
        ...action,
        variant: action.variant || 'primary',
        className: getActionClassName(action),
        ariaLabel: action.label,
      }));
    };

    const getActionClassName = (action: EmptyStateAction) => {
      const baseClasses = 'inline-flex items-center justify-center';
      const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        link: 'text-primary underline-offset-4 hover:underline',
      };

      const disabledClass = action.disabled ? 'opacity-50 cursor-not-allowed' : '';

      return `${baseClasses} ${variantClasses[action.variant || 'primary']} ${disabledClass}`.trim();
    };

    it('formats single action', () => {
      const actions = formatEmptyStateActions([
        { label: 'Create Item', onClick: () => {} },
      ]);

      expect(actions).toHaveLength(1);
      expect(actions[0].variant).toBe('primary');
      expect(actions[0].ariaLabel).toBe('Create Item');
    });

    it('supports multiple actions', () => {
      const actions = formatEmptyStateActions([
        { label: 'Primary', onClick: () => {} },
        { label: 'Secondary', onClick: () => {}, variant: 'secondary' },
      ]);

      expect(actions).toHaveLength(2);
      expect(actions[0].variant).toBe('primary');
      expect(actions[1].variant).toBe('secondary');
    });

    it('handles disabled state', () => {
      const actions = formatEmptyStateActions([
        { label: 'Disabled', onClick: () => {}, disabled: true },
      ]);

      expect(actions[0].className).toContain('opacity-50');
      expect(actions[0].className).toContain('cursor-not-allowed');
    });
  });

  describe('EmptyState Customization', () => {
    interface EmptyStateProps {
      icon?: string;
      title?: string;
      description?: string;
      hideIcon?: boolean;
      hideDescription?: boolean;
      compact?: boolean;
    }

    const buildEmptyState = (props: EmptyStateProps) => {
      const showIcon = !props.hideIcon && props.icon;
      const showDescription = !props.hideDescription && props.description;
      const spacing = props.compact ? 8 : 16;

      const elements = [];

      if (showIcon) {
        elements.push({ type: 'icon', value: props.icon });
      }

      if (props.title) {
        elements.push({ type: 'title', value: props.title });
      }

      if (showDescription) {
        elements.push({ type: 'description', value: props.description });
      }

      return {
        elements,
        spacing,
        layout: props.compact ? 'compact' : 'normal',
      };
    };

    it('includes all elements by default', () => {
      const state = buildEmptyState({
        icon: 'inbox',
        title: 'No messages',
        description: 'Your inbox is empty',
      });

      expect(state.elements).toHaveLength(3);
      expect(state.elements[0].type).toBe('icon');
      expect(state.elements[1].type).toBe('title');
      expect(state.elements[2].type).toBe('description');
    });

    it('can hide icon', () => {
      const state = buildEmptyState({
        icon: 'inbox',
        title: 'No messages',
        hideIcon: true,
      });

      expect(state.elements.find(e => e.type === 'icon')).toBeUndefined();
    });

    it('can hide description', () => {
      const state = buildEmptyState({
        title: 'No messages',
        description: 'Your inbox is empty',
        hideDescription: true,
      });

      expect(state.elements.find(e => e.type === 'description')).toBeUndefined();
    });

    it('supports compact mode', () => {
      const state = buildEmptyState({
        title: 'No data',
        compact: true,
      });

      expect(state.spacing).toBe(8);
      expect(state.layout).toBe('compact');
    });
  });

  describe('EmptyState Themes', () => {
    const getEmptyStateTheme = (props: {
      variant?: 'default' | 'subtle' | 'bordered';
      colorScheme?: 'neutral' | 'primary' | 'success' | 'warning' | 'error';
    }) => {
      const variant = props.variant || 'default';
      const colorScheme = props.colorScheme || 'neutral';

      const variants = {
        default: {
          container: '',
          icon: `text-${colorScheme}-500`,
          title: 'text-foreground',
          description: 'text-muted-foreground',
        },
        subtle: {
          container: `bg-${colorScheme}-50 dark:bg-${colorScheme}-950`,
          icon: `text-${colorScheme}-600`,
          title: `text-${colorScheme}-900 dark:text-${colorScheme}-100`,
          description: `text-${colorScheme}-700 dark:text-${colorScheme}-300`,
        },
        bordered: {
          container: `border-2 border-${colorScheme}-200 dark:border-${colorScheme}-800`,
          icon: `text-${colorScheme}-500`,
          title: 'text-foreground',
          description: 'text-muted-foreground',
        },
      };

      return variants[variant];
    };

    it('applies default theme', () => {
      const theme = getEmptyStateTheme({});
      expect(theme.container).toBe('');
      expect(theme.icon).toBe('text-neutral-500');
    });

    it('applies subtle theme with color', () => {
      const theme = getEmptyStateTheme({
        variant: 'subtle',
        colorScheme: 'primary',
      });
      expect(theme.container).toContain('bg-primary-50');
      expect(theme.icon).toBe('text-primary-600');
    });

    it('applies bordered theme', () => {
      const theme = getEmptyStateTheme({
        variant: 'bordered',
        colorScheme: 'warning',
      });
      expect(theme.container).toContain('border-2');
      expect(theme.container).toContain('border-warning-200');
    });
  });

  describe('EmptyState Responsive', () => {
    const getResponsiveEmptyState = (screenWidth: number) => {
      const breakpoints = {
        mobile: 640,
        tablet: 1024,
      };

      const isMobile = screenWidth < breakpoints.mobile;
      const isTablet = screenWidth >= breakpoints.mobile && screenWidth < breakpoints.tablet;

      return {
        size: isMobile ? 'sm' : isTablet ? 'md' : 'lg',
        padding: isMobile ? 16 : isTablet ? 24 : 32,
        iconSize: isMobile ? 40 : isTablet ? 56 : 64,
        titleSize: isMobile ? 'text-base' : isTablet ? 'text-lg' : 'text-xl',
        descriptionSize: isMobile ? 'text-sm' : 'text-base',
        actionStacking: isMobile ? 'vertical' : 'horizontal',
        maxWidth: isMobile ? '100%' : isTablet ? 400 : 500,
      };
    };

    it('adjusts for mobile screens', () => {
      const mobile = getResponsiveEmptyState(375);
      expect(mobile.size).toBe('sm');
      expect(mobile.iconSize).toBe(40);
      expect(mobile.actionStacking).toBe('vertical');
      expect(mobile.maxWidth).toBe('100%');
    });

    it('adjusts for tablet screens', () => {
      const tablet = getResponsiveEmptyState(768);
      expect(tablet.size).toBe('md');
      expect(tablet.iconSize).toBe(56);
      expect(tablet.actionStacking).toBe('horizontal');
      expect(tablet.maxWidth).toBe(400);
    });

    it('adjusts for desktop screens', () => {
      const desktop = getResponsiveEmptyState(1440);
      expect(desktop.size).toBe('lg');
      expect(desktop.iconSize).toBe(64);
      expect(desktop.titleSize).toBe('text-xl');
    });
  });

  describe('EmptyState Animation', () => {
    const getEmptyStateAnimation = (props: {
      animated?: boolean;
      animationType?: 'fade' | 'scale' | 'slide';
      delay?: number;
    }) => {
      if (!props.animated) return null;

      const type = props.animationType || 'fade';
      const delay = props.delay || 0;

      const animations = {
        fade: {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          duration: 500,
        },
        scale: {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          duration: 400,
        },
        slide: {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          duration: 600,
        },
      };

      return {
        ...animations[type],
        delay,
        easing: 'ease-out',
      };
    };

    it('returns null when not animated', () => {
      const anim = getEmptyStateAnimation({ animated: false });
      expect(anim).toBeNull();
    });

    it('defaults to fade animation', () => {
      const anim = getEmptyStateAnimation({ animated: true });
      expect(anim?.initial.opacity).toBe(0);
      expect(anim?.animate.opacity).toBe(1);
      expect(anim?.duration).toBe(500);
    });

    it('supports scale animation', () => {
      const anim = getEmptyStateAnimation({ animated: true, animationType: 'scale' });
      expect(anim?.initial).toHaveProperty('scale', 0.8);
      expect(anim?.animate).toHaveProperty('scale', 1);
    });

    it('supports animation delay', () => {
      const anim = getEmptyStateAnimation({ animated: true, delay: 200 });
      expect(anim?.delay).toBe(200);
    });
  });
});