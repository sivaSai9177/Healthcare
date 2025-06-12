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
import { useTheme } from '@/lib/theme/provider';
import { Text } from './Text';
import { Box } from './Box';
import { HStack, VStack } from './Stack';
import { Symbol } from './Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { 
  SpacingScale, 
  AnimationVariant,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

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
  animationVariant?: AnimationVariant;
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
  info: 'information-circle',
  success: 'checkmark-circle',
  warning: 'warning',
  error: 'close-circle',
  default: 'information-circle',
};

// Theme-aware color mapping
const getAlertColors = (variant: AlertVariant, theme: any) => {
  const colorMap = {
    info: {
      background: theme.primary + '1a', // 10% opacity
      border: theme.primary + '33', // 20% opacity
      icon: theme.primary,
      text: theme.foreground,
    },
    success: {
      background: theme.success + '1a',
      border: theme.success + '33',
      icon: theme.success,
      text: theme.foreground,
    },
    warning: {
      background: 'theme.warning' + '1a', // amber
      border: 'theme.warning' + '33',
      icon: 'theme.warning',
      text: theme.foreground,
    },
    error: {
      background: theme.destructive + '1a',
      border: theme.destructive + '33',
      icon: theme.destructive,
      text: theme.foreground,
    },
    default: {
      background: theme.muted,
      border: theme.border,
      icon: theme.mutedForeground,
      text: theme.foreground,
    },
  };
  
  return colorMap[variant];
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
  animationVariant = 'moderate',
  animationType = 'slideDown',
  animationDuration,
  animationDelay = 0,
  shakeOnError = true,
  useHaptics = true,
  animationConfig,
}, ref) => {
  const theme = useTheme();
  const { componentSpacing } = useSpacing();
  const colors = getAlertColors(variant, theme);
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.normal;
  
  // Animation values
  const shakeX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(animated && isAnimated && shouldAnimate() ? 0 : 1);
  
  // Trigger shake animation for error alerts
  useEffect(() => {
    if (variant === 'error' && shakeOnError && animated && isAnimated && shouldAnimate()) {
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
  }, [variant, shakeOnError, animated, isAnimated, shouldAnimate, useHaptics]);
  
  // Trigger success haptics
  useEffect(() => {
    if (variant === 'success' && animated && isAnimated && shouldAnimate() && useHaptics && Platform.OS !== 'web') {
      haptic('success');
    }
  }, [variant, animated, isAnimated, shouldAnimate, useHaptics]);
  
  // Animated styles
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  // Handle close animation
  const handleClose = () => {
    if (animated && isAnimated && shouldAnimate()) {
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
      name="variantIcons[variant]" 
      size={componentSpacing.iconSize} 
      color={colors.icon}
    />
  ));
  
  // Get entrance animation based on type
  const getEntranceAnimation = () => {
    if (!animated || !isAnimated || !shouldAnimate() || animationType === 'none') return undefined;
    
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
    if (!animated || !isAnimated || !shouldAnimate()) return undefined;
    return FadeOut.duration(duration / 2);
  };
  
  // Combine animation styles
  const containerAnimatedStyle = animated && isAnimated && shouldAnimate()
    ? variant === 'error' && shakeOnError
      ? shakeStyle
      : animationType === 'fade'
      ? fadeStyle
      : {}
    : {};
  
  // Use Animated.View for animation support
  const AnimatedBox = animated && isAnimated && shouldAnimate() && Platform.OS !== 'web' 
    ? Animated.View 
    : View;
  
  // Web CSS animations
  const webAnimationStyle = Platform.OS === 'web' && animated && isAnimated && shouldAnimate() ? {
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
      style={[
        {
          padding: componentSpacing.containerPadding,
          borderRadius: componentSpacing.borderRadius,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
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
              style={{ color: colors.text }}
            >
              {title}
            </Text>
          )}
          
          {description && (
            <Text 
              size="sm" 
              style={{ color: colors.text, opacity: 0.9 }}
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
                color={colors.icon}
                style={{ opacity: pressed ? 0.7 : 1 }}
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