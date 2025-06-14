import React, { useEffect } from 'react';
import { View, Pressable, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { Symbol } from '@/components/universal/display/Symbols';
import { cn } from '@/lib/core/utils';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { useShadow } from '@/hooks/useShadow';

export type ChipAnimationType = 'scale' | 'fade' | 'bounce' | 'none';

export interface ChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  onPress?: () => void;
  onRemove?: () => void;
  removable?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  shadow?: 'sm' | 'base' | 'md' | 'lg' | 'none';
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationType?: ChipAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  hoverScale?: number;
  pressScale?: number;
  useHaptics?: boolean;
  removeWithAnimation?: boolean;
}

// Size configurations
const sizeConfig = {
  sm: {
    paddingH: 8,
    paddingV: 4,
    fontSize: 'xs' as const,
    iconSize: 14,
    height: 24,
  },
  default: {
    paddingH: 12,
    paddingV: 6,
    fontSize: 'sm' as const,
    iconSize: 16,
    height: 32,
  },
  lg: {
    paddingH: 16,
    paddingV: 8,
    fontSize: 'base' as const,
    iconSize: 20,
    height: 40,
  },
};

// Variant classes
const variantClasses = {
  default: {
    base: 'bg-muted',
    text: 'text-foreground',
    selected: 'bg-muted-foreground/20',
  },
  primary: {
    base: 'bg-primary',
    text: 'text-primary-foreground',
    selected: 'bg-primary/80',
  },
  secondary: {
    base: 'bg-secondary',
    text: 'text-secondary-foreground',
    selected: 'bg-secondary/80',
  },
  destructive: {
    base: 'bg-destructive',
    text: 'text-destructive-foreground',
    selected: 'bg-destructive/80',
  },
  outline: {
    base: 'bg-transparent border border-input',
    text: 'text-foreground',
    selected: 'bg-muted border-primary',
  },
  ghost: {
    base: 'bg-transparent',
    text: 'text-foreground',
    selected: 'bg-muted',
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Chip = React.forwardRef<View, ChipProps>(({
  children,
  variant = 'default',
  size = 'default',
  onPress,
  onRemove,
  removable = false,
  icon,
  iconPosition = 'left',
  selected = false,
  disabled = false,
  className,
  shadow = 'none',
  style,
  // Animation props
  animated = true,
  animationType = 'scale',
  animationDuration = 200,
  animationDelay = 0,
  hoverScale = 1.05,
  pressScale = 0.95,
  useHaptics = true,
  removeWithAnimation = true,
}, ref) => {
  const { shouldAnimate } = useAnimationStore();
  const shadowStyle = useShadow(shadow);
  
  const config = sizeConfig[size];
  const classes = variantClasses[variant];
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(animationType === 'fade' ? 0 : 1);
  const isPressed = useSharedValue(0);
  const isHovered = useSharedValue(0);
  const removeScale = useSharedValue(1);
  
  // Spring config
  const springConfig = {
    damping: 15,
    stiffness: 300,
  };
  
  // Initialize animations
  useEffect(() => {
    if (animated && shouldAnimate()) {
      setTimeout(() => {
        if (animationType === 'fade') {
          opacity.value = withTiming(1, { duration: animationDuration });
        } else if (animationType === 'bounce') {
          scale.value = withSequence(
            withSpring(1.1, { ...springConfig, damping: 10 }),
            withSpring(1, springConfig)
          );
        }
      }, animationDelay);
    } else {
      opacity.value = 1;
    }
  }, []);
  
  // Handle press
  const handlePressIn = () => {
    if (!disabled && animated && shouldAnimate()) {
      isPressed.value = withSpring(1, springConfig);
      if (useHaptics) {
        haptic('light');
      }
    }
  };
  
  const handlePressOut = () => {
    if (!disabled && animated && shouldAnimate()) {
      isPressed.value = withSpring(0, springConfig);
    }
  };
  
  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };
  
  // Handle remove
  const handleRemove = () => {
    if (!disabled && onRemove) {
      if (removeWithAnimation && animated && shouldAnimate()) {
        removeScale.value = withTiming(0, { duration: 150 }, () => {
          'worklet';
          // Call onRemove after animation
        });
        opacity.value = withTiming(0, { duration: 150 });
      }
      if (useHaptics) {
        haptic('light');
      }
      // Delay removal to allow animation
      setTimeout(() => onRemove(), removeWithAnimation ? 150 : 0);
    }
  };
  
  // Handle hover (web only)
  const handleHoverIn = () => {
    if (Platform.OS === 'web' && !disabled && animated && shouldAnimate()) {
      isHovered.value = withSpring(1, springConfig);
    }
  };
  
  const handleHoverOut = () => {
    if (Platform.OS === 'web' && !disabled && animated && shouldAnimate()) {
      isHovered.value = withSpring(0, springConfig);
    }
  };
  
  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { 
        scale: scale.value * removeScale.value * interpolate(
          isPressed.value + isHovered.value,
          [0, 1, 2],
          [1, pressScale, hoverScale]
        )
      },
    ],
  }));
  
  // Container classes
  const containerClasses = cn(
    'flex-row items-center rounded-full',
    selected ? classes.selected : classes.base,
    disabled && 'opacity-50',
    onPress && !disabled && 'cursor-pointer',
    className
  );
  
  const ViewComponent = onPress || removable ? AnimatedPressable : Animated.View;
  
  return (
    <ViewComponent
      ref={ref}
      className={containerClasses}
      style={[
        {
          height: config.height,
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
        },
        shadowStyle,
        animated && shouldAnimate() ? containerAnimatedStyle : {},
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...(Platform.OS === 'web' && {
        onHoverIn: handleHoverIn,
        onHoverOut: handleHoverOut,
      } as any)}
    >
      {/* Left icon */}
      {icon && iconPosition === 'left' && (
        <Symbol
          name={icon}
          size={config.iconSize}
          className={cn(classes.text, 'mr-1')}
        />
      )}
      
      {/* Content */}
      {typeof children === 'string' ? (
        <Text
          size={config.fontSize}
          className={classes.text}
        >
          {children}
        </Text>
      ) : (
        children
      )}
      
      {/* Right icon */}
      {icon && iconPosition === 'right' && !removable && (
        <Symbol
          name={icon}
          size={config.iconSize}
          className={cn(classes.text, 'ml-1')}
        />
      )}
      
      {/* Remove button */}
      {removable && (
        <Pressable
          onPress={handleRemove}
          className="ml-1 -mr-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Symbol
            name="xmark"
            size={config.iconSize}
            className={cn(classes.text, 'opacity-70')}
          />
        </Pressable>
      )}
    </ViewComponent>
  );
});

Chip.displayName = 'Chip';