import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text as RNText,
  Pressable,
  Modal,
  Platform,
  LayoutChangeEvent,
  ScaledSize,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { Text } from '@/components/universal/typography/Text';
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';

export type TooltipAnimationType = 'fade' | 'scale' | 'slide' | 'bounce' | 'none';

export interface TooltipProps {
  // Content
  children: React.ReactNode;
  content: string | React.ReactNode;
  
  // Positioning
  position?: 'top' | 'bottom' | 'left' | 'right';
  side?: 'top' | 'bottom' | 'left' | 'right'; // Alias for position
  align?: 'start' | 'center' | 'end';
  offset?: number;
  
  // Behavior
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
  disabled?: boolean;
  
  // Styling
  sideOffset?: number;
  maxWidth?: number;
  className?: string;
  variant?: 'default' | 'dark' | 'light';
  
  // Animation props
  animated?: boolean;
  animationType?: TooltipAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  showArrow?: boolean;
}

interface TooltipPosition {
  top: number;
  left: number;
}

// Variant styles
const variantStyles = {
  default: 'bg-popover text-popover-foreground border-border',
  dark: 'bg-gray-900 text-white border-gray-800',
  light: 'bg-white text-gray-900 border-gray-200',
};

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  side,
  align = 'center',
  offset = 8,
  delayDuration = 700,
  skipDelayDuration = 300,
  disableHoverableContent = false,
  disabled = false,
  sideOffset = 0,
  maxWidth = 250,
  className,
  variant = 'default',
  animated = true,
  animationType = 'fade',
  animationDuration = 200,
  useHaptics = false,
  showArrow = true,
}) => {
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const shadowStyle = useShadow('md');
  const [visible, setVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });
  const triggerRef = useRef<View>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const skipDelayRef = useRef(false);
  
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(animationType === 'scale' ? 0.9 : 1);
  const translateY = useSharedValue(animationType === 'slide' ? -10 : 0);
  
  // Spring config
  const springConfig = {
    damping: 15,
    stiffness: 200,
  };
  
  // Web-specific hover handling
  const isWeb = Platform.OS === 'web';
  
  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle: any = {
      opacity: opacity.value,
    };
    
    if (animationType === 'scale') {
      baseStyle.transform = [{ scale: scale.value }];
    } else if (animationType === 'slide') {
      const placement = side || position;
      switch (placement) {
        case 'top':
          baseStyle.transform = [{ translateY: translateY.value }];
          break;
        case 'bottom':
          baseStyle.transform = [{ translateY: -translateY.value }];
          break;
        case 'left':
          baseStyle.transform = [{ translateX: translateY.value }];
          break;
        case 'right':
          baseStyle.transform = [{ translateX: -translateY.value }];
          break;
      }
    }
    
    return baseStyle;
  });
  
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    
    triggerRef.current.measure((x, y, width, height, pageX, pageY) => {
      const screen: ScaledSize = Dimensions.get('window');
      let top = 0;
      let left = 0;
      
      // Use side prop if provided, otherwise fall back to position
      const placement = side || position;
      
      // Calculate position based on placement
      switch (placement) {
        case 'top':
          top = pageY - tooltipSize.height - offset - sideOffset;
          break;
        case 'bottom':
          top = pageY + height + offset + sideOffset;
          break;
        case 'left':
          left = pageX - tooltipSize.width - offset - sideOffset;
          top = pageY + (height - tooltipSize.height) / 2;
          break;
        case 'right':
          left = pageX + width + offset + sideOffset;
          top = pageY + (height - tooltipSize.height) / 2;
          break;
      }
      
      // Calculate horizontal position for top/bottom
      if (position === 'top' || position === 'bottom') {
        switch (align) {
          case 'start':
            left = pageX;
            break;
          case 'center':
            left = pageX + (width - tooltipSize.width) / 2;
            break;
          case 'end':
            left = pageX + width - tooltipSize.width;
            break;
        }
      }
      
      // Ensure tooltip stays within screen bounds
      left = Math.max(8, Math.min(left, screen.width - tooltipSize.width - 8));
      top = Math.max(8, Math.min(top, screen.height - tooltipSize.height - 8));
      
      setTooltipPosition({ top, left });
    });
  }, [position, align, offset, sideOffset, tooltipSize]);
  
  const showTooltip = useCallback(() => {
    if (disabled) return;
    
    const delay = skipDelayRef.current ? skipDelayDuration : delayDuration;
    
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
      skipDelayRef.current = true;
      
      // Haptic feedback when tooltip appears
      if (useHaptics && Platform.OS !== 'web') {
        haptic('selection');
      }
      
      // Reset skip delay after a period of inactivity
      setTimeout(() => {
        skipDelayRef.current = false;
      }, 1500);
    }, delay);
  }, [disabled, delayDuration, skipDelayDuration, useHaptics]);
  
  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  }, []);
  
  const onTooltipLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setTooltipSize({ width, height });
  }, []);
  
  // Update position when tooltip size changes
  React.useEffect(() => {
    if (visible && tooltipSize.width > 0 && tooltipSize.height > 0) {
      calculatePosition();
    }
  }, [visible, tooltipSize, calculatePosition]);
  
  // Animate tooltip visibility
  React.useEffect(() => {
    if (visible && animated && shouldAnimate() && animationType !== 'none') {
      if (animationType === 'fade') {
        opacity.value = withTiming(1, { duration: animationDuration });
      } else if (animationType === 'scale') {
        opacity.value = withTiming(1, { duration: animationDuration });
        scale.value = withSpring(1, springConfig);
      } else if (animationType === 'slide') {
        opacity.value = withTiming(1, { duration: animationDuration });
        translateY.value = withSpring(0, springConfig);
      } else if (animationType === 'bounce') {
        opacity.value = withTiming(1, { duration: animationDuration });
        scale.value = withSequence(
          withSpring(1.1, { ...springConfig, damping: 10 }),
          withSpring(1, springConfig)
        );
      }
    } else if (!visible) {
      opacity.value = withTiming(0, { duration: animationDuration });
      if (animationType === 'scale') {
        scale.value = withTiming(0.9, { duration: animationDuration });
      }
      if (animationType === 'slide') {
        translateY.value = withTiming(-10, { duration: animationDuration });
      }
    } else {
      // No animation
      opacity.value = visible ? 1 : 0;
      scale.value = 1;
      translateY.value = 0;
    }
  }, [visible, animated, shouldAnimate, animationType, animationDuration]);
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Get transform origin for web animations
  const getTransformOrigin = () => {
    const placement = side || position;
    switch (placement) {
      case 'top':
        return 'bottom center';
      case 'bottom':
        return 'top center';
      case 'left':
        return 'right center';
      case 'right':
        return 'left center';
      default:
        return 'center';
    }
  };
  
  const renderContent = () => {
    if (typeof content === 'string') {
      return (
        <Text
          size="sm"
          className={variant === 'dark' ? 'text-white' : variant === 'light' ? 'text-gray-900' : 'text-popover-foreground'}
        >
          {content}
        </Text>
      );
    }
    return content;
  };
  
  return (
    <>
      <Pressable
        ref={triggerRef}
        onPressIn={isWeb ? undefined : showTooltip}
        onPressOut={isWeb ? undefined : hideTooltip}
        onHoverIn={isWeb ? showTooltip : undefined}
        onHoverOut={isWeb ? hideTooltip : undefined}
      >
        {children}
      </Pressable>
      
      {visible && (
        <Modal
          transparent
          visible={visible}
          animationType="none"
          statusBarTranslucent
          pointerEvents="none"
        >
          <Animated.View
            className={cn(
              'absolute border rounded-md px-3 py-2',
              variantStyles[variant],
              className
            )}
            style={[
              {
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                maxWidth,
              },
              shadowStyle,
              animated && shouldAnimate() && animationType !== 'none'
                ? animatedStyle
                : { opacity: 1 },
              Platform.OS === 'web' && animated && shouldAnimate() && {
                transition: 'all 0.2s ease',
                transformOrigin: getTransformOrigin(),
              } as any,
            ]}
            onLayout={onTooltipLayout}
          >
            {renderContent()}
          </Animated.View>
        </Modal>
      )}
    </>
  );
};

// Convenience components for common use cases
export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In the future, this could provide shared context for tooltip delays
  return <>{children}</>;
};

export const TooltipTrigger = Pressable;
export const TooltipContent = View;