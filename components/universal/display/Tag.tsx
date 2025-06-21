import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { Symbol } from '@/components/universal/display/Symbols';
import { cn } from '@/lib/core/utils';
import { useAnimationStore } from '@/lib/stores/animation-store';

export type TagVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info';
export type TagSize = 'xs' | 'sm' | 'default' | 'lg';
export type TagAnimationType = 'fade' | 'scale' | 'slide' | 'none';

export interface TagProps {
  children: React.ReactNode;
  variant?: TagVariant;
  size?: TagSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  rounded?: boolean;
  outline?: boolean;
  className?: string;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationType?: TagAnimationType;
  animationDuration?: number;
  animationDelay?: number;
}

// Size configurations
const sizeConfig = {
  xs: {
    paddingH: 6,
    paddingV: 2,
    fontSize: 'xs' as const,
    iconSize: 12,
  },
  sm: {
    paddingH: 8,
    paddingV: 3,
    fontSize: 'xs' as const,
    iconSize: 14,
  },
  default: {
    paddingH: 10,
    paddingV: 4,
    fontSize: 'sm' as const,
    iconSize: 16,
  },
  lg: {
    paddingH: 12,
    paddingV: 5,
    fontSize: 'base' as const,
    iconSize: 18,
  },
};

// Variant classes
const variantClasses = {
  default: {
    base: 'bg-muted',
    outline: 'border-muted-foreground/20',
    text: 'text-foreground',
  },
  primary: {
    base: 'bg-primary',
    outline: 'border-primary',
    text: 'text-primary-foreground',
  },
  secondary: {
    base: 'bg-secondary',
    outline: 'border-secondary',
    text: 'text-secondary-foreground',
  },
  success: {
    base: 'bg-green-100 dark:bg-green-900/30',
    outline: 'border-green-500',
    text: 'text-green-800 dark:text-green-200',
  },
  warning: {
    base: 'bg-yellow-100 dark:bg-yellow-900/30',
    outline: 'border-yellow-500',
    text: 'text-yellow-800 dark:text-yellow-200',
  },
  destructive: {
    base: 'bg-red-100 dark:bg-red-900/30',
    outline: 'border-red-500',
    text: 'text-red-800 dark:text-red-200',
  },
  info: {
    base: 'bg-blue-100 dark:bg-blue-900/30',
    outline: 'border-blue-500',
    text: 'text-blue-800 dark:text-blue-200',
  },
};

const AnimatedView = Animated.View;

export const Tag = React.forwardRef<View, TagProps>(({
  children,
  variant = 'default',
  size = 'default',
  icon,
  iconPosition = 'left',
  rounded = true,
  outline = false,
  className,
  style,
  // Animation props
  animated = true,
  animationType = 'fade',
  animationDuration = 300,
  animationDelay = 0,
}, ref) => {
  const { shouldAnimate } = useAnimationStore();
  
  const config = sizeConfig[size];
  const classes = variantClasses[variant];
  
  // Animation values
  const opacity = useSharedValue(animationType === 'fade' ? 0 : 1);
  const scale = useSharedValue(animationType === 'scale' ? 0.8 : 1);
  const translateX = useSharedValue(animationType === 'slide' ? -20 : 0);
  
  // Spring config
  const springConfig = {
    damping: 15,
    stiffness: 200,
  };
  
  // Initialize animations
  useEffect(() => {
    if (animated && shouldAnimate()) {
      setTimeout(() => {
        if (animationType === 'fade') {
          opacity.value = withTiming(1, { duration: animationDuration });
        } else if (animationType === 'scale') {
          scale.value = withSpring(1, springConfig);
        } else if (animationType === 'slide') {
          translateX.value = withSpring(0, springConfig);
        }
      }, animationDelay);
    } else {
      opacity.value = 1;
      scale.value = 1;
      translateX.value = 0;
    }
  }, []);
  
  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
    ],
  }));
  
  // Container classes
  const containerClasses = cn(
    'flex-row items-center',
    rounded ? 'rounded-full' : 'rounded',
    outline ? 'bg-transparent border' : classes.base,
    outline && classes.outline,
    className
  );
  
  return (
    <AnimatedView
      ref={ref}
      className={containerClasses}
      style={[
        {
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
          alignSelf: 'flex-start',
        },
        animated && shouldAnimate() ? containerAnimatedStyle : {},
        style,
      ]}
      entering={animated && shouldAnimate() ? FadeIn.duration(animationDuration) : undefined}
      exiting={animated && shouldAnimate() ? FadeOut.duration(animationDuration) : undefined}
      layout={animated && shouldAnimate() ? Layout.springify() : undefined}
    >
      {/* Left icon */}
      {icon && iconPosition === 'left' && (
        <Symbol
          name={icon}
          size={config.iconSize}
          className={cn(classes.text, 'mr-1') as string}
        />
      )}
      
      {/* Content */}
      {typeof children === 'string' ? (
        <Text
          size={config.fontSize}
          weight="medium"
          className={classes.text}
        >
          {children}
        </Text>
      ) : (
        children
      )}
      
      {/* Right icon */}
      {icon && iconPosition === 'right' && (
        <Symbol
          name={icon}
          size={config.iconSize}
          className={cn(classes.text, 'ml-1') as string}
        />
      )}
    </AnimatedView>
  );
});

Tag.displayName = 'Tag';

// Export a StatusTag component for common use cases
export const StatusTag: React.FC<{
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning';
  size?: TagSize;
  className?: string;
}> = ({ status, size = 'default', className }) => {
  const statusConfig = {
    active: { variant: 'success' as const, icon: 'checkmark.circle.fill', text: 'Active' },
    inactive: { variant: 'default' as const, icon: 'minus.circle', text: 'Inactive' },
    pending: { variant: 'warning' as const, icon: 'clock.fill', text: 'Pending' },
    error: { variant: "error" as const, icon: 'xmark.circle.fill', text: 'Error' },
    success: { variant: 'success' as const, icon: 'checkmark.circle.fill', text: 'Success' },
    warning: { variant: 'warning' as const, icon: 'exclamationmark.triangle.fill', text: 'Warning' },
  };
  
  const config = statusConfig[status];
  
  return (
    <Tag
      variant={config.variant}
      size={size}
      icon={config.icon}
      className={className}
    >
      {config.text}
    </Tag>
  );
};