import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TextInput, 
  TextInputProps, 
  View, 
  ViewStyle, 
  TextStyle, 
  Platform,
  Pressable,
  LayoutAnimation,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { cn } from '@/lib/core/utils';
import { Text } from '@/components/universal/typography/Text';
import { Box } from '@/components/universal/layout/Box';
import { Symbol } from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { useTheme } from '@/lib/theme/provider';
import { authStyles } from '@/components/blocks/auth/styles/authStyles';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedView = Animated.View;

interface InputProps extends TextInputProps {
  // HTML attributes for better form handling
  id?: string;
  name?: string;
  
  // Label and help text
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  
  // Sizing
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  
  // Visual
  variant?: 'outline' | 'filled' | 'ghost';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  
  // Icons and elements
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  
  // State
  isDisabled?: boolean;
  isRequired?: boolean;
  isLoading?: boolean;
  
  // Features
  showClearButton?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  
  // Animation
  animated?: boolean;
  floatingLabel?: boolean;
  shakeOnError?: boolean;
  
  // Style
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  containerStyle?: ViewStyle;
  
  // Callbacks
  onClear?: () => void;
}

// Size variants with density support
const sizeClasses = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-5 text-lg',
};

const densitySizeClasses = {
  compact: {
    sm: 'h-8 px-2.5 text-sm',
    md: 'h-9 px-3 text-base',
    lg: 'h-10 px-4 text-lg',
  },
  medium: {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-5 text-lg',
  },
  large: {
    sm: 'h-10 px-4 text-base',
    md: 'h-12 px-5 text-lg',
    lg: 'h-14 px-6 text-xl',
  },
};

