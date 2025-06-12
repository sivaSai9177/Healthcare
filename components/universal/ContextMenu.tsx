import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Platform,
  ViewStyle,
  TextStyle,
  Dimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInDown,
} from 'react-native-reanimated';
import { Symbol } from './Symbols';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Card } from './Card';
import { 
  AnimationVariant,
  getAnimationConfig,
  SpacingScale,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

const AnimatedView = Animated.View;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

export type ContextMenuAnimationType = 'scale' | 'fade' | 'slide' | 'none';

export interface ContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
  disabled?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  style?: ViewStyle;
  menuStyle?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: ContextMenuAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ContextMenu = React.forwardRef<View, ContextMenuProps>(
  (
    {
      children,
      items,
      disabled = false,
      onOpen,
      onClose,
      style,
      menuStyle,
      testID,
      animated = true,
      animationVariant = 'moderate',
      animationType = 'scale',
      animationDuration,
      useHaptics = true,
      animationConfig,
    },
    ref
  ) => {
    const theme = useTheme();
    const { spacing } = useSpacing();
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
    const triggerRef = useRef<View>(null);
    const { shouldAnimate } = useAnimationStore();
    const { config, isAnimated } = useAnimationVariant({
      variant: animationVariant,
      overrides: animationConfig,
    });
    
    // Animation values
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(10);

    // Open menu animation
    useEffect(() => {
      if (isOpen && animated && isAnimated && shouldAnimate() && animationType !== 'none') {
        if (animationType === 'scale') {
          scale.value = withSpring(1, config.spring);
          opacity.value = withTiming(1, { duration: config.duration.fast });
        } else if (animationType === 'fade') {
          scale.value = 1;
          opacity.value = withTiming(1, { duration: config.duration.normal });
        } else if (animationType === 'slide') {
          scale.value = 1;
          opacity.value = withTiming(1, { duration: config.duration.fast });
          translateY.value = withSpring(0, config.spring);
        }
      } else if (!isOpen) {
        scale.value = 0;
        opacity.value = 0;
        translateY.value = 10;
      }
    }, [isOpen, animated, isAnimated, shouldAnimate, animationType, config]);

    const handleLongPress = useCallback(() => {
      if (disabled) return;

      // Haptic feedback
      if (useHaptics && Platform.OS !== 'web') {
        haptics.impact('light');
      }

      triggerRef.current?.measure((x, y, width, height, pageX, pageY) => {
        // Calculate menu position
        let menuX = pageX;
        let menuY = pageY + height + spacing[2];

        // Adjust if menu would go off screen
        const menuWidth = 200;
        const menuHeight = items.length * 48 + spacing[2] * 2;

        if (menuX + menuWidth > SCREEN_WIDTH) {
          menuX = SCREEN_WIDTH - menuWidth - spacing[2];
        }

        if (menuY + menuHeight > SCREEN_HEIGHT) {
          menuY = pageY - menuHeight - spacing[2];
        }

        setMenuPosition({ x: menuX, y: menuY });
        setIsOpen(true);
        onOpen?.();
      });
    }, [disabled, items.length, spacing, onOpen, useHaptics]);

    const handleClose = useCallback(() => {
      setIsOpen(false);
      setSubmenuOpen(null);
      onClose?.();
    }, [onClose]);

    const handleItemSelect = useCallback((item: ContextMenuItem) => {
      if (item.disabled || item.separator) return;
      
      // Haptic feedback
      if (useHaptics && Platform.OS !== 'web') {
        haptic('selection');
      }
      
      if (item.submenu) {
        setSubmenuOpen(item.key);
      } else {
        item.onSelect();
        handleClose();
      }
    }, [handleClose, useHaptics]);

    const renderMenuItem = (item: ContextMenuItem, index: number) => {
      if (item.separator) {
        return (
          <View
            key={`${item.key}-${index}`}
            style={{
              height: 1,
              backgroundColor: theme.border,
              marginVertical: spacing[1],
            }}
          />
        );
      }

      const isSubmenuOpen = submenuOpen === item.key;
      const hasSubmenu = item.submenu && item.submenu.length > 0;

      // Create animated menu item component
      const AnimatedMenuItem = () => {
        const itemOpacity = useSharedValue(0);
        const itemTranslateX = useSharedValue(-20);
        const itemScale = useSharedValue(1);
        
        // Stagger animation on mount
        useEffect(() => {
          if (animated && isAnimated && shouldAnimate() && animationType !== 'none') {
            const delay = index * 50; // 50ms stagger
            itemOpacity.value = withDelay(delay, withTiming(1, { duration: config.duration.fast }));
            itemTranslateX.value = withDelay(delay, withSpring(0, config.spring));
          } else {
            itemOpacity.value = 1;
            itemTranslateX.value = 0;
          }
        }, []);
        
        const handlePressIn = () => {
          if (animated && isAnimated && shouldAnimate()) {
            itemScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
          }
        };
        
        const handlePressOut = () => {
          if (animated && isAnimated && shouldAnimate()) {
            itemScale.value = withSpring(1, config.spring);
          }
        };
        
        const animatedStyle = useAnimatedStyle(() => ({
          opacity: itemOpacity.value,
          transform: [
            { translateX: itemTranslateX.value },
            { scale: itemScale.value },
          ] as any,
        }));
        
        return (
          <AnimatedPressable
            onPress={() => handleItemSelect(item)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={item.disabled}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing[3],
                paddingHorizontal: spacing[4],
                opacity: item.disabled ? 0.5 : 1,
                backgroundColor: isSubmenuOpen ? theme.accent : 'transparent',
              },
              animated && isAnimated && shouldAnimate() && animationType !== 'none' ? animatedStyle : {},
              Platform.OS === 'web' && animated && isAnimated && shouldAnimate() && {
                transition: 'all 0.2s ease',
              } as any,
            ]}
          >
            {item.icon && (
              <Symbol
                name="item.icon as any"
                size={18}
                color={
                  item.destructive
                    ? theme.destructive
                    : item.disabled
                    ? theme.mutedForeground
                    : theme.foreground
                }
                style={{ marginRight: spacing[3] }}
              />
            )}
            
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                color: item.destructive
                  ? theme.destructive
                  : item.disabled
                  ? theme.mutedForeground
                  : theme.foreground,
              }}
            >
              {item.label}
            </Text>
            
            {hasSubmenu && (
              <Symbol name="chevron.right"
                size={16}
                color={theme.mutedForeground}
                style={{ marginLeft: spacing[2] }}
              />
            )}
          </AnimatedPressable>
        );
      };
      
      return <AnimatedMenuItem key={`${item.key}-${index}`} />;
    };

    const renderSubmenu = () => {
      const parentItem = items.find(item => item.key === submenuOpen);
      if (!parentItem || !parentItem.submenu) return null;

      const AnimatedSubmenu = () => {
        const submenuOpacity = useSharedValue(0);
        const submenuScale = useSharedValue(0.9);
        const submenuTranslateX = useSharedValue(-10);
        
        useEffect(() => {
          if (animated && isAnimated && shouldAnimate() && animationType !== 'none') {
            submenuOpacity.value = withTiming(1, { duration: config.duration.fast });
            submenuScale.value = withSpring(1, config.spring);
            submenuTranslateX.value = withSpring(0, config.spring);
          } else {
            submenuOpacity.value = 1;
            submenuScale.value = 1;
            submenuTranslateX.value = 0;
          }
        }, []);
        
        const animatedStyle = useAnimatedStyle(() => ({
          opacity: submenuOpacity.value,
          transform: [
            { scale: submenuScale.value },
            { translateX: submenuTranslateX.value },
          ] as any,
        }));
        
        return (
          <AnimatedView
            style={[
              {
                position: 'absolute',
                left: 200 + spacing[2],
                top: 0,
                minWidth: 180,
                maxHeight: SCREEN_HEIGHT * 0.8,
              },
              animated && isAnimated && shouldAnimate() && animationType !== 'none' ? animatedStyle : {},
              Platform.OS === 'web' && animated && isAnimated && shouldAnimate() && {
                transition: 'all 0.2s ease',
              } as any,
            ]}
          >
            <Card
              style={[menuStyle]}
              p={1 as SpacingScale}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {parentItem.submenu.map((item, index) => renderMenuItem(item, index))}
              </ScrollView>
            </Card>
          </AnimatedView>
        );
      };
      
      return <AnimatedSubmenu />;
    };

    // Platform-specific trigger
    const triggerProps = Platform.select({
      ios: {
        onLongPress: handleLongPress,
        delayLongPress: 500,
      },
      android: {
        onLongPress: handleLongPress,
        delayLongPress: 500,
      },
      default: {
        onPress: (e: any) => {
          if (Platform.OS === 'web' && e.button === 2) {
            e.preventDefault();
            handleLongPress();
          }
        },
        onContextMenu: (e: any) => {
          e.preventDefault();
          handleLongPress();
          return false;
        },
      },
    });

    return (
      <>
        <Pressable
          ref={ref}
          style={style}
          disabled={disabled}
          {...triggerProps}
          testID={testID}
        >
          <View ref={triggerRef}>
            {children}
          </View>
        </Pressable>

        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={handleClose}
        >
          <Pressable
            style={{
              flex: 1,
            }}
            onPress={handleClose}
          >
            <AnimatedView
              style={[
                {
                  position: 'absolute',
                  left: menuPosition.x,
                  top: menuPosition.y,
                },
                useAnimatedStyle(() => ({
                  opacity: opacity.value,
                  transform: [
                    { scale: scale.value },
                    { translateY: translateY.value },
                  ] as any,
                })),
                Platform.OS === 'web' && animated && isAnimated && shouldAnimate() && {
                  transition: 'all 0.2s ease',
                  transformOrigin: 'top left',
                } as any,
              ]}
            >
              <Card
                style={[
                  {
                    minWidth: 200,
                    maxHeight: SCREEN_HEIGHT * 0.8,
                    ...Platform.select({
                      ios: {
                        boxShadow: '0px 4px 8px theme.mutedForeground + "10"',
                      },
                      android: {
                        elevation: 8,
                      },
                      default: {
                        boxShadow: `0 4px 12px ${theme.foreground}30`,
                      },
                    }),
                  },
                  menuStyle,
                ]}
                p={1 as SpacingScale}
              >
                <ScrollView showsVerticalScrollIndicator={false}>
                  {items.map((item, index) => renderMenuItem(item, index))}
                </ScrollView>
              </Card>
              {renderSubmenu()}
            </AnimatedView>
          </Pressable>
        </Modal>
      </>
    );
  }
);

