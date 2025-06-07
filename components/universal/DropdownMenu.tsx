import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Pressable,
  Modal,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from './Box';
import { VStack } from './Stack';
import { Text as UniversalText } from './Text';
import { useTheme } from '@/lib/theme/theme-provider';
import { designSystem } from '@/lib/design-system';
import { useSpacing } from '@/contexts/SpacingContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactElement;
  disabled?: boolean;
}

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number; // Deprecated - uses spacing tokens
  minWidth?: number;
  style?: any;
  isLoading?: boolean;
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
  setTriggerLayout: (layout: { x: number; y: number; width: number; height: number }) => void;
} | null>(null);

const DropdownMenuRadioContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

const useDropdownMenuContext = () => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within a DropdownMenu');
  }
  return context;
};

// Main DropdownMenu Component
export function DropdownMenu({ children }: DropdownMenuProps) {
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
  
  const contextValue = React.useMemo(() => {
    return { 
      open, 
      onOpenChange, 
      triggerLayout,
      setTriggerLayout 
    };
  }, [open, onOpenChange, triggerLayout]);
  
  return (
    <DropdownMenuContext.Provider value={contextValue}>
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
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePress = () => {
    if (disabled) return;
    
    if (Platform.OS === 'web') {
      // For web, measure relative to the viewport
      triggerRef.current?.measure((fx, fy, width, height, px, py) => {
        context.setTriggerLayout({ x: px, y: py, width, height });
        context.onOpenChange(true);
      });
    } else {
      // For native platforms
      triggerRef.current?.measureInWindow((x, y, width, height) => {
        context.setTriggerLayout({ x, y, width, height });
        context.onOpenChange(true);
      });
    }
  };
  
  if (asChild && React.isValidElement(children)) {
    const childrenWithProps = React.cloneElement(children as any, {
      ref: triggerRef,
      onPress: (e: any) => {
        handlePress();
        // Call original onPress if it exists
        const originalOnPress = (children as any).props?.onPress;
        if (originalOnPress) {
          originalOnPress(e);
        }
      },
      disabled,
    });
    return childrenWithProps;
  }
  
  return (
    <Pressable
      ref={triggerRef}
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : (pressed || isPressed ? 0.7 : 1),
        ...(Platform.OS === 'web' && {
          cursor: disabled ? 'not-allowed' : 'pointer',
          transform: isHovered && !disabled ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.2s ease',
        } as any),
      })}
      {...(Platform.OS === 'web' && {
        onHoverIn: () => !disabled && setIsHovered(true),
        onHoverOut: () => setIsHovered(false),
        onPressIn: () => !disabled && setIsPressed(true),
        onPressOut: () => setIsPressed(false),
      })}
    >
      {children}
    </Pressable>
  );
}

