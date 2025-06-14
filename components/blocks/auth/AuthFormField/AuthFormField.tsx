import React from 'react';
import { Input, Text, VStack } from '@/components/universal';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import Animated, { FadeIn } from 'react-native-reanimated';

const AnimatedView = Animated.View;

interface AuthFormFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  hint?: string;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
  animationDelay?: number;
}

export function AuthFormField({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  leftIcon,
  rightElement,
  secureTextEntry,
  autoCapitalize = 'none',
  autoComplete,
  keyboardType = 'default',
  hint,
  className,
  required = false,
  autoFocus = false,
  animationDelay = 0,
}: AuthFormFieldProps) {
  const { spacing } = useSpacing();

  return (
    <AnimatedView 
      entering={FadeIn.delay(animationDelay).springify()}
      className={className}
    >
      <VStack gap={spacing[1] as any}>
        <Input
          label={required ? `${label} *` : label}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          error={error}
          leftIcon={leftIcon}
          rightElement={rightElement}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete as any}
          keyboardType={keyboardType}
          autoFocus={autoFocus}
          className={cn(
            "transition-all duration-200",
            error && "animate-shake"
          )}
        />
        
        {hint && !error && (
          <AnimatedView entering={FadeIn}>
            <Text size="xs" colorTheme="mutedForeground" className="px-1">
              {hint}
            </Text>
          </AnimatedView>
        )}
      </VStack>
    </AnimatedView>
  );
}