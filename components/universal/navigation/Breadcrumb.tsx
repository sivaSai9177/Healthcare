import React, { useEffect } from 'react';
import { View, Pressable, ViewStyle, ScrollView, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { HStack } from '@/components/universal/layout/Stack';
import { Text } from '@/components/universal/typography/Text';
import { UniversalLink } from './Link';
import { Symbol } from '@/components/universal/display/Symbols';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type BreadcrumbAnimationType = 'stagger' | 'fade' | 'none';

// Spring config
const springConfig = {
  damping: 20,
  stiffness: 300,
};

// Breadcrumb Props
export interface BreadcrumbProps {
  children: React.ReactNode;
  separator?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationType?: BreadcrumbAnimationType;
  animationDuration?: number;
}

// Breadcrumb Item Wrapper for animations
interface BreadcrumbItemWrapperProps {
  children: React.ReactNode;
  index: number;
  animated: boolean;
  animationType: BreadcrumbAnimationType;
  animationDuration: number;
}

const BreadcrumbItemWrapper: React.FC<BreadcrumbItemWrapperProps> = ({
  children,
  index,
  animated,
  animationType,
  animationDuration,
}) => {
  const { shouldAnimate } = useAnimationStore();
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-10);
  
  useEffect(() => {
    // Skip animations on web or when disabled
    if (Platform.OS === 'web' || !animated || !shouldAnimate() || animationType === 'none') {
      opacity.value = 1;
      translateX.value = 0;
      return;
    }
    
    const delay = animationType === 'stagger' ? index * 50 : 0;
    
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: animationDuration })
    );
    
    if (animationType === 'stagger') {
      translateX.value = withDelay(
        delay,
        withSpring(0, springConfig)
      );
    }
  }, [index, animationType, animationDuration, animated, opacity, translateX, shouldAnimate]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: animationType === 'stagger' ? [{ translateX: translateX.value }] : [],
  }));
  
  // Skip animations on web completely
  if (Platform.OS === 'web' || !animated || !shouldAnimate() || animationType === 'none') {
    return <>{children}</>;
  }
  
  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  children,
  separator,
  className,
  style,
  animated = true,
  animationType = 'stagger',
  animationDuration = 300,
}) => {
  
  const items = React.Children.toArray(children);
  const defaultSeparator = (
    <Symbol
      name="chevron.right"
      size={16}
      className="text-muted-foreground"
    />
  );
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 0 }}
    >
      <HStack spacing={2} alignItems="center" className={className} style={style}>
        {items.map((item, index) => (
          <BreadcrumbItemWrapper
            key={index}
            index={index}
            animated={animated}
            animationType={animationType}
            animationDuration={animationDuration}
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
  className?: string;
}

export const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({
  children,
  href,
  onPress,
  disabled = false,
  current = false,
  className,
}) => {
  const { shouldAnimate } = useAnimationStore();
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  // Skip animations on web
  const useAnimations = Platform.OS !== 'web' && shouldAnimate();
  
  const handlePressIn = () => {
    if (useAnimations) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    }
  };
  
  const handlePressOut = () => {
    if (useAnimations) {
      scale.value = withSpring(1, springConfig);
    }
  };
  
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      haptic('selection');
    }
    onPress?.();
  };
  
  // If it's a link
  if (href && !disabled && !current) {
    return (
      <UniversalLink href={href as any} variant="ghost" className={className}>
        <Text
          size="sm"
          className="text-foreground"
        >
          {children}
        </Text>
      </UniversalLink>
    );
  }
  
  // If it has onPress
  if (onPress && !disabled && !current) {
    const PressableComponent = useAnimations ? AnimatedPressable : Pressable;
    return (
      <PressableComponent 
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={useAnimations ? animatedStyle : undefined}
      >
        {({ pressed }) => (
          <Text
            size="sm"
            className="text-foreground"
            style={{
              opacity: pressed ? 0.7 : 1,
            }}
          >
            {children}
          </Text>
        )}
      </PressableComponent>
    );
  }
  
  // Static item (current or disabled)
  return (
    <Text
      size="sm"
      className={current ? 'text-foreground' : 'text-muted-foreground'}
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
  return (
    <View className="px-1">
      <Symbol name="ellipsis"
        size={16}
        className="text-muted-foreground"
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
  animationType?: BreadcrumbAnimationType;
  animationDuration?: number;
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
  animationType = 'stagger',
  animationDuration = 300,
}) => {
  
  // Add home item if needed
  const allItems = showHome
    ? [{ label: homeLabel, href: homeHref, onPress: onHomePress }, ...items]
    : items;
  
  // Handle max items with ellipsis
  let displayItems: (typeof allItems[0] | { isEllipsis: true })[] = allItems;
  
  if (maxItems && allItems.length > maxItems) {
    const firstItem = allItems[0];
    const lastItems = allItems.slice(-(maxItems - 2));
    displayItems = [firstItem, { isEllipsis: true }, ...lastItems];
  }
  
  return (
    <Breadcrumb 
      separator={separator} 
      style={style}
      animated={animated}
      animationType={animationType}
      animationDuration={animationDuration}
    >
      {displayItems.map((item, index) => {
        if ('isEllipsis' in item && item.isEllipsis) {
          return <BreadcrumbEllipsis key={`ellipsis-${index}`} />;
        }
        
        const isLast = index === displayItems.length - 1;
        return (
          <BreadcrumbItem
            key={(item as any).label}
            href={(item as any).href}
            onPress={(item as any).onPress}
            current={(item as any).current || isLast}
          >
            {(item as any).label}
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
  return (
    <BreadcrumbItem {...props}>
      <HStack spacing={1} alignItems="center">
        {icon && (
          <Symbol
            name={icon as any}
            size={16}
            className={props.current ? 'text-foreground' : 'text-muted-foreground'}
          />
        )}
        {children}
      </HStack>
    </BreadcrumbItem>
  );
};