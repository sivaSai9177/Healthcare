import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Pressable, ViewStyle, ScrollView, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';
import { useSpacing } from '@/lib/stores/spacing-store';
import { HStack, VStack } from '@/components/universal/layout/Stack';
import { Text } from '@/components/universal/typography/Text';
import { Symbol } from '@/components/universal/display/Symbols';
import { SpacingScale } from '@/lib/design';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { cn } from '@/lib/core/utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type NavigationMenuAnimationType = 'slide' | 'fade' | 'scale' | 'none';

// Navigation Menu Context
interface NavigationMenuContextValue {
  value: string;
  onValueChange: (value: string) => void;
  animated: boolean;
  animationType: NavigationMenuAnimationType;
  animationDuration: number;
  useHaptics: boolean;
}

const NavigationMenuContext = createContext<NavigationMenuContextValue | null>(null);

const useNavigationMenu = () => {
  const context = useContext(NavigationMenuContext);
  if (!context) {
    throw new Error('useNavigationMenu must be used within NavigationMenu');
  }
  return context;
};

// Navigation Menu Props
export interface NavigationMenuProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationType?: NavigationMenuAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  children,
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  orientation = 'horizontal',
  className,
  style,
  animated = true,
  animationType = 'scale',
  animationDuration = 300,
  useHaptics = true,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const value = controlledValue ?? internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (!controlledValue) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };
  
  const contextValue = React.useMemo(
    () => ({ 
      value, 
      onValueChange: handleValueChange,
      animated,
      animationType,
      animationDuration,
      useHaptics,
    }),
    [value, animated, animationType, animationDuration, useHaptics]
  );
  
  const Container = orientation === 'horizontal' ? HStack : VStack;
  
  return (
    <NavigationMenuContext.Provider value={contextValue}>
      <View className={className} style={style}>
        <ScrollView
          horizontal={orientation === 'horizontal'}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <Container spacing={1}>
            {children}
          </Container>
        </ScrollView>
      </View>
    </NavigationMenuContext.Provider>
  );
};

// Navigation Menu Item Props
export interface NavigationMenuItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
  onPress?: () => void;
}

export const NavigationMenuItem: React.FC<NavigationMenuItemProps> = ({
  value: itemValue,
  children,
  disabled = false,
  active: controlledActive,
  onPress,
}) => {
  const { spacing, componentSpacing } = useSpacing();
  const { value, onValueChange, animated, animationType, animationDuration, useHaptics: contextUseHaptics } = useNavigationMenu();
  const { shouldAnimate } = useAnimationStore();
  
  const isActive = controlledActive ?? value === itemValue;
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const backgroundColor = useSharedValue(0);
  
  // Spring config
  const springConfig = {
    damping: 20,
    stiffness: 300,
  };

  // Update animations when active state changes
  useEffect(() => {
    if (animated && shouldAnimate()) {
      if (animationType === 'scale') {
        scale.value = withSpring(isActive ? 1.05 : 1, springConfig);
      }
      if (animationType === 'fade') {
        opacity.value = withTiming(isActive ? 1 : 0.7, { duration: animationDuration });
      }
      backgroundColor.value = withTiming(isActive ? 1 : 0, { duration: animationDuration });
    }
  }, [isActive, animated, shouldAnimate, animationType, animationDuration]);
  
  const handlePress = () => {
    if (!disabled) {
      // Haptic feedback
      if (contextUseHaptics && Platform.OS !== 'web') {
        haptic('selection');
      }
      
      // Press animation
      if (animated && shouldAnimate() && animationType === 'scale') {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
        setTimeout(() => {
          scale.value = withSpring(isActive ? 1.05 : 1, springConfig);
        }, 100);
      }
      
      onValueChange(itemValue);
      onPress?.();
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: animationType === 'fade' ? opacity.value : 1,
  }));
  
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundColor.value,
  }));
  
  return (
    <AnimatedPressable 
      onPress={handlePress} 
      disabled={disabled}
      style={[
        animatedStyle,
        { opacity: disabled ? 0.5 : 1 }
      ]}
    >
      {({ pressed }) => (
        <View className="relative">
          <Animated.View
            className={cn(
              "absolute inset-0 bg-accent rounded-md",
              !isActive && "opacity-0"
            )}
            style={animated && shouldAnimate() ? backgroundStyle : {}}
          />
          <View
            className={cn(
              "px-3 py-2 rounded-md relative",
              pressed && !isActive && "bg-muted",
              Platform.OS === 'web' && animated && shouldAnimate() && "transition-all duration-200"
            )}
          >
            {typeof children === 'string' ? (
              <Text
                size="sm"
                weight={isActive ? 'medium' : 'normal'}
                className={isActive ? 'text-accent-foreground' : 'text-foreground'}
              >
                {children}
              </Text>
            ) : (
              children
            )}
          </View>
        </View>
      )}
    </AnimatedPressable>
  );
};

