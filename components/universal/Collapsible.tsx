import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ViewStyle,
  TextStyle,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Extrapolate,
} from 'react-native-reanimated';
import { Symbol } from './Symbols';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { AnimationVariant } from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedView = ReAnimated.View;
const AnimatedPressable = ReAnimated.createAnimatedComponent(Pressable);

export type CollapsibleAnimationType = 'height' | 'fade' | 'slide' | 'none';

export interface CollapsibleProps {
  children: React.ReactNode;
  title?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  showArrow?: boolean;
  animationDuration?: number;
  animationType?: 'spring' | 'linear' | 'easeInEaseOut';
  disabled?: boolean;
  variant?: 'default' | 'bordered' | 'ghost';
  style?: ViewStyle;
  triggerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  collapsibleAnimationType?: CollapsibleAnimationType;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const Collapsible = React.forwardRef<View, CollapsibleProps>(
  (
    {
      children,
      title,
      defaultOpen = false,
      open: controlledOpen,
      onOpenChange,
      trigger,
      showArrow = true,
      animationDuration = 300,
      animationType = 'spring',
      disabled = false,
      variant = 'default',
      style,
      triggerStyle,
      contentStyle,
      titleStyle,
      testID,
      animated = true,
      animationVariant = 'moderate',
      collapsibleAnimationType = 'height',
      useHaptics = true,
      animationConfig,
    },
    ref
  ) => {
    const theme = useTheme();
    const { spacing } = useSpacing();
    const { shouldAnimate } = useAnimationStore();
    const { config, isAnimated } = useAnimationVariant({
      variant: animationVariant,
      overrides: animationConfig,
    });
    
    const [isOpen, setIsOpen] = useState(controlledOpen ?? defaultOpen);
    const animatedHeight = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
    const animatedRotation = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
    const [contentHeight, setContentHeight] = useState(0);
    
    // Reanimated values
    const height = useSharedValue(isOpen ? 1 : 0);
    const rotation = useSharedValue(isOpen ? 1 : 0);
    const opacity = useSharedValue(isOpen ? 1 : 0);
    const translateY = useSharedValue(isOpen ? 0 : -10);
    const scale = useSharedValue(1);
    
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : isOpen;

    useEffect(() => {
      if (animated && isAnimated && shouldAnimate() && collapsibleAnimationType !== 'none') {
        if (open) {
          height.value = withSpring(1, config.spring);
          rotation.value = withSpring(1, config.spring);
          opacity.value = withTiming(1, { duration: config.duration.fast });
          if (collapsibleAnimationType === 'slide') {
            translateY.value = withSpring(0, config.spring);
          }
        } else {
          height.value = withTiming(0, { duration: config.duration.normal });
          rotation.value = withSpring(0, config.spring);
          opacity.value = withTiming(0, { duration: config.duration.fast });
          if (collapsibleAnimationType === 'slide') {
            translateY.value = withTiming(-10, { duration: config.duration.fast });
          }
        }
      } else {
        // Fallback to Animated API
        const layoutAnimConfig = {
          duration: animationDuration,
          update: {
            type: animationType === 'spring' 
              ? LayoutAnimation.Types.spring 
              : animationType === 'linear' 
              ? LayoutAnimation.Types.linear 
              : LayoutAnimation.Types.easeInEaseOut,
            property: LayoutAnimation.Properties.scaleY,
          },
        };

        if (Platform.OS === 'android') {
          LayoutAnimation.configureNext(layoutAnimConfig);
        }

        Animated.parallel([
          Animated.timing(animatedHeight, {
            toValue: open ? 1 : 0,
            duration: animationDuration,
            useNativeDriver: false,
          }),
          Animated.timing(animatedRotation, {
            toValue: open ? 1 : 0,
            duration: animationDuration,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [open, animationDuration, animatedHeight, animatedRotation, animated, isAnimated, shouldAnimate, collapsibleAnimationType, config]);

    const handleToggle = useCallback(() => {
      if (disabled) return;
      
      // Haptic feedback
      if (useHaptics && Platform.OS !== 'web') {
        haptic('selection');
      }
      
      const newValue = !open;
      if (!isControlled) {
        setIsOpen(newValue);
      }
      onOpenChange?.(newValue);
    }, [disabled, open, isControlled, onOpenChange, useHaptics]);
    
    const handlePressIn = () => {
      if (animated && isAnimated && shouldAnimate()) {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      }
    };
    
    const handlePressOut = () => {
      if (animated && isAnimated && shouldAnimate()) {
        scale.value = withSpring(1, config.spring);
      }
    };

    const getVariantStyles = (): ViewStyle => {
      switch (variant) {
        case 'bordered':
          return {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            overflow: 'hidden',
          };
        case 'ghost':
          return {};
        default:
          return {
            backgroundColor: theme.card,
            borderRadius: 8,
            overflow: 'hidden',
          };
      }
    };

    const animatedContentStyle = useAnimatedStyle(() => {
      const baseStyle: any = {
        opacity: collapsibleAnimationType === 'fade' || collapsibleAnimationType === 'slide' 
          ? opacity.value 
          : 1,
      };
      
      if (collapsibleAnimationType === 'height' || collapsibleAnimationType === 'slide') {
        baseStyle.height = interpolate(
          height.value,
          [0, 1],
          [0, contentHeight],
          Extrapolate.CLAMP
        );
      }
      
      if (collapsibleAnimationType === 'slide') {
        baseStyle.transform = [{ translateY: translateY.value }];
      }
      
      return baseStyle;
    });
    
    const animatedArrowStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 90])}deg` }],
    }));
    
    const animatedTriggerStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }] as any,
    }));
    
    // Fallback rotation for Animated API
    const animatedRotationDeg = animatedRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '90deg'],
    });

    const renderDefaultTrigger = () => (
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing[3],
            backgroundColor: variant === 'ghost' ? 'transparent' : theme.card,
          },
          triggerStyle,
        ]}
      >
        <Text
          style={[
            {
              fontSize: 16,
              fontWeight: '500',
              color: disabled ? theme.mutedForeground : theme.foreground,
              flex: 1,
            },
            titleStyle,
          ]}
        >
          {title}
        </Text>
        {showArrow && (
          animated && isAnimated && shouldAnimate() ? (
            <AnimatedView
              style={[
                {
                  marginLeft: spacing[2],
                },
                animatedArrowStyle,
              ]}
            >
              <Symbol name="chevron.right"
                size={20}
                color={disabled ? theme.mutedForeground : theme.foreground}
              />
            </AnimatedView>
          ) : (
            <Animated.View
              style={{
                transform: [{ rotate: animatedRotationDeg }],
                marginLeft: spacing[2],
              }}
            >
              <Symbol name="chevron.right"
                size={20}
                color={disabled ? theme.mutedForeground : theme.foreground}
              />
            </Animated.View>
          )
        )}
      </View>
    );

    return (
      <View ref={ref} style={[getVariantStyles(), style]} testID={testID}>
        {animated && isAnimated && shouldAnimate() ? (
          <AnimatedPressable
            onPress={handleToggle}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={animatedTriggerStyle}
          >
            {trigger || renderDefaultTrigger()}
          </AnimatedPressable>
        ) : (
          <Pressable
            onPress={handleToggle}
            disabled={disabled}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {trigger || renderDefaultTrigger()}
          </Pressable>
        )}
        
        {animated && isAnimated && shouldAnimate() && collapsibleAnimationType !== 'none' ? (
          <AnimatedView
            style={[
              {
                overflow: 'hidden',
              },
              animatedContentStyle,
            ]}
          >
            <View
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                setContentHeight(height);
              }}
              style={[
                {
                  position: contentHeight ? 'relative' : 'absolute',
                  padding: variant === 'ghost' ? 0 : spacing[3],
                  paddingTop: variant === 'ghost' ? spacing[2] : 0,
                },
                contentStyle,
              ]}
            >
              {children}
            </View>
          </AnimatedView>
        ) : (
          <Animated.View
            style={{
              height: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, contentHeight || 0],
              }),
              opacity: animatedHeight,
              overflow: 'hidden',
            }}
          >
          <View
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setContentHeight(height);
            }}
            style={[
              {
                position: contentHeight ? 'relative' : 'absolute',
                padding: variant === 'ghost' ? 0 : spacing[3],
                paddingTop: variant === 'ghost' ? spacing[2] : 0,
              },
              contentStyle,
            ]}
          >
            {children}
          </View>
          </Animated.View>
        )}
      </View>
    );
  }
);

Collapsible.displayName = 'Collapsible';

// Collapsible Group Component
export interface CollapsibleGroupProps {
  children: React.ReactElement<CollapsibleProps>[];
  accordion?: boolean;
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  style?: ViewStyle;
  testID?: string;
}

export const CollapsibleGroup: React.FC<CollapsibleGroupProps> = ({
  children,
  accordion = false,
  defaultValue = [],
  value: controlledValue,
  onValueChange,
  style,
  testID,
}) => {
  const [openItems, setOpenItems] = useState<string[]>(controlledValue ?? defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : openItems;

  const handleItemToggle = useCallback((index: string, isOpen: boolean) => {
    let newValue: string[];
    
    if (accordion) {
      newValue = isOpen ? [index] : [];
    } else {
      if (isOpen) {
        newValue = [...value, index];
      } else {
        newValue = value.filter(item => item !== index);
      }
    }
    
    if (!isControlled) {
      setOpenItems(newValue);
    }
    onValueChange?.(newValue);
  }, [accordion, value, isControlled, onValueChange]);

  return (
    <View style={style} testID={testID}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null;
        
        const itemKey = child.key || index.toString();
        const isOpen = value.includes(itemKey);
        
        return React.cloneElement(child, {
          ...child.props,
          open: isOpen,
          onOpenChange: (open: boolean) => {
            handleItemToggle(itemKey, open);
            child.props.onOpenChange?.(open);
          },
        });
      })}
    </View>
  );
};

// Collapsible Section Helper Component
export interface CollapsibleSectionProps extends Omit<CollapsibleProps, 'trigger'> {
  icon?: string;
  badge?: string | number;
  subtitle?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  icon,
  badge,
  subtitle,
  title,
  children,
  ...props
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();

  const customTrigger = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[3],
      }}
    >
      {icon && (
        <Symbol
          name="icon as any"
          size={24}
          color={theme.primary}
          style={{ marginRight: spacing[3] }}
        />
      )}
      
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.foreground,
              flex: 1,
            }}
          >
            {title}
          </Text>
          {badge !== undefined && (
            <View
              style={{
                backgroundColor: theme.primary,
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[0.5],
                borderRadius: 12,
                marginLeft: spacing[2],
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: theme.primaryForeground,
                }}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>
        {subtitle && (
          <Text
            style={{
              fontSize: 14,
              color: theme.mutedForeground,
              marginTop: spacing[0.5],
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      
      {props.showArrow !== false && (
        <Symbol name="chevron.right"
          size={20}
          color={theme.foreground}
          style={{ marginLeft: spacing[2] }}
        />
      )}
    </View>
  );

  return (
    <Collapsible {...props} title={title} trigger={customTrigger}>
      {children}
    </Collapsible>
  );
};