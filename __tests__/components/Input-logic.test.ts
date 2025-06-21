import { describe, it, expect, jest } from '@jest/globals';

describe('Input Component Logic', () => {
  describe('Input Variants', () => {
    const inputVariants = {
      outline: 'border border-gray-300 dark:border-gray-700 bg-transparent',
      filled: 'bg-gray-100 dark:bg-gray-900 border-transparent',
      ghost: 'border-transparent bg-transparent',
    };

    it('has all required variants', () => {
      expect(Object.keys(inputVariants)).toEqual(['outline', 'filled', 'ghost']);
    });

    it('outline variant has border', () => {
      expect(inputVariants.outline).toContain('border');
      expect(inputVariants.outline).toContain('border-gray-300');
      expect(inputVariants.outline).toContain('bg-transparent');
    });

    it('filled variant has background', () => {
      expect(inputVariants.filled).toContain('bg-gray-100');
      expect(inputVariants.filled).toContain('border-transparent');
    });

    it('ghost variant is transparent', () => {
      expect(inputVariants.ghost).toContain('border-transparent');
      expect(inputVariants.ghost).toContain('bg-transparent');
    });
  });

  describe('Input Sizes', () => {
    const inputSizes = {
      sm: { height: 32, fontSize: 14, paddingX: 12 },
      md: { height: 40, fontSize: 16, paddingX: 16 },
      lg: { height: 48, fontSize: 18, paddingX: 20 },
    };

    it('has all size options', () => {
      expect(Object.keys(inputSizes)).toEqual(['sm', 'md', 'lg']);
    });

    it('sizes increase progressively', () => {
      expect(inputSizes.sm.height).toBeLessThan(inputSizes.md.height);
      expect(inputSizes.md.height).toBeLessThan(inputSizes.lg.height);
      
      expect(inputSizes.sm.fontSize).toBeLessThan(inputSizes.md.fontSize);
      expect(inputSizes.md.fontSize).toBeLessThan(inputSizes.lg.fontSize);
    });

    it('padding increases with size', () => {
      expect(inputSizes.sm.paddingX).toBeLessThan(inputSizes.md.paddingX);
      expect(inputSizes.md.paddingX).toBeLessThan(inputSizes.lg.paddingX);
    });
  });

  describe('Input States', () => {
    const getInputState = (props: {
      value?: string;
      error?: string;
      success?: boolean;
      disabled?: boolean;
      editable?: boolean;
      focused?: boolean;
    }) => {
      const hasValue = !!props.value;
      const hasError = !!props.error;
      const isSuccess = props.success && !hasError;
      const isDisabled = props.disabled || props.editable === false;
      const isFocused = props.focused || false;
      
      return {
        hasValue,
        hasError,
        isSuccess,
        isDisabled,
        isFocused,
        showError: hasError,
        showSuccess: isSuccess && !hasError,
        borderColor: hasError ? 'error' : isSuccess ? 'success' : isFocused ? 'primary' : 'default',
      };
    };

    it('detects value presence', () => {
      expect(getInputState({ value: 'test' }).hasValue).toBe(true);
      expect(getInputState({ value: '' }).hasValue).toBe(false);
      expect(getInputState({}).hasValue).toBe(false);
    });

    it('handles error state', () => {
      const state = getInputState({ error: 'Required field' });
      expect(state.hasError).toBe(true);
      expect(state.showError).toBe(true);
      expect(state.borderColor).toBe('error');
    });

    it('handles success state', () => {
      const state = getInputState({ success: true });
      expect(state.isSuccess).toBe(true);
      expect(state.showSuccess).toBe(true);
      expect(state.borderColor).toBe('success');
    });

    it('error overrides success', () => {
      const state = getInputState({ success: true, error: 'Error' });
      expect(state.showError).toBe(true);
      expect(state.showSuccess).toBe(false);
      expect(state.borderColor).toBe('error');
    });

    it('handles disabled states', () => {
      expect(getInputState({ disabled: true }).isDisabled).toBe(true);
      expect(getInputState({ editable: false }).isDisabled).toBe(true);
    });

    it('handles focus state', () => {
      const state = getInputState({ focused: true });
      expect(state.isFocused).toBe(true);
      expect(state.borderColor).toBe('primary');
    });
  });

  describe('Validation Logic', () => {
    const validateInput = (value: string, rules: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      email?: boolean;
      numeric?: boolean;
    }) => {
      const errors: string[] = [];
      
      if (rules.required && !value.trim()) {
        errors.push('This field is required');
      }
      
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Minimum ${rules.minLength} characters required`);
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Maximum ${rules.maxLength} characters allowed`);
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push('Invalid format');
      }
      
      if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push('Invalid email address');
      }
      
      if (rules.numeric && !/^\d+$/.test(value)) {
        errors.push('Only numbers allowed');
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        firstError: errors[0] || null,
      };
    };

    it('validates required fields', () => {
      const result = validateInput('', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.firstError).toBe('This field is required');
      
      const valid = validateInput('test', { required: true });
      expect(valid.isValid).toBe(true);
    });

    it('validates minimum length', () => {
      const result = validateInput('ab', { minLength: 3 });
      expect(result.isValid).toBe(false);
      expect(result.firstError).toContain('Minimum 3 characters');
      
      const valid = validateInput('abc', { minLength: 3 });
      expect(valid.isValid).toBe(true);
    });

    it('validates maximum length', () => {
      const result = validateInput('12345', { maxLength: 4 });
      expect(result.isValid).toBe(false);
      expect(result.firstError).toContain('Maximum 4 characters');
    });

    it('validates email format', () => {
      const invalid = validateInput('invalid-email', { email: true });
      expect(invalid.isValid).toBe(false);
      expect(invalid.firstError).toBe('Invalid email address');
      
      const valid = validateInput('test@example.com', { email: true });
      expect(valid.isValid).toBe(true);
    });

    it('validates numeric input', () => {
      const invalid = validateInput('abc123', { numeric: true });
      expect(invalid.isValid).toBe(false);
      
      const valid = validateInput('12345', { numeric: true });
      expect(valid.isValid).toBe(true);
    });

    it('validates with custom pattern', () => {
      const phonePattern = /^\d{3}-\d{3}-\d{4}$/;
      
      const invalid = validateInput('1234567890', { pattern: phonePattern });
      expect(invalid.isValid).toBe(false);
      
      const valid = validateInput('123-456-7890', { pattern: phonePattern });
      expect(valid.isValid).toBe(true);
    });

    it('collects multiple errors', () => {
      const result = validateInput('a', {
        minLength: 3,
        numeric: true,
      });
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Minimum 3 characters required');
      expect(result.errors).toContain('Only numbers allowed');
    });
  });

  describe('Input Masking', () => {
    const maskInput = (value: string, mask: string) => {
      let masked = '';
      let valueIndex = 0;
      
      for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
        if (mask[i] === '#') {
          masked += value[valueIndex];
          valueIndex++;
        } else {
          masked += mask[i];
        }
      }
      
      return masked;
    };

    it('masks phone numbers', () => {
      const masked = maskInput('1234567890', '(###) ###-####');
      expect(masked).toBe('(123) 456-7890');
    });

    it('masks credit cards', () => {
      const masked = maskInput('1234567812345678', '#### #### #### ####');
      expect(masked).toBe('1234 5678 1234 5678');
    });

    it('masks dates', () => {
      const masked = maskInput('12252023', '##/##/####');
      expect(masked).toBe('12/25/2023');
    });

    it('handles partial input', () => {
      const masked = maskInput('123', '(###) ###-####');
      expect(masked).toBe('(123');
    });
  });

  describe('Input Formatting', () => {
    const formatters = {
      currency: (value: string) => {
        const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(num);
      },
      percentage: (value: string) => {
        const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
        if (isNaN(num)) return '';
        return `${num.toFixed(2)}%`;
      },
      capitalize: (value: string) => {
        return value.replace(/\b\w/g, l => l.toUpperCase());
      },
      uppercase: (value: string) => value.toUpperCase(),
      lowercase: (value: string) => value.toLowerCase(),
    };

    it('formats currency', () => {
      expect(formatters.currency('1234.56')).toBe('$1,234.56');
      expect(formatters.currency('1234')).toBe('$1,234.00');
    });

    it('formats percentages', () => {
      expect(formatters.percentage('12.5')).toBe('12.50%');
      expect(formatters.percentage('0.5')).toBe('0.50%');
    });

    it('capitalizes words', () => {
      expect(formatters.capitalize('hello world')).toBe('Hello World');
      expect(formatters.capitalize('HELLO WORLD')).toBe('HELLO WORLD');
    });

    it('transforms case', () => {
      expect(formatters.uppercase('hello')).toBe('HELLO');
      expect(formatters.lowercase('HELLO')).toBe('hello');
    });
  });

  describe('Icon Positioning', () => {
    const getIconStyles = (position: 'left' | 'right', size: 'sm' | 'md' | 'lg') => {
      const iconSizes = {
        sm: 16,
        md: 20,
        lg: 24,
      };
      
      const iconPadding = {
        sm: 8,
        md: 12,
        lg: 16,
      };
      
      return {
        size: iconSizes[size],
        padding: iconPadding[size],
        position: position === 'left' ? 'start' : 'end',
        inputPadding: position === 'left' 
          ? { paddingLeft: iconSizes[size] + iconPadding[size] * 2 }
          : { paddingRight: iconSizes[size] + iconPadding[size] * 2 },
      };
    };

    it('calculates left icon positioning', () => {
      const styles = getIconStyles('left', 'md');
      expect(styles.position).toBe('start');
      expect(styles.size).toBe(20);
      expect(styles.inputPadding).toHaveProperty('paddingLeft');
      expect(styles.inputPadding.paddingLeft).toBe(44); // 20 + 12*2
    });

    it('calculates right icon positioning', () => {
      const styles = getIconStyles('right', 'md');
      expect(styles.position).toBe('end');
      expect(styles.inputPadding).toHaveProperty('paddingRight');
    });

    it('scales icon with input size', () => {
      const sm = getIconStyles('left', 'sm');
      const lg = getIconStyles('left', 'lg');
      
      expect(sm.size).toBeLessThan(lg.size);
      expect(sm.padding).toBeLessThan(lg.padding);
    });
  });

  describe('Focus Animation Values', () => {
    const getFocusAnimationValues = (focused: boolean, hasError: boolean) => {
      return {
        borderWidth: focused ? 2 : 1,
        borderColor: hasError ? '#ef4444' : focused ? '#3b82f6' : '#d1d5db',
        scale: focused ? 1.02 : 1,
        labelScale: focused || hasError ? 0.85 : 1,
        labelY: focused || hasError ? -12 : 0,
      };
    };

    it('animates border on focus', () => {
      const focused = getFocusAnimationValues(true, false);
      expect(focused.borderWidth).toBe(2);
      expect(focused.borderColor).toBe('#3b82f6');
      expect(focused.scale).toBeGreaterThan(1);
    });

    it('shows error state', () => {
      const error = getFocusAnimationValues(false, true);
      expect(error.borderColor).toBe('#ef4444');
      expect(error.labelScale).toBeLessThan(1);
    });

    it('prioritizes error over focus', () => {
      const both = getFocusAnimationValues(true, true);
      expect(both.borderColor).toBe('#ef4444');
    });

    it('animates floating label', () => {
      const focused = getFocusAnimationValues(true, false);
      expect(focused.labelScale).toBeLessThan(1);
      expect(focused.labelY).toBeLessThan(0);
    });
  });

  describe('Accessibility', () => {
    const getAccessibilityProps = (props: {
      label?: string;
      error?: string;
      hint?: string;
      required?: boolean;
      disabled?: boolean;
    }) => {
      const hints: string[] = [];
      
      if (props.hint) hints.push(props.hint);
      if (props.error) hints.push(`Error: ${props.error}`);
      if (props.required) hints.push('Required field');
      
      return {
        accessibilityLabel: props.label,
        accessibilityHint: hints.join('. '),
        accessibilityState: {
          disabled: props.disabled || false,
          selected: false,
        },
        accessibilityRole: 'none' as const,
        accessible: true,
      };
    };

    it('includes label in accessibility', () => {
      const props = getAccessibilityProps({ label: 'Email Address' });
      expect(props.accessibilityLabel).toBe('Email Address');
    });

    it('combines hints for accessibility', () => {
      const props = getAccessibilityProps({
        hint: 'Enter your email',
        error: 'Invalid format',
        required: true,
      });
      expect(props.accessibilityHint).toContain('Enter your email');
      expect(props.accessibilityHint).toContain('Error: Invalid format');
      expect(props.accessibilityHint).toContain('Required field');
    });

    it('sets disabled state', () => {
      const props = getAccessibilityProps({ disabled: true });
      expect(props.accessibilityState.disabled).toBe(true);
    });
  });
});