import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, ViewStyle, Platform, ScrollView, LayoutRectangle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import { Box } from '@/components/universal/layout/Box';
import { Text } from '@/components/universal/typography/Text';
import { useSpacing } from '@/lib/stores/spacing-store';
import { SpacingScale } from '@/lib/design';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';

const AnimatedBox = Animated.createAnimatedComponent(Box);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type TabsAnimationType = 'slide' | 'fade' | 'scale' | 'none';

// Spring config
const springConfig = {
  damping: 20,
  stiffness: 300,
};

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationType?: TabsAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
}

export const Tabs: React.FC<TabsProps> & {
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
} = ({ 
  value, 
  onValueChange, 
  children,
  className,
  style,
  animated = true,
  animationType = 'slide',
  animationDuration = 300,
  useHaptics = true,
}) => {
  const tabLayouts = useRef<{ [key: string]: LayoutRectangle }>({});
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  
  return (
    <TabsContext.Provider value={{ 
      value, 
      onValueChange,
      animated,
      animationType,
      animationDuration,
      useHaptics,
      indicatorPosition,
      indicatorWidth,
      tabLayouts,
    }}>
      <Box className={className} style={style}>
        {children}
      </Box>
    </TabsContext.Provider>
  );
};

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  animated: boolean;
  animationType: TabsAnimationType;
  animationDuration: number;
  useHaptics: boolean;
  indicatorPosition: Animated.SharedValue<number>;
  indicatorWidth: Animated.SharedValue<number>;
  tabLayouts: React.MutableRefObject<{ [key: string]: LayoutRectangle }>;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  scrollable?: boolean;
}

