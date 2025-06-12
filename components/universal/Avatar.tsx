import React, { useEffect } from 'react';
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
import { useTheme } from '@/lib/theme/provider';
import { Text } from './Text';

import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from './Symbols';
import { AnimationVariant } from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarAnimationType = 'fade' | 'zoom' | 'scale' | 'none';

export interface AvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: AvatarSize;
  rounded?: 'full' | 'md' | 'lg' | 'none';
  showFallback?: boolean;
  fallbackIcon?: keyof typeof any;
  bgColorTheme?: 'primary' | 'secondary' | 'accent' | 'muted';
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  onPress?: () => void;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: AvatarAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  hoverScale?: number;
  pressScale?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

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
  size = 'md',
  rounded = 'full',
  showFallback = true,
  fallbackIcon = 'person',
  bgColorTheme = 'muted',
  style,
  imageStyle,
  onPress,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'fade',
  animationDuration,
  animationDelay = 0,
  hoverScale = 1.05,
  pressScale = 0.95,
  useHaptics = true,
  animationConfig,
}, ref) => {
  const theme = useTheme();
  const { componentSpacing } = useSpacing();
  const [imageError, setImageError] = React.useState(false);
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.normal;
  
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(animationType === 'zoom' ? 0.5 : 1);
  const imageOpacity = useSharedValue(0);
  const isPressed = useSharedValue(0);
  
  // Initialize animations
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      setTimeout(() => {
        if (animationType === 'fade') {
          opacity.value = withTiming(1, { duration });
        } else if (animationType === 'zoom') {
          opacity.value = withTiming(1, { duration: duration / 2 });
          scale.value = withSpring(1, config.spring);
        } else if (animationType === 'scale') {
          opacity.value = withTiming(1, { duration: duration / 2 });
          scale.value = withTiming(1, { duration });
        }
      }, animationDelay);
    } else {
      opacity.value = 1;
      scale.value = 1;
    }
  }, [animated, isAnimated, shouldAnimate, animationType, animationDelay, duration, config.spring, opacity, scale]);
  
  // Image load animation
  const handleImageLoad = () => {
    if (animated && isAnimated && shouldAnimate()) {
      imageOpacity.value = withTiming(1, { duration: config.duration.fast });
    } else {
      imageOpacity.value = 1;
    }
  };

  // Size mapping for avatars based on density
  const sizeMap = {
    xs: Math.round(componentSpacing.avatarSize * 0.6),  // 60% of base
    sm: Math.round(componentSpacing.avatarSize * 0.8),  // 80% of base
    md: componentSpacing.avatarSize,                     // 100% of base
    lg: Math.round(componentSpacing.avatarSize * 1.2),  // 120% of base
    xl: Math.round(componentSpacing.avatarSize * 1.4),  // 140% of base
    '2xl': Math.round(componentSpacing.avatarSize * 1.6), // 160% of base
  };

  const avatarSize = sizeMap[size];
  const fontSize = {
    xs: 10,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 30,
  }[size];

  const iconSize = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    '2xl': 48,
  }[size];

  const borderRadius = {
    full: avatarSize / 2,
    lg: 12,
    md: 8,
    none: 0,
  }[rounded];

  // Theme-aware background colors
  const bgColors = {
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,
    muted: theme.muted,
  };

  const textColors = {
    primary: theme.primaryForeground,
    secondary: theme.secondaryForeground,
    accent: theme.accentForeground,
    muted: theme.mutedForeground,
  };

  const backgroundColor = bgColors[bgColorTheme];
  const textColor = textColors[bgColorTheme];

  const showImageFallback = !source || imageError;
  const initials = getInitials(name);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const currentScale = interpolate(
      isPressed.value,
      [0, 1],
      [1, pressScale]
    );
    
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value * currentScale },
      ],
    };
  });
  
  const imageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));
  
  const handlePressIn = () => {
    if (animated && isAnimated && shouldAnimate()) {
      isPressed.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };
  
  const handlePressOut = () => {
    if (animated && isAnimated && shouldAnimate()) {
      isPressed.value = withSpring(0, { damping: 15, stiffness: 400 });
    }
  };
  
  const handlePress = () => {
    if (useHaptics) {
      haptic('impact');
    }
    onPress?.();
  };
  
  const content = (
    <Animated.View
      ref={ref}
      style={[
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
        animated && isAnimated && shouldAnimate() ? containerAnimatedStyle : {},
      ]}
      entering={Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && animationType === 'zoom'
        ? ZoomIn.duration(duration).delay(animationDelay)
        : Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && animationType === 'fade'
        ? FadeIn.duration(duration).delay(animationDelay)
        : undefined
      }
    >
      {!showImageFallback && source ? (
        <AnimatedImage
          source={source}
          style={[
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius,
            },
            imageStyle,
            animated && isAnimated && shouldAnimate() ? imageAnimatedStyle : {},
          ]}
          onError={() => setImageError(true)}
          onLoad={handleImageLoad}
        />
      ) : showFallback ? (
        initials ? (
          <Text
            style={{
              fontSize,
              fontWeight: '600',
              color: textColor,
            }}
          >
            {initials}
          </Text>
        ) : (
          <Symbol
            name="fallbackIcon"
            size={iconSize}
            color={textColor}
          />
        )
      ) : null}
    </Animated.View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
});

Avatar.displayName = 'Avatar';

// Avatar Group Component
export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
  spacing?: number;
  style?: ViewStyle;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 3,
  size = 'md',
  spacing = -8,
  style,
}) => {
  const theme = useTheme();
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {visibleChildren.map((child, index) => (
        <View
          key={index}
          style={{
            marginLeft: index === 0 ? 0 : spacing,
            zIndex: visibleChildren.length - index,
          }}
        >
          {React.cloneElement(child as React.ReactElement<AvatarProps>, {
            size,
            style: {
              borderWidth: 2,
              borderColor: theme.background,
            },
          })}
        </View>
      ))}
      {remainingCount > 0 && (
        <Avatar
          size={size}
          name={`+${remainingCount}`}
          bgColorTheme="primary"
          style={{
            marginLeft: spacing,
            borderWidth: 2,
            borderColor: theme.background,
          }}
        />
      )}
    </View>
  );
};
