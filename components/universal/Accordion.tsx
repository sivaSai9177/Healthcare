import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Pressable, ViewStyle, LayoutAnimation, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { VStack, HStack } from './Stack';
import { Text } from './Text';
import { Symbol } from './Symbols';
import { AnimationVariant , SpacingScale } from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

const AnimatedView = Animated.View;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type AccordionAnimationType = 'collapse' | 'fade' | 'slide' | 'none';

// Accordion Context
interface AccordionContextValue {
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  type: 'single' | 'multiple';
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: AccordionAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within Accordion');
  }
  return context;
};

// Accordion Props
export interface AccordionProps {
  type?: 'single' | 'multiple';
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children: React.ReactNode;
  collapsible?: boolean;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: AccordionAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const Accordion: React.FC<AccordionProps> = ({
  type = 'single',
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
  collapsible = true,
  style,
  animated = true,
  animationVariant = 'moderate',
  animationType = 'collapse',
  animationDuration,
  useHaptics = true,
  animationConfig,
}) => {
  const [internalValue, setInternalValue] = useState<string | string[]>(
    defaultValue || (type === 'single' ? '' : [])
  );
  
  const value = controlledValue ?? internalValue;
  
  const handleValueChange = (newValue: string | string[]) => {
    if (!controlledValue) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };
  
  const contextValue = React.useMemo(
    () => ({
      value,
      onValueChange: handleValueChange,
      type,
      animated,
      animationVariant,
      animationType,
      animationDuration,
      useHaptics,
      animationConfig,
    }),
    [value, type, animated, animationVariant, animationType, animationDuration, useHaptics, animationConfig]
  );
  
  return (
    <AccordionContext.Provider value={contextValue}>
      <VStack spacing={2} style={style}>
        {children}
      </VStack>
    </AccordionContext.Provider>
  );
};

// Accordion Item Context
interface AccordionItemContextValue {
  isExpanded: boolean;
  itemValue: string;
  contentHeight: number;
  setContentHeight: (height: number) => void;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

const useAccordionItem = () => {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('useAccordionItem must be used within AccordionItem');
  }
  return context;
};

// Accordion Item Props
export interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  value: itemValue,
  children,
  disabled = false,
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { value, type, animated, animationVariant, animationType } = useAccordion();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: {},
  });
  
  const [contentHeight, setContentHeight] = useState(0);
  
  const isExpanded = type === 'single' 
    ? value === itemValue 
    : Array.isArray(value) && value.includes(itemValue);
  
  // Animation values
  const expandProgress = useSharedValue(isExpanded ? 1 : 0);
  const itemScale = useSharedValue(1);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate() && animationType !== 'none') {
      if (isExpanded) {
        expandProgress.value = withSpring(1, config.spring);
      } else {
        expandProgress.value = withTiming(0, { duration: config.duration.normal });
      }
    } else {
      expandProgress.value = isExpanded ? 1 : 0;
    }
  }, [isExpanded, animated, isAnimated, shouldAnimate, animationType, config]);
  
  const animatedItemStyle = useAnimatedStyle(() => {
    if (animationType === 'slide') {
      return {
        transform: [
          { translateY: interpolate(expandProgress.value, [0, 1], [-10, 0]) },
          { scale: itemScale.value },
        ] as any,
      };
    }
    return {
      transform: [{ scale: itemScale.value }] as any,
    };
  });
  
  const contextValue = React.useMemo(
    () => ({ isExpanded, itemValue, contentHeight, setContentHeight }),
    [isExpanded, itemValue, contentHeight]
  );
  
  return (
    <AccordionItemContext.Provider value={contextValue}>
      {animated && isAnimated && shouldAnimate() && animationType !== 'none' ? (
        <AnimatedView
          style={[
            {
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: spacing[2],
              backgroundColor: theme.card,
              opacity: disabled ? 0.6 : 1,
              overflow: 'hidden',
            },
            animatedItemStyle,
          ]}
        >
          {children}
        </AnimatedView>
      ) : (
        <View
          style={{
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: spacing[2],
            backgroundColor: theme.card,
            opacity: disabled ? 0.6 : 1,
            overflow: 'hidden',
          }}
        >
          {children}
        </View>
      )}
    </AccordionItemContext.Provider>
  );
};

