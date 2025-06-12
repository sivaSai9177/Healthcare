import React, { useEffect } from 'react';
import { View, Pressable, ViewStyle, ScrollView, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { HStack } from './Stack';
import { Text } from './Text';
import { UniversalLink } from './Link';
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
const AnimatedView = Animated.View;

export type BreadcrumbAnimationType = 'stagger' | 'fade' | 'none';

// Breadcrumb Props
export interface BreadcrumbProps {
  children: React.ReactNode;
  separator?: React.ReactNode;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: BreadcrumbAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

// Breadcrumb Item Wrapper for animations
interface BreadcrumbItemWrapperProps {
  children: React.ReactNode;
  index: number;
  animated: boolean;
  animationVariant: AnimationVariant;
  animationType: BreadcrumbAnimationType;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
  useHaptics: boolean;
}

const BreadcrumbItemWrapper: React.FC<BreadcrumbItemWrapperProps> = ({
  children,
  index,
  animated,
  animationVariant,
  animationType,
  animationConfig,
}) => {
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-10);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate() && animationType !== 'none') {
      const delay = animationType === 'stagger' ? index * 50 : 0;
      
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: config.duration.normal })
      );
      
      if (animationType === 'stagger') {
        translateX.value = withDelay(
          delay,
          withSpring(0, config.spring)
        );
      }
    } else {
      opacity.value = 1;
      translateX.value = 0;
    }
  }, [index, animated, isAnimated, shouldAnimate, animationType, config]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: animationType === 'stagger' ? [{ translateX: translateX.value }] : [],
  }));
  
  if (!animated || !isAnimated || !shouldAnimate() || animationType === 'none') {
    return <>{children}</>;
  }
  
  return (
    <AnimatedView style={animatedStyle}>
      {children}
    </AnimatedView>
  );
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  children,
  separator,
  style,
  animated = true,
  animationVariant = 'moderate',
  animationType = 'stagger',
  animationDuration,
  useHaptics = true,
  animationConfig,
}) => {
  const theme = useTheme();
  const { componentSpacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const items = React.Children.toArray(children);
  const defaultSeparator = (
    <Symbol name="chevron.right"
      size={16}
      color={theme.mutedForeground}
    />
  );
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 0 }}
    >
      <HStack spacing={2} alignItems="center" style={style}>
        {items.map((item, index) => (
          <BreadcrumbItemWrapper
            key={index}
            index={index}
            animated={animated}
            animationVariant={animationVariant}
            animationType={animationType}
            animationConfig={animationConfig}
            useHaptics={useHaptics}
          >
            {item}
            {index < items.length - 1 && (
              <View>{separator || defaultSeparator}</View>
            )}
          </BreadcrumbItemWrapper>
        ))}
      </HStack>
    </ScrollView>
  );
};

// Breadcrumb Item Props
export interface BreadcrumbItemProps {
  children: React.ReactNode;
  href?: string;
  onPress?: () => void;
  disabled?: boolean;
  current?: boolean;
}

export const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({
  children,
  href,
  onPress,
  disabled = false,
  current = false,
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: 'moderate',
  });
  
  const handlePressIn = () => {
    if (shouldAnimate() && isAnimated) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    }
  };
  
  const handlePressOut = () => {
    if (shouldAnimate() && isAnimated) {
      scale.value = withSpring(1, config.spring);
    }
  };
  
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      haptic('selection');
    }
    onPress?.();
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  // If it's a link
  if (href && !disabled && !current) {
    return (
      <UniversalLink href={href as any} variant="ghost">
        <Text
          size="sm"
          colorTheme="foreground"
        >
          {children}
        </Text>
      </UniversalLink>
    );
  }
  
  // If it has onPress
  if (onPress && !disabled && !current) {
    return (
      <AnimatedPressable 
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {({ pressed }) => (
          <Text
            size="sm"
            colorTheme="foreground"
            style={{
              opacity: pressed ? 0.7 : 1,
            }}
          >
            {children}
          </Text>
        )}
      </AnimatedPressable>
    );
  }
  
  // Static item (current or disabled)
  return (
    <Text
      size="sm"
      colorTheme={current ? 'foreground' : 'mutedForeground'}
      weight={current ? 'medium' : 'normal'}
      style={{
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </Text>
  );
};

// Breadcrumb Ellipsis
export const BreadcrumbEllipsis: React.FC = () => {
  const theme = useTheme();
  const { componentSpacing } = useSpacing();
  
  return (
    <View style={{ paddingHorizontal: 4 }}>
      <Symbol name="ellipsis"
        size={componentSpacing.iconSize.sm}
        color={theme.mutedForeground}
      />
    </View>
  );
};

// Convenience component for common breadcrumb patterns
export interface SimpleBreadcrumbProps {
  items: {
    label: string;
    href?: string;
    onPress?: () => void;
    current?: boolean;
  }[];
  separator?: React.ReactNode;
  showHome?: boolean;
  homeLabel?: string;
  homeHref?: string;
  onHomePress?: () => void;
  maxItems?: number;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: BreadcrumbAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const SimpleBreadcrumb: React.FC<SimpleBreadcrumbProps> = ({
  items,
  separator,
  showHome = true,
  homeLabel = 'Home',
  homeHref = '/',
  onHomePress,
  maxItems,
  style,
  animated = true,
  animationVariant = 'moderate',
  animationType = 'stagger',
  animationDuration,
  useHaptics = true,
  animationConfig,
}) => {
  const theme = useTheme();
  const { componentSpacing } = useSpacing();
  
  // Add home item if needed
  const allItems = showHome
    ? [{ label: homeLabel, href: homeHref, onPress: onHomePress }, ...items]
    : items;
  
  // Handle max items with ellipsis
  let displayItems = allItems;
  let showEllipsis = false;
  
  if (maxItems && allItems.length > maxItems) {
    const firstItem = allItems[0];
    const lastItems = allItems.slice(-(maxItems - 2));
    displayItems = [firstItem, { label: '...', isEllipsis: true }, ...lastItems];
    showEllipsis = true;
  }
  
  return (
    <Breadcrumb 
      separator={separator} 
      style={style}
      animated={animated}
      animationVariant={animationVariant}
      animationType={animationType}
      animationDuration={animationDuration}
      useHaptics={useHaptics}
      animationConfig={animationConfig}
    >
      {displayItems.map((item, index) => {
        if ('isEllipsis' in item && item.isEllipsis) {
          return <BreadcrumbEllipsis key={`ellipsis-${index}`} />;
        }
        
        const isLast = index === displayItems.length - 1;
        return (
          <BreadcrumbItem
            key={item.label}
            href={item.href}
            onPress={item.onPress}
            current={item.current || isLast}
          >
            {item.label}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};

// Breadcrumb with icons
export interface IconBreadcrumbItemProps extends BreadcrumbItemProps {
  icon?: string;
}

export const IconBreadcrumbItem: React.FC<IconBreadcrumbItemProps> = ({
  icon,
  children,
  ...props
}) => {
  const theme = useTheme();
  const { componentSpacing } = useSpacing();
  
  return (
    <BreadcrumbItem {...props}>
      <HStack spacing={1} alignItems="center">
        {icon && (
          <Symbol
            name="icon as any"
            size={componentSpacing.iconSize.sm}
            color={props.current ? theme.foreground : theme.mutedForeground}
          />
        )}
        {children}
      </HStack>
    </BreadcrumbItem>
  );
};