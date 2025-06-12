import React, { useState, useEffect } from 'react';
import { TextInput, TextInputProps, ViewStyle, TextStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Box } from './Box';
import { Text } from './Text';
import { useTheme } from '@/lib/theme/provider';
import { 
  BorderRadius, 
  SpacingScale,
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

// Import animation type from design system
import type { InputAnimationType } from '@/lib/design/animation-variants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  rounded?: BorderRadius;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  isDisabled?: boolean;
  isRequired?: boolean;
  containerStyle?: ViewStyle;
  name?: string; // For web form autofill
  id?: string; // For web form autofill
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: InputAnimationType;
  animationDuration?: number;
  shakeIntensity?: number;
  pulseScale?: number;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

// Input sizes will be defined dynamically based on spacing density

export const Input = React.forwardRef<TextInput, InputProps>(({
  label,
  error,
  success,
  hint,
  size = 'md',
  rounded = 'md',
  leftElement,
  rightElement,
  isDisabled = false,
  isRequired = false,
  containerStyle,
  style,
  onFocus,
  onBlur,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'shake',
  animationDuration,
  shakeIntensity = 8,
  pulseScale = 1.02,
  animationConfig,
  ...props
}, ref) => {
  const theme = useTheme();
  const { spacing, componentSpacing, componentSizes, typographyScale } = useSpacing();
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [previousError, setPreviousError] = useState(error);
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.fast;
  
  // Animation values
  const shakeX = useSharedValue(0);
  const errorOpacity = useSharedValue(0);
  const successOpacity = useSharedValue(0);
  const focusScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  
  // Trigger shake animation on error
  useEffect(() => {
    if (error && error !== previousError && animated && isAnimated && shouldAnimate()) {
      if (animationType === 'shake') {
        shakeX.value = withSequence(
          withTiming(-shakeIntensity, { duration: duration / 4 }),
          withTiming(shakeIntensity, { duration: duration / 4 }),
          withTiming(-shakeIntensity / 2, { duration: duration / 4 }),
          withTiming(0, { duration: duration / 4 })
        );
      }
      errorOpacity.value = withTiming(1, { duration });
      haptic('error');
    }
    setPreviousError(error);
  }, [error, animated, isAnimated, shouldAnimate, animationType, shakeIntensity, duration]);
  
  // Trigger success animation
  useEffect(() => {
    if (success && !error && animated && isAnimated && shouldAnimate()) {
      successOpacity.value = withTiming(1, { duration });
      haptic('success');
    }
  }, [success, error, animated, isAnimated, shouldAnimate, duration]);
  
  // Get size configuration from spacing context
  const inputSize = componentSizes.input[size];
  const sizeConfig = {
    paddingX: componentSpacing.inputPadding.x as SpacingScale,
    paddingY: componentSpacing.inputPadding.y as SpacingScale,
    fontSize: typographyScale[size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'base'],
    height: inputSize.height,
  };
  
  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (animated && isAnimated && shouldAnimate() && animationType === 'focus') {
      focusScale.value = withSpring(pulseScale, config.spring);
    }
    onFocus?.(e);
  };
  
  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (animated && isAnimated && shouldAnimate() && animationType === 'focus') {
      focusScale.value = withSpring(1, config.spring);
    }
    onBlur?.(e);
  };
  
  // Pulse animation
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate() && animationType === 'pulse' && isFocused) {
      pulseOpacity.value = withSequence(
        withTiming(0.7, { duration: duration / 2 }),
        withTiming(1, { duration: duration / 2 })
      );
    }
  }, [animated, isAnimated, shouldAnimate, animationType, isFocused, duration]);
  
  const getBorderColor = () => {
    if (error) return theme.destructive;
    if (success) return theme.success || theme.accent;
    if (isFocused) return theme.primary;
    if (isHovered && !isDisabled) return theme.primary + '80'; // 50% opacity
    return theme.border;
  };

  const inputContainerStyle: ViewStyle = {
    borderWidth: 1,
    borderColor: getBorderColor(),
    borderRadius: componentSpacing.borderRadius,
    backgroundColor: isDisabled ? theme.muted : theme.card,
    height: sizeConfig.height,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[sizeConfig.paddingX],
    // Web-specific styles
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      cursor: isDisabled ? 'not-allowed' : 'text',
    } as any),
  };
  
  // Ensure we use the correct text color - cardForeground for input text
  const textColor = theme.cardForeground || theme.foreground;
  
  const inputStyle: TextStyle = {
    flex: 1,
    fontSize: sizeConfig.fontSize,
    color: textColor,
    paddingVertical: spacing[sizeConfig.paddingY],
    // Platform-specific fixes
    ...(Platform.OS === 'android' && {
      textAlignVertical: 'center',
    }),
    // Web-specific styles to disable autofill outline
    ...(Platform.OS === 'web' && {
      outline: 'none',
      boxShadow: 'none',
      WebkitBoxShadow: 'none',
    } as any),
  };
  
  // Animated styles
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  
  const focusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
  }));
  
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));
  
  const errorFadeStyle = useAnimatedStyle(() => ({
    opacity: errorOpacity.value,
  }));
  
  const successFadeStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }));
  
  // Combine animation styles based on type
  const containerAnimatedStyle = animated && isAnimated && shouldAnimate()
    ? animationType === 'shake' && error
      ? shakeStyle
      : animationType === 'focus'
      ? focusStyle
      : animationType === 'pulse' && isFocused
      ? pulseStyle
      : {}
    : {};
  
  return (
    <Box style={containerStyle}>
      {label && (
        <Box mb={2} flexDirection="row">
          <Text size="sm" weight="medium" colorTheme="foreground">
            {label}
          </Text>
          {isRequired && (
            <Text size="sm" colorTheme="destructive" ml={1}>
              *
            </Text>
          )}
        </Box>
      )}
      
      <Animated.View style={containerAnimatedStyle}>
        <Box
          style={inputContainerStyle}
          {...(Platform.OS === 'web' ? {
            onMouseEnter: () => !isDisabled && setIsHovered(true),
            onMouseLeave: () => setIsHovered(false),
          } as any : {})}
        >
        {leftElement && <Box mr={2}>{leftElement}</Box>}
        
        <TextInput
          ref={ref}
          style={[inputStyle, style]}
          placeholderTextColor={theme.mutedForeground}
          editable={!isDisabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={theme.primary}
          underlineColorAndroid="transparent"
          {...props}
          {...(Platform.OS === 'web' && {
            autoComplete: props.autoComplete,
            name: props.autoComplete, // Web browsers use name attribute for autofill
            id: props.autoComplete, // Some browsers also use id
            className: 'universal-input', // Add class for CSS targeting
          })}
        />
        
        {rightElement && <Box ml={2}>{rightElement}</Box>}
        </Box>
      </Animated.View>
      
      {(error || hint || success) && (
        <Box mt={1}>
          {error ? (
            <Animated.View style={errorFadeStyle}>
              <Text size="sm" colorTheme="destructive">
                {error}
              </Text>
            </Animated.View>
          ) : success ? (
            <Animated.View style={successFadeStyle}>
              <Text size="sm" colorTheme="success">
                ✓ Valid
              </Text>
            </Animated.View>
          ) : hint ? (
            <Text size="sm" colorTheme="mutedForeground">
              {hint}
            </Text>
          ) : null}
        </Box>
      )}
    </Box>
  );
});

Input.displayName = 'Input';