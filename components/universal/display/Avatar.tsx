import React, { useEffect, useState } from 'react';
import { View, Image, ImageSourcePropType, ViewStyle, ImageStyle, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from '@/components/universal/display/Symbols';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { useShadow } from '@/hooks/useShadow';

export type AvatarSize = 'xs' | 'sm' | 'default' | 'lg' | 'xl' | '2xl';
export type AvatarAnimationType = 'fade' | 'zoom' | 'scale' | 'none';

export interface AvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: AvatarSize;
  rounded?: 'full' | 'md' | 'lg' | 'none';
  showFallback?: boolean;
  fallbackIcon?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  status?: 'online' | 'offline' | 'busy' | 'away' | 'none';
  className?: string;
  shadow?: 'sm' | 'base' | 'md' | 'lg' | 'none';
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  onPress?: () => void;
  
  // Animation props
  animated?: boolean;
  animationType?: AvatarAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  hoverScale?: number;
  pressScale?: number;
  useHaptics?: boolean;
}

// Size configurations
const sizeConfig = {
  xs: { size: 24, fontSize: 'xs' as const, iconSize: 12, statusSize: 6 },
  sm: { size: 32, fontSize: 'sm' as const, iconSize: 16, statusSize: 8 },
  default: { size: 40, fontSize: 'base' as const, iconSize: 20, statusSize: 10 },
  lg: { size: 56, fontSize: 'lg' as const, iconSize: 28, statusSize: 12 },
  xl: { size: 72, fontSize: 'xl' as const, iconSize: 36, statusSize: 14 },
  '2xl': { size: 96, fontSize: '2xl' as const, iconSize: 48, statusSize: 16 },
};

// Variant classes
const variantClasses = {
  default: 'bg-muted',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
};

// Status colors
const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
  none: '',
};

// Border radius mappings
const roundedMap = {
  full: 9999,
  lg: 12,
  md: 8,
  none: 0,
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedImage = Animated.createAnimatedComponent(Image);

export const Avatar = React.forwardRef<View, AvatarProps>(({
  source,
  name = '',
  size = 'default',
  rounded = 'full',
  showFallback = true,
  fallbackIcon = 'person',
  variant = 'default',
  status = 'none',
  className,
  shadow = 'base',
  style,
  imageStyle,
  onPress,
  // Animation props
  animated = true,
  animationType = 'fade',
  animationDuration = 300,
  animationDelay = 0,
  hoverScale = 1.05,
  pressScale = 0.95,
  useHaptics = true,
}, ref) => {
  const { spacing } = useSpacing();
  const [imageError, setImageError] = useState(false);
  const { shouldAnimate } = useAnimationStore();
  const shadowStyle = useShadow(shadow);
  
  const config = sizeConfig[size];
  const borderRadius = roundedMap[rounded];
  
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(animationType === 'zoom' ? 0.5 : 1);
  const imageOpacity = useSharedValue(0);
  const isPressed = useSharedValue(0);
  const isHovered = useSharedValue(0);
  
  // Spring config
  const springConfig = {
    damping: 15,
    stiffness: 300,
  };
  
  // Initialize animations
  useEffect(() => {
    if (animated && shouldAnimate()) {
      setTimeout(() => {
        opacity.value = withTiming(1, { duration: animationDuration });
        if (animationType === 'zoom') {
          scale.value = withSpring(1, springConfig);
        }
      }, animationDelay);
    } else {
      opacity.value = 1;
      scale.value = 1;
    }
  }, []);
  
  // Handle image load
  const handleImageLoad = () => {
    if (animated && shouldAnimate()) {
      imageOpacity.value = withTiming(1, { duration: animationDuration });
    } else {
      imageOpacity.value = 1;
    }
  };
  
  // Handle press
  const handlePressIn = () => {
    if (animated && shouldAnimate()) {
      isPressed.value = withSpring(1, springConfig);
      if (useHaptics) {
        haptic('light');
      }
    }
  };
  
  const handlePressOut = () => {
    if (animated && shouldAnimate()) {
      isPressed.value = withSpring(0, springConfig);
    }
  };
  
  // Handle hover (web only)
  const handleHoverIn = () => {
    if (Platform.OS === 'web' && animated && shouldAnimate()) {
      isHovered.value = withSpring(1, springConfig);
    }
  };
  
  const handleHoverOut = () => {
    if (Platform.OS === 'web' && animated && shouldAnimate()) {
      isHovered.value = withSpring(0, springConfig);
    }
  };
  
  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { 
        scale: interpolate(
          isPressed.value + isHovered.value,
          [0, 1, 2],
          [scale.value, pressScale, hoverScale]
        )
      },
    ],
  }));
  
  const imageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));
  
  // Container classes
  const containerClasses = cn(
    'items-center justify-center overflow-hidden',
    variantClasses[variant],
    onPress && 'cursor-pointer',
    className
  );
  
  // Container style
  const containerStyle: ViewStyle = {
    width: config.size,
    height: config.size,
    borderRadius,
    ...shadowStyle,
    ...style,
  };
  
  const ViewComponent = onPress ? AnimatedPressable : Animated.View;
  
  const content = (
    <>
      {source && !imageError ? (
        <AnimatedImage
          source={source}
          style={[
            {
              width: config.size,
              height: config.size,
              borderRadius,
            },
            animated && shouldAnimate() ? imageAnimatedStyle : {},
            imageStyle,
          ]}
          onLoad={handleImageLoad}
          onError={() => setImageError(true)}
        />
      ) : showFallback ? (
        <View className="items-center justify-center">
          {name ? (
            <Text
              size={config.fontSize}
              weight="semibold"
              className={variant === 'default' ? 'text-foreground' : 'text-primary-foreground'}
            >
              {getInitials(name)}
            </Text>
          ) : (
            <Symbol
              name={fallbackIcon}
              size={config.iconSize}
              className={variant === 'default' ? 'text-foreground' : 'text-primary-foreground'}
            />
          )}
        </View>
      ) : null}
      
      {/* Status indicator */}
      {status !== 'none' && (
        <View
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            statusColors[status]
          )}
          style={{
            width: config.statusSize,
            height: config.statusSize,
          }}
        />
      )}
    </>
  );
  
  return (
    <ViewComponent
      ref={ref}
      className={containerClasses}
      style={[
        containerStyle,
        animated && shouldAnimate() ? containerAnimatedStyle : {},
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...(Platform.OS === 'web' && {
        onHoverIn: handleHoverIn,
        onHoverOut: handleHoverOut,
      } as any)}
    >
      {content}
    </ViewComponent>
  );
});

Avatar.displayName = 'Avatar';