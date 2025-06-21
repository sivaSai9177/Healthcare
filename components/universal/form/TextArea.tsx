import React, { useEffect, useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Platform,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { useShadow } from '@/hooks/useShadow';
import { Text } from '@/components/universal/typography/Text';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export interface TextAreaProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  success?: boolean | string;
  rows?: number;
  maxRows?: number;
  autoResize?: boolean;
  disabled?: boolean;
  required?: boolean;
  characterLimit?: number;
  showCharacterCount?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'filled' | 'ghost';
  className?: string;
  containerClassName?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  
  // Animation props
  animated?: boolean;
  animationDuration?: number;
  useHaptics?: boolean;
}

// Size configurations
const sizeConfig = {
  sm: {
    fontSize: 14,
    padding: 8,
    minHeight: 60,
    labelSize: 'xs' as const,
  },
  default: {
    fontSize: 16,
    padding: 12,
    minHeight: 80,
    labelSize: 'sm' as const,
  },
  lg: {
    fontSize: 18,
    padding: 16,
    minHeight: 100,
    labelSize: 'base' as const,
  },
};

// Variant classes
const variantClasses = {
  default: {
    container: 'border border-input bg-background',
    focused: 'border-primary',
    error: 'border-destructive',
    success: 'border-green-500',
  },
  filled: {
    container: 'border-0 bg-muted',
    focused: 'bg-muted/80',
    error: 'bg-destructive/10',
    success: 'bg-green-500/10',
  },
  ghost: {
    container: 'border-0 bg-transparent',
    focused: 'bg-muted/50',
    error: 'bg-destructive/5',
    success: 'bg-green-500/5',
  },
};

export const TextArea = React.forwardRef<TextInput, TextAreaProps>(({
  label,
  error,
  success,
  rows = 3,
  maxRows = 6,
  autoResize = true,
  disabled = false,
  required = false,
  characterLimit,
  showCharacterCount = false,
  size = 'default',
  variant = 'default',
  className,
  containerClassName,
  style,
  inputStyle,
  shadow = 'none',
  // Animation props
  animated = true,
  animationDuration = 200,
  useHaptics = true,
  // TextInput props
  value,
  onChangeText,
  onFocus,
  onBlur,
  onContentSizeChange,
  placeholder,
  placeholderTextColor,
  ...props
}, ref) => {
  useSpacing(); // Hook for spacing context (may be used in future)
  const { shouldAnimate } = useAnimationStore();
  const shadowStyle = useShadow({ size: shadow === 'none' ? undefined : shadow });
  const [isFocused, setIsFocused] = useState(false);
  const [height, setHeight] = useState(sizeConfig[size].minHeight);
  const [characterCount, setCharacterCount] = useState(value?.length || 0);
  
  const config = sizeConfig[size];
  const classes = variantClasses[variant];
  
  // Animation values
  const focusScale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);
  const errorShake = useSharedValue(0);
  
  // Calculate dynamic height based on rows
  const minHeight = config.minHeight * (rows / 3);
  const maxHeight = config.minHeight * (maxRows / 3);
  
  // Update character count
  useEffect(() => {
    setCharacterCount(value?.length || 0);
  }, [value]);
  
  // Handle focus animation
  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (animated && shouldAnimate()) {
      focusScale.value = withSpring(1.02, { damping: 15, stiffness: 300 });
      borderOpacity.value = withTiming(1, { duration: animationDuration });
      if (useHaptics) {
        haptic('selection');
      }
    }
    onFocus?.(e);
  };
  
  // Handle blur animation
  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (animated && shouldAnimate()) {
      focusScale.value = withSpring(1, { duration: animationDuration });
      borderOpacity.value = withTiming(0, { duration: animationDuration });
    }
    onBlur?.(e);
  };
  
  // Handle text change with character limit
  const handleChangeText = (text: string) => {
    if (characterLimit && text.length > characterLimit) {
      if (useHaptics) {
        haptic('warning');
      }
      return;
    }
    onChangeText?.(text);
  };
  
  // Handle content size change for auto-resize
  const handleContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    if (autoResize) {
      const newHeight = Math.min(Math.max(e.nativeEvent.contentSize.height, minHeight), maxHeight);
      setHeight(newHeight);
    }
    onContentSizeChange?.(e);
  };
  
  // Shake animation for errors
  useEffect(() => {
    if (error && animated && shouldAnimate()) {
      errorShake.value = withSpring(
        10,
        { damping: 10, stiffness: 300 },
        () => {
          errorShake.value = withSpring(0, { damping: 15, stiffness: 300 });
        }
      );
    }
  }, [error, animated, errorShake, shouldAnimate]);
  
  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: focusScale.value } as any,
      { translateX: errorShake.value } as any,
    ],
  }));
  
  const borderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(borderOpacity.value, [0, 1], [0, 1]),
  }));
  
  // Container classes
  const containerClasses = cn(
    'rounded-lg overflow-hidden',
    classes.container,
    isFocused && classes.focused,
    error && classes.error,
    success && classes.success,
    disabled && 'opacity-50',
    containerClassName
  );
  
  // Input classes
  const inputClasses = cn(
    'flex-1 text-foreground',
    Platform.OS === 'web' && 'outline-none resize-none',
    className
  );
  
  // Placeholder color
  const defaultPlaceholderColor = '#9ca3af'; // text-gray-400
  
  return (
    <View style={style}>
      {/* Label */}
      {label && (
        <Text
          size={config.labelSize}
          weight="medium"
          className="mb-1 text-foreground"
        >
          {label}
          {required && <Text className="text-destructive ml-1">*</Text>}
        </Text>
      )}
      
      {/* TextArea Container */}
      <Animated.View
        className={containerClasses}
        style={[
          {
            minHeight,
            maxHeight: autoResize ? maxHeight : undefined,
            height: autoResize ? height : minHeight,
          },
          shadowStyle,
          animated && shouldAnimate() ? containerAnimatedStyle : undefined,
        ]}
      >
        <AnimatedTextInput
          ref={ref}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onContentSizeChange={handleContentSizeChange}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || defaultPlaceholderColor}
          multiline
          textAlignVertical="top"
          editable={!disabled}
          className={inputClasses}
          style={[
            {
              fontSize: config.fontSize,
              padding: config.padding,
              minHeight: minHeight - config.padding * 2,
              ...Platform.select({
                web: {
                  outlineStyle: 'none',
                } as any,
              }),
            },
            inputStyle,
          ]}
          {...props}
        />
        
        {/* Focus border overlay */}
        {animated && shouldAnimate() && isFocused && (
          <Animated.View
            className="absolute inset-0 rounded-lg border-2 border-primary pointer-events-none"
            style={borderAnimatedStyle}
          />
        )}
      </Animated.View>
      
      {/* Footer: Error message or character count */}
      <View className="flex-row justify-between items-center mt-1">
        {/* Error or success message */}
        {error ? (
          <Text size="sm" className="text-destructive flex-1">
            {error}
          </Text>
        ) : success && typeof success === 'string' ? (
          <Text size="sm" className="text-green-500 flex-1">
            {success}
          </Text>
        ) : (
          <View className="flex-1" />
        )}
        
        {/* Character count */}
        {showCharacterCount && (
          <Text
            size="xs"
            className={cn(
              'text-muted-foreground',
              characterLimit && characterCount >= characterLimit * 0.9 && 'text-warning',
              characterLimit && characterCount >= characterLimit && 'text-destructive'
            )}
          >
            {characterCount}
            {characterLimit && `/${characterLimit}`}
          </Text>
        )}
      </View>
    </View>
  );
});

TextArea.displayName = 'TextArea';