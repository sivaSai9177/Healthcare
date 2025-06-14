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
import { Text, TextProps } from './Text';
import { useSpacing } from '@/lib/stores/spacing-store';
import { cn } from '@/lib/core/utils';
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
  animationType?: LabelAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  errorShake?: boolean;
  useHaptics?: boolean;
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
  animationType = 'fadeIn',
  animationDuration = 300,
  animationDelay = 0,
  errorShake = true,
  useHaptics = true,
  ...textProps
}, ref) => {
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  
  const duration = animationDuration;
  
  // Animation values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(animated && shouldAnimate() && animationType === 'fadeIn' ? 0 : 1);
  const asteriskScale = useSharedValue(1);
  
  // Error shake animation
  useEffect(() => {
    if (error && animated && shouldAnimate() && errorShake) {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withSpring(0, { damping: 12, stiffness: 180 })
      );
      
      if (useHaptics) {
        haptic('error');
      }
    }
  }, [error, animated, shouldAnimate, errorShake, translateX, useHaptics]);
  
  // Asterisk pulse animation
  useEffect(() => {
    if (required && animated && shouldAnimate() && animationType === 'asteriskPulse') {
      asteriskScale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withSpring(1, { damping: 12, stiffness: 180 })
      );
    }
  }, [required, animated, shouldAnimate, animationType, asteriskScale]);
  
  // Fade in animation
  useEffect(() => {
    if (animated && shouldAnimate() && animationType === 'fadeIn') {
      opacity.value = withTiming(1, { duration });
    }
  }, [animated, shouldAnimate, animationType, opacity, duration]);
  
  // Animated styles
  const labelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));
  
  const asteriskAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: asteriskScale.value }],
  }));

  // Determine text color class based on state
  const getTextColorClass = () => {
    if (error) return 'text-destructive';
    if (disabled) return 'text-muted-foreground';
    return undefined;
  };

  const textColorClass = getTextColorClass();

  const ContainerComponent = animated && shouldAnimate() ? AnimatedView : View;
  
  const labelContent = (
    <ContainerComponent 
      ref={ref} 
      style={[
        style,
        animated && shouldAnimate() ? labelAnimatedStyle : {},
      ]}
      entering={Platform.OS !== 'web' && animated && shouldAnimate() && animationType === 'slideIn'
        ? SlideInLeft.duration(duration).delay(animationDelay)
        : undefined
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          size={size}
          weight={weight}
          colorTheme={colorTheme || undefined}
          className={textColorClass}
          style={[
            disabled && { opacity: 0.6 },
            textProps.style,
          ]}
          {...textProps}
        >
          {children}
        </Text>
        {required && (
          <AnimatedView
            style={[
              animated && shouldAnimate() && animationType === 'asteriskPulse'
                ? asteriskAnimatedStyle
                : {},
            ]}
          >
            <Text
              size={size}
              className="text-destructive"
              style={{
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
          entering={Platform.OS !== 'web' && animated && shouldAnimate()
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
    const PressableComponent = animated && shouldAnimate() ? AnimatedPressable : Pressable;
    
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
  animationDelay = 0,
  staggerChildren = true,
  errorAnimation = 'shake',
}) => {
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  
  // Animation values
  const errorOpacity = useSharedValue(error ? 1 : 0);
  const errorTranslateY = useSharedValue(error ? 0 : -10);
  
  // Error animation
  useEffect(() => {
    if (animated && shouldAnimate()) {
      if (error) {
        errorOpacity.value = withTiming(1, { duration: 150 });
        errorTranslateY.value = withSpring(0, { damping: 12, stiffness: 180 });
        
        if (errorAnimation === 'flash') {
          errorOpacity.value = withSequence(
            withTiming(0, { duration: 100 }),
            withTiming(1, { duration: 100 }),
            withTiming(0, { duration: 100 }),
            withTiming(1, { duration: 100 })
          );
        }
      } else {
        errorOpacity.value = withTiming(0, { duration: 150 });
        errorTranslateY.value = withTiming(-10, { duration: 150 });
      }
    }
  }, [error, animated, shouldAnimate, errorAnimation, errorOpacity, errorTranslateY]);
  
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
        animationDelay={animationDelay}
        errorShake={errorAnimation === 'shake'}
        {...labelProps}
      >
        {label}
      </Label>
      
      <AnimatedView 
        style={{ marginTop: spacing[1.5] }}
        entering={Platform.OS !== 'web' && animated && shouldAnimate() && staggerChildren
          ? FadeIn.duration(300).delay(animationDelay + 200)
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
            animated && shouldAnimate() ? errorAnimatedStyle : {},
          ]}
        >
          <Text
            size="xs"
            className="text-destructive"
          >
            {error}
          </Text>
        </AnimatedView>
      )}
    </View>
  );
};

FormField.displayName = 'FormField';