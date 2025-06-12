import React, { createContext, useContext, useEffect } from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { HStack, VStack } from './Stack';
import { Text } from './Text';
import { 
  SpacingScale,
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

// Radio Group Context
interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: RadioAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

const useRadioGroup = () => {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error('useRadioGroup must be used within RadioGroup');
  }
  return context;
};

export type RadioAnimationType = 'select' | 'pulse' | 'scale' | 'none';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Radio Group Props
export interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: SpacingScale;
  disabled?: boolean;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: RadioAnimationType;
  animationDuration?: number;
  staggerDelay?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onValueChange,
  children,
  orientation = 'vertical',
  spacing = 3,
  disabled = false,
  style,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'select',
  animationDuration,
  staggerDelay = 50,
  useHaptics = true,
  animationConfig,
}) => {
  const contextValue = React.useMemo(
    () => ({ 
      value, 
      onValueChange, 
      disabled,
      animated,
      animationVariant,
      animationType,
      animationDuration,
      useHaptics,
      animationConfig,
    }),
    [value, onValueChange, disabled, animated, animationVariant, animationType, animationDuration, useHaptics, animationConfig]
  );

  const Container = orientation === 'horizontal' ? HStack : VStack;

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <Container spacing={spacing} style={style}>
        {children}
      </Container>
    </RadioGroupContext.Provider>
  );
};

// Radio Group Item Props
export interface RadioGroupItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  onPress?: () => void;
}

export const RadioGroupItem: React.FC<RadioGroupItemProps> = ({
  value,
  children,
  disabled: itemDisabled = false,
  onPress,
}) => {
  const theme = useTheme();
  const { spacing, componentSpacing } = useSpacing();
  const { 
    value: groupValue, 
    onValueChange, 
    disabled: groupDisabled,
    animated,
    animationVariant,
    animationType,
    animationDuration,
    useHaptics,
    animationConfig,
  } = useRadioGroup();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.fast;
  const isSelected = groupValue === value;
  const isDisabled = groupDisabled || itemDisabled;
  
  // Animation values
  const scale = useSharedValue(isSelected ? 1 : 0);
  const outerScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  
  // Update animation values when selection changes
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      scale.value = withSpring(isSelected ? 1 : 0, config.spring);
      
      if (isSelected && animationType === 'pulse') {
        pulseOpacity.value = withSequence(
          withTiming(0.3, { duration: duration / 2 }),
          withTiming(0, { duration: duration / 2 })
        );
      }
    } else {
      scale.value = isSelected ? 1 : 0;
    }
  }, [isSelected, animated, isAnimated, shouldAnimate, animationType, duration, config.spring]);
  
  const handlePress = () => {
    if (!isDisabled) {
      if (animated && isAnimated && shouldAnimate()) {
        if (useHaptics) {
          haptic('light');
        }
        
        if (animationType === 'scale') {
          outerScale.value = withSpring(0.9, config.spring, () => {
            outerScale.value = withSpring(1, config.spring);
          });
        }
      }
      onValueChange(value);
      onPress?.();
    }
  };
  
  // Animated styles
  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
  }));
  
  const innerDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));
  
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: interpolate(pulseOpacity.value, [0, 0.3], [1, 1.5]) }],
  }));
  
  const shouldUseAnimation = animated && isAnimated && shouldAnimate();
  const OuterView = shouldUseAnimation ? AnimatedView : View;
  const InnerView = shouldUseAnimation ? AnimatedView : View;
  
  return (
    <Pressable onPress={handlePress} disabled={isDisabled}>
      {({ pressed }) => (
        <HStack 
          spacing={2} 
          alignItems="center"
          style={{
            opacity: isDisabled ? 0.5 : pressed ? 0.7 : 1,
          }}
        >
          {/* Radio Button */}
          <OuterView
            style={[
              {
                width: componentSpacing.checkboxSize.md,
                height: componentSpacing.checkboxSize.md,
                borderRadius: componentSpacing.checkboxSize.md / 2,
                borderWidth: 2,
                borderColor: isDisabled 
                  ? theme.border 
                  : isSelected 
                    ? theme.primary 
                    : theme.input,
                backgroundColor: isDisabled
                  ? theme.muted
                  : theme.background,
                alignItems: 'center',
                justifyContent: 'center',
              },
              shouldUseAnimation ? outerRingStyle : {},
            ]}
          >
            {/* Pulse effect */}
            {shouldUseAnimation && animationType === 'pulse' && isSelected && (
              <AnimatedView
                style={[
                  {
                    position: 'absolute',
                    width: componentSpacing.checkboxSize.md,
                    height: componentSpacing.checkboxSize.md,
                    borderRadius: componentSpacing.checkboxSize.md / 2,
                    backgroundColor: theme.primary,
                  },
                  pulseStyle,
                ]}
                pointerEvents="none"
              />
            )}
            
            {/* Inner dot */}
            {isSelected && (
              <InnerView
                style={[
                  {
                    width: componentSpacing.checkboxSize.md * 0.4,
                    height: componentSpacing.checkboxSize.md * 0.4,
                    borderRadius: (componentSpacing.checkboxSize.md * 0.4) / 2,
                    backgroundColor: isDisabled
                      ? theme.mutedForeground
                      : theme.primary,
                  },
                  shouldUseAnimation ? innerDotStyle : {},
                ]}
              />
            )}
          </OuterView>
          
          {/* Label */}
          {typeof children === 'string' ? (
            <Text
              colorTheme={isDisabled ? 'mutedForeground' : 'foreground'}
              onPress={!isDisabled ? handlePress : undefined}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </HStack>
      )}
    </Pressable>
  );
};

// Simple Radio component for standalone use
export interface RadioProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Radio: React.FC<RadioProps> = ({
  value,
  onValueChange,
  disabled = false,
  size = 'md',
}) => {
  const theme = useTheme();
  const { componentSpacing } = useSpacing();
  
  const sizeMap = {
    sm: componentSpacing.checkboxSize.sm,
    md: componentSpacing.checkboxSize.md,
    lg: componentSpacing.checkboxSize.lg,
  };
  
  const buttonSize = sizeMap[size];
  
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
    >
      {({ pressed }) => (
        <View
          style={{
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            borderWidth: 2,
            borderColor: disabled 
              ? theme.border 
              : value 
                ? theme.primary 
                : theme.input,
            backgroundColor: disabled
              ? theme.muted
              : theme.background,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
          }}
        >
          {value && (
            <View
              style={{
                width: buttonSize * 0.4,
                height: buttonSize * 0.4,
                borderRadius: (buttonSize * 0.4) / 2,
                backgroundColor: disabled
                  ? theme.mutedForeground
                  : theme.primary,
              }}
            />
          )}
        </View>
      )}
    </Pressable>
  );
};