const variantClasses = {
  outline: 'border border-input bg-background',
  filled: 'border-0 bg-muted',
  ghost: 'border-0 bg-transparent px-0',
};

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export const Input = React.forwardRef<TextInput, InputProps>(({
  // Label and help text
  label,
  error,
  success,
  hint,
  
  // Sizing
  size = 'md',
  fullWidth = true,
  
  // Visual
  variant = 'outline',
  rounded = 'md',
  
  // Icons and elements
  leftIcon,
  rightIcon,
  leftElement,
  rightElement,
  
  // State
  isDisabled = false,
  isRequired = false,
  isLoading = false,
  
  // Features
  showClearButton = false,
  showCharacterCount = false,
  maxLength,
  
  // Animation
  animated = true,
  floatingLabel = true,
  shakeOnError = true,
  
  // Style
  containerClassName,
  inputClassName,
  labelClassName,
  containerStyle,
  style,
  
  // Props
  value = '',
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  
  // Callbacks
  onClear,
  
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [internalShowPassword, setInternalShowPassword] = useState(false);
  const { density } = useSpacing();
  const { enableAnimations } = useAnimationStore();
  const theme = useTheme();
  
  // Define isPasswordField early
  const isPasswordField = props.secureTextEntry !== undefined;
  // Check if secureTextEntry is being controlled externally via rightElement
  const hasCustomPasswordToggle = isPasswordField && rightElement;
  const showPassword = hasCustomPasswordToggle ? false : internalShowPassword;
  
  // Create a local ref that we can use internally
  const inputRef = useRef<TextInput>(null);
  
  // Use imperative handle to expose the ref
  React.useImperativeHandle(ref, () => inputRef.current as TextInput);
  
  // Animation values
  const labelPosition = useSharedValue(0);
  const labelScale = useSharedValue(1);
  const borderWidth = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const errorOpacity = useSharedValue(0);
  const successScale = useSharedValue(0);
  const clearButtonOpacity = useSharedValue(0);
  const clearButtonScale = useSharedValue(0.8);
  
  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Handle floating label animation
  useEffect(() => {
    if (floatingLabel && label && enableAnimations) {
      const hasValue = localValue && localValue.length > 0;
      const shouldFloat = isFocused || hasValue;
      
      labelPosition.value = withSpring(shouldFloat ? -20 : 0, {
        damping: 15,
        stiffness: 300,
      });
      
      labelScale.value = withSpring(shouldFloat ? 0.85 : 1, {
        damping: 15,
        stiffness: 300,
      });
    }
  }, [isFocused, localValue, floatingLabel, label, enableAnimations]);
  
  // Handle focus animation
  useEffect(() => {
    if (animated && enableAnimations) {
      borderWidth.value = withSpring(isFocused ? 2 : 1, {
        damping: 20,
        stiffness: 400,
      });
    }
  }, [isFocused, animated, enableAnimations]);
  
  // Handle error animation
  useEffect(() => {
    if (error && shakeOnError && enableAnimations) {
      // Shake animation
      shakeX.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(0, { duration: 50 })
      );
      
      // Error message fade in
      errorOpacity.value = withTiming(1, { duration: 200 });
      
      // Haptic feedback
      haptic('error');
    } else {
      errorOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [error, shakeOnError, enableAnimations]);
  
  // Handle success animation
  useEffect(() => {
    if (success && enableAnimations) {
      successScale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
      haptic('success');
    }
  }, [success, enableAnimations]);
  
  // Handle clear button visibility
  useEffect(() => {
    if (showClearButton && localValue && localValue.length > 0 && !isDisabled) {
      clearButtonOpacity.value = withTiming(1, { duration: 200 });
      clearButtonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    } else {
      clearButtonOpacity.value = withTiming(0, { duration: 200 });
      clearButtonScale.value = withTiming(0.8, { duration: 200 });
    }
  }, [showClearButton, localValue, isDisabled]);
  
  // Handlers
  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);
  
  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);
  
  const handleChangeText = useCallback((text: string) => {
    setLocalValue(text);
    onChangeText?.(text);
  }, [onChangeText]);
  
  const handleClear = useCallback(() => {
    setLocalValue('');
    onChangeText?.('');
    onClear?.();
    haptic('light');
  }, [onChangeText, onClear]);
  
  const togglePasswordVisibility = useCallback(() => {
    setInternalShowPassword(prev => !prev);
    haptic('light');
  }, []);
  
  // Get size classes based on density
  const sizeClass = densitySizeClasses[density]?.[size] || sizeClasses[size];
  
  // Build container classes
  const containerClasses = cn(
    'relative',
    fullWidth && 'w-full',
    containerClassName
  );
  
  // Get height based on size  
  const getHeight = () => {
    if (!floatingLabel) {
      switch (size) {
        case 'sm': return 36;
        case 'lg': return 52;
        default: return 44;
      }
    }
    // For floating label, use existing height logic
    return undefined;
  };

  // Get border color
  const getBorderColor = () => {
    if (!floatingLabel) {
      if (error) return authStyles.colors.destructive;
      if (success) return authStyles.colors.success;
      if (isFocused) return authStyles.colors.primary;
      return '#e5e7eb'; // gray-200
    }
    // For floating label, use the original logic
    if (error) return theme.destructive;
    if (success) return theme.success || '#10b981';
    if (isFocused) return theme.primary;
    return theme.border;
  };
  
  // Build input wrapper classes for floating label
  const inputWrapperClasses = cn(
    'flex-row items-center',
    floatingLabel && variantClasses[variant],
    floatingLabel && roundedClasses[rounded],
    floatingLabel && sizeClass,
    floatingLabel && error && 'border-destructive',
    floatingLabel && success && 'border-green-500',
    floatingLabel && isFocused && !error && 'border-primary',
    isDisabled && 'opacity-50',
    floatingLabel && 'transition-colors duration-200'
  );
  
  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  
  const labelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: labelPosition.value },
      { scale: labelScale.value },
    ],
    position: 'absolute',
    left: leftIcon ? 40 : 16,
    top: interpolate(
      labelPosition.value,
      [-20, 0],
      [0, size === 'sm' ? 8 : size === 'lg' ? 14 : 10],
      Extrapolation.CLAMP
    ),
  }));
  
  const borderAnimatedStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
  }));
  
  const errorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: errorOpacity.value,
  }));
  
  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));
  
  const clearButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: clearButtonOpacity.value,
    transform: [{ scale: clearButtonScale.value }],
  }));
  
  const characterCount = localValue ? localValue.length : 0;
  
  return (
    <AnimatedView 
      className={containerClasses} 
      style={[containerAnimatedStyle, containerStyle] as any}
    >
      {/* Floating Label */}
      {label && floatingLabel && (
        <AnimatedView 
          style={[labelAnimatedStyle, { pointerEvents: "none" }] as any}
        >
          <Text
            size="sm"
            color={error ? 'destructive' : isFocused ? 'primary' : 'muted'}
            className={cn('bg-background px-1', labelClassName) as string}
          >
            {label}
            {isRequired && <Text color="destructive"> *</Text>}
          </Text>
        </AnimatedView>
      )}
      
      {/* Static Label */}
      {label && !floatingLabel && (
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          <Text 
            size="sm" 
            weight="medium" 
            style={{ color: theme.foreground }}
            className={labelClassName}
          >
            {label}
          </Text>
          {isRequired && (
            <Text 
              size="sm" 
              style={{ color: authStyles.colors.destructive, marginLeft: 4 }}
            >
              *
            </Text>
          )}
        </View>
      )}
      
      {/* Input Container */}
      <Pressable 
        onPress={() => inputRef.current?.focus()} 
        disabled={isDisabled || isLoading}
        style={Platform.OS === 'web' ? { cursor: isDisabled ? 'not-allowed' : 'text' } as any : undefined}
      >
        <AnimatedView 
          className={inputWrapperClasses}
          style={[
            !floatingLabel && {
              borderWidth: 1,
              borderColor: getBorderColor(),
              borderRadius: 6 as any,
              backgroundColor: isDisabled ? theme.muted : theme.background,
              height: getHeight(),
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              ...(Platform.OS === 'web' && {
                transition: 'all 0.2s ease',
                cursor: isDisabled ? 'not-allowed' : 'text',
              } as any),
            },
            animated && floatingLabel && borderAnimatedStyle,
            { pointerEvents: "box-only" }
          ]}
        >
        {/* Left Icon/Element */}
        {leftIcon && (
          <View className={floatingLabel ? "pl-3 pr-2" : ""}>
            {typeof leftIcon === 'string' ? (
              <Symbol name={leftIcon as any} size={floatingLabel ? 18 : 20} color={isFocused ? 'primary' : 'muted'} />
            ) : leftIcon}
          </View>
        )}
        {leftElement && (
          <View style={!floatingLabel ? { marginRight: 8 } : undefined}>
            {leftElement}
          </View>
        )}
        
        {/* Text Input */}
        <AnimatedTextInput
          ref={inputRef}
          value={localValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={floatingLabel && label ? '' : placeholder}
          placeholderTextColor={theme.mutedForeground}
          editable={!isDisabled && !isLoading}
          secureTextEntry={hasCustomPasswordToggle ? props.secureTextEntry : (isPasswordField && !showPassword)}
          maxLength={maxLength}
          selectionColor={!floatingLabel ? authStyles.colors.primary : undefined}
          underlineColorAndroid="transparent"
          className={cn(
            'flex-1 bg-transparent text-foreground',
            Platform.OS === 'web' && 'outline-none universal-input',
            inputClassName
          )}
          style={[
            {
              fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
              paddingVertical: 0,
              color: theme.foreground,
              ...(Platform.OS === 'android' && {
                textAlignVertical: 'center',
              }),
              ...(Platform.OS === 'web' && {
                outline: 'none',
                boxShadow: 'none',
                WebkitBoxShadow: 'none',
              } as any),
            },
            style,
          ]}
          {...props}
        />
        
        {/* Character Count */}
        {showCharacterCount && maxLength && (
          <Text 
            size="xs" 
            color={characterCount >= maxLength ? 'destructive' : 'muted'}
            className="pr-2"
          >
            {characterCount}/{maxLength}
          </Text>
        )}
        
        {/* Clear Button */}
        {showClearButton && !isPasswordField && (
          <AnimatedView style={clearButtonAnimatedStyle}>
            <Pressable
              onPress={handleClear}
              className="p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined}
            >
              <Symbol name="x.circle.fill" size={18} color="muted" />
            </Pressable>
          </AnimatedView>
        )}
        
        {/* Password Toggle - Only show if no custom rightElement */}
        {isPasswordField && !rightElement && (
          <Pressable
            onPress={togglePasswordVisibility}
            className="p-1 pr-3"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined}
          >
            <Symbol 
              name={showPassword ? 'eye.slash' : 'eye'} 
              size={18} 
              color="muted" 
            />
          </Pressable>
        )}
        
        {/* Success Icon */}
        {success && !error && (
          <AnimatedView style={successAnimatedStyle} className="pr-3">
            <Symbol name="checkmark.circle.fill" size={18} color="success" />
          </AnimatedView>
        )}
        
        {/* Right Icon/Element */}
        {rightIcon && !showClearButton && !isPasswordField && !success && !rightElement && (
          <View className="pr-3 pl-2">
            {typeof rightIcon === 'string' ? (
              <Symbol name={rightIcon as any} size={18} color="muted" />
            ) : rightIcon}
          </View>
        )}
        {rightElement && (
          <View style={!floatingLabel ? { marginLeft: 8 } : undefined}>
            {rightElement}
          </View>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <View className="pr-3">
            <LoadingSpinner size={size} />
          </View>
        )}
        </AnimatedView>
      </Pressable>
      
      {/* Error Message */}
      {error && (
        <AnimatedView style={[floatingLabel && errorAnimatedStyle, !floatingLabel && { marginTop: 4 }] as any}>
          <Text 
            size="sm" 
            style={{ color: authStyles.colors.destructive }}
            className={floatingLabel ? "mt-1.5" : ""}
          >
            {error}
          </Text>
        </AnimatedView>
      )}
      
      {/* Hint Text */}
      {hint && !error && (
        <View style={!floatingLabel ? { marginTop: 4 } : undefined}>
          <Text 
            size="sm" 
            style={{ color: theme.mutedForeground }}
            className={floatingLabel ? "mt-1.5" : ""}
          >
            {hint}
          </Text>
        </View>
      )}
    </AnimatedView>
  );
});

