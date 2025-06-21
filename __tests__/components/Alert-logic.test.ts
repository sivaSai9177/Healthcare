import { describe, it, expect } from '@jest/globals';

describe('Alert Component Logic', () => {
  describe('Alert Variants', () => {
    const alertVariants = {
      default: 'bg-background text-foreground',
      info: 'bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border-blue-200',
      success: 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border-green-200',
      warning: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 border-yellow-200',
      error: 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border-red-200',
      destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    };

    it('has all severity levels', () => {
      const expectedVariants = ['default', 'info', 'success', 'warning', 'error', 'destructive'];
      expect(Object.keys(alertVariants)).toEqual(expectedVariants);
    });

    it('info variant has blue colors', () => {
      expect(alertVariants.info).toContain('bg-blue-50');
      expect(alertVariants.info).toContain('text-blue-900');
      expect(alertVariants.info).toContain('border-blue-200');
    });

    it('success variant has green colors', () => {
      expect(alertVariants.success).toContain('bg-green-50');
      expect(alertVariants.success).toContain('text-green-900');
      expect(alertVariants.success).toContain('border-green-200');
    });

    it('warning variant has yellow colors', () => {
      expect(alertVariants.warning).toContain('bg-yellow-50');
      expect(alertVariants.warning).toContain('text-yellow-900');
      expect(alertVariants.warning).toContain('border-yellow-200');
    });

    it('error variant has red colors', () => {
      expect(alertVariants.error).toContain('bg-red-50');
      expect(alertVariants.error).toContain('text-red-900');
      expect(alertVariants.error).toContain('border-red-200');
    });

    it('includes dark mode colors', () => {
      expect(alertVariants.info).toContain('dark:bg-blue-950');
      expect(alertVariants.success).toContain('dark:bg-green-950');
      expect(alertVariants.warning).toContain('dark:bg-yellow-950');
      expect(alertVariants.error).toContain('dark:bg-red-950');
    });
  });

  describe('Alert Icons', () => {
    const getAlertIcon = (variant: string) => {
      const icons = {
        default: 'info-circle',
        info: 'info-circle',
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'exclamation-circle',
        destructive: 'x-circle',
      };
      
      const colors = {
        default: 'text-foreground',
        info: 'text-blue-600',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        error: 'text-red-600',
        destructive: 'text-destructive',
      };
      
      return {
        name: icons[variant as keyof typeof icons] || icons.default,
        color: colors[variant as keyof typeof colors] || colors.default,
        size: 20,
      };
    };

    it('returns correct icon for each variant', () => {
      expect(getAlertIcon('info').name).toBe('info-circle');
      expect(getAlertIcon('success').name).toBe('check-circle');
      expect(getAlertIcon('warning').name).toBe('exclamation-triangle');
      expect(getAlertIcon('error').name).toBe('exclamation-circle');
      expect(getAlertIcon('destructive').name).toBe('x-circle');
    });

    it('returns correct color for each variant', () => {
      expect(getAlertIcon('info').color).toBe('text-blue-600');
      expect(getAlertIcon('success').color).toBe('text-green-600');
      expect(getAlertIcon('warning').color).toBe('text-yellow-600');
      expect(getAlertIcon('error').color).toBe('text-red-600');
    });

    it('has consistent icon size', () => {
      const variants = ['info', 'success', 'warning', 'error'];
      variants.forEach(variant => {
        expect(getAlertIcon(variant).size).toBe(20);
      });
    });
  });

  describe('Alert States', () => {
    const getAlertState = (props: {
      dismissible?: boolean;
      dismissed?: boolean;
      autoHide?: boolean;
      duration?: number;
    }) => {
      return {
        showDismissButton: props.dismissible && !props.dismissed,
        isVisible: !props.dismissed,
        shouldAutoHide: !!props.autoHide && props.duration !== undefined,
        autoHideDuration: props.duration || 5000,
      };
    };

    it('shows dismiss button when dismissible', () => {
      const state = getAlertState({ dismissible: true });
      expect(state.showDismissButton).toBe(true);
      expect(state.isVisible).toBe(true);
    });

    it('hides dismiss button when dismissed', () => {
      const state = getAlertState({ dismissible: true, dismissed: true });
      expect(state.showDismissButton).toBe(false);
      expect(state.isVisible).toBe(false);
    });

    it('handles auto-hide configuration', () => {
      const state = getAlertState({ autoHide: true, duration: 3000 });
      expect(state.shouldAutoHide).toBe(true);
      expect(state.autoHideDuration).toBe(3000);
    });

    it('uses default duration when not specified', () => {
      const state = getAlertState({ autoHide: true });
      expect(state.autoHideDuration).toBe(5000);
    });

    it('does not auto-hide without explicit flag', () => {
      const state = getAlertState({ duration: 3000 });
      expect(state.shouldAutoHide).toBe(false);
    });
  });

  describe('Alert Layout', () => {
    interface AlertContent {
      title?: string;
      description?: string;
      actions?: { label: string; action: () => void }[];
      icon?: boolean;
    }

    const getAlertLayout = (content: AlertContent) => {
      const hasIcon = content.icon !== false;
      const hasTitle = !!content.title;
      const hasDescription = !!content.description;
      const hasActions = content.actions && content.actions.length > 0;
      
      return {
        layout: hasIcon ? 'flex flex-row gap-3' : 'block',
        contentWrapper: 'flex-1',
        titleClass: hasDescription ? 'font-semibold mb-1' : 'font-medium',
        descriptionClass: 'text-sm opacity-90',
        actionsClass: hasActions ? 'mt-3 flex gap-2' : '',
        showIcon: hasIcon,
        showTitle: hasTitle,
        showDescription: hasDescription,
        showActions: hasActions,
      };
    };

    it('uses flex layout with icon', () => {
      const layout = getAlertLayout({ title: 'Test', icon: true });
      expect(layout.layout).toContain('flex flex-row');
      expect(layout.showIcon).toBe(true);
    });

    it('uses block layout without icon', () => {
      const layout = getAlertLayout({ title: 'Test', icon: false });
      expect(layout.layout).toBe('block');
      expect(layout.showIcon).toBe(false);
    });

    it('adjusts title styling with description', () => {
      const withDesc = getAlertLayout({ title: 'Title', description: 'Desc' });
      const withoutDesc = getAlertLayout({ title: 'Title' });
      
      expect(withDesc.titleClass).toContain('font-semibold');
      expect(withDesc.titleClass).toContain('mb-1');
      expect(withoutDesc.titleClass).toContain('font-medium');
    });

    it('shows actions section when provided', () => {
      const layout = getAlertLayout({
        title: 'Alert',
        actions: [{ label: 'OK', action: () => {} }],
      });
      
      expect(layout.showActions).toBe(true);
      expect(layout.actionsClass).toContain('mt-3');
      expect(layout.actionsClass).toContain('flex gap-2');
    });
  });

  describe('Alert Animation', () => {
    const getAnimationConfig = (props: {
      variant: string;
      animateIn?: boolean;
      animateOut?: boolean;
    }) => {
      const baseAnimation = {
        duration: 300,
        easing: 'ease-out',
      };
      
      const variantAnimations = {
        default: { scale: { from: 0.95, to: 1 } },
        info: { translateX: { from: -20, to: 0 } },
        success: { scale: { from: 0.9, to: 1 }, rotate: { from: -5, to: 0 } },
        warning: { translateY: { from: -10, to: 0 } },
        error: { scale: { from: 1.05, to: 1 } },
        destructive: { scale: { from: 0.95, to: 1 }, opacity: { from: 0, to: 1 } },
      };
      
      return {
        ...baseAnimation,
        ...(variantAnimations[props.variant as keyof typeof variantAnimations] || variantAnimations.default),
        reverse: props.animateOut,
      };
    };

    it('has base animation properties', () => {
      const config = getAnimationConfig({ variant: 'default' });
      expect(config.duration).toBe(300);
      expect(config.easing).toBe('ease-out');
    });

    it('applies variant-specific animations', () => {
      const info = getAnimationConfig({ variant: 'info' });
      expect(info.translateX).toBeDefined();
      expect(info.translateX?.from).toBe(-20);
      
      const success = getAnimationConfig({ variant: 'success' });
      expect(success.scale).toBeDefined();
      expect(success.rotate).toBeDefined();
    });

    it('reverses animation for exit', () => {
      const config = getAnimationConfig({ variant: 'default', animateOut: true });
      expect(config.reverse).toBe(true);
    });
  });

  describe('Alert Actions', () => {
    interface AlertAction {
      label: string;
      variant?: 'primary' | 'secondary' | 'link';
      onClick: () => void;
      closeOnClick?: boolean;
    }

    const formatAlertActions = (actions: AlertAction[]) => {
      return actions.map(action => ({
        ...action,
        variant: action.variant || 'link',
        className: getActionClassName(action.variant || 'link'),
        handler: action.closeOnClick 
          ? () => { action.onClick(); /* close alert */ } 
          : action.onClick,
      }));
    };

    const getActionClassName = (variant: string) => {
      const classes = {
        primary: 'bg-primary text-primary-foreground px-3 py-1 rounded',
        secondary: 'bg-secondary text-secondary-foreground px-3 py-1 rounded',
        link: 'text-primary underline-offset-2 hover:underline',
      };
      
      return classes[variant as keyof typeof classes] || classes.link;
    };

    it('formats actions with default variant', () => {
      const actions = formatAlertActions([
        { label: 'Learn More', onClick: () => {} },
      ]);
      
      expect(actions[0].variant).toBe('link');
      expect(actions[0].className).toContain('underline');
    });

    it('applies action variants correctly', () => {
      const primary = getActionClassName('primary');
      const secondary = getActionClassName('secondary');
      const link = getActionClassName('link');
      
      expect(primary).toContain('bg-primary');
      expect(secondary).toContain('bg-secondary');
      expect(link).toContain('hover:underline');
    });

    it('wraps handler for close on click', () => {
      let clicked = false;
      const actions = formatAlertActions([
        { 
          label: 'OK', 
          onClick: () => { clicked = true; },
          closeOnClick: true,
        },
      ]);
      
      actions[0].handler();
      expect(clicked).toBe(true);
    });
  });

  describe('Alert Accessibility', () => {
    const getAlertA11y = (props: {
      variant: string;
      title?: string;
      dismissible?: boolean;
    }) => {
      const roleMap = {
        info: 'status',
        success: 'status',
        warning: 'alert',
        error: 'alert',
        destructive: 'alert',
        default: 'status',
      };
      
      const ariaLive = {
        info: 'polite',
        success: 'polite',
        warning: 'polite',
        error: 'assertive',
        destructive: 'assertive',
        default: 'polite',
      };
      
      return {
        role: roleMap[props.variant as keyof typeof roleMap] || 'status',
        'aria-live': ariaLive[props.variant as keyof typeof ariaLive] || 'polite',
        'aria-label': props.title || `${props.variant} alert`,
        'aria-atomic': true,
        dismissButtonLabel: 'Dismiss alert',
      };
    };

    it('assigns correct roles', () => {
      expect(getAlertA11y({ variant: 'info' }).role).toBe('status');
      expect(getAlertA11y({ variant: 'error' }).role).toBe('alert');
      expect(getAlertA11y({ variant: 'warning' }).role).toBe('alert');
    });

    it('sets appropriate aria-live', () => {
      expect(getAlertA11y({ variant: 'info' })['aria-live']).toBe('polite');
      expect(getAlertA11y({ variant: 'error' })['aria-live']).toBe('assertive');
      expect(getAlertA11y({ variant: 'destructive' })['aria-live']).toBe('assertive');
    });

    it('includes title in aria-label', () => {
      const withTitle = getAlertA11y({ variant: 'info', title: 'Information' });
      const withoutTitle = getAlertA11y({ variant: 'error' });
      
      expect(withTitle['aria-label']).toBe('Information');
      expect(withoutTitle['aria-label']).toBe('error alert');
    });

    it('sets aria-atomic for complete reading', () => {
      const a11y = getAlertA11y({ variant: 'info' });
      expect(a11y['aria-atomic']).toBe(true);
    });
  });

  describe('Alert Queue Management', () => {
    interface QueuedAlert {
      id: string;
      content: any;
      priority: number;
      timestamp: number;
    }

    class AlertQueue {
      private queue: QueuedAlert[] = [];
      private maxVisible: number = 3;
      
      add(alert: Omit<QueuedAlert, 'timestamp'>) {
        this.queue.push({
          ...alert,
          timestamp: Date.now(),
        });
        this.queue.sort((a, b) => b.priority - a.priority);
      }
      
      remove(id: string) {
        this.queue = this.queue.filter(alert => alert.id !== id);
      }
      
      getVisible() {
        return this.queue.slice(0, this.maxVisible);
      }
      
      getQueued() {
        return this.queue.slice(this.maxVisible);
      }
    }

    it('adds alerts to queue', () => {
      const queue = new AlertQueue();
      queue.add({ id: '1', content: 'Test', priority: 1 });
      
      expect(queue.getVisible()).toHaveLength(1);
      expect(queue.getQueued()).toHaveLength(0);
    });

    it('sorts by priority', () => {
      const queue = new AlertQueue();
      queue.add({ id: '1', content: 'Low', priority: 1 });
      queue.add({ id: '2', content: 'High', priority: 10 });
      queue.add({ id: '3', content: 'Medium', priority: 5 });
      
      const visible = queue.getVisible();
      expect(visible[0].priority).toBe(10);
      expect(visible[1].priority).toBe(5);
      expect(visible[2].priority).toBe(1);
    });

    it('limits visible alerts', () => {
      const queue = new AlertQueue();
      for (let i = 0; i < 5; i++) {
        queue.add({ id: `${i}`, content: `Alert ${i}`, priority: i });
      }
      
      expect(queue.getVisible()).toHaveLength(3);
      expect(queue.getQueued()).toHaveLength(2);
    });

    it('removes alerts from queue', () => {
      const queue = new AlertQueue();
      queue.add({ id: '1', content: 'Test', priority: 1 });
      queue.add({ id: '2', content: 'Test', priority: 2 });
      
      queue.remove('1');
      
      const visible = queue.getVisible();
      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe('2');
    });
  });
});