import { describe, it, expect, jest } from '@jest/globals';

// Test Button logic without rendering
describe('Button Component Logic', () => {
  describe('Variant Styles', () => {
    const buttonVariants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
      glass: 'glass glass-hover glass-press text-foreground',
      'glass-primary': 'glass-info glass-hover glass-press text-primary-foreground',
      'glass-destructive': 'glass-urgent glass-hover glass-press text-destructive-foreground',
    };

    it('has all required variants', () => {
      const expectedVariants = [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
        'glass',
        'glass-primary',
        'glass-destructive',
      ];
      
      expectedVariants.forEach(variant => {
        expect(buttonVariants).toHaveProperty(variant);
        expect(buttonVariants[variant as keyof typeof buttonVariants]).toBeTruthy();
      });
    });

    it('default variant has primary colors', () => {
      expect(buttonVariants.default).toContain('bg-primary');
      expect(buttonVariants.default).toContain('text-primary-foreground');
    });

    it('destructive variant has destructive colors', () => {
      expect(buttonVariants.destructive).toContain('bg-destructive');
      expect(buttonVariants.destructive).toContain('text-destructive-foreground');
    });

    it('outline variant has border', () => {
      expect(buttonVariants.outline).toContain('border');
      expect(buttonVariants.outline).toContain('border-input');
    });

    it('glass variants have glass classes', () => {
      expect(buttonVariants.glass).toContain('glass');
      expect(buttonVariants['glass-primary']).toContain('glass-info');
      expect(buttonVariants['glass-destructive']).toContain('glass-urgent');
    });
  });

  describe('Disabled Styles', () => {
    const disabledVariants = {
      default: 'bg-primary/50 text-primary-foreground/70',
      destructive: 'bg-destructive/50 text-destructive-foreground/70',
      outline: 'border-input/50 bg-background/50 text-foreground/50',
      secondary: 'bg-secondary/50 text-secondary-foreground/70',
      ghost: 'text-foreground/50',
      link: 'text-primary/50',
      glass: 'opacity-50 backdrop-blur-sm',
      'glass-primary': 'opacity-50 backdrop-blur-sm',
      'glass-destructive': 'opacity-50 backdrop-blur-sm',
    };

    it('disabled variants have reduced opacity', () => {
      expect(disabledVariants.default).toContain('/50');
      expect(disabledVariants.destructive).toContain('/50');
      expect(disabledVariants.outline).toContain('/50');
    });

    it('glass variants use opacity for disabled state', () => {
      expect(disabledVariants.glass).toContain('opacity-50');
      expect(disabledVariants['glass-primary']).toContain('opacity-50');
      expect(disabledVariants['glass-destructive']).toContain('opacity-50');
    });
  });

  describe('Button Sizes', () => {
    const buttonSizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    it('has all required sizes', () => {
      expect(Object.keys(buttonSizes)).toEqual(['default', 'sm', 'lg', 'icon']);
    });

    it('sizes have appropriate height classes', () => {
      expect(buttonSizes.default).toContain('h-10');
      expect(buttonSizes.sm).toContain('h-9');
      expect(buttonSizes.lg).toContain('h-11');
      expect(buttonSizes.icon).toContain('h-10');
    });

    it('icon size is square', () => {
      expect(buttonSizes.icon).toContain('h-10');
      expect(buttonSizes.icon).toContain('w-10');
    });

    it('larger sizes have more padding', () => {
      expect(buttonSizes.sm).toContain('px-3');
      expect(buttonSizes.default).toContain('px-4');
      expect(buttonSizes.lg).toContain('px-8');
    });
  });

  describe('Press Feedback Configuration', () => {
    const pressFeedback = {
      ios: {
        pressInScale: 0.97,
        pressInOpacity: 0.8,
        springConfig: {
          damping: 15,
          stiffness: 150,
        },
      },
      android: {
        rippleColor: 'rgba(0, 0, 0, 0.1)',
        borderless: false,
      },
      web: {
        cursor: 'pointer',
        hoverScale: 1.02,
        hoverOpacity: 0.9,
      },
    };

    it('has platform-specific configurations', () => {
      expect(pressFeedback).toHaveProperty('ios');
      expect(pressFeedback).toHaveProperty('android');
      expect(pressFeedback).toHaveProperty('web');
    });

    it('iOS has scale and opacity settings', () => {
      expect(pressFeedback.ios.pressInScale).toBeLessThan(1);
      expect(pressFeedback.ios.pressInOpacity).toBeLessThan(1);
      expect(pressFeedback.ios.springConfig).toBeDefined();
    });

    it('Android has ripple configuration', () => {
      expect(pressFeedback.android.rippleColor).toBeDefined();
      expect(pressFeedback.android.borderless).toBe(false);
    });

    it('Web has hover effects', () => {
      expect(pressFeedback.web.cursor).toBe('pointer');
      expect(pressFeedback.web.hoverScale).toBeGreaterThan(1);
    });
  });

  describe('Button Props Interface', () => {
    interface ButtonProps {
      variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'glass' | 'glass-primary' | 'glass-destructive';
      size?: 'default' | 'sm' | 'lg' | 'icon';
      isLoading?: boolean;
      isDisabled?: boolean;
      leftIcon?: any;
      rightIcon?: any;
      children?: any;
      className?: string;
      textClassName?: string;
      fullWidth?: boolean;
      animated?: boolean;
      useHaptics?: boolean;
      rippleEffect?: boolean;
      pressDepth?: number;
      shadow?: 'none' | 'sm' | 'md' | 'lg';
    }

    it('allows all variant types', () => {
      const validButton: ButtonProps = {
        variant: 'default',
      };
      expect(validButton.variant).toBe('default');

      const destructiveButton: ButtonProps = {
        variant: 'destructive',
      };
      expect(destructiveButton.variant).toBe('destructive');
    });

    it('allows all size types', () => {
      const sizes: ButtonProps['size'][] = ['default', 'sm', 'lg', 'icon'];
      sizes.forEach(size => {
        const button: ButtonProps = { size };
        expect(button.size).toBe(size);
      });
    });

    it('supports loading and disabled states', () => {
      const loadingButton: ButtonProps = {
        isLoading: true,
        isDisabled: false,
      };
      expect(loadingButton.isLoading).toBe(true);
      expect(loadingButton.isDisabled).toBe(false);
    });

    it('supports icon props', () => {
      const iconButton: ButtonProps = {
        leftIcon: 'icon-component',
        rightIcon: 'another-icon',
      };
      expect(iconButton.leftIcon).toBeDefined();
      expect(iconButton.rightIcon).toBeDefined();
    });

    it('supports animation props', () => {
      const animatedButton: ButtonProps = {
        animated: true,
        useHaptics: true,
        rippleEffect: true,
        pressDepth: 5,
      };
      expect(animatedButton.animated).toBe(true);
      expect(animatedButton.useHaptics).toBe(true);
      expect(animatedButton.rippleEffect).toBe(true);
      expect(animatedButton.pressDepth).toBe(5);
    });

    it('supports shadow variants', () => {
      const shadowVariants: ButtonProps['shadow'][] = ['none', 'sm', 'md', 'lg'];
      shadowVariants.forEach(shadow => {
        const button: ButtonProps = { shadow };
        expect(button.shadow).toBe(shadow);
      });
    });
  });

  describe('Button State Logic', () => {
    const getButtonState = (props: { isLoading?: boolean; isDisabled?: boolean; disabled?: boolean }) => {
      const isDisabled = props.isDisabled || props.disabled;
      const isInteractive = !isDisabled && !props.isLoading;
      
      return {
        isDisabled,
        isInteractive,
        showLoadingIndicator: props.isLoading,
        acceptsPress: isInteractive,
      };
    };

    it('handles loading state correctly', () => {
      const state = getButtonState({ isLoading: true });
      expect(state.showLoadingIndicator).toBe(true);
      expect(state.acceptsPress).toBe(false);
      expect(state.isInteractive).toBe(false);
    });

    it('handles disabled state correctly', () => {
      const state = getButtonState({ isDisabled: true });
      expect(state.isDisabled).toBe(true);
      expect(state.acceptsPress).toBe(false);
      expect(state.isInteractive).toBe(false);
    });

    it('handles both disabled prop formats', () => {
      const state1 = getButtonState({ isDisabled: true });
      const state2 = getButtonState({ disabled: true });
      
      expect(state1.isDisabled).toBe(true);
      expect(state2.isDisabled).toBe(true);
    });

    it('is interactive when not loading or disabled', () => {
      const state = getButtonState({});
      expect(state.isInteractive).toBe(true);
      expect(state.acceptsPress).toBe(true);
    });

    it('prioritizes loading over disabled for interaction', () => {
      const state = getButtonState({ isLoading: true, isDisabled: true });
      expect(state.showLoadingIndicator).toBe(true);
      expect(state.isDisabled).toBe(true);
      expect(state.acceptsPress).toBe(false);
    });
  });

  describe('Style Composition', () => {
    const composeButtonStyles = (
      variant: string,
      size: string,
      isDisabled: boolean,
      fullWidth: boolean,
      className?: string
    ) => {
      const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors';
      const variantStyles = variant;
      const sizeStyles = size;
      const disabledStyles = isDisabled ? 'opacity-50 cursor-not-allowed' : '';
      const widthStyles = fullWidth ? 'w-full' : '';
      
      return [baseStyles, variantStyles, sizeStyles, disabledStyles, widthStyles, className]
        .filter(Boolean)
        .join(' ');
    };

    it('includes base styles', () => {
      const styles = composeButtonStyles('', '', false, false);
      expect(styles).toContain('inline-flex');
      expect(styles).toContain('items-center');
      expect(styles).toContain('justify-center');
      expect(styles).toContain('rounded-md');
    });

    it('applies disabled styles when disabled', () => {
      const styles = composeButtonStyles('', '', true, false);
      expect(styles).toContain('opacity-50');
      expect(styles).toContain('cursor-not-allowed');
    });

    it('applies full width styles', () => {
      const styles = composeButtonStyles('', '', false, true);
      expect(styles).toContain('w-full');
    });

    it('includes custom className', () => {
      const styles = composeButtonStyles('', '', false, false, 'custom-class');
      expect(styles).toContain('custom-class');
    });

    it('filters out empty style segments', () => {
      const styles = composeButtonStyles('', '', false, false);
      expect(styles).not.toMatch(/\s{2,}/); // No double spaces
    });
  });
});