ContextMenu.displayName = 'ContextMenu';

// Context Menu Provider for global menu
export interface ContextMenuProviderProps {
  children: React.ReactNode;
}

export const ContextMenuProvider: React.FC<ContextMenuProviderProps> = ({ children }) => {
  // This could be extended to provide global context menu functionality
  return <>{children}</>;
};

// Helper component for menu items with common patterns
export interface QuickContextMenuProps {
  children: React.ReactNode;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  customItems?: ContextMenuItem[];
  disabled?: boolean;
  style?: ViewStyle;
}

export const QuickContextMenu: React.FC<QuickContextMenuProps> = ({
  children,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onSelectAll,
  customItems = [],
  disabled,
  style,
}) => {
  const items: ContextMenuItem[] = [];

  if (onCut) {
    items.push({
      key: 'cut',
      label: 'Cut',
      icon: 'cut',
      onSelect: onCut,
    });
  }

  if (onCopy) {
    items.push({
      key: 'copy',
      label: 'Copy',
      icon: 'copy',
      onSelect: onCopy,
    });
  }

  if (onPaste) {
    items.push({
      key: 'paste',
      label: 'Paste',
      icon: 'clipboard',
      onSelect: onPaste,
    });
  }

  if (onSelectAll) {
    items.push({
      key: 'select-all',
      label: 'Select All',
      icon: 'checkbox-outline',
      onSelect: onSelectAll,
    });
  }

  if (items.length > 0 && (customItems.length > 0 || onDelete)) {
    items.push({
      key: 'separator-1',
      label: '',
      separator: true,
      onSelect: () => {},
    });
  }

  items.push(...customItems);

  if (onDelete) {
    if (customItems.length > 0) {
      items.push({
        key: 'separator-2',
        label: '',
        separator: true,
        onSelect: () => {},
      });
    }
    items.push({
      key: 'delete',
      label: 'Delete',
      icon: 'trash',
      destructive: true,
      onSelect: onDelete,
    });
  }

  return (
    <ContextMenu 
      items={items} 
      disabled={disabled} 
      style={style}
      animated
      animationType="scale"
      useHaptics
    >
      {children}
    </ContextMenu>
  );
};