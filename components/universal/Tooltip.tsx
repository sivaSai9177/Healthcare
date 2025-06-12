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
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { AnimationVariant } from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { Text } from './Text';
import { useBreakpoint } from '@/hooks/responsive';

export type TooltipAnimationType = 'fade' | 'scale' | 'slide' | 'none';

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
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: TooltipAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

interface TooltipPosition {
  top: number;
  left: number;
}

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
  animated = true,
  animationVariant = 'subtle',
  animationType = 'fade',
  animationDuration,
  useHaptics = false,
  animationConfig,
}) => {
  const theme = useTheme();
  const { spacing, componentSpacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
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
    if (visible && animated && isAnimated && shouldAnimate() && animationType !== 'none') {
      if (animationType === 'fade') {
        opacity.value = withTiming(1, { duration: config.duration.fast });
      } else if (animationType === 'scale') {
        opacity.value = withTiming(1, { duration: config.duration.fast });
        scale.value = withSpring(1, config.spring);
      } else if (animationType === 'slide') {
        opacity.value = withTiming(1, { duration: config.duration.fast });
        translateY.value = withSpring(0, config.spring);
      }
    } else if (!visible) {
      opacity.value = withTiming(0, { duration: config.duration.fast });
      if (animationType === 'scale') {
        scale.value = withTiming(0.9, { duration: config.duration.fast });
      }
      if (animationType === 'slide') {
        translateY.value = withTiming(-10, { duration: config.duration.fast });
      }
    } else {
      // No animation
      opacity.value = visible ? 1 : 0;
      scale.value = 1;
      translateY.value = 0;
    }
  }, [visible, animated, isAnimated, shouldAnimate, animationType, config]);
  
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
          colorTheme="foreground"
          style={{ color: theme.popoverForeground }}
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
            style={[
              {
                position: 'absolute',
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                maxWidth,
                backgroundColor: theme.popover,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: componentSpacing.borderRadius.md,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[2],
                ...Platform.select({
                  ios: {
                    shadowColor: 'theme.foreground',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                  },
                  android: {
                    elevation: 5,
                  },
                  default: {
                    boxShadow: '0px 2px 4px theme.mutedForeground + "40"',
                  },
                }),
              },
              animated && isAnimated && shouldAnimate() && animationType !== 'none'
                ? animatedStyle
                : { opacity: 1 },
              Platform.OS === 'web' && animated && isAnimated && shouldAnimate() && {
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