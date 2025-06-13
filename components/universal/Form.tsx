import React, { useEffect } from 'react';
import {
  useForm,
  Controller,
  UseFormReturn,
  FieldValues,
  FieldPath,
  ControllerProps,
  RegisterOptions,
} from 'react-hook-form';
import { View, ViewStyle, TextStyle } from 'react-native';
import { cn } from '@/lib/core/utils';
import { Button, ButtonProps } from './Button';
import { VStack, HStack } from './Stack';
import { FormField, Label } from './Label';
import { haptic } from '@/lib/ui/haptics';

// Import necessary components
import { Text } from './Text';
import { Input } from './Input';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { Switch } from './Switch';
import { useTheme } from '@/lib/theme/provider';

// Base form props interface
export interface BaseFormProps {
  // Style props
  className?: string;
  
  // Gap size using Tailwind spacing scale
  gap?: 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 14 | 16 | 20 | 24 | 28 | 32 | 36 | 40 | 44 | 48 | 52 | 56 | 60 | 64 | 72 | 80 | 96;
  
  // Haptic feedback
  useHaptics?: boolean;
}

// Map gap values to Tailwind classes
const gapClasses = {
  0: '',
  0.5: 'gap-0.5',
  1: 'gap-1',
  1.5: 'gap-1.5',
  2: 'gap-2',
  2.5: 'gap-2.5',
  3: 'gap-3',
  3.5: 'gap-3.5',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  7: 'gap-7',
  8: 'gap-8',
  9: 'gap-9',
  10: 'gap-10',
  11: 'gap-11',
  12: 'gap-12',
  14: 'gap-14',
  16: 'gap-16',
  20: 'gap-20',
  24: 'gap-24',
  28: 'gap-28',
  32: 'gap-32',
  36: 'gap-36',
  40: 'gap-40',
  44: 'gap-44',
  48: 'gap-48',
  52: 'gap-52',
  56: 'gap-56',
  60: 'gap-60',
  64: 'gap-64',
  72: 'gap-72',
  80: 'gap-80',
  96: 'gap-96',
} as const;

// Form Context
interface FormContextValue<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;
  useHaptics?: boolean;
}

const FormContext = React.createContext<FormContextValue | null>(null);

export const useFormContext = <TFieldValues extends FieldValues = FieldValues>() => {
  const context = React.useContext(FormContext) as FormContextValue<TFieldValues>;
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context.form;
};

// Form Provider Component
export interface FormProps<TFieldValues extends FieldValues = FieldValues> extends BaseFormProps {
  form: UseFormReturn<TFieldValues>;
  onSubmit: (data: TFieldValues) => void | Promise<void>;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Form<TFieldValues extends FieldValues = FieldValues>({
  form,
  onSubmit,
  children,
  style,
  className,
  gap = 4,
  useHaptics = true,
}: FormProps<TFieldValues>) {
  const handleSubmit = form.handleSubmit(async (data) => {
    if (useHaptics) {
      haptic('light');
    }
    await onSubmit(data);
  });
  
  // Shake on error
  useEffect(() => {
    const hasErrors = Object.keys(form.formState.errors).length > 0;
    if (hasErrors && useHaptics) {
      haptic('error');
    }
  }, [form.formState.errors, useHaptics]);
  
  const contextValue = {
    form,
    useHaptics,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <View 
        style={style}
        className={cn(
          'flex flex-col',
          gapClasses[gap],
          className
        )}
      >
        {children}
      </View>
    </FormContext.Provider>
  );
}

// Form Field Wrapper
export interface FormItemProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: string;
  hint?: string;
  required?: boolean;
  rules?: RegisterOptions<TFieldValues, TName>;
  children: (field: ControllerProps<TFieldValues, TName>['field']) => React.ReactNode;
  style?: ViewStyle;
}

