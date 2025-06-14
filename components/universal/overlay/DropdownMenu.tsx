import { useSpacing } from '@/lib/stores/spacing-store';
import { SpacingScale } from '@/lib/design';
import { useAnimationStore } from "@/lib/stores/animation-store";
import { haptic } from "@/lib/ui/haptics";
import { Symbol } from '@/components/universal/display/Symbols';
import { cn } from '@/lib/core/utils';
import { useTheme } from '@/lib/theme/provider';
import { log } from '@/lib/core/debug/logger';
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Box } from "@/components/universal/layout/Box";
import { VStack } from "@/components/universal/layout/Stack";
import { Text as UniversalText } from "@/components/universal/typography/Text";
// Import Reanimated properly
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export type DropdownMenuAnimationType = 'scale' | 'fade' | 'slide' | 'none';

export interface DropdownMenuProps {
  children: React.ReactNode;
  
  // Animation props
  animated?: boolean;
  animationType?: DropdownMenuAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
}

export interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactElement;
  disabled?: boolean;
}

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  minWidth?: number;
  className?: string;
  
  // Animation props (can override parent props)
  animated?: boolean;
  animationType?: DropdownMenuAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
}

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
  shortcut?: string;
}

export interface DropdownMenuCheckboxItemProps extends DropdownMenuItemProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export interface DropdownMenuRadioItemProps extends DropdownMenuItemProps {
  value: string;
}

export interface DropdownMenuLabelProps {
  children: React.ReactNode;
}

export interface DropdownMenuSeparatorProps {
  style?: any;
}

export interface DropdownMenuShortcutProps {
  children: React.ReactNode;
}

export interface DropdownMenuGroupProps {
  children: React.ReactNode;
}

export interface DropdownMenuRadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

// Dropdown Context
const DropdownMenuContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLayout: { x: number; y: number; width: number; height: number } | null;
  setTriggerLayout: (layout: { x: number; y: number; width: number; height: number } | null) => void;
  animated?: boolean;
  animationType?: DropdownMenuAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
} | null>(null);

const DropdownMenuRadioContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

const useDropdownMenuContext = () => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error(
      "DropdownMenu components must be used within a DropdownMenu"
    );
  }
  return context;
};

// Main DropdownMenu Component
export function DropdownMenu({ 
  children,
  animated = true,
  animationType = 'scale',
  animationDuration,
  useHaptics = true,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const onOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset trigger layout when closing
      setTimeout(() => setTriggerLayout(null), 300);
    }
  };

  const updateTriggerLayout = (layout: { x: number; y: number; width: number; height: number } | null) => {
    setTriggerLayout(layout);
  };

  return (
    <DropdownMenuContext.Provider value={{ 
      open, 
      onOpenChange, 
      triggerLayout, 
      setTriggerLayout: updateTriggerLayout,
      animated,
      animationType,
      animationDuration,
      useHaptics,
    }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

// DropdownMenu Trigger
export function DropdownMenuTrigger({
  asChild,
  children,
  disabled,
}: DropdownMenuTriggerProps) {
  const context = useDropdownMenuContext();
  const triggerRef = useRef<View>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handlePress = () => {
    if (disabled) return;
    
    // Haptic feedback
    if (context.useHaptics && Platform.OS !== 'web') {
      haptic('selection');
    }

    triggerRef.current?.measureInWindow((x, y, width, height) => {
      // Update trigger layout through context method
      context.setTriggerLayout({ x, y, width, height });
      context.onOpenChange(true);
    });
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onPress: handlePress,
      disabled,
      onPointerEnter: Platform.OS === 'web' && !disabled ? () => setIsHovered(true) : undefined,
      onPointerLeave: Platform.OS === 'web' && !disabled ? () => setIsHovered(false) : undefined,
      style: ({ pressed }: any) => [
        typeof (children as any).props.style === 'function' 
          ? (children as any).props.style({ pressed }) 
          : (children as any).props.style,
        (pressed || isHovered) && !disabled && {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        },
      ] as any,
    } as any);
  }

  return (
    <Pressable
      ref={triggerRef}
      onPress={handlePress}
      disabled={disabled}
      onPointerEnter={Platform.OS === 'web' && !disabled ? () => setIsHovered(true) : undefined}
      onPointerLeave={Platform.OS === 'web' && !disabled ? () => setIsHovered(false) : undefined}
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        backgroundColor: pressed || isHovered ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
        borderRadius: 4,
        ...(Platform.OS === 'web' && {
          transition: 'all 0.15s ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
        } as any),
      })}
    >
      {children}
    </Pressable>
  );
}

