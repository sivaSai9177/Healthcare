import { describe, it, expect } from '@jest/globals';

describe('Card Component Logic', () => {
  describe('Card Variants', () => {
    const cardVariants = {
      default: 'bg-card text-card-foreground shadow-sm',
      outline: 'border border-border bg-transparent',
      elevated: 'bg-card text-card-foreground shadow-lg',
      filled: 'bg-muted text-muted-foreground',
      glass: 'glass glass-hover',
    };

    it('has all required variants', () => {
      const expectedVariants = ['default', 'outline', 'elevated', 'filled', 'glass'];
      expect(Object.keys(cardVariants)).toEqual(expectedVariants);
    });

    it('default variant has shadow', () => {
      expect(cardVariants.default).toContain('shadow-sm');
      expect(cardVariants.default).toContain('bg-card');
    });

    it('elevated variant has larger shadow', () => {
      expect(cardVariants.elevated).toContain('shadow-lg');
    });

    it('outline variant has border but no background', () => {
      expect(cardVariants.outline).toContain('border');
      expect(cardVariants.outline).toContain('bg-transparent');
    });

    it('glass variant has glass effects', () => {
      expect(cardVariants.glass).toContain('glass');
      expect(cardVariants.glass).toContain('glass-hover');
    });
  });

  describe('Card Padding', () => {
    const cardPadding = {
      none: 'p-0',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    };

    it('has progressive padding sizes', () => {
      expect(cardPadding.none).toBe('p-0');
      expect(cardPadding.sm).toBe('p-2');
      expect(cardPadding.md).toBe('p-4');
      expect(cardPadding.lg).toBe('p-6');
      expect(cardPadding.xl).toBe('p-8');
    });

    it('supports no padding option', () => {
      expect(cardPadding.none).toBe('p-0');
    });
  });

  describe('Card States', () => {
    const getCardState = (props: {
      isPressable?: boolean;
      isDisabled?: boolean;
      isLoading?: boolean;
      isSelected?: boolean;
    }) => {
      return {
        interactive: props.isPressable && !props.isDisabled && !props.isLoading,
        showLoadingOverlay: props.isLoading,
        opacity: props.isDisabled ? 0.5 : 1,
        cursor: props.isPressable && !props.isDisabled ? 'pointer' : 'default',
        borderHighlight: props.isSelected,
      };
    };

    it('handles pressable state', () => {
      const state = getCardState({ isPressable: true });
      expect(state.interactive).toBe(true);
      expect(state.cursor).toBe('pointer');
    });

    it('disables interaction when loading', () => {
      const state = getCardState({ isPressable: true, isLoading: true });
      expect(state.interactive).toBe(false);
      expect(state.showLoadingOverlay).toBe(true);
    });

    it('handles disabled state', () => {
      const state = getCardState({ isPressable: true, isDisabled: true });
      expect(state.interactive).toBe(false);
      expect(state.opacity).toBe(0.5);
      expect(state.cursor).toBe('default');
    });

    it('handles selected state', () => {
      const state = getCardState({ isSelected: true });
      expect(state.borderHighlight).toBe(true);
    });
  });

  describe('Card Layout', () => {
    interface CardSection {
      type: 'header' | 'content' | 'footer' | 'media';
      padding?: string;
      borderTop?: boolean;
      borderBottom?: boolean;
    }

    const getCardLayout = (sections: CardSection[]) => {
      return sections.map((section, index) => ({
        ...section,
        isFirst: index === 0,
        isLast: index === sections.length - 1,
        borderTop: section.borderTop || (section.type === 'footer' && index > 0),
        borderBottom: section.borderBottom || (section.type === 'header' && index < sections.length - 1),
      }));
    };

    it('identifies first and last sections', () => {
      const layout = getCardLayout([
        { type: 'header' },
        { type: 'content' },
        { type: 'footer' },
      ]);
      
      expect(layout[0].isFirst).toBe(true);
      expect(layout[0].isLast).toBe(false);
      expect(layout[2].isFirst).toBe(false);
      expect(layout[2].isLast).toBe(true);
    });

    it('adds borders between sections', () => {
      const layout = getCardLayout([
        { type: 'header' },
        { type: 'content' },
        { type: 'footer' },
      ]);
      
      expect(layout[0].borderBottom).toBe(true); // Header has bottom border
      expect(layout[2].borderTop).toBe(true); // Footer has top border
    });

    it('handles single section', () => {
      const layout = getCardLayout([{ type: 'content' }]);
      
      expect(layout[0].isFirst).toBe(true);
      expect(layout[0].isLast).toBe(true);
      expect(layout[0].borderTop).toBeFalsy();
      expect(layout[0].borderBottom).toBeFalsy();
    });
  });

  describe('Card Actions', () => {
    interface CardAction {
      label: string;
      variant?: 'primary' | 'secondary' | 'danger';
      icon?: string;
      disabled?: boolean;
    }

    const formatCardActions = (actions: CardAction[], alignment: 'left' | 'right' | 'center' = 'right') => {
      return {
        actions: actions.map(action => ({
          ...action,
          variant: action.variant || 'secondary',
          className: getActionClassName(action),
        })),
        containerClass: `flex gap-2 justify-${alignment === 'left' ? 'start' : alignment === 'center' ? 'center' : 'end'}`,
      };
    };

    const getActionClassName = (action: CardAction) => {
      const base = 'px-3 py-1.5 rounded-md text-sm';
      const variants = {
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        danger: 'bg-destructive text-destructive-foreground',
      };
      const disabled = action.disabled ? 'opacity-50 cursor-not-allowed' : '';
      
      return `${base} ${variants[action.variant || 'secondary']} ${disabled}`.trim();
    };

    it('formats actions with default variant', () => {
      const formatted = formatCardActions([
        { label: 'Cancel' },
        { label: 'Save', variant: 'primary' },
      ]);
      
      expect(formatted.actions[0].variant).toBe('secondary');
      expect(formatted.actions[1].variant).toBe('primary');
    });

    it('applies correct action styles', () => {
      const action = { label: 'Delete', variant: 'danger' as const };
      const className = getActionClassName(action);
      
      expect(className).toContain('bg-destructive');
      expect(className).toContain('text-destructive-foreground');
    });

    it('handles disabled actions', () => {
      const action = { label: 'Submit', disabled: true };
      const className = getActionClassName(action);
      
      expect(className).toContain('opacity-50');
      expect(className).toContain('cursor-not-allowed');
    });

    it('aligns actions correctly', () => {
      const left = formatCardActions([], 'left');
      const center = formatCardActions([], 'center');
      const right = formatCardActions([]);
      
      expect(left.containerClass).toContain('justify-start');
      expect(center.containerClass).toContain('justify-center');
      expect(right.containerClass).toContain('justify-end');
    });
  });

  describe('Card Media', () => {
    const getMediaStyles = (props: {
      position: 'top' | 'bottom' | 'left' | 'right';
      size?: 'sm' | 'md' | 'lg' | 'full';
      aspectRatio?: string;
    }) => {
      const sizes = {
        sm: { width: 80, height: 80 },
        md: { width: 120, height: 120 },
        lg: { width: 200, height: 200 },
        full: { width: '100%', height: 'auto' },
      };

      const isHorizontal = props.position === 'left' || props.position === 'right';
      const size = props.size || 'md';

      return {
        container: isHorizontal ? 'flex flex-row' : 'flex flex-col',
        mediaOrder: props.position === 'bottom' || props.position === 'right' ? 'order-2' : 'order-1',
        contentOrder: props.position === 'bottom' || props.position === 'right' ? 'order-1' : 'order-2',
        mediaSize: sizes[size],
        aspectRatio: props.aspectRatio || (size === 'full' ? '16/9' : '1/1'),
      };
    };

    it('handles horizontal layouts', () => {
      const left = getMediaStyles({ position: 'left' });
      const right = getMediaStyles({ position: 'right' });
      
      expect(left.container).toContain('flex-row');
      expect(right.container).toContain('flex-row');
    });

    it('handles vertical layouts', () => {
      const top = getMediaStyles({ position: 'top' });
      const bottom = getMediaStyles({ position: 'bottom' });
      
      expect(top.container).toContain('flex-col');
      expect(bottom.container).toContain('flex-col');
    });

    it('orders media correctly', () => {
      const top = getMediaStyles({ position: 'top' });
      const bottom = getMediaStyles({ position: 'bottom' });
      
      expect(top.mediaOrder).toBe('order-1');
      expect(top.contentOrder).toBe('order-2');
      expect(bottom.mediaOrder).toBe('order-2');
      expect(bottom.contentOrder).toBe('order-1');
    });

    it('applies size styles', () => {
      const sm = getMediaStyles({ position: 'left', size: 'sm' });
      const full = getMediaStyles({ position: 'top', size: 'full' });
      
      expect(sm.mediaSize.width).toBe(80);
      expect(full.mediaSize.width).toBe('100%');
    });
  });

  describe('Card Hover Effects', () => {
    const getHoverStyles = (variant: string, isPressable: boolean) => {
      if (!isPressable) return '';
      
      const hoverEffects = {
        default: 'hover:shadow-md transition-shadow',
        outline: 'hover:border-primary transition-colors',
        elevated: 'hover:shadow-xl hover:-translate-y-1 transition-all',
        filled: 'hover:bg-muted/80 transition-colors',
        glass: 'hover:backdrop-blur-lg transition-all',
      };
      
      return hoverEffects[variant as keyof typeof hoverEffects] || '';
    };

    it('adds hover effects for pressable cards', () => {
      const hover = getHoverStyles('default', true);
      expect(hover).toContain('hover:shadow-md');
      expect(hover).toContain('transition-shadow');
    });

    it('no hover effects for non-pressable cards', () => {
      const hover = getHoverStyles('default', false);
      expect(hover).toBe('');
    });

    it('elevated cards have lift effect', () => {
      const hover = getHoverStyles('elevated', true);
      expect(hover).toContain('hover:-translate-y-1');
      expect(hover).toContain('hover:shadow-xl');
    });

    it('glass cards have backdrop blur', () => {
      const hover = getHoverStyles('glass', true);
      expect(hover).toContain('hover:backdrop-blur-lg');
    });
  });

  describe('Card Grid Layout', () => {
    const getGridStyles = (props: {
      columns?: number | { sm?: number; md?: number; lg?: number };
      gap?: 'sm' | 'md' | 'lg';
      responsive?: boolean;
    }) => {
      const gaps = {
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
      };

      if (typeof props.columns === 'number') {
        return {
          container: `grid grid-cols-${props.columns} ${gaps[props.gap || 'md']}`,
          responsive: false,
        };
      }

      const cols = props.columns || {};
      return {
        container: [
          'grid',
          cols.sm ? `grid-cols-${cols.sm}` : 'grid-cols-1',
          cols.md ? `md:grid-cols-${cols.md}` : '',
          cols.lg ? `lg:grid-cols-${cols.lg}` : '',
          gaps[props.gap || 'md'],
        ].filter(Boolean).join(' '),
        responsive: true,
      };
    };

    it('creates fixed grid layouts', () => {
      const grid = getGridStyles({ columns: 3, gap: 'md' });
      expect(grid.container).toContain('grid-cols-3');
      expect(grid.container).toContain('gap-4');
      expect(grid.responsive).toBe(false);
    });

    it('creates responsive grid layouts', () => {
      const grid = getGridStyles({
        columns: { sm: 1, md: 2, lg: 3 },
        gap: 'lg',
      });
      
      expect(grid.container).toContain('grid-cols-1');
      expect(grid.container).toContain('md:grid-cols-2');
      expect(grid.container).toContain('lg:grid-cols-3');
      expect(grid.container).toContain('gap-6');
      expect(grid.responsive).toBe(true);
    });

    it('applies gap sizes correctly', () => {
      const sm = getGridStyles({ columns: 2, gap: 'sm' });
      const lg = getGridStyles({ columns: 2, gap: 'lg' });
      
      expect(sm.container).toContain('gap-2');
      expect(lg.container).toContain('gap-6');
    });
  });
});