import React from 'react';
import {
  View,
  ViewStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { Box } from '@/components/universal/layout/Box';
import { HStack } from '@/components/universal/layout/Stack';
import { Symbol } from '@/components/universal/display/Symbols';
// import { useSpacing } from '@/lib/stores/spacing-store';
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface ToastConfig {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  onClose?: () => void;
  icon?: React.ReactNode;
  position?: ToastPosition;
}

interface ToastProps extends ToastConfig {
  onHide: () => void;
}

// Variant classes
const variantClasses = {
  default: {
    container: 'bg-card border-border',
    icon: 'text-foreground',
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-500',
    icon: 'text-green-600 dark:text-green-400',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-500',
    icon: 'text-red-600 dark:text-red-400',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500',
    icon: 'text-blue-600 dark:text-blue-400',
  },
};

const variantIcons: Record<ToastVariant, string> = {
  default: 'info.circle',
  success: 'checkmark.circle.fill',
  error: 'xmark.circle.fill',
  warning: 'exclamationmark.triangle.fill',
  info: 'info.circle.fill',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Toast: React.FC<ToastProps> = ({
  title,
  description,
  variant = 'default',
  duration = 4000,
  action,
  onClose,
  onHide,
  icon,
  position = 'bottom',
}) => {
  // const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const shadowStyle = useShadow('md');
  const classes = variantClasses[variant];
  
  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(position.includes('top') ? -100 : 100);
  const scale = useSharedValue(0.9);

  const handleClose = React.useCallback(() => {
    'worklet';
    if (shouldAnimate()) {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(
        position.includes('top') ? -100 : 100,
        { duration: 200 },
        () => {
          runOnJS(onHide)();
          if (onClose) runOnJS(onClose)();
        }
      );
      scale.value = withTiming(0.9, { duration: 200 });
    } else {
      onHide();
      onClose?.();
    }
  }, [onClose, onHide, opacity, position, translateY, scale, shouldAnimate]);

  React.useEffect(() => {
    // Animate in
    if (shouldAnimate()) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    } else {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
    }

    // Haptic feedback
    if (variant === 'success') {
      haptic('success');
    } else if (variant === 'error') {
      haptic('error');
    } else if (variant === 'warning') {
      haptic('warning');
    }

    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose, shouldAnimate, variant, opacity, scale, translateY]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value } as any,
      { scale: scale.value } as any,
    ],
  }));

  const iconElement = icon || (
    <Symbol
      name={variantIcons[variant] as any}
      size={20}
      className={classes.icon}
    />
  );

  return (
    <Animated.View
      style={[
        {
          minWidth: 300,
          maxWidth: 400,
          margin: 12,
        },
        shouldAnimate() ? animatedStyle : { opacity: 1 as any },
      ]}
    >
      <Box
        className={cn(
          'p-4 rounded-lg border',
          classes.container
        )}
        style={shadowStyle}
      >
        <HStack spacing={3} alignItems="flex-start">
          {iconElement}
          
          <Box flex={1}>
            {title && (
              <Text
                weight="semibold"
                size="base"
                className="text-foreground"
              >
                {title}
              </Text>
            )}
            
            {description && (
              <Text
                size="sm"
                className="text-muted-foreground mt-0.5"
              >
                {String(description)}
              </Text>
            )}
            
            {action && (
              <AnimatedPressable
                onPress={action.onPress}
                className="mt-2"
              >
                {({ pressed }) => (
                  <Text
                    size="sm"
                    weight="medium"
                    className={cn(
                      classes.icon,
                      pressed && 'opacity-70'
                    )}
                  >
                    {action.label}
                  </Text>
                )}
              </AnimatedPressable>
            )}
          </Box>
          
          {onClose && (
            <AnimatedPressable
              onPress={handleClose}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              {({ pressed }) => (
                <Symbol
                  name="xmark"
                  size={16}
                  className={cn(
                    'text-muted-foreground',
                    pressed && 'opacity-70'
                  )}
                />
              )}
            </AnimatedPressable>
          )}
        </HStack>
      </Box>
    </Animated.View>
  );
};

// Toast Context
interface ToastContextType {
  show: (config: ToastConfig) => void;
  hide: (id?: string) => void;
  hideAll: () => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  
  return {
    ...context,
    success: (title: string, description?: string, config?: Partial<ToastConfig>) => {
      context.show({ ...config, title, description, variant: 'success' });
    },
    error: (title: string, description?: string, config?: Partial<ToastConfig>) => {
      context.show({ ...config, title, description, variant: 'error' });
    },
    warning: (title: string, description?: string, config?: Partial<ToastConfig>) => {
      context.show({ ...config, title, description, variant: 'warning' });
    },
    info: (title: string, description?: string, config?: Partial<ToastConfig>) => {
      context.show({ ...config, title, description, variant: 'info' });
    },
  };
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 3,
}) => {
  const [toasts, setToasts] = React.useState<(ToastConfig & { id: string })[]>([]);

  const show = React.useCallback((config: ToastConfig) => {
    const id = config.id || Math.random().toString(36).substr(2, 9);
    const newToast = { ...config, id };

    setToasts(prev => {
      const updated = [...prev, newToast];
      // Limit number of toasts
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });
  }, [maxToasts]);

  const hide = React.useCallback((id?: string) => {
    if (id) {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    } else {
      // Hide the oldest toast
      setToasts(prev => prev.slice(1));
    }
  }, []);

  const hideAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  const value = React.useMemo(() => ({
    show,
    hide,
    hideAll,
  }), [show, hide, hideAll]);

  const getPositionStyle = (position: ToastPosition): ViewStyle => {
    const base: ViewStyle = {
      position: 'absolute',
      zIndex: 9999,
    };

    switch (position) {
      case 'top':
        return { ...base, top: 0, left: 0, right: 0, alignItems: 'center' };
      case 'bottom':
        return { ...base, bottom: 0, left: 0, right: 0, alignItems: 'center' };
      case 'top-right':
        return { ...base, top: 0, right: 0 };
      case 'top-left':
        return { ...base, top: 0, left: 0 };
      case 'bottom-right':
        return { ...base, bottom: 0, right: 0 };
      case 'bottom-left':
        return { ...base, bottom: 0, left: 0 };
      default:
        return { ...base, bottom: 0, left: 0, right: 0, alignItems: 'center' };
    }
  };

  // Group toasts by position
  const toastsByPosition = React.useMemo(() => {
    return toasts.reduce((acc, toast) => {
      const position = toast.position || 'bottom';
      if (!acc[position]) {
        acc[position] = [];
      }
      acc[position].push(toast);
      return acc;
    }, {} as Record<ToastPosition, typeof toasts>);
  }, [toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <View
          key={position}
          style={[getPositionStyle(position as ToastPosition), { pointerEvents: 'box-none' as any }]}
        >
          {positionToasts.map(toast => (
            <Toast
              key={toast.id}
              {...toast}
              onHide={() => hide(toast.id)}
            />
          ))}
        </View>
      ))}
    </ToastContext.Provider>
  );
};

// Export Toast component
export { Toast };

