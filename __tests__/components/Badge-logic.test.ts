import { describe, it, expect } from '@jest/globals';

describe('Badge Component Logic', () => {
  describe('Badge Variants', () => {
    const badgeVariants = {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      outline: 'text-foreground border border-input',
      success: 'bg-green-600 text-white',
      warning: 'bg-yellow-600 text-white',
      info: 'bg-blue-600 text-white',
    };

    it('has all badge variants', () => {
      const expectedVariants = ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info'];
      expect(Object.keys(badgeVariants)).toEqual(expectedVariants);
    });

    it('default variant uses primary colors', () => {
      expect(badgeVariants.default).toContain('bg-primary');
      expect(badgeVariants.default).toContain('text-primary-foreground');
    });

    it('outline variant has border', () => {
      expect(badgeVariants.outline).toContain('border');
      expect(badgeVariants.outline).not.toContain('bg-');
    });

    it('semantic variants use appropriate colors', () => {
      expect(badgeVariants.success).toContain('bg-green-600');
      expect(badgeVariants.warning).toContain('bg-yellow-600');
      expect(badgeVariants.info).toContain('bg-blue-600');
    });
  });

  describe('Badge Sizes', () => {
    const badgeSizes = {
      sm: { padding: 'px-2 py-0.5', fontSize: 'text-xs' },
      md: { padding: 'px-2.5 py-1', fontSize: 'text-sm' },
      lg: { padding: 'px-3 py-1.5', fontSize: 'text-base' },
    };

    it('has progressive sizing', () => {
      expect(badgeSizes.sm.fontSize).toBe('text-xs');
      expect(badgeSizes.md.fontSize).toBe('text-sm');
      expect(badgeSizes.lg.fontSize).toBe('text-base');
    });

    it('adjusts padding for each size', () => {
      expect(badgeSizes.sm.padding).toBe('px-2 py-0.5');
      expect(badgeSizes.md.padding).toBe('px-2.5 py-1');
      expect(badgeSizes.lg.padding).toBe('px-3 py-1.5');
    });
  });

  describe('Badge Content', () => {
    interface BadgeContent {
      text?: string;
      icon?: string;
      count?: number;
      maxCount?: number;
    }

    const formatBadgeContent = (content: BadgeContent) => {
      if (content.count !== undefined) {
        const max = content.maxCount || 99;
        const displayCount = content.count > max ? `${max}+` : content.count.toString();
        return {
          text: displayCount,
          type: 'count',
          isOverMax: content.count > max,
        };
      }

      return {
        text: content.text || '',
        icon: content.icon,
        type: 'text',
      };
    };

    it('formats count badges', () => {
      const count = formatBadgeContent({ count: 5 });
      expect(count.text).toBe('5');
      expect(count.type).toBe('count');
    });

    it('handles max count limit', () => {
      const overMax = formatBadgeContent({ count: 150, maxCount: 99 });
      expect(overMax.text).toBe('99+');
      expect(overMax.isOverMax).toBe(true);
    });

    it('custom max count', () => {
      const customMax = formatBadgeContent({ count: 1500, maxCount: 999 });
      expect(customMax.text).toBe('999+');
    });

    it('formats text badges', () => {
      const text = formatBadgeContent({ text: 'NEW' });
      expect(text.text).toBe('NEW');
      expect(text.type).toBe('text');
    });

    it('handles empty content', () => {
      const empty = formatBadgeContent({});
      expect(empty.text).toBe('');
      expect(empty.type).toBe('text');
    });
  });

  describe('Badge Shapes', () => {
    const badgeShapes = {
      rounded: 'rounded-md',
      pill: 'rounded-full',
      square: 'rounded-none',
    };

    it('has different shape options', () => {
      expect(Object.keys(badgeShapes)).toEqual(['rounded', 'pill', 'square']);
    });

    it('applies correct border radius', () => {
      expect(badgeShapes.rounded).toBe('rounded-md');
      expect(badgeShapes.pill).toBe('rounded-full');
      expect(badgeShapes.square).toBe('rounded-none');
    });
  });

  describe('Badge Positioning', () => {
    const getBadgePosition = (props: {
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
      offset?: number;
    }) => {
      const position = props.position || 'top-right';
      const offset = props.offset || 0;

      const positions = {
        'top-left': { top: offset, left: offset },
        'top-right': { top: offset, right: offset },
        'bottom-left': { bottom: offset, left: offset },
        'bottom-right': { bottom: offset, right: offset },
      };

      return {
        position: 'absolute',
        ...positions[position],
        transform: position.includes('right') ? 'translate(50%, -50%)' : 'translate(-50%, -50%)',
      };
    };

    it('positions badge in corners', () => {
      const topRight = getBadgePosition({ position: 'top-right' });
      expect(topRight.top).toBe(0);
      expect(topRight.right).toBe(0);
    });

    it('applies offset', () => {
      const withOffset = getBadgePosition({ position: 'top-left', offset: 4 });
      expect(withOffset.top).toBe(4);
      expect(withOffset.left).toBe(4);
    });

    it('transforms for overlap effect', () => {
      const rightSide = getBadgePosition({ position: 'top-right' });
      expect(rightSide.transform).toBe('translate(50%, -50%)');

      const leftSide = getBadgePosition({ position: 'top-left' });
      expect(leftSide.transform).toBe('translate(-50%, -50%)');
    });
  });

  describe('Badge Animations', () => {
    const getBadgeAnimation = (props: {
      animated?: boolean;
      type?: 'pulse' | 'bounce' | 'fade';
    }) => {
      if (!props.animated) return null;

      const animations = {
        pulse: {
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          keyframes: {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.5 },
          },
        },
        bounce: {
          animation: 'bounce 1s infinite',
          keyframes: {
            '0%, 100%': { transform: 'translateY(-25%)' },
            '50%': { transform: 'translateY(0)' },
          },
        },
        fade: {
          animation: 'fadeIn 0.3s ease-out',
          keyframes: {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 },
          },
        },
      };

      return animations[props.type || 'pulse'];
    };

    it('returns animation config when animated', () => {
      const pulse = getBadgeAnimation({ animated: true });
      expect(pulse?.animation).toContain('pulse');
    });

    it('returns null when not animated', () => {
      const noAnim = getBadgeAnimation({ animated: false });
      expect(noAnim).toBeNull();
    });

    it('supports different animation types', () => {
      const bounce = getBadgeAnimation({ animated: true, type: 'bounce' });
      expect(bounce?.animation).toContain('bounce');

      const fade = getBadgeAnimation({ animated: true, type: 'fade' });
      expect(fade?.animation).toContain('fadeIn');
    });
  });

  describe('Badge Accessibility', () => {
    const getBadgeA11y = (props: {
      content: string | number;
      screenReaderLabel?: string;
      variant?: string;
    }) => {
      const isCount = typeof props.content === 'number';
      const isDestructive = props.variant === 'destructive';
      const isWarning = props.variant === 'warning';

      const defaultLabel = isCount
        ? `${props.content} items`
        : props.content.toString();

      return {
        'aria-label': props.screenReaderLabel || defaultLabel,
        'aria-live': isDestructive || isWarning ? 'assertive' : 'polite',
        role: isCount ? 'status' : undefined,
      };
    };

    it('provides aria-label for counts', () => {
      const count = getBadgeA11y({ content: 5 });
      expect(count['aria-label']).toBe('5 items');
      expect(count.role).toBe('status');
    });

    it('uses custom screen reader label', () => {
      const custom = getBadgeA11y({
        content: 3,
        screenReaderLabel: '3 new notifications',
      });
      expect(custom['aria-label']).toBe('3 new notifications');
    });

    it('sets appropriate aria-live', () => {
      const normal = getBadgeA11y({ content: 'NEW' });
      expect(normal['aria-live']).toBe('polite');

      const urgent = getBadgeA11y({ content: 'ERROR', variant: 'destructive' });
      expect(urgent['aria-live']).toBe('assertive');
    });
  });

  describe('Badge Groups', () => {
    interface BadgeGroup {
      badges: { id: string; content: string | number }[];
      maxVisible?: number;
      spacing?: number;
    }

    const getBadgeGroupConfig = (group: BadgeGroup) => {
      const maxVisible = group.maxVisible || Infinity;
      const visibleBadges = group.badges.slice(0, maxVisible);
      const hiddenCount = Math.max(0, group.badges.length - maxVisible);

      return {
        visibleBadges,
        hiddenCount,
        showMore: hiddenCount > 0,
        spacing: group.spacing || 4,
        moreLabel: `+${hiddenCount}`,
      };
    };

    it('limits visible badges', () => {
      const group = getBadgeGroupConfig({
        badges: [
          { id: '1', content: 'A' },
          { id: '2', content: 'B' },
          { id: '3', content: 'C' },
          { id: '4', content: 'D' },
        ],
        maxVisible: 2,
      });

      expect(group.visibleBadges).toHaveLength(2);
      expect(group.hiddenCount).toBe(2);
      expect(group.showMore).toBe(true);
      expect(group.moreLabel).toBe('+2');
    });

    it('shows all when under limit', () => {
      const group = getBadgeGroupConfig({
        badges: [
          { id: '1', content: 'A' },
          { id: '2', content: 'B' },
        ],
        maxVisible: 5,
      });

      expect(group.visibleBadges).toHaveLength(2);
      expect(group.showMore).toBe(false);
    });
  });
});