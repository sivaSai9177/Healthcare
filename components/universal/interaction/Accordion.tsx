import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Pressable, ViewStyle, LayoutAnimation, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { useSpacing } from '@/lib/stores/spacing-store';
import { VStack, HStack } from '@/components/universal/layout/Stack';
import { Text } from '@/components/universal/typography/Text';
import { Symbol } from '@/components/universal/display/Symbols';
import { SpacingScale } from '@/lib/design';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';

const AnimatedView = Animated.View;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type AccordionAnimationType = 'collapse' | 'fade' | 'slide' | 'none';

// Spring config
const springConfig = {
  damping: 20,
  stiffness: 300,
};

// Accordion Context
interface AccordionContextValue {
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  type: 'single' | 'multiple';
  animated?: boolean;
  animationType?: AccordionAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
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
  className?: string;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationType?: AccordionAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({
  type = 'single',
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
  collapsible = true,
  className,
  style,
  animated = true,
  animationType = 'collapse',
  animationDuration = 300,
  useHaptics = true,
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
      animationType,
      animationDuration,
      useHaptics,
    }),
    [value, type, animated, animationType, animationDuration, useHaptics]
  );
  
  return (
    <AccordionContext.Provider value={contextValue}>
      <VStack spacing={2} className={className} style={style}>
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
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  value: itemValue,
  children,
  disabled = false,
  className,
}) => {
  const { value, type, animated, animationType, animationDuration } = useAccordion();
  const { shouldAnimate } = useAnimationStore();
  const shadowStyle = useShadow('sm');
  
  const [contentHeight, setContentHeight] = useState(0);
  
  const isExpanded = type === 'single' 
    ? value === itemValue 
    : Array.isArray(value) && value.includes(itemValue);
  
  // Animation values
  const expandProgress = useSharedValue(isExpanded ? 1 : 0);
  const itemScale = useSharedValue(1);
  
  useEffect(() => {
    if (animated && shouldAnimate() && animationType !== 'none') {
      if (isExpanded) {
        expandProgress.value = withSpring(1, springConfig);
      } else {
        expandProgress.value = withTiming(0, { duration: animationDuration });
      }
    } else {
      expandProgress.value = isExpanded ? 1 : 0;
    }
  }, [isExpanded, animated, shouldAnimate, animationType, animationDuration]);
  
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
  
  const itemClasses = cn(
    'border border-border rounded-lg bg-card overflow-hidden',
    disabled && 'opacity-60',
    className
  );

  return (
    <AccordionItemContext.Provider value={contextValue}>
      {animated && shouldAnimate() && animationType !== 'none' ? (
        <AnimatedView
          className={itemClasses}
          style={[
            shadowStyle,
            animatedItemStyle,
          ]}
          entering={FadeIn.duration(animationDuration)}
          layout={Layout.springify(springConfig)}
        >
          {children}
        </AnimatedView>
      ) : (
        <View
          className={itemClasses}
          style={shadowStyle}
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
  const { value, onValueChange, type, animated, animationDuration, useHaptics: contextUseHaptics } = useAccordion();
  const { isExpanded, itemValue } = useAccordionItem();
  const { shouldAnimate } = useAnimationStore();
  
  // Animation values
  const rotation = useSharedValue(isExpanded ? 180 : 0);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    if (animated && shouldAnimate()) {
      rotation.value = withSpring(isExpanded ? 180 : 0, springConfig);
    } else {
      rotation.value = isExpanded ? 180 : 0;
    }
  }, [isExpanded, animated, shouldAnimate]);
  
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
    if (animated && shouldAnimate()) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };
  
  const handlePressOut = () => {
    if (animated && shouldAnimate()) {
      scale.value = withSpring(1, springConfig);
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
      <View className="flex-1">
        {typeof children === 'string' ? (
          <Text weight="medium" className="text-foreground">{children}</Text>
        ) : (
          children
        )}
      </View>
      {animated && shouldAnimate() ? (
        <AnimatedView style={animatedArrowStyle}>
          <Symbol
            name="chevron.down"
            size={16}
            className="text-muted-foreground"
          />
        </AnimatedView>
      ) : (
        <View
          style={{
            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
          }}
        >
          <Symbol
            name="chevron.down"
            size={16}
            className="text-muted-foreground"
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
  
  return animated && shouldAnimate() ? (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedTriggerStyle}
      className="cursor-pointer"
    >
      {content}
    </AnimatedPressable>
  ) : (
    <Pressable onPress={handlePress} className="cursor-pointer">
      {({ pressed }) => (
        <View className={cn(pressed && 'opacity-70')}>
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
  const { spacing } = useSpacing();
  const { animated, animationType, animationDuration } = useAccordion();
  const { isExpanded, contentHeight, setContentHeight } = useAccordionItem();
  const { shouldAnimate } = useAnimationStore();
  
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
    if (animated && shouldAnimate() && animationType !== 'none') {
      if (isExpanded) {
        height.value = withSpring(1, springConfig);
        opacity.value = withTiming(1, { duration: animationDuration / 2 });
        if (animationType === 'slide') {
          translateY.value = withSpring(0, springConfig);
        }
      } else {
        height.value = withTiming(0, { duration: animationDuration });
        opacity.value = withTiming(0, { duration: animationDuration / 2 });
        if (animationType === 'slide') {
          translateY.value = withTiming(-10, { duration: animationDuration / 2 });
        }
      }
    } else {
      height.value = isExpanded ? 1 : 0;
      opacity.value = isExpanded ? 1 : 0;
      translateY.value = isExpanded ? 0 : -10;
    }
  }, [isExpanded, animated, shouldAnimate, animationType, animationDuration]);
  
  if (!isExpanded && !forceMount) {
    return null;
  }
  
  return animated && shouldAnimate() && animationType !== 'none' ? (
    <AnimatedView
      className="border-t border-border overflow-hidden"
      style={animatedContentStyle}
    >
      <View
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setContentHeight(height);
        }}
        className="px-4 py-3"
      >
        {children}
      </View>
    </AnimatedView>
  ) : (
    <View
      className={cn(
        'border-t border-border px-4 py-3',
        !isExpanded && 'hidden'
      )}
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