// DropdownMenu Portal
export function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// DropdownMenu Content
export function DropdownMenuContent({
  children,
  align = 'start',
  side = 'bottom',
  sideOffset: unusedSideOffset,
  minWidth = 200,
  style,
  isLoading = false,
}: DropdownMenuContentProps) {
  const { open, onOpenChange, triggerLayout } = useDropdownMenuContext();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open]);
  
  if (!triggerLayout) return null;
  
  // Calculate position
  let left = triggerLayout.x;
  const actualOffset = spacing[2]; // Use spacing token instead of prop
  let top = triggerLayout.y + triggerLayout.height + actualOffset;
  
  // Align adjustments
  if (align === 'center') {
    left = triggerLayout.x + (triggerLayout.width / 2) - (minWidth / 2);
  } else if (align === 'end') {
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
          <Animated.View
            style={{
              position: 'absolute',
              left,
              top,
              minWidth,
              backgroundColor: theme.popover,
              borderRadius: designSystem.borderRadius.md,
              borderWidth: 1,
              borderColor: theme.border,
              ...designSystem.shadows.md,
              padding: spacing[1],
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              ...style,
            }}
          >
            {isLoading ? (
              <View style={{ padding: spacing[4], alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 300 }}
              >
                {children}
              </ScrollView>
            )}
          </Animated.View>
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
  const { onOpenChange } = useDropdownMenuContext();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
      onOpenChange(false);
    }
  };
  
  // Web-specific event handlers following Button pattern
  const webHandlers = Platform.OS === 'web' ? {
    onHoverIn: () => !disabled && setIsHovered(true),
    onHoverOut: () => setIsHovered(false),
    onPressIn: () => !disabled && setIsPressed(true),
    onPressOut: () => setIsPressed(false),
  } : {};
  
  // Calculate background color matching shadcn patterns
  const getBackgroundColor = () => {
    if (disabled) return 'transparent';
    if (isPressed || isHovered) return theme.accent; // Use accent color for hover/press
    return 'transparent';
  };
  
  const itemStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2] * 0.75, // 75% of spacing[2]
    borderRadius: designSystem.borderRadius.sm,
    backgroundColor: getBackgroundColor(),
    opacity: disabled ? 0.5 : 1,
    // Web-specific styles
    ...(Platform.OS === 'web' && {
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.15s ease',
      userSelect: 'none',
    } as any),
  };
  
  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={itemStyle}
      {...webHandlers}
    >
      {icon && (
        <Box mr={2}>
          {icon}
        </Box>
      )}
      
      <UniversalText
        size="sm"
        style={{ 
          flex: 1,
          color: destructive 
            ? theme.destructive 
            : (isHovered || isPressed ? theme.accentForeground : theme.foreground)
        }}
      >
        {children}
      </UniversalText>
      
      {shortcut && (
        <UniversalText
          size="xs"
          colorTheme="mutedForeground"
          style={{ marginLeft: spacing[4] }}
        >
          {shortcut}
        </UniversalText>
      )}
    </Pressable>
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
  const theme = useTheme();
  const { spacing } = useSpacing();
  
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
        <Box 
          width={16} 
          height={16} 
          alignItems="center" 
          justifyContent="center"
          style={{
            borderWidth: 2,
            borderColor: checked ? theme.primary : theme.border,
            borderRadius: spacing[1],
            backgroundColor: checked ? theme.primary : 'transparent',
            ...(Platform.OS === 'web' && {
              transition: 'all 0.2s ease',
              transform: checked ? 'scale(1.05)' : 'scale(1)',
            } as any),
          }}
        >
          {checked && (
            <Ionicons
              name="checkmark"
              size={12}
              color={theme.primaryForeground || theme.background}
              style={Platform.OS === 'web' ? {
                animation: 'checkmark-appear 0.2s ease',
              } as any : {}}
            />
          )}
        </Box>
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
  const theme = useTheme();
  const { spacing } = useSpacing();
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
        <Box 
          width={16} 
          height={16} 
          alignItems="center" 
          justifyContent="center"
          style={Platform.OS === 'web' ? {
            transition: 'transform 0.2s ease',
            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
          } as any : {}}
        >
          <View
            style={{
              width: spacing[2],
              height: spacing[2],
              borderRadius: spacing[1],
              backgroundColor: isSelected ? theme.foreground : 'transparent',
              borderWidth: isSelected ? 0 : 2,
              borderColor: theme.border,
              ...(Platform.OS === 'web' && {
                transition: 'all 0.2s ease',
              } as any),
            }}
          />
        </Box>
      }
    >
      {children}
    </DropdownMenuItem>
  );
}

// DropdownMenu Label
export function DropdownMenuLabel({ children }: DropdownMenuLabelProps) {
  const { spacing } = useSpacing();
  
  return (
    <Box px={2} py={1.5}>
      <UniversalText
        size="xs"
        weight="semibold"
        colorTheme="mutedForeground"
      >
        {children}
      </UniversalText>
    </Box>
  );
}

// DropdownMenu Separator
export function DropdownMenuSeparator({ style }: DropdownMenuSeparatorProps) {
  const theme = useTheme();
  const { spacing } = useSpacing();
  
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: theme.border,
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
  return <VStack spacing={0}>{children}</VStack>;
}

// DropdownMenu Sub (not implemented for mobile)
export const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => {
  console.warn('DropdownMenuSub is not supported on mobile platforms');
  return null;
};

export const DropdownMenuSubTrigger = DropdownMenuItem;
export const DropdownMenuSubContent = DropdownMenuContent;

// DropdownMenu Shortcut (convenience component)
export function DropdownMenuShortcut({ children }: { children: React.ReactNode }) {
  return (
    <UniversalText size="xs" colorTheme="mutedForeground">
      {children}
    </UniversalText>
  );
}