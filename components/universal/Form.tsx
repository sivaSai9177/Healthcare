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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import { Button, ButtonProps } from './Button';
import { VStack , HStack } from './Stack';
import { FormField } from './Label';
import { SpacingScale, AnimationVariant } from '@/lib/design';

import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

// Import necessary components
import { Text } from './Text';
import { Input } from './Input';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { Switch } from './Switch';
import { useTheme } from '@/lib/theme/provider';

export type FormAnimationType = 'validate' | 'submit' | 'error' | 'none';

const AnimatedView = Animated.createAnimatedComponent(View);

// Form Context
interface FormContextValue<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: FormAnimationType;
  animationDuration?: number;
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
export interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: (data: TFieldValues) => void | Promise<void>;
  children: React.ReactNode;
  style?: ViewStyle;
  spacing?: SpacingScale;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: FormAnimationType;
  animationDuration?: number;
  staggerDelay?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export function Form<TFieldValues extends FieldValues = FieldValues>({
  form,
  onSubmit,
  children,
  style,
  spacing = 4,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'validate',
  animationDuration,
  staggerDelay = 100,
  useHaptics = true,
  animationConfig,
}: FormProps<TFieldValues>) {
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.normal;
  
  // Animation values
  const formScale = useSharedValue(1);
  const formShakeX = useSharedValue(0);
  const submitScale = useSharedValue(1);
  
  const handleSubmit = form.handleSubmit(async (data) => {
    if (animated && isAnimated && shouldAnimate() && animationType === 'submit') {
      submitScale.value = withSequence(
        withSpring(0.95, config.spring),
        withSpring(1, config.spring)
      );
      if (useHaptics) {
        haptic('success');
      }
    }
    await onSubmit(data);
  });
  
  // Shake on error
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate() && animationType === 'error') {
      const hasErrors = Object.keys(form.formState.errors).length > 0;
      if (hasErrors) {
        formShakeX.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        if (useHaptics) {
          haptic('error');
        }
      }
    }
  }, [form.formState.errors, animated, isAnimated, shouldAnimate, animationType, useHaptics]);
  
  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: formShakeX.value },
      { scale: formScale.value },
    ],
  }));
  
  const contextValue = {
    form,
    animated,
    animationVariant,
    animationType,
    animationDuration: duration,
    useHaptics,
  };
  
  const shouldUseAnimation = animated && isAnimated && shouldAnimate();
  const FormContainer = shouldUseAnimation ? AnimatedView : View;

  return (
    <FormContext.Provider value={contextValue}>
      <FormContainer style={[style, shouldUseAnimation ? formAnimatedStyle : {}]}>
        <VStack spacing={spacing}>
          {children}
        </VStack>
      </FormContainer>
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
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: context.animationVariant || 'moderate',
  });
  
  // Animation values for field error
  const fieldShakeX = useSharedValue(0);
  const fieldScale = useSharedValue(1);
  
  useEffect(() => {
    if (context.animated && isAnimated && shouldAnimate() && context.animationType === 'validate') {
      if (error) {
        fieldShakeX.value = withSequence(
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        if (context.useHaptics) {
          haptic('light');
        }
      }
    }
  }, [error, context.animated, isAnimated, shouldAnimate, context.animationType, context.useHaptics]);
  
  const fieldAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: fieldShakeX.value },
      { scale: fieldScale.value },
    ],
  }));
  
  const shouldUseAnimation = context.animated && isAnimated && shouldAnimate();
  const FieldContainer = shouldUseAnimation ? AnimatedView : View;

  return (
    <Controller
      control={form.control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <FieldContainer style={[shouldUseAnimation ? fieldAnimatedStyle : {}, style]}>
          <FormField
            label={label || ''}
            required={required}
            hint={hint}
            error={error?.message}
          >
            {children(field)}
          </FormField>
        </FieldContainer>
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
      type="submit"
      onPress={handlePress}
      isLoading={isLoading || isSubmitting}
      isDisabled={isDisabled || !isValid || isSubmitting}
      animated={context?.animated}
      animationVariant={context?.animationVariant}
      animationType="scale"
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
        <HStack spacing={2} alignItems="center">
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
        <HStack spacing={2} alignItems="center" justifyContent="space-between">
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