// DropdownMenu Portal
export function DropdownMenuPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

const AnimatedView = ReAnimated.createAnimatedComponent(View);
const AnimatedScrollView = ReAnimated.createAnimatedComponent(ScrollView);

// Helper components to avoid hooks in conditional rendering
const CheckboxIcon = ({ checked }: { checked: boolean }) => {
  return (
    <Box width={16} height={16} alignItems="center" justifyContent="center">
      {checked && (
        <Symbol
          name="checkmark"
          size={14}
          color="#000000"
        />
      )}
    </Box>
  );
};

const RadioIcon = ({ selected }: { selected: boolean }) => {
  return (
    <Box width={16} height={16} alignItems="center" justifyContent="center">
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: selected ? "#000000" : "transparent",
        }}
      />
    </Box>
  );
};

// DropdownMenuItemWrapper - Component for animating individual menu items with stagger
const DropdownMenuItemWrapper = ({ 
  children, 
  index, 
  animated, 
  shouldAnimate, 
  duration 
}: {
  children: React.ReactNode;
  index: number;
  animated: boolean;
  shouldAnimate: () => boolean;
  duration: number;
}) => {
  const itemOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (animated && shouldAnimate()) {
      itemOpacity.value = withDelay(
        index * 50, // Stagger delay
        withTiming(1, { duration })
      );
    } else {
      itemOpacity.value = 1;
    }
  }, [animated, shouldAnimate, index, duration, itemOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: itemOpacity.value,
  }));

  if (!animated || !shouldAnimate()) {
    return <>{children}</>;
  }

  return (
    <AnimatedView style={animatedStyle}>
      {children}
    </AnimatedView>
  );
};

