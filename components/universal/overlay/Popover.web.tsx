import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  Pressable,
  LayoutChangeEvent,
  ViewStyle,
  Platform,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { designSystem } from '@/lib/design';

export type PopoverPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'
  | 'left-start'
  | 'left-end'
  | 'right-start'
  | 'right-end';

export interface PopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: PopoverPlacement;
  showArrow?: boolean;
  dismissOnTouchOutside?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  arrowStyle?: ViewStyle;
  isLoading?: boolean;
  testID?: string;
}

interface Position {
  top: number;
  left: number;
  arrowTop?: number;
  arrowLeft?: number;
  arrowRotation?: string;
}

export const Popover = React.forwardRef<View, PopoverProps>(
  (
    {
      children,
      content,
      open: controlledOpen,
      onOpenChange,
      placement = 'bottom',
      showArrow = true,
      dismissOnTouchOutside = true,
      style,
      contentStyle,
      arrowStyle,
      isLoading = false,
      testID,
    },
    ref
  ) => {
    const theme = useTheme();
    const { spacing, componentSpacing } = useSpacing();
    const [internalOpen, setInternalOpen] = useState(false);
    const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
    const [isAnimating, setIsAnimating] = useState(false);
    const triggerRef = useRef<View>(null);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;

    const handleOpenChange = (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    };

    // Measure trigger element position
    const measureTrigger = () => {
      if (triggerRef.current) {
        triggerRef.current.measureInWindow((x, y, width, height) => {
          setTriggerLayout({ x, y, width, height });
        });
      }
    };

    useEffect(() => {
      if (isOpen) {
        measureTrigger();
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 200);
      }
    }, [isOpen]);

    // Calculate popover position
    const calculatePosition = (): Position => {
      const screenWidth = Dimensions.get('window').width;
      const screenHeight = Dimensions.get('window').height;
      const arrowSize = spacing[2]; // Use spacing token for arrow size
      
      let top = 0;
      let left = 0;
      let arrowTop = 0;
      let arrowLeft = 0;
      let arrowRotation = '0deg';

      const scaledOffset = spacing[2]; // Base offset uses spacing[2]
      const totalOffset = scaledOffset + (showArrow ? arrowSize : 0);

      switch (placement) {
        case 'top':
          top = triggerLayout.y - contentSize.height - totalOffset;
          left = triggerLayout.x + (triggerLayout.width - contentSize.width) / 2;
          arrowTop = contentSize.height - 1;
          arrowLeft = contentSize.width / 2 - arrowSize;
          arrowRotation = '180deg';
          break;
        case 'bottom':
          top = triggerLayout.y + triggerLayout.height + totalOffset;
          left = triggerLayout.x + (triggerLayout.width - contentSize.width) / 2;
          arrowTop = -arrowSize + 1;
          arrowLeft = contentSize.width / 2 - arrowSize;
          arrowRotation = '0deg';
          break;
        case 'left':
          top = triggerLayout.y + (triggerLayout.height - contentSize.height) / 2;
          left = triggerLayout.x - contentSize.width - totalOffset;
          arrowTop = contentSize.height / 2 - arrowSize;
          arrowLeft = contentSize.width - 1;
          arrowRotation = '90deg';
          break;
        case 'right':
          top = triggerLayout.y + (triggerLayout.height - contentSize.height) / 2;
          left = triggerLayout.x + triggerLayout.width + totalOffset;
          arrowTop = contentSize.height / 2 - arrowSize;
          arrowLeft = -arrowSize + 1;
          arrowRotation = '-90deg';
          break;
        case 'top-start':
          top = triggerLayout.y - contentSize.height - totalOffset;
          left = triggerLayout.x;
          arrowTop = contentSize.height - 1;
          arrowLeft = Math.min(spacing[4], contentSize.width / 2 - arrowSize);
          arrowRotation = '180deg';
          break;
        case 'top-end':
          top = triggerLayout.y - contentSize.height - totalOffset;
          left = triggerLayout.x + triggerLayout.width - contentSize.width;
          arrowTop = contentSize.height - 1;
          arrowLeft = Math.max(contentSize.width - spacing[4] - arrowSize * 2, contentSize.width / 2 - arrowSize);
          arrowRotation = '180deg';
          break;
        case 'bottom-start':
          top = triggerLayout.y + triggerLayout.height + totalOffset;
          left = triggerLayout.x;
          arrowTop = -arrowSize + 1;
          arrowLeft = Math.min(spacing[4], contentSize.width / 2 - arrowSize);
          arrowRotation = '0deg';
          break;
        case 'bottom-end':
          top = triggerLayout.y + triggerLayout.height + totalOffset;
          left = triggerLayout.x + triggerLayout.width - contentSize.width;
          arrowTop = -arrowSize + 1;
          arrowLeft = Math.max(contentSize.width - spacing[4] - arrowSize * 2, contentSize.width / 2 - arrowSize);
          arrowRotation = '0deg';
          break;
      }

      // Keep popover within screen bounds
      const padding = spacing[2];
      if (left < padding) left = padding;
      if (left + contentSize.width > screenWidth - padding) {
        left = screenWidth - contentSize.width - padding;
      }
      if (top < padding) top = padding;
      if (top + contentSize.height > screenHeight - padding) {
        top = screenHeight - contentSize.height - padding;
      }

      return { top, left, arrowTop, arrowLeft, arrowRotation };
    };

    const position = calculatePosition();

    const arrowStyles: ViewStyle = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderLeftWidth: spacing[2],
      borderRightWidth: spacing[2],
      borderBottomWidth: spacing[2],
      borderStyle: 'solid',
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: theme.popover,
      transform: [{ rotate: position.arrowRotation || '0deg' }],
      top: position.arrowTop,
      left: position.arrowLeft,
      ...arrowStyle,
    };

    const defaultContentStyle: ViewStyle = {
      position: 'absolute',
      backgroundColor: theme.popover,
      borderRadius: componentSpacing.borderRadius,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing[3] as any,
      ...designSystem.shadows.md,
      top: position.top,
      left: position.left,
      opacity: isAnimating ? 0 : 1,
      transform: [{ scale: isAnimating ? 0.95 : 1 }],
      ...contentStyle,
    };

    const trigger = React.cloneElement(children as React.ReactElement<any>, {
      ref: triggerRef,
      onPress: () => handleOpenChange(true),
      style: [
        (children as React.ReactElement<any>).props.style,
        {
          cursor: 'pointer',
        },
      ],
    } as any);

    return (
      <>
        {trigger}
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => handleOpenChange(false)}
          testID={testID}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => dismissOnTouchOutside && handleOpenChange(false)}
          >
            <Pressable
              style={defaultContentStyle}
              onLayout={(event: LayoutChangeEvent) => {
                const { width, height } = event.nativeEvent.layout;
                setContentSize({ width, height });
              }}
              onPress={(e) => e.stopPropagation()}
            >
              {showArrow && <View style={arrowStyles} />}
              {isLoading ? (
                <View style={{ padding: spacing[4] as any, alignItems: 'center' }}>
                  <ActivityIndicator size="sm" color={theme.primary} />
                </View>
              ) : (
                content
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }
);

Popover.displayName = 'Popover';

// Popover Content Components
export interface PopoverContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const PopoverContent: React.FC<PopoverContentProps> = ({ children, style }) => {
  return <View style={style}>{children}</View>;
};

PopoverContent.displayName = 'PopoverContent';

// Popover Trigger Component (for custom triggers)
export interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  onPress?: () => void;
}

export const PopoverTrigger = React.forwardRef<View, PopoverTriggerProps>(
  ({ children, asChild = true, onPress }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onPress: (e: any) => {
          (children as React.ReactElement<any>).props.onPress?.(e);
          onPress?.();
        },
      } as any);
    }

    return (
      <Pressable ref={ref} onPress={onPress}>
        {children}
      </Pressable>
    );
  }
);

PopoverTrigger.displayName = 'PopoverTrigger';