// Accordion Trigger Props
export interface AccordionTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  children,
  asChild = false,
}) => {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { spacing, componentSpacing } = useSpacing(); // spacing kept for consistency with other components
  const { value, onValueChange, type, animated, animationVariant, animationType: _animationType, useHaptics: contextUseHaptics } = useAccordion();
  const { isExpanded, itemValue } = useAccordionItem();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: {},
  });
  
  // Animation values
  const rotation = useSharedValue(isExpanded ? 180 : 0);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      rotation.value = withSpring(isExpanded ? 180 : 0, config.spring);
    } else {
      rotation.value = isExpanded ? 180 : 0;
    }
  }, [isExpanded, animated, isAnimated, shouldAnimate, config]);
  
  const handlePress = () => {
    // Haptic feedback
    if (contextUseHaptics && Platform.OS !== 'web') {
      haptic('selection');
    }
    
    // Animate on iOS and Android, not on web
    if (Platform.OS !== 'web' && !animated) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    
    if (type === 'single') {
      onValueChange(isExpanded ? '' : itemValue);
    } else {
      const currentValue = value as string[];
      if (isExpanded) {
        onValueChange(currentValue.filter(v => v !== itemValue));
      } else {
        onValueChange([...currentValue, itemValue]);
      }
    }
  };
  
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
  
  const animatedArrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  const animatedTriggerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }] as any,
  }));
  
  const content = (
    <HStack
      p={4 as SpacingScale}
      spacing={3}
      alignItems="center"
      justifyContent="space-between"
    >
      <View style={{ flex: 1 }}>
        {typeof children === 'string' ? (
          <Text weight="medium">{children}</Text>
        ) : (
          children
        )}
      </View>
      {animated && isAnimated && shouldAnimate() ? (
        <AnimatedView style={animatedArrowStyle}>
          <Symbol name="chevron.down"
            size={componentSpacing.iconSize.md}
            color={theme.mutedForeground}
          />
        </AnimatedView>
      ) : (
        <View
          style={{
            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
          }}
        >
          <Symbol name="chevron.down"
            size={componentSpacing.iconSize.md}
            color={theme.mutedForeground}
          />
        </View>
      )}
    </HStack>
  );
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      onPress: handlePress,
      children: content,
    });
  }
  
  return animated && isAnimated && shouldAnimate() ? (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedTriggerStyle}
    >
      {content}
    </AnimatedPressable>
  ) : (
    <Pressable onPress={handlePress}>
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.7 : 1 }}>
          {content}
        </View>
      )}
    </Pressable>
  );
};

// Accordion Content Props
export interface AccordionContentProps {
  children: React.ReactNode;
  forceMount?: boolean;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({
  children,
  forceMount = false,
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { animated, animationVariant, animationType } = useAccordion();
  const { isExpanded, contentHeight, setContentHeight } = useAccordionItem();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: {},
  });
  
  // Animation values
  const height = useSharedValue(isExpanded ? 1 : 0);
  const opacity = useSharedValue(isExpanded ? 1 : 0);
  const translateY = useSharedValue(isExpanded ? 0 : -10);
  
  // Define animated style before any conditional returns
  const animatedContentStyle = useAnimatedStyle(() => {
    const baseStyle: any = {
      opacity: animationType === 'fade' || animationType === 'slide' ? opacity.value : 1,
    };
    
    if (animationType === 'collapse' || animationType === 'slide') {
      baseStyle.height = interpolate(
        height.value,
        [0, 1],
        [0, contentHeight],
        Extrapolate.CLAMP
      );
    }
    
    if (animationType === 'slide') {
      baseStyle.transform = [{ translateY: translateY.value }];
    }
    
    return baseStyle;
  });

  useEffect(() => {
    if (animated && isAnimated && shouldAnimate() && animationType !== 'none') {
      if (isExpanded) {
        height.value = withSpring(1, config.spring);
        opacity.value = withTiming(1, { duration: config.duration.fast });
        if (animationType === 'slide') {
          translateY.value = withSpring(0, config.spring);
        }
      } else {
        height.value = withTiming(0, { duration: config.duration.normal });
        opacity.value = withTiming(0, { duration: config.duration.fast });
        if (animationType === 'slide') {
          translateY.value = withTiming(-10, { duration: config.duration.fast });
        }
      }
    } else {
      height.value = isExpanded ? 1 : 0;
      opacity.value = isExpanded ? 1 : 0;
      translateY.value = isExpanded ? 0 : -10;
    }
  }, [isExpanded, animated, isAnimated, shouldAnimate, animationType, config]);
  
  if (!isExpanded && !forceMount) {
    return null;
  }
  
  return animated && isAnimated && shouldAnimate() && animationType !== 'none' ? (
    <AnimatedView
      style={[
        {
          borderTopWidth: 1,
          borderTopColor: theme.border,
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
        style={{
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
        }}
      >
        {children}
      </View>
    </AnimatedView>
  ) : (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        display: isExpanded ? 'flex' : 'none',
      }}
    >
      {children}
    </View>
  );
};

// Pre-styled Accordion variants
export interface SimpleAccordionProps {
  items: {
    value: string;
    title: string;
    content: React.ReactNode;
    disabled?: boolean;
  }[];
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  style?: ViewStyle;
}

export const SimpleAccordion: React.FC<SimpleAccordionProps> = ({
  items,
  type = 'single',
  defaultValue,
  style,
}) => {
  return (
    <Accordion type={type} defaultValue={defaultValue} style={style}>
      {items.map((item) => (
        <AccordionItem key={item.value} value={item.value} disabled={item.disabled}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};