// DropdownMenu Content
export function DropdownMenuContent({
  children,
  align = "start",
  sideOffset = 8,
  minWidth = 200,
  className,
  animated: propsAnimated,
  animationType: propsAnimationType,
  animationDuration,
  useHaptics: propsUseHaptics,
}: DropdownMenuContentProps) {
  const contextValues = useDropdownMenuContext();
  const { open, onOpenChange, triggerLayout } = contextValues;
  
  // Use props if provided, otherwise fall back to context
  const animated = propsAnimated ?? contextValues.animated ?? true;
  const animationType = propsAnimationType ?? contextValues.animationType ?? 'scale';
  const useHaptics = propsUseHaptics ?? contextValues.useHaptics ?? true;
  
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  
  // Default animation config
  const duration = animationDuration ?? 200;
  const springConfig = {
    damping: 15,
    stiffness: 300,
  };
  
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(animationType === 'scale' ? 0.9 : 1);
  const translateY = useSharedValue(animationType === 'slide' ? -10 : 0);
  
  // Track items for stagger animation

  useEffect(() => {
    if (open && animated && shouldAnimate()) {
      // Haptic feedback when menu opens
      if (useHaptics && Platform.OS !== 'web') {
        haptic('selection');
      }
      
      if (animationType === 'scale') {
        opacity.value = withTiming(1, { duration });
        scale.value = withSpring(1, springConfig);
      } else if (animationType === 'fade') {
        opacity.value = withTiming(1, { duration });
      } else if (animationType === 'slide') {
        opacity.value = withTiming(1, { duration });
        translateY.value = withSpring(0, springConfig);
      }
    } else if (open) {
      opacity.value = 1;
      scale.value = 1;
      translateY.value = 0;
    } else {
      opacity.value = 0;
      if (animationType === 'scale') scale.value = 0.9;
      if (animationType === 'slide') translateY.value = -10;
    }
  }, [open, animated, shouldAnimate, animationType, duration, springConfig, useHaptics, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle: any = {
      opacity: opacity.value,
    };
    
    if (animationType === 'scale') {
      baseStyle.transform = [
        { scale: scale.value },
        { translateY: translateY.value },
      ];
    } else if (animationType === 'slide') {
      baseStyle.transform = [
        { translateY: translateY.value },
      ];
    }
    
    return baseStyle;
  });
  
  // Get transform origin for web animations
  const getTransformOrigin = () => {
    switch (align) {
      case 'center':
        return 'top center';
      case 'end':
        return 'top right';
      default:
        return 'top left';
    }
  };

  if (!triggerLayout) return null;

  // Calculate position
  let left = triggerLayout.x;
  let top = triggerLayout.y + triggerLayout.height + sideOffset;

  // Align adjustments
  if (align === "center") {
    left = triggerLayout.x + triggerLayout.width / 2 - minWidth / 2;
  } else if (align === "end") {
    left = triggerLayout.x + triggerLayout.width - minWidth;
  }

  // Ensure menu stays within screen bounds
  const maxLeft = screenWidth - minWidth - spacing[4];
  const maxTop = screenHeight - 300; // Approximate max height

  left = Math.max(spacing[4], Math.min(left, maxLeft));
  top = Math.min(top, maxTop);

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={() => onOpenChange(false)}
    >
      <TouchableWithoutFeedback onPress={() => onOpenChange(false)}>
        <View style={{ flex: 1 }}>
          <AnimatedView
            className={cn(
              'bg-popover border border-border rounded-lg shadow-md',
              className
            )}
            style={[
              {
                position: "absolute",
                left,
                top,
                minWidth,
                padding: spacing[1],
              },
              animated && shouldAnimate() && animationType !== 'none' 
                ? animatedStyle 
                : { opacity: 1 },
              Platform.OS === 'web' && animated && shouldAnimate() && {
                transition: 'all 0.2s ease',
                transformOrigin: getTransformOrigin(),
              } as any,
            ]}
          >
            <AnimatedScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 300 }}
            >
              {React.Children.map(children, (child, index) => (
                <DropdownMenuItemWrapper
                  key={index}
                  index={index}
                  animated={animated}
                  shouldAnimate={shouldAnimate}
                  duration={duration}
                >
                  {child}
                </DropdownMenuItemWrapper>
              ))}
            </AnimatedScrollView>
          </AnimatedView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// DropdownMenu Item
export function DropdownMenuItem({
  children,
  onPress,
  disabled,
  destructive,
  icon,
  shortcut,
}: DropdownMenuItemProps) {
  const context = useDropdownMenuContext();
  const { onOpenChange } = context;
  const { spacing } = useSpacing();
  const [isHovered, setIsHovered] = useState(false);

  const handlePress = () => {
    if (!disabled && onPress) {
      // Haptic feedback for menu item selection
      if (context.useHaptics && Platform.OS !== 'web') {
        haptic('light');
      }
      
      onPress();
      onOpenChange(false);
    }
  };

  const AnimatedPressable = ReAnimated.createAnimatedComponent(Pressable);
  const itemScale = useSharedValue(1);
  
  const handlePressIn = () => {
    itemScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };
  
  const handlePressOut = () => {
    itemScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };
  
  const animatedItemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: itemScale.value }] as any,
  }));
  
  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      onPointerEnter={Platform.OS === 'web' && !disabled ? () => setIsHovered(true) : undefined}
      onPointerLeave={Platform.OS === 'web' && !disabled ? () => setIsHovered(false) : undefined}
      style={[
        ({ pressed }: any) => ({
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing[2],
          paddingVertical: spacing[1.5],
          borderRadius: 4,
          backgroundColor: pressed || isHovered ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          ...(Platform.OS === 'web' && {
            transition: 'backgroundColor 0.15s ease',
            cursor: disabled ? 'not-allowed' : 'pointer',
          } as any),
        }),
        animatedItemStyle,
      ]}
    >
      {icon && <Box mr={2}>{icon}</Box>}

      <UniversalText
        size="sm"
        className={destructive ? "text-destructive" : "text-popover-foreground"}
        style={{ flex: 1 }}
      >
        {children}
      </UniversalText>

      {shortcut && (
        <UniversalText
          size="xs"
          className="text-muted-foreground"
          style={{ marginLeft: spacing[4] }}
        >
          {shortcut}
        </UniversalText>
      )}
    </AnimatedPressable>
  );
}