// Navigation Menu Content Props
export interface NavigationMenuContentProps {
  value: string;
  children: React.ReactNode;
  forceMount?: boolean;
}

export const NavigationMenuContent: React.FC<NavigationMenuContentProps> = ({
  value: contentValue,
  children,
  forceMount = false,
}) => {
  const { value, animated, animationType, animationDuration } = useNavigationMenu();
  const { shouldAnimate } = useAnimationStore();
  
  const isActive = value === contentValue;
  
  if (!isActive && !forceMount) {
    return null;
  }
  
  const getEnteringAnimation = () => {
    if (!animated || !shouldAnimate() || animationType === 'none') {
      return undefined;
    }
    
    switch (animationType) {
      case 'slide':
        return SlideInDown.duration(animationDuration);
      case 'fade':
        return FadeIn.duration(animationDuration);
      case 'scale':
        return FadeIn.duration(animationDuration).springify();
      default:
        return undefined;
    }
  };
  
  const getExitingAnimation = () => {
    if (!animated || !shouldAnimate() || animationType === 'none') {
      return undefined;
    }
    
    switch (animationType) {
      case 'slide':
        return SlideOutUp.duration(animationDuration * 0.7);
      case 'fade':
        return FadeOut.duration(animationDuration * 0.7);
      case 'scale':
        return FadeOut.duration(animationDuration * 0.7);
      default:
        return undefined;
    }
  };
  
  // Web CSS animations
  const webAnimationStyle = Platform.OS === 'web' && animated && shouldAnimate() ? {
    '@keyframes slideIn': {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    animation: `slideIn ${animationDuration}ms ease-out`,
  } as any : {};
  
  return (
    <Animated.View
      entering={Platform.OS !== 'web' ? getEnteringAnimation() : undefined}
      exiting={Platform.OS !== 'web' ? getExitingAnimation() : undefined}
      style={[
        {
          display: isActive ? 'flex' : 'none',
        },
        webAnimationStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Navigation Menu Link
export interface NavigationMenuLinkProps {
  href?: string;
  onPress?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
}

export const NavigationMenuLink: React.FC<NavigationMenuLinkProps> = ({
  href,
  onPress,
  children,
  disabled = false,
  active = false,
}) => {
  
  const handlePress = () => {
    if (!disabled) {
      onPress?.();
      // Handle href navigation if needed
    }
  };
  
  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      {({ pressed }) => (
        <View
          className={cn(
            "px-3 py-2 rounded-md",
            active && "bg-accent",
            pressed && !active && "bg-muted",
            disabled && "opacity-50"
          )}
        >
          {typeof children === 'string' ? (
            <Text
              size="sm"
              weight={active ? 'medium' : 'normal'}
              className={active ? 'text-accent-foreground' : 'text-foreground'}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  );
};

// Simple Navigation Menu
export interface SimpleNavigationMenuItem {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface SimpleNavigationMenuProps {
  items: SimpleNavigationMenuItem[];
  defaultValue?: string;
  orientation?: 'horizontal' | 'vertical';
  showContent?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  onItemPress?: (value: string) => void;
  
  // Animation props
  animated?: boolean;
  animationType?: NavigationMenuAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
}

export const SimpleNavigationMenu: React.FC<SimpleNavigationMenuProps> = ({
  items,
  defaultValue,
  orientation = 'horizontal',
  showContent = true,
  style,
  contentStyle,
  onItemPress,
  animated = true,
  animationType = 'scale',
  animationDuration = 300,
  useHaptics = true,
}) => {
  const { spacing, componentSpacing } = useSpacing();
  const [activeValue, setActiveValue] = useState(defaultValue || items[0]?.value || '');
  
  return (
    <VStack spacing={3}>
      <NavigationMenu
        value={activeValue}
        onValueChange={setActiveValue}
        orientation={orientation}
        style={style}
        animated={animated}
        animationType={animationType}
        animationDuration={animationDuration}
        useHaptics={useHaptics}
      >
        {items.map((item) => (
          <NavigationMenuItem
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            onPress={() => onItemPress?.(item.value)}
          >
            <HStack spacing={2} alignItems="center">
              {item.icon && (
                <Symbol
                  name={item.icon as any}
                  size={componentSpacing.iconSize.sm}
                  className={
                    activeValue === item.value
                      ? 'text-accent-foreground'
                      : 'text-foreground'
                  }
                />
              )}
              <Text>{item.label}</Text>
            </HStack>
          </NavigationMenuItem>
        ))}
      </NavigationMenu>
      
      {showContent && (
        <View style={contentStyle}>
          {items.map((item) => (
            item.content && (
              <NavigationMenuContent key={item.value} value={item.value}>
                {item.content}
              </NavigationMenuContent>
            )
          ))}
        </View>
      )}
    </VStack>
  );
};