import React, { useEffect } from 'react';
import { View, ViewStyle, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
  runOnJS,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { Box } from '@/components/universal/layout/Box';
import { HStack, VStack } from '@/components/universal/layout/Stack';
import { Symbol } from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { SpacingScale } from '@/lib/design';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { cn } from '@/lib/core/utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'default';
export type AlertAnimationType = 'slideDown' | 'slideUp' | 'slideLeft' | 'slideRight' | 'fade' | 'shake' | 'none';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  onClose?: () => void;
  action?: React.ReactNode;
  style?: ViewStyle;
  children?: React.ReactNode;
  
  // Animation props
  animated?: boolean;
  animationType?: AlertAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  shakeOnError?: boolean;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

const variantIcons: Record<AlertVariant, keyof typeof any> = {
  info: 'info.circle',
  success: 'checkmark.circle',
  warning: 'exclamationmark.triangle',
  error: 'xmark.circle',
  default: 'info.circle',
};

// Alert variant styles
const alertVariantStyles = {
  info: {
    container: "bg-primary/10 border-primary/20",
    icon: "text-primary",
    text: "text-foreground",
  },
  success: {
    container: "bg-success/10 border-success/20",
    icon: "text-success",
    text: "text-foreground",
  },
  warning: {
    container: "bg-warning/10 border-warning/20",
    icon: "text-warning",
    text: "text-foreground",
  },
  error: {
    container: "bg-destructive/10 border-destructive/20",
    icon: "text-destructive",
    text: "text-foreground",
  },
  default: {
    container: "bg-muted border-border",
    icon: "text-muted-foreground",
    text: "text-foreground",
  },
};

export const Alert = React.forwardRef<View, AlertProps>(({
  variant = 'default',
  title,
  description,
  icon,
  showIcon = true,
  onClose,
  action,
  style,
  children,
  // Animation props
  animated = true,
  animationType = 'slideDown',
  animationDuration,
  animationDelay = 0,
  shakeOnError = true,
  useHaptics = true,
  animationConfig,
}, ref) => {
  const { componentSpacing } = useSpacing();
  const styles = alertVariantStyles[variant];
  const { shouldAnimate } = useAnimationStore();
  
  const duration = animationDuration ?? 300;
  
  // Animation values
  const shakeX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(animated && shouldAnimate() ? 0 : 1);
  
  // Trigger shake animation for error alerts
  useEffect(() => {
    if (variant === 'error' && shakeOnError && animated && shouldAnimate()) {
      // Shake animation
      shakeX.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
      
      // Haptic feedback for error
      if (useHaptics && Platform.OS !== 'web') {
        haptic('error');
      }
    }
  }, [variant, shakeOnError, animated, shouldAnimate, useHaptics]);
  
  // Trigger success haptics
  useEffect(() => {
    if (variant === 'success' && animated && shouldAnimate() && useHaptics && Platform.OS !== 'web') {
      haptic('success');
    }
  }, [variant, animated, shouldAnimate, useHaptics]);
  
  // Animated styles
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  // Handle close animation
  const handleClose = () => {
    if (animated && shouldAnimate()) {
      scale.value = withTiming(0.9, { duration: 100 });
      opacity.value = withTiming(0, { duration: duration / 2 }, (finished) => {
        'worklet';
        if (finished && onClose) {
          runOnJS(onClose)();
        }
      });
    } else {
      onClose?.();
    }
  };

  const iconElement = icon || (showIcon && (
    <Symbol 
      name={variantIcons[variant] as any} 
      size={componentSpacing.iconSize} 
      className={styles.icon}
    />
  ));
  
  // Get entrance animation based on type
  const getEntranceAnimation = () => {
    if (!animated || !shouldAnimate() || animationType === 'none') return undefined;
    
    switch (animationType) {
      case 'slideDown':
        return SlideInDown.duration(duration).delay(animationDelay);
      case 'slideUp':
        return SlideInUp.duration(duration).delay(animationDelay);
      case 'slideLeft':
        return SlideInLeft.duration(duration).delay(animationDelay);
      case 'slideRight':
        return SlideInRight.duration(duration).delay(animationDelay);
      case 'fade':
        return FadeIn.duration(duration).delay(animationDelay);
      default:
        return undefined;
    }
  };
  
  const getExitAnimation = () => {
    if (!animated || !shouldAnimate()) return undefined;
    return FadeOut.duration(duration / 2);
  };
  
  // Combine animation styles
  const containerAnimatedStyle = animated && shouldAnimate()
    ? variant === 'error' && shakeOnError
      ? shakeStyle
      : animationType === 'fade'
      ? fadeStyle
      : {}
    : {};
  
  // Use Animated.View for animation support
  const AnimatedBox = animated && shouldAnimate() && Platform.OS !== 'web' 
    ? Animated.View 
    : View;
  
  // Web CSS animations
  const webAnimationStyle = Platform.OS === 'web' && animated && shouldAnimate() ? {
    animation: animationType === 'slideDown' ? `slideInDown ${duration}ms ease-out ${animationDelay}ms` :
              animationType === 'slideUp' ? `slideInUp ${duration}ms ease-out ${animationDelay}ms` :
              animationType === 'slideLeft' ? `slideInLeft ${duration}ms ease-out ${animationDelay}ms` :
              animationType === 'slideRight' ? `slideInRight ${duration}ms ease-out ${animationDelay}ms` :
              animationType === 'fade' ? `fadeIn ${duration}ms ease-out ${animationDelay}ms` : undefined,
    '@keyframes slideInDown': {
      from: { transform: 'translateY(-100%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    '@keyframes slideInUp': {
      from: { transform: 'translateY(100%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    '@keyframes slideInLeft': {
      from: { transform: 'translateX(-100%)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
    '@keyframes slideInRight': {
      from: { transform: 'translateX(100%)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
  } as any : {};

  return (
    <AnimatedBox
      ref={ref}
      className={cn("border", styles.container)}
      style={[
        {
          padding: componentSpacing.containerPadding,
          borderRadius: componentSpacing.borderRadius,
        },
        containerAnimatedStyle,
        webAnimationStyle,
        style,
      ]}
      entering={Platform.OS !== 'web' ? getEntranceAnimation() : undefined}
      exiting={Platform.OS !== 'web' ? getExitAnimation() : undefined}
    >
      <HStack spacing={3 as SpacingScale} alignItems="flex-start">
        {iconElement && (
          <Box pt={0.5 as SpacingScale}>
            {iconElement}
          </Box>
        )}
        
        <VStack spacing={1 as SpacingScale} flex={1}>
          {title && (
            <Text 
              weight="semibold" 
              size="base"
              className={styles.text}
            >
              {title}
            </Text>
          )}
          
          {description && (
            <Text 
              size="sm" 
              className={cn(styles.text, "opacity-90")}
            >
              {description}
            </Text>
          )}
          
          {children}
          
          {action && (
            <Box mt={2 as SpacingScale}>
              {action}
            </Box>
          )}
        </VStack>
        
        {onClose && (
          <Pressable
            onPress={handleClose}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            {({ pressed }) => (
              <Symbol name="xmark" 
                size={Math.round(componentSpacing.iconSize * 0.8)} 
                className={cn(styles.icon, pressed && 'opacity-70')}
              />
            )}
          </Pressable>
        )}
      </HStack>
    </AnimatedBox>
  );
});

Alert.displayName = 'Alert';

// AlertTitle component for use with Alert
export const AlertTitle: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => {
  return (
    <Text weight="semibold" size="base" style={style}>
      {children}
    </Text>
  );
};

// AlertDescription component for use with Alert
export const AlertDescription: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => {
  return (
    <Text size="sm" colorTheme="mutedForeground" style={style}>
      {children}
    </Text>
  );
};