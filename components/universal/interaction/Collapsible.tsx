import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
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
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { Symbol } from '@/components/universal/display/Symbols';
import { Text } from '@/components/universal/typography/Text';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { haptic } from '@/lib/ui/haptics';
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedView = ReAnimated.View;
const AnimatedPressable = ReAnimated.createAnimatedComponent(Pressable);

export type CollapsibleAnimationType = 'height' | 'fade' | 'slide' | 'none';

// Spring config
const springConfig = {
  damping: 20,
  stiffness: 300,
};

export interface CollapsibleProps {
  children: React.ReactNode;
  title?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  showArrow?: boolean;
  animationDuration?: number;
  disabled?: boolean;
  variant?: 'default' | 'bordered' | 'ghost';
  className?: string;
  style?: ViewStyle;
  triggerClassName?: string;
  triggerStyle?: ViewStyle;
  contentClassName?: string;
  contentStyle?: ViewStyle;
  titleClassName?: string;
  titleStyle?: TextStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  collapsibleAnimationType?: CollapsibleAnimationType;
  useHaptics?: boolean;
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
      disabled = false,
      variant = 'default',
      className,
      style,
      triggerClassName,
      triggerStyle,
      contentClassName,
      contentStyle,
      titleClassName,
      titleStyle,
      testID,
      animated = true,
      collapsibleAnimationType = 'height',
      useHaptics = true,
    },
    ref
  ) => {
    const { spacing } = useSpacing();
    const { shouldAnimate } = useAnimationStore();
    const { config, isAnimated } = useAnimationVariant({ variant: 'moderate' });
    const shadowStyle = useShadow(variant === 'default' ? 'sm' : 'none');
    
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
      if (animated && shouldAnimate() && collapsibleAnimationType !== 'none') {
        if (open) {
          height.value = withSpring(1, springConfig);
          rotation.value = withSpring(1, springConfig);
          opacity.value = withTiming(1, { duration: animationDuration / 2 });
          if (collapsibleAnimationType === 'slide') {
            translateY.value = withSpring(0, springConfig);
          }
        } else {
          height.value = withTiming(0, { duration: animationDuration });
          rotation.value = withSpring(0, springConfig);
          opacity.value = withTiming(0, { duration: animationDuration / 2 });
          if (collapsibleAnimationType === 'slide') {
            translateY.value = withTiming(-10, { duration: animationDuration / 2 });
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
      if (animated && shouldAnimate()) {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      }
    };
    
    const handlePressOut = () => {
      if (animated && shouldAnimate()) {
        scale.value = withSpring(1, springConfig);
      }
    };

    const variantClasses = {
      default: 'bg-card rounded-lg overflow-hidden',
      bordered: 'border border-border rounded-lg overflow-hidden',
      ghost: '',
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
        className={cn(
          'flex-row items-center justify-between p-3',
          variant !== 'ghost' && 'bg-card',
          triggerClassName
        )}
        style={triggerStyle}
      >
        <Text
          className={cn(
            'text-base font-medium flex-1',
            disabled ? 'text-muted-foreground' : 'text-foreground',
            titleClassName
          )}
          style={titleStyle}
        >
          {title}
        </Text>
        {showArrow && (
          animated && shouldAnimate() ? (
            <AnimatedView
              className="ml-2"
              style={animatedArrowStyle}
            >
              <Symbol
                name="chevron.right"
                size={20}
                className={disabled ? 'text-muted-foreground' : 'text-foreground'}
              />
            </AnimatedView>
          ) : (
            <Animated.View
              style={{
                transform: [{ rotate: animatedRotationDeg }],
                marginLeft: spacing[2],
              }}
            >
              <Symbol
                name="chevron.right"
                size={20}
                className={disabled ? 'text-muted-foreground' : 'text-foreground'}
              />
            </Animated.View>
          )
        )}
      </View>
    );

    return (
      <View
        ref={ref}
        className={cn(variantClasses[variant], className) as string}
        style={[variant === 'default' ? shadowStyle : {}, style] as any}
        testID={testID}
      >
        {animated && shouldAnimate() ? (
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
        
        {animated && shouldAnimate() && collapsibleAnimationType !== 'none' ? (
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
              className={cn(
                contentHeight ? 'relative' : 'absolute',
                variant === 'ghost' ? 'pt-2' : 'p-3',
                contentClassName
              )}
              style={contentStyle}
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
            className={cn(
              contentHeight ? 'relative' : 'absolute',
              variant === 'ghost' ? 'pt-2' : 'p-3',
              contentClassName
            )}
            style={contentStyle}
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

  const customTrigger = (
    <View className="flex-row items-center p-3">
      {icon && (
        <Symbol
          name={icon as any}
          size={24}
          className="text-primary mr-3"
        />
      )}
      
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text
            className="text-base font-semibold text-foreground flex-1"
          >
            {title}
          </Text>
          {badge !== undefined && (
            <View className="bg-primary px-2 py-0.5 rounded-full ml-2">
              <Text
                className="text-xs font-semibold text-primary-foreground"
              >
                {badge}
              </Text>
            </View>
          )}
        </View>
        {subtitle && (
          <Text
            className="text-sm text-muted-foreground mt-0.5"
          >
            {subtitle}
          </Text>
        )}
      </View>
      
      {props.showArrow !== false && (
        <Symbol
          name="chevron.right"
          size={20}
          className="text-foreground ml-2"
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

// Additional components for API compatibility with other Collapsible implementations
export const CollapsibleTrigger: React.FC<{ 
  children: React.ReactNode; 
  asChild?: boolean;
  onPress?: () => void;
}> = ({ children, asChild, onPress }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...children.props,
      onPress: onPress || children.props.onPress,
    });
  }
  
  return (
    <Pressable onPress={onPress}>
      {children}
    </Pressable>
  );
};

export const CollapsibleContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View>{children}</View>;
};