// DropdownMenu Checkbox Item
export function DropdownMenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
  disabled,
  ...props
}: DropdownMenuCheckboxItemProps) {
  const handlePress = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
    props.onPress?.();
  };

  return (
    <DropdownMenuItem
      {...props}
      onPress={handlePress}
      disabled={disabled}
      icon={
        <CheckboxIcon checked={checked} />
      }
    >
      {children}
    </DropdownMenuItem>
  );
}

// DropdownMenu Radio Group
export function DropdownMenuRadioGroup({
  value,
  onValueChange,
  children,
}: DropdownMenuRadioGroupProps) {
  return (
    <DropdownMenuRadioContext.Provider value={{ value, onValueChange }}>
      {children}
    </DropdownMenuRadioContext.Provider>
  );
}

// DropdownMenu Radio Item
export function DropdownMenuRadioItem({
  children,
  value,
  disabled,
  ...props
}: DropdownMenuRadioItemProps) {
  const radioContext = React.useContext(DropdownMenuRadioContext);
  const isSelected = radioContext?.value === value;

  const handlePress = () => {
    if (!disabled && radioContext?.onValueChange) {
      radioContext.onValueChange(value);
    }
    props.onPress?.();
  };

  return (
    <DropdownMenuItem
      {...props}
      onPress={handlePress}
      disabled={disabled}
      icon={
        <RadioIcon selected={isSelected} />
      }
    >
      {children}
    </DropdownMenuItem>
  );
}

// DropdownMenu Label
export function DropdownMenuLabel({ children }: DropdownMenuLabelProps) {
  return (
    <Box px={2 as SpacingScale} py={1.5}>
      <UniversalText size="xs" weight="semibold" className="text-muted-foreground">
        {children}
      </UniversalText>
    </Box>
  );
}

// DropdownMenu Separator
export function DropdownMenuSeparator({ style }: DropdownMenuSeparatorProps) {
  const { spacing } = useSpacing();

  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          marginVertical: spacing[1],
          marginHorizontal: -spacing[1],
        },
        style,
      ]}
    />
  );
}

// DropdownMenu Group
export function DropdownMenuGroup({ children }: DropdownMenuGroupProps) {
  return <VStack gap={0}>{children}</VStack>;
}

// DropdownMenu Sub (not implemented for mobile)
export const DropdownMenuSub = (_: {
  children: React.ReactNode;
}) => {
  log.warn('DropdownMenuSub is not supported on mobile platforms', 'DROPDOWN');
  return null;
};

export const DropdownMenuSubTrigger = DropdownMenuItem;
export const DropdownMenuSubContent = DropdownMenuContent;

// DropdownMenu Shortcut (convenience component)
export function DropdownMenuShortcut(props: DropdownMenuShortcutProps) {
  return (
    <UniversalText size="xs" className="text-muted-foreground">
      {props.children}
    </UniversalText>
  );
}
