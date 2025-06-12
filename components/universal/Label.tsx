import React, { useEffect } from 'react';
import { View, ViewStyle, Pressable, TextStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  FadeIn,
  SlideInLeft,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { Text, TextProps } from './Text';
import { useSpacing } from '@/lib/stores/spacing-store';
import { 
  AnimationVariant,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export type LabelAnimationType = 'fadeIn' | 'slideIn' | 'asteriskPulse' | 'none';

export interface LabelProps extends Omit<TextProps, 'children' | 'style'> {
  children: React.ReactNode;
  htmlFor?: string; // For accessibility and form association
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: LabelAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  errorShake?: boolean;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

const AnimatedView = Animated.View;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Label = React.forwardRef<View, LabelProps>(({
  children,
  htmlFor,
  required = false,
  disabled = false,
  error = false,
  hint,
  onPress,
  size = 'sm',
  weight = 'medium',
  colorTheme,
  style,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'fadeIn',
  animationDuration,
  animationDelay = 0,
  errorShake = true,
  useHaptics = true,
  animationConfig,
  ...textProps
}, ref) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();

  // Get animation config
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.normal;
  
  // Animation values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(animated && isAnimated && shouldAnimate() && animationType === 'fadeIn' ? 0 : 1);
  const asteriskScale = useSharedValue(1);
  
  // Error shake animation
  useEffect(() => {
    if (error && animated && isAnimated && shouldAnimate() && errorShake) {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withSpring(0, config.spring)
      );
      
      if (useHaptics) {
        haptic('error');
      }
    }
  }, [error, animated, isAnimated, shouldAnimate, errorShake, translateX, config.spring, useHaptics]);
  
  // Asterisk pulse animation
  useEffect(() => {
    if (required && animated && isAnimated && shouldAnimate() && animationType === 'asteriskPulse') {
      asteriskScale.value = withSequence(
        withTiming(1.2, { duration: config.duration.fast }),
        withSpring(1, config.spring)
      );
    }
  }, [required, animated, isAnimated, shouldAnimate, animationType, asteriskScale, config.duration.fast, config.spring]);
  
  // Fade in animation
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate() && animationType === 'fadeIn') {
      opacity.value = withTiming(1, { duration });
    }
  }, [animated, isAnimated, shouldAnimate, animationType, opacity, duration]);
  
  // Animated styles
  const labelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));
  
  const asteriskAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: asteriskScale.value }],
  }));

  // Determine text color based on state
  const getTextColor = () => {
    if (error) return theme.destructive;
    if (disabled) return theme.mutedForeground;
    if (colorTheme) return undefined; // Use colorTheme prop
    return theme.foreground;
  };

  const textColor = getTextColor();

  const ContainerComponent = animated && isAnimated && shouldAnimate() ? AnimatedView : View;
  
  const labelContent = (
    <ContainerComponent 
      ref={ref} 
      style={[
        style,
        animated && isAnimated && shouldAnimate() ? labelAnimatedStyle : {},
      ]}
      entering={Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && animationType === 'slideIn'
        ? SlideInLeft.duration(duration).delay(animationDelay)
        : undefined
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          size={size}
          weight={weight}
          colorTheme={colorTheme}
          style={[
            textColor ? { color: textColor } : {},
            disabled && { opacity: 0.6 },
          ]}
          {...textProps}
        >
          {children}
        </Text>
        {required && (
          <AnimatedView
            style={[
              animated && isAnimated && shouldAnimate() && animationType === 'asteriskPulse'
                ? asteriskAnimatedStyle
                : {},
            ]}
          >
            <Text
              size={size}
              style={{
                color: theme.destructive,
                marginLeft: spacing[0.5],
              }}
            >
              *
            </Text>
          </AnimatedView>
        )}
      </View>
      
      {hint && (
        <AnimatedView
          entering={Platform.OS !== 'web' && animated && isAnimated && shouldAnimate()
            ? FadeIn.duration(duration).delay(animationDelay + 100)
            : undefined
          }
        >
          <Text
            size="xs"
            colorTheme="mutedForeground"
            style={{ marginTop: spacing[0.5] }}
          >
            {hint}
          </Text>
        </AnimatedView>
      )}
    </ContainerComponent>
  );

  if (onPress && !disabled) {
    const PressableComponent = animated && isAnimated && shouldAnimate() ? AnimatedPressable : Pressable;
    
    return (
      <PressableComponent 
        onPress={() => {
          if (useHaptics) {
            haptic('impact');
          }
          onPress();
        }}
      >
        {({ pressed }) => (
          <View style={{ opacity: pressed ? 0.7 : 1 }}>
            {labelContent}
          </View>
        )}
      </PressableComponent>
    );
  }

  return labelContent;
});

Label.displayName = 'Label';

// FormField component that combines Label with spacing
export interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  labelProps?: Omit<LabelProps, 'children'>;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationDelay?: number;
  staggerChildren?: boolean;
  errorAnimation?: 'shake' | 'flash' | 'fadeIn';
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  required = false,
  error,
  hint,
  labelProps,
  style,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationDelay = 0,
  staggerChildren = true,
  errorAnimation = 'shake',
}) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
  });
  
  // Animation values
  const errorOpacity = useSharedValue(error ? 1 : 0);
  const errorTranslateY = useSharedValue(error ? 0 : -10);
  
  // Error animation
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      if (error) {
        errorOpacity.value = withTiming(1, { duration: config.duration.fast });
        errorTranslateY.value = withSpring(0, config.spring);
        
        if (errorAnimation === 'flash') {
          errorOpacity.value = withSequence(
            withTiming(0, { duration: 100 }),
            withTiming(1, { duration: 100 }),
            withTiming(0, { duration: 100 }),
            withTiming(1, { duration: 100 })
          );
        }
      } else {
        errorOpacity.value = withTiming(0, { duration: config.duration.fast });
        errorTranslateY.value = withTiming(-10, { duration: config.duration.fast });
      }
    }
  }, [error, animated, isAnimated, shouldAnimate, errorAnimation, errorOpacity, errorTranslateY, config]);
  
  const errorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: errorOpacity.value,
    transform: [{ translateY: errorTranslateY.value }],
  }));

  return (
    <View style={style}>
      <Label
        required={required}
        error={!!error}
        hint={hint}
        animated={animated}
        animationVariant={animationVariant}
        animationDelay={animationDelay}
        errorShake={errorAnimation === 'shake'}
        {...labelProps}
      >
        {label}
      </Label>
      
      <AnimatedView 
        style={{ marginTop: spacing[1.5] }}
        entering={Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && staggerChildren
          ? FadeIn.duration(config.duration.normal).delay(animationDelay + 200)
          : undefined
        }
      >
        {children}
      </AnimatedView>
      
      {error && (
        <AnimatedView
          style={[
            {
              marginTop: spacing[1],
            },
            animated && isAnimated && shouldAnimate() ? errorAnimatedStyle : {},
          ]}
        >
          <Text
            size="xs"
            style={{
              color: theme.destructive,
            }}
          >
            {error}
          </Text>
        </AnimatedView>
      )}
    </View>
  );
};

FormField.displayName = 'FormField';