import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, ViewStyle, Platform, ScrollView, LayoutRectangle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Box } from './Box';
import { Text } from './Text';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { 
  SpacingScale,
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

const AnimatedBox = Animated.createAnimatedComponent(Box);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type TabsAnimationType = 'slide' | 'fade' | 'scale' | 'none';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: TabsAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const Tabs: React.FC<TabsProps> & {
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
} = ({ 
  value, 
  onValueChange, 
  children, 
  style,
  animated = true,
  animationVariant = 'moderate',
  animationType = 'slide',
  animationDuration,
  useHaptics = true,
  animationConfig,
}) => {
  const tabLayouts = useRef<{ [key: string]: LayoutRectangle }>({});
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  
  return (
    <TabsContext.Provider value={{ 
      value, 
      onValueChange,
      animated,
      animationVariant,
      animationType,
      animationDuration,
      useHaptics,
      animationConfig,
      indicatorPosition,
      indicatorWidth,
      tabLayouts,
    }}>
      <Box style={style}>
        {children}
      </Box>
    </TabsContext.Provider>
  );
};

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  animated: boolean;
  animationVariant: AnimationVariant;
  animationType: TabsAnimationType;
  animationDuration?: number;
  useHaptics: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
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
  style?: ViewStyle;
  scrollable?: boolean;
}

const TabsList: React.FC<TabsListProps> = ({ children, style, scrollable = false }) => {
  const theme = useTheme();
  const { spacing, componentSpacing } = useSpacing();
  const context = useTabsContext();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: context.animationVariant,
    overrides: context.animationConfig,
  });
  
  const duration = context.animationDuration ?? config.duration.normal;
  
  // Animated indicator style
  const indicatorStyle = useAnimatedStyle(() => {
    if (!context.animated || !isAnimated || !shouldAnimate() || context.animationType === 'none') {
      return { opacity: 0 };
    }
    
    return {
      position: 'absolute' as const,
      bottom: 0,
      left: context.indicatorPosition.value,
      width: context.indicatorWidth.value,
      height: 3,
      backgroundColor: theme.primary,
      borderRadius: 1.5,
      opacity: context.indicatorWidth.value > 0 ? 1 : 0,
    };
  });
  
  // Web CSS for indicator
  const webIndicatorStyle = Platform.OS === 'web' && context.animated && isAnimated && shouldAnimate() ? {
    transition: `left ${duration}ms ease-out, width ${duration}ms ease-out`,
  } as any : {};
  
  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing[1],
        }}
        style={[{
          backgroundColor: theme.muted,
          borderRadius: componentSpacing.borderRadius,
        }, style]}
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
      bgTheme="muted"
      p={1 as SpacingScale}
      rounded="lg"
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      style={[{ position: 'relative' }, style]}
    >
      {children}
      {context.animationType === 'slide' && (
        <Animated.View 
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
  style?: ViewStyle;
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, icon, disabled = false, style }) => {
  const theme = useTheme();
  const { spacing, componentSpacing } = useSpacing();
  const context = useTabsContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const triggerRef = useRef<View>(null);
  
  const isActive = value === context.value;
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: context.animationVariant,
    overrides: context.animationConfig,
  });
  
  const duration = context.animationDuration ?? config.duration.normal;
  
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
      if (context.animated && isAnimated && shouldAnimate() && context.animationType === 'scale') {
        scale.value = withSequence(
          withSpring(0.95, { damping: 15, stiffness: 400 }),
          withSpring(1, config.spring)
        );
      }
      
      context.onValueChange(value);
    }
  };
  
  // Update indicator position when this tab becomes active
  useEffect(() => {
    if (isActive && triggerRef.current && context.animationType === 'slide') {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        triggerRef.current?.measureLayout(
          triggerRef.current.parent as any,
          (relativeX, relativeY, relativeWidth, relativeHeight) => {
            if (context.animated && isAnimated && shouldAnimate()) {
              context.indicatorPosition.value = withSpring(relativeX, config.spring);
              context.indicatorWidth.value = withSpring(relativeWidth, config.spring);
            } else {
              context.indicatorPosition.value = relativeX;
              context.indicatorWidth.value = relativeWidth;
            }
            
            // Store layout for future reference
            context.tabLayouts.current[value] = {
              x: relativeX,
              y: relativeY,
              width: relativeWidth,
              height: relativeHeight,
            };
          },
          () => {}
        );
      });
    }
  }, [isActive, value, context, isAnimated, shouldAnimate, config.spring]);
  
  // Update opacity on active state change
  useEffect(() => {
    if (context.animated && isAnimated && shouldAnimate() && context.animationType === 'fade') {
      opacity.value = withTiming(isActive ? 1 : 0.7, { duration });
    }
  }, [isActive, context.animated, isAnimated, shouldAnimate, context.animationType, duration]);

  const getBackgroundColor = () => {
    if (isActive) return theme.background;
    if (isPressed && !disabled) return theme.accent;
    if (isHovered && !disabled) return theme.accent + '80'; // 50% opacity
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return theme.mutedForeground + '80';
    if (isActive) return theme.foreground;
    return theme.mutedForeground;
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: context.animationType === 'fade' ? opacity.value : 1,
  }));
  
  const triggerStyle: ViewStyle = {
    paddingHorizontal: spacing[3 as SpacingScale],
    paddingVertical: spacing[1 as SpacingScale],
    borderRadius: componentSpacing.borderRadius,
    backgroundColor: getBackgroundColor(),
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    // Web-specific styles
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      cursor: disabled ? 'not-allowed' : 'pointer',
    } as any),
    // Active shadow
    ...(isActive && context.animationType !== 'slide' && {
      boxShadow: '0px 1px 2px theme.mutedForeground + "10"',
      elevation: 2,
    }),
  };

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
      style={[
        triggerStyle,
        context.animated && isAnimated && shouldAnimate() && context.animationType !== 'slide'
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
          <Box style={{ opacity: disabled ? 0.5 : 1 }}>
            {React.isValidElement(icon) ? React.cloneElement(icon, {
              color: getTextColor(),
            } as any) : icon}
          </Box>
        )}
        {typeof children === 'string' ? (
          <Text
            size="sm"
            weight="medium"
            style={{ color: getTextColor() }}
          >
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
  style?: ViewStyle;
}

const TabsContent: React.FC<TabsContentProps> = ({ value, children, style }) => {
  const context = useTabsContext();
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: context.animationVariant,
    overrides: context.animationConfig,
  });
  
  const duration = context.animationDuration ?? config.duration.normal;
  
  if (value !== context.value) {
    return null;
  }
  
  // Web CSS animations
  const webAnimationStyle = Platform.OS === 'web' && context.animated && isAnimated && shouldAnimate() ? {
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    animation: `fadeIn ${duration}ms ease-out`,
  } as any : {};
  
  return (
    <AnimatedBox
      mt={2}
      style={[webAnimationStyle, style]}
      entering={Platform.OS !== 'web' && context.animated && isAnimated && shouldAnimate()
        ? FadeIn.duration(duration)
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