Input.displayName = 'Input';

// Loading spinner component
const LoadingSpinner = ({ size }: { size: 'sm' | 'md' | 'lg' }) => {
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  const spinnerSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  
  return (
    <AnimatedView style={animatedStyle}>
      <Symbol name="arrow.clockwise" size={spinnerSize} color="muted" />
    </AnimatedView>
  );
};

// Specialized input components
export const PasswordInput = React.forwardRef<TextInput, Omit<InputProps, 'secureTextEntry'>>((
  props, 
  ref
) => (
  <Input ref={ref} secureTextEntry {...props} />
));
PasswordInput.displayName = 'PasswordInput';

export const SearchInput = React.forwardRef<TextInput, InputProps>((
  props, 
  ref
) => (
  <Input 
    ref={ref} 
    leftIcon="magnifyingglass"
    placeholder="Search..."
    showClearButton
    {...props} 
  />
));
SearchInput.displayName = 'SearchInput';

export const EmailInput = React.forwardRef<TextInput, InputProps>((
  props, 
  ref
) => (
  <Input 
    ref={ref} 
    leftIcon="envelope"
    keyboardType="email-address"
    autoCapitalize="none"
    autoComplete="email"
    textContentType="emailAddress"
    {...props} 
  />
));
EmailInput.displayName = 'EmailInput';