const TabsList: React.FC<TabsListProps> = ({ children, className, style, scrollable = false }) => {
  const context = useTabsContext();
  const { shouldAnimate } = useAnimationStore();
  const { spacing } = useSpacing();
  
  // Animated indicator style
  const indicatorStyle = useAnimatedStyle(() => {
    if (!context.animated || !shouldAnimate() || context.animationType === 'none') {
      return { opacity: 0 as any };
    }
    
    return {
      position: 'absolute' as const,
      bottom: 0,
      left: context.indicatorPosition.value,
      width: context.indicatorWidth.value,
      height: 3,
      opacity: context.indicatorWidth.value > 0 ? 1 : 0,
    };
  });
  
  // Web CSS for indicator
  const webIndicatorStyle = Platform.OS === 'web' && context.animated && shouldAnimate() ? {
    transition: `left ${context.animationDuration}ms ease-out, width ${context.animationDuration}ms ease-out`,
  } as any : {};
  
  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing[1],
        }}
        className={cn('bg-muted rounded-lg', className) as string}
        style={style}
      >
        <Box
          p={1 as SpacingScale}
          flexDirection="row"
          alignItems="center"
          gap={1 as SpacingScale}
        >
          {children}
        </Box>
      </ScrollView>
    );
  }
  
  return (
    <Box
      p={1 as SpacingScale}
      className={cn('rounded-lg flex-row items-center justify-center relative bg-muted', className) as string}
      style={style}
    >
      {children}
      {context.animationType === 'slide' && (
        <Animated.View 
          className="bg-primary rounded-full"
          style={[
            indicatorStyle,
            webIndicatorStyle,
          ]}
        />
      )}
    </Box>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: ViewStyle;
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, icon, disabled = false, className, style }) => {
  const context = useTabsContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const triggerRef = useRef<View>(null);
  
  const isActive = value === context.value;
  const shadowStyle = useShadow(isActive && context.animationType !== 'slide' ? 'sm' : 'none');
  const { shouldAnimate } = useAnimationStore();
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isActive ? 1 : 0.7);
  
  const handlePress = () => {
    if (!disabled) {
      // Haptic feedback
      if (context.useHaptics && Platform.OS !== 'web') {
        haptic('selection');
      }
      
      // Trigger press animation
      if (context.animated && shouldAnimate() && context.animationType === 'scale') {
        scale.value = withSequence(
          withSpring(0.95, { damping: 15, stiffness: 400 }),
          withSpring(1, springConfig)
        );
      }
      
      context.onValueChange(value);
    }
  };
  
  // Update indicator position when this tab becomes active
  useEffect(() => {
    if (isActive && triggerRef.current && context.animationType === 'slide') {
      // Simple implementation - we'll rely on layout updates instead
      // The indicator animation will be handled by the TabsList component
    }
  }, [isActive, context.animationType]);
  
  // Update opacity on active state change
  useEffect(() => {
    if (context.animated && shouldAnimate() && context.animationType === 'fade') {
      opacity.value = withTiming(isActive ? 1 : 0.7, { duration: context.animationDuration });
    }
  }, [isActive, context.animated, shouldAnimate, context.animationType, context.animationDuration, opacity]);

  const triggerClasses = cn(
    'rounded-lg flex-1 items-center justify-center min-h-[32px] px-3 py-1',
    isActive && 'bg-background',
    isPressed && !disabled && 'bg-muted/40',
    isHovered && !disabled && !isActive && 'bg-muted/20',
    disabled && 'cursor-not-allowed',
    !disabled && 'cursor-pointer',
    className
  );
  
  const textClasses = cn(
    'text-sm font-medium',
    disabled && 'text-muted-foreground/50',
    isActive && 'text-foreground',
    !isActive && !disabled && 'text-muted-foreground'
  );

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: context.animationType === 'fade' ? opacity.value : 1,
  }));
  
  // Web transition style
  const webTransitionStyle = Platform.OS === 'web' ? {
    transition: 'all 0.2s ease',
  } as any : {};

  const webHandlers = Platform.OS === 'web' && !disabled ? {
    onHoverIn: () => setIsHovered(true),
    onHoverOut: () => setIsHovered(false),
    onPressIn: () => setIsPressed(true),
    onPressOut: () => setIsPressed(false),
  } : {};

  return (
    <AnimatedPressable
      ref={triggerRef}
      onPress={handlePress}
      disabled={disabled}
      className={triggerClasses}
      style={[
        isActive && context.animationType !== 'slide' ? shadowStyle : {},
        webTransitionStyle,
        context.animated && shouldAnimate() && context.animationType !== 'slide'
          ? animatedStyle
          : {},
        style,
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive, disabled }}
      {...webHandlers}
    >
      <Box flexDirection="column" alignItems="center" gap={1 as SpacingScale}>
        {icon && (
          <Box className={cn(disabled && 'opacity-50') as string}>
            {React.isValidElement(icon) ? React.cloneElement(icon, {
              className: textClasses,
            } as any) : icon}
          </Box>
        )}
        {typeof children === 'string' ? (
          <Text className={textClasses}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Box>
    </AnimatedPressable>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

const TabsContent: React.FC<TabsContentProps> = ({ value, children, className, style }) => {
  const context = useTabsContext();
  const { shouldAnimate } = useAnimationStore();
  
  if (value !== context.value) {
    return null;
  }
  
  // Web CSS animations
  const webAnimationStyle = Platform.OS === 'web' && context.animated && shouldAnimate() ? {
    '@keyframes fadeIn': {
      from: { opacity: 0 as any },
      to: { opacity: 1 as any },
    },
    animation: `fadeIn ${context.animationDuration}ms ease-out`,
  } as any : {};
  
  return (
    <AnimatedBox
      mt={2}
      className={className}
      style={[webAnimationStyle, style] as any}
      entering={Platform.OS !== 'web' && context.animated && shouldAnimate()
        ? FadeIn.duration(context.animationDuration)
        : undefined
      }
    >
      {children}
    </AnimatedBox>
  );
};

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

export { TabsList, TabsTrigger, TabsContent };