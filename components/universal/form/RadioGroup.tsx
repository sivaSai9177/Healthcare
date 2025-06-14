import React, { createContext, useContext, useEffect } from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { useSpacing } from '@/lib/stores/spacing-store';
import { HStack, VStack } from '@/components/universal/layout/Stack';
import { Text } from '@/components/universal/typography/Text';
import { cn } from '@/lib/core/utils';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { useShadow } from '@/hooks/useShadow';

// Radio Group Context
interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  animated?: boolean;
  animationType?: RadioAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  variant?: 'default' | 'primary' | 'secondary' | 'destructive';
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
  spacing?: 'sm' | 'base' | 'lg';
  disabled?: boolean;
  className?: string;
  style?: ViewStyle;
  variant?: 'default' | 'primary' | 'secondary' | 'destructive';
  
  // Animation props
  animated?: boolean;
  animationType?: RadioAnimationType;
  animationDuration?: number;
  staggerDelay?: number;
  useHaptics?: boolean;
}

// Variant classes for Tailwind
const variantClasses = {
  default: {
    unchecked: 'border-input bg-background',
    checked: 'border-primary bg-primary',
    hover: 'hover:border-primary hover:bg-primary/10',
  },
  primary: {
    unchecked: 'border-primary/50 bg-background',
    checked: 'border-primary bg-primary',
    hover: 'hover:border-primary hover:bg-primary/10',
  },
  secondary: {
    unchecked: 'border-secondary/50 bg-background',
    checked: 'border-secondary bg-secondary',
    hover: 'hover:border-secondary hover:bg-secondary/10',
  },
  destructive: {
    unchecked: 'border-destructive/50 bg-background',
    checked: 'border-destructive bg-destructive',
    hover: 'hover:border-destructive hover:bg-destructive/10',
  },
};

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onValueChange,
  children,
  orientation = 'vertical',
  spacing = 'base',
  disabled = false,
  className,
  style,
  variant = 'default',
  // Animation props
  animated = true,
  animationType = 'select',
  animationDuration = 200,
  staggerDelay = 50,
  useHaptics = true,
}) => {
  const contextValue = React.useMemo(
    () => ({ 
      value, 
      onValueChange, 
      disabled,
      animated,
      animationType,
      animationDuration,
      useHaptics,
      variant,
    }),
    [value, onValueChange, disabled, animated, animationType, animationDuration, useHaptics, variant]
  );

  const Stack = orientation === 'horizontal' ? HStack : VStack;

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <Stack 
        gap={spacing === 'sm' ? 2 : spacing === 'lg' ? 4 : 3} 
        className={className}
        style={style}
      >
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              ...child.props,
              _staggerIndex: index,
              _staggerDelay: staggerDelay,
            } as any);
          }
          return child;
        })}
      </Stack>
    </RadioGroupContext.Provider>
  );
};

// Radio Item Props
export interface RadioItemProps {
  value: string;
  children?: React.ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  style?: ViewStyle;
  shadow?: 'sm' | 'base' | 'md' | 'lg' | 'none';
  _staggerIndex?: number;
  _staggerDelay?: number;
}

// Size mappings
const sizeMap = {
  sm: 16,
  default: 20,
  lg: 24,
};

export const RadioItem = React.forwardRef<View, RadioItemProps>(({
  value,
  children,
  disabled: itemDisabled,
  size = 'default',
  className,
  style,
  shadow = 'none',
  _staggerIndex = 0,
  _staggerDelay = 0,
}, ref) => {
  const { 
    value: groupValue, 
    onValueChange, 
    disabled: groupDisabled,
    animated,
    animationType,
    animationDuration = 200,
    useHaptics,
    variant = 'default',
  } = useRadioGroup();
  
  const isDisabled = itemDisabled || groupDisabled;
  const isSelected = groupValue === value;
  const { shouldAnimate } = useAnimationStore();
  const shadowStyle = useShadow(shadow);
  
  const pixelSize = sizeMap[size];
  const innerSize = pixelSize * 0.5;
  const variantClass = variantClasses[variant];
  
  // Animation values
  const scale = useSharedValue(1);
  const innerScale = useSharedValue(isSelected ? 1 : 0);
  const innerOpacity = useSharedValue(isSelected ? 1 : 0);
  
  // Spring config
  const springConfig = {
    damping: 15,
    stiffness: 300,
  };
  
  // Update animation values when selection changes
  useEffect(() => {
    if (animated && shouldAnimate()) {
      const delay = _staggerIndex * _staggerDelay;
      
      if (isSelected) {
        innerScale.value = withDelay(delay, withSpring(1, springConfig));
        innerOpacity.value = withDelay(delay, withTiming(1, { duration: animationDuration }));
        
        if (animationType === 'pulse') {
          scale.value = withDelay(delay, withSequence(
            withSpring(1.2, { ...springConfig, damping: 10 }),
            withSpring(1, springConfig)
          ));
        }
      } else {
        innerScale.value = withSpring(0, springConfig);
        innerOpacity.value = withTiming(0, { duration: animationDuration });
      }
    } else {
      // No animation
      innerScale.value = isSelected ? 1 : 0;
      innerOpacity.value = isSelected ? 1 : 0;
    }
  }, [isSelected, animated, shouldAnimate, animationType, _staggerIndex, _staggerDelay, animationDuration]);

  const handlePress = () => {
    if (!isDisabled && onValueChange) {
      if (animated && shouldAnimate() && useHaptics) {
        haptic('light');
      }
      onValueChange(value);
      
      // Scale animation on press
      if (animated && shouldAnimate() && animationType === 'scale') {
        scale.value = withSpring(0.9, springConfig, () => {
          scale.value = withSpring(1, springConfig);
        });
      }
    }
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
    opacity: innerOpacity.value,
  }));
  
  const ViewComponent = animated && shouldAnimate() ? AnimatedPressable : Pressable;
  
  // Tailwind classes
  const radioClasses = cn(
    'rounded-full border-2 items-center justify-center',
    isSelected ? variantClass.checked : variantClass.unchecked,
    !isDisabled && variantClass.hover,
    isDisabled && 'opacity-50 cursor-not-allowed',
    className
  );
  
  // Native styles
  const nativeStyle: ViewStyle = {
    width: pixelSize,
    height: pixelSize,
    borderRadius: pixelSize / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.5 : 1,
  };
  
  const innerNativeStyle: ViewStyle = {
    width: innerSize,
    height: innerSize,
    borderRadius: innerSize / 2,
  };
  
  return (
    <HStack gap={2} align="center">
      <ViewComponent
        ref={ref}
        onPress={handlePress}
        disabled={isDisabled}
        className={radioClasses}
        style={[
          nativeStyle,
          shadowStyle,
          animated && shouldAnimate() ? containerStyle : {},
          style,
        ]}
      >
        {animated && shouldAnimate() ? (
          <AnimatedView 
            className={isSelected ? "bg-primary-foreground" : "bg-transparent"}
            style={[innerNativeStyle, innerStyle]} 
          />
        ) : (
          isSelected && (
            <View 
              className="bg-primary-foreground"
              style={innerNativeStyle} 
            />
          )
        )}
      </ViewComponent>
      {children && (
        <Pressable onPress={handlePress} disabled={isDisabled}>
          {typeof children === 'string' ? (
            <Text
              size="sm"
              className={cn(
                isDisabled && 'opacity-50',
                'select-none'
              )}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </Pressable>
      )}
    </HStack>
  );
});

RadioItem.displayName = 'RadioItem';