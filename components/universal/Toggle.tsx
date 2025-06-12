import React, { useEffect } from 'react';
import { Pressable, View, ViewStyle, Text as RNText } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from './Symbols';
import { 
  AnimationVariant,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export type ToggleSize = 'sm' | 'md' | 'lg';
export type ToggleVariant = 'default' | 'outline';
export type ToggleAnimationType = 'press' | 'scale' | 'fade' | 'none';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);


export interface ToggleProps {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  disabled?: boolean;
  size?: ToggleSize;
  variant?: ToggleVariant;
  children?: React.ReactNode;
  icon?: string;
  style?: ViewStyle;
  asChild?: boolean;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: ToggleAnimationType;
  animationDuration?: number;
  pressScale?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const Toggle = React.forwardRef<View, ToggleProps>(({
  pressed = false,
  onPressedChange,
  disabled = false,
  size = 'md',
  variant = 'default',
  children,
  icon,
  style,
  asChild = false,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'scale',
  animationDuration,
  pressScale = 0.95,
  useHaptics = true,
  animationConfig,
}, ref) => {
  const theme = useTheme();
  const { spacing, componentSizes, componentSpacing } = useSpacing();
  const [isHovered, setIsHovered] = React.useState(false);
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.fast;
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  // Size configuration
  const sizeConfig = {
    sm: {
      padding: spacing[2],
      minHeight: componentSizes.button.sm.height,
      fontSize: 12,
      iconSize: componentSpacing.iconSize.sm,
    },
    md: {
      padding: spacing[2.5],
      minHeight: componentSizes.button.md.height,
      fontSize: 14,
      iconSize: componentSpacing.iconSize.md,
    },
    lg: {
      padding: spacing[3],
      minHeight: componentSizes.button.lg.height,
      fontSize: 16,
      iconSize: componentSpacing.iconSize.lg,
    },
  };

  const toggleSizeConfig = sizeConfig[size];

  // Theme-aware colors
  const getColors = () => {
    if (disabled) {
      return {
        background: 'transparent',
        border: theme.border,
        text: theme.mutedForeground,
        icon: theme.mutedForeground,
      };
    }

    if (variant === 'outline') {
      return {
        background: pressed ? theme.accent : 'transparent',
        border: pressed ? theme.accent : theme.border,
        text: pressed ? theme.accentForeground : theme.foreground,
        icon: pressed ? theme.accentForeground : theme.foreground,
      };
    }

    // Default variant
    return {
      background: pressed ? theme.accent : 'transparent',
      border: 'transparent',
      text: pressed ? theme.accentForeground : theme.foreground,
      icon: pressed ? theme.accentForeground : theme.foreground,
    };
  };

  const colors = getColors();
  
  // Update animation values when pressed state changes
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      if (pressed) {
        if (animationType === 'scale') {
          scale.value = withSpring(1.05, config.spring);
        }
        iconRotation.value = withSpring(180, config.spring);
      } else {
        scale.value = withSpring(1, config.spring);
        iconRotation.value = withSpring(0, config.spring);
      }
      
      if (animationType === 'fade') {
        opacity.value = withTiming(pressed ? 1 : 0.7, { duration });
      }
    }
  }, [pressed, animated, isAnimated, shouldAnimate, animationType, duration, config.spring, scale, opacity, iconRotation]);

  // Animated styles - Must be defined before any conditional returns
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: animationType === 'fade' ? opacity.value : 1,
  }));
  
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const handlePress = () => {
    if (!disabled && onPressedChange) {
      if (animated && isAnimated && shouldAnimate()) {
        if (useHaptics) {
          haptic('light');
        }
        
        if (animationType === 'press') {
          scale.value = withSpring(pressScale, config.spring, () => {
            scale.value = withSpring(1, config.spring);
          });
        }
      }
      onPressedChange(!pressed);
    }
  };
  
  
  
  const content = (
    <>
      {icon && (
        <Symbol name={icon}
          size={toggleSizeConfig.iconSize}
          color={colors.icon}
          style={[
            children ? { marginRight: spacing[1] } : undefined,
            animated && isAnimated && shouldAnimate() ? iconStyle : {},
          ]}
        />
      )}
      {children && (
        <RNText
          style={{
            fontSize: toggleSizeConfig.fontSize,
            fontWeight: '500',
            color: colors.text,
          }}
        >
          {children}
        </RNText>
      )}
    </>
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onPress: handlePress,
      disabled,
      style: [
        {
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
        (children as React.ReactElement<any>).props.style,
      ],
    });
  }

  const PressableComponent = animated && isAnimated && shouldAnimate() ? AnimatedPressable : Pressable;
  
  return (
    <PressableComponent
      ref={ref}
      onPress={handlePress}
      disabled={disabled}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: config.padding,
          paddingVertical: config.padding / 2,
          minHeight: config.minHeight,
          backgroundColor: colors.background,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
          borderRadius: 6,
          opacity: disabled ? 0.5 : 1,
        },
        isHovered && !disabled && {
          backgroundColor: pressed 
            ? theme.accent 
            : variant === 'outline' 
              ? theme.muted 
              : theme.accent + '1a',
        },
        animated && isAnimated && shouldAnimate() ? containerStyle : {},
        style,
      ]}
    >
      {content}
    </PressableComponent>
  );
});

Toggle.displayName = 'Toggle';

// Toggle Group Component
export interface ToggleGroupProps {
  type?: 'single' | 'multiple';
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  size?: ToggleSize;
  variant?: ToggleVariant;
  style?: ViewStyle;
}

export const ToggleGroup: React.FC<ToggleGroupProps> = ({
  type = 'single',
  value,
  onValueChange,
  disabled = false,
  children,
  orientation = 'horizontal',
  size = 'md',
  variant = 'default',
  style,
}) => {
  const { spacing } = useSpacing();

  const handleTogglePress = (itemValue: string) => {
    if (type === 'single') {
      onValueChange?.(itemValue === value ? '' : itemValue);
    } else {
      const currentValues = (value as string[]) || [];
      const newValues = currentValues.includes(itemValue)
        ? currentValues.filter(v => v !== itemValue)
        : [...currentValues, itemValue];
      onValueChange?.(newValues);
    }
  };

  const isPressed = (itemValue: string) => {
    if (type === 'single') {
      return value === itemValue;
    }
    return ((value as string[]) || []).includes(itemValue);
  };

  return (
    <View
      style={[
        {
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          gap: spacing[1],
        },
        style,
      ]}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === ToggleGroupItem) {
          return React.cloneElement(child as React.ReactElement<ToggleGroupItemProps>, {
            pressed: isPressed(child.props.value),
            onPressedChange: () => handleTogglePress(child.props.value),
            disabled: disabled || child.props.disabled,
            size,
            variant,
          });
        }
        return child;
      })}
    </View>
  );
};

// Toggle Group Item
export interface ToggleGroupItemProps extends Omit<ToggleProps, 'pressed' | 'onPressedChange'> {
  value: string;
}

export const ToggleGroupItem: React.FC<ToggleGroupItemProps> = (props) => {
  // This component is meant to be used inside ToggleGroup
  // The actual rendering is handled by ToggleGroup
  return <Toggle {...props} />;
};

ToggleGroup.displayName = 'ToggleGroup';
ToggleGroupItem.displayName = 'ToggleGroupItem';