export function FormItem<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  hint,
  required,
  rules,
  children,
  style,
}: FormItemProps<TFieldValues, TName>) {
  const context = React.useContext(FormContext) as FormContextValue<TFieldValues>;
  const form = context.form;
  const error = form.formState.errors[name];
  
  useEffect(() => {
    if (error && context.useHaptics) {
      haptic('light');
    }
  }, [error, context.useHaptics]);

  return (
    <Controller
      control={form.control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <View style={style}>
          <FormField
            label={label || ''}
            required={required}
            hint={hint}
            error={error?.message}
          >
            {children(field)}
          </FormField>
        </View>
      )}
    />
  );
}

// Form Submit Button
export interface FormSubmitProps extends Omit<ButtonProps, 'onPress' | 'type'> {
  onPress?: () => void;
}

export const FormSubmit: React.FC<FormSubmitProps> = ({
  children = 'Submit',
  isLoading,
  isDisabled,
  onPress,
  ...props
}) => {
  const context = React.useContext(FormContext);
  const formFromHook = useFormContext();
  const form = context?.form || formFromHook;
  const { isSubmitting, isValid } = form.formState;

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
    // The actual form submission is handled by the Form component
    form.handleSubmit(() => {})();
  };

  return (
    <Button
      onPress={handlePress}
      isLoading={isLoading || isSubmitting}
      isDisabled={isDisabled || !isValid || isSubmitting}
      useHaptics={context?.useHaptics}
      {...props}
    >
      {children}
    </Button>
  );
};

// Form Error Message
export interface FormErrorProps {
  name?: string;
  style?: TextStyle;
}

export const FormError: React.FC<FormErrorProps> = ({ name, style }) => {
  const form = useFormContext();
  const theme = useTheme();
  const error = name ? form.formState.errors[name] : form.formState.errors.root;

  const errorMessage = error?.message || (typeof error === 'string' ? error : null);
  
  if (!errorMessage) return null;

  return (
    <Text
      size="sm"
      style={{
        color: theme.destructive,
        ...style,
      }}
    >
      {errorMessage}
    </Text>
  );
};

// Form utilities and helpers
export { useForm, Controller } from 'react-hook-form';
export type { UseFormReturn, FieldValues, FieldPath, RegisterOptions } from 'react-hook-form';

// Pre-configured form field components
export const FormInput: React.FC<
  Omit<FormItemProps, 'children'> & { placeholder?: string; type?: string }
> = ({ name, label, rules, placeholder, type, ...props }) => {
  return (
    <FormItem name={name} label={label} rules={rules} {...props}>
      {(field) => (
        <Input
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          placeholder={placeholder}
          secureTextEntry={type === 'password'}
        />
      )}
    </FormItem>
  );
};

export const FormSelect: React.FC<
  FormItemProps & { options: any[]; placeholder?: string }
> = ({ name, label, rules, options, placeholder, ...props }) => {
  return (
    <FormItem name={name} label={label} rules={rules} {...props}>
      {(field) => (
        <Select
          value={field.value}
          onValueChange={field.onChange}
          options={options}
          placeholder={placeholder}
        />
      )}
    </FormItem>
  );
};

export const FormCheckbox: React.FC<
  FormItemProps & { checkboxLabel?: string }
> = ({ name, label, rules, checkboxLabel, ...props }) => {
  return (
    <FormItem name={name} label={label} rules={rules} {...props}>
      {(field) => (
        <HStack gap={2} align="center">
          <Checkbox
            checked={field.value}
            onCheckedChange={field.onChange}
          />
          {checkboxLabel && (
            <Text size="sm">{checkboxLabel}</Text>
          )}
        </HStack>
      )}
    </FormItem>
  );
};

export const FormSwitch: React.FC<
  FormItemProps & { switchLabel?: string }
> = ({ name, label, rules, switchLabel, ...props }) => {
  return (
    <FormItem name={name} label={label} rules={rules} {...props}>
      {(field) => (
        <HStack gap={2} align="center" justify="between">
          {switchLabel && (
            <Text size="sm">{switchLabel}</Text>
          )}
          <Switch
            value={field.value}
            onValueChange={field.onChange}
          />
        </HStack>
      )}
    </FormItem>
  );
};

// Additional exports for compatibility
export const FormLabel = Label;
export const FormControl = Input;
export const FormMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text size="sm" className="text-destructive">{children}</Text>
);