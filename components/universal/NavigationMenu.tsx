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
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { HStack, VStack } from './Stack';
import { Text } from './Text';

import { Symbol } from './Symbols';
import { 
  SpacingScale,
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type NavigationMenuAnimationType = 'slide' | 'fade' | 'scale' | 'none';

// Navigation Menu Context
interface NavigationMenuContextValue {
  value: string;
  onValueChange: (value: string) => void;
  animated: boolean;
  animationVariant: AnimationVariant;
  animationType: NavigationMenuAnimationType;
  animationDuration?: number;
  useHaptics: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
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
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: NavigationMenuAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  children,
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  orientation = 'horizontal',
  style,
  animated = true,
  animationVariant = 'moderate',
  animationType = 'scale',
  animationDuration,
  useHaptics = true,
  animationConfig,
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
      animationVariant,
      animationType,
      animationDuration,
      useHaptics,
      animationConfig,
    }),
    [value, animated, animationVariant, animationType, animationDuration, useHaptics, animationConfig]
  );
  
  const Container = orientation === 'horizontal' ? HStack : VStack;
  
  return (
    <NavigationMenuContext.Provider value={contextValue}>
      <View style={style}>
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
  const theme = useTheme();
  const { spacing, componentSpacing } = useSpacing();
  const { value, onValueChange, animated, animationVariant, animationType, useHaptics: contextUseHaptics, animationConfig } = useNavigationMenu();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const isActive = controlledActive ?? value === itemValue;
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const backgroundColor = useSharedValue(0);
  
  // Update animations when active state changes
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      if (animationType === 'scale') {
        scale.value = withSpring(isActive ? 1.05 : 1, config.spring);
      }
      if (animationType === 'fade') {
        opacity.value = withTiming(isActive ? 1 : 0.7, { duration: config.duration.normal });
      }
      backgroundColor.value = withTiming(isActive ? 1 : 0, { duration: config.duration.fast });
    }
  }, [isActive, animated, isAnimated, shouldAnimate, animationType, config]);
  
  const handlePress = () => {
    if (!disabled) {
      // Haptic feedback
      if (contextUseHaptics && Platform.OS !== 'web') {
        haptic('selection');
      }
      
      // Press animation
      if (animated && isAnimated && shouldAnimate() && animationType === 'scale') {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
        setTimeout(() => {
          scale.value = withSpring(isActive ? 1.05 : 1, config.spring);
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
  
  const backgroundStyle = useAnimatedStyle(() => {
    const interpolatedColor = backgroundColor.value === 1 ? theme.accent : 'transparent';
    return {
      backgroundColor: interpolatedColor,
    };
  });
  
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
        <Animated.View
          style={[
            {
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[2],
              borderRadius: componentSpacing.borderRadius.md,
              backgroundColor: pressed && !isActive ? theme.muted : 'transparent',
            },
            animated && isAnimated && shouldAnimate() ? backgroundStyle : {
              backgroundColor: isActive ? theme.accent : 'transparent'
            },
            Platform.OS === 'web' && animated && isAnimated && shouldAnimate() && {
              transition: 'all 0.2s ease',
            } as any,
          ]}
        >
          {typeof children === 'string' ? (
            <Text
              size="sm"
              weight={isActive ? 'medium' : 'normal'}
              colorTheme={isActive ? 'accentForeground' : 'foreground'}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </Animated.View>
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
  const { value, animated, animationVariant, animationType, animationConfig } = useNavigationMenu();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const isActive = value === contentValue;
  
  if (!isActive && !forceMount) {
    return null;
  }
  
  const getEnteringAnimation = () => {
    if (!animated || !isAnimated || !shouldAnimate() || animationType === 'none') {
      return undefined;
    }
    
    switch (animationType) {
      case 'slide':
        return SlideInDown.duration(config.duration.normal);
      case 'fade':
        return FadeIn.duration(config.duration.normal);
      case 'scale':
        return FadeIn.duration(config.duration.normal).springify();
      default:
        return undefined;
    }
  };
  
  const getExitingAnimation = () => {
    if (!animated || !isAnimated || !shouldAnimate() || animationType === 'none') {
      return undefined;
    }
    
    switch (animationType) {
      case 'slide':
        return SlideOutUp.duration(config.duration.fast);
      case 'fade':
        return FadeOut.duration(config.duration.fast);
      case 'scale':
        return FadeOut.duration(config.duration.fast);
      default:
        return undefined;
    }
  };
  
  // Web CSS animations
  const webAnimationStyle = Platform.OS === 'web' && animated && isAnimated && shouldAnimate() ? {
    '@keyframes slideIn': {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    animation: `slideIn ${config.duration.normal}ms ease-out`,
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
  const theme = useTheme();
  const { spacing, componentSpacing } = useSpacing();
  
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
          style={{
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderRadius: componentSpacing.borderRadius.md,
            backgroundColor: active 
              ? theme.accent 
              : pressed 
                ? theme.muted 
                : 'transparent',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {typeof children === 'string' ? (
            <Text
              size="sm"
              weight={active ? 'medium' : 'normal'}
              colorTheme={active ? 'accentForeground' : 'foreground'}
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
  animationVariant?: AnimationVariant;
  animationType?: NavigationMenuAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
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
  animationVariant = 'moderate',
  animationType = 'scale',
  animationDuration,
  useHaptics = true,
  animationConfig,
}) => {
  const theme = useTheme();
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
        animationVariant={animationVariant}
        animationType={animationType}
        animationDuration={animationDuration}
        useHaptics={useHaptics}
        animationConfig={animationConfig}
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
                  name="item.icon as any"
                  size={componentSpacing.iconSize.sm}
                  color={
                    activeValue === item.value
                      ? theme.accentForeground
                      : theme.foreground
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