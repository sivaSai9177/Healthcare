import React, { useState, useEffect } from 'react';
import { View, Pressable, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from '@/components/universal/display/Symbols';
import { 
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

// AnimatedIcon is handled internally by Symbol component
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type RatingAnimationType = 'fill' | 'bounce' | 'glow' | 'none';

// Star component to handle individual star animations
interface StarProps {
  index: number;
  value: number;
  hoverValue: number | null;
  iconSize: number;
  iconMap: any;
  icon: string;
  ratingColor: string;
  emptyRatingColor: string;
  spacing: number;
  isInteractive: boolean;
  allowHalf: boolean;
  animated: boolean;
  shouldAnimate: () => boolean;
  animationType: RatingAnimationType;
  scale: Animated.SharedValue<number>;
  opacity: Animated.SharedValue<number>;
  rotation: Animated.SharedValue<number>;
  onPress: (index: number, isHalf?: boolean) => void;
  onHover: (index: number, isHalf?: boolean) => void;
  onHoverEnd: () => void;
}

const RatingStar: React.FC<StarProps> = ({
  index,
  value,
  hoverValue,
  iconSize,
  iconMap,
  icon,
  ratingColor,
  emptyRatingColor,
  spacing,
  isInteractive,
  allowHalf,
  animated,
  shouldAnimate,
  animationType,
  scale,
  opacity,
  rotation,
  onPress,
  onHover,
  onHoverEnd,
}) => {
  const getIconName = (isHalf: boolean = false): string => {
    const displayValue = hoverValue !== null ? hoverValue : value;
    
    if (index < Math.floor(displayValue)) {
      return iconMap[icon].filled;
    } else if (isHalf && index === Math.floor(displayValue) && displayValue % 1 >= 0.5) {
      return iconMap[icon].filled;
    } else {
      return iconMap[icon].empty;
    }
  };

  const getIconColor = () => {
    const displayValue = hoverValue !== null ? hoverValue : value;
    return index < displayValue ? ratingColor : emptyRatingColor;
  };
  
  // Create animated style for this star
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));
  
  if (allowHalf && isInteractive) {
    return (
      <View key={index} style={{ position: 'relative' }}>
        {/* Left half */}
        <Pressable
          onPress={() => onPress(index, true)}
          onPressIn={() => onHover(index, true)}
          onPressOut={onHoverEnd}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: iconSize / 2,
            height: iconSize,
            zIndex: 2,
          }}
        />
        {/* Right half */}
        <Pressable
          onPress={() => onPress(index, false)}
          onPressIn={() => onHover(index, false)}
          onPressOut={onHoverEnd}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: iconSize / 2,
            height: iconSize,
            zIndex: 2,
          }}
        />
        {/* Icon */}
        <Symbol
          name={getIconName()}
          size={iconSize}
          color={getIconColor()}
          style={[
            { marginHorizontal: spacing },
            animated && shouldAnimate() ? animatedStyle : {},
          ]}
        />
      </View>
    );
  }

  return (
    <Pressable
      key={index}
      onPress={() => onPress(index)}
      onPressIn={() => onHover(index)}
      onPressOut={onHoverEnd}
      disabled={!isInteractive}
    >
      <Symbol
        name={getIconName()}
        size={iconSize}
        color={getIconColor()}
        style={[
          { marginHorizontal: spacing },
          animated && shouldAnimate() ? animatedStyle : {},
        ]}
      />
    </Pressable>
  );
};

export interface RatingProps {
  value: number;
  onValueChange?: (value: number) => void;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  emptyColor?: string;
  icon?: 'star' | 'heart' | 'thumbs-up';
  allowHalf?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  labelFormat?: (value: number, max: number) => string;
  style?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: RatingAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  staggerDelay?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const Rating = React.forwardRef<View, RatingProps>(
  (
    {
      value,
      onValueChange,
      max = 5,
      size = 'md',
      color,
      emptyColor,
      icon = 'star',
      allowHalf = false,
      readonly = false,
      disabled = false,
      showLabel = false,
      labelFormat = (val, max) => `${val}/${max}`,
      style,
      testID,
      // Animation props
      animated = true,
      animationVariant = 'moderate',
      animationType = 'fill',
      animationDuration,
      animationDelay = 0,
      staggerDelay = 50,
      useHaptics = true,
      animationConfig,
    },
    ref
  ) => {
    const { spacing } = useSpacing();
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const { shouldAnimate } = useAnimationStore();
    
    // Get animation config without theme
    const baseConfig = getAnimationConfig('moderate');
    const config = animationConfig ? { ...baseConfig, ...animationConfig } : baseConfig;
    
    const duration = animationDuration ?? config.duration.normal;
    
    // Create individual animation values for each star
    // Create a fixed number of animations to avoid dynamic hook calls
    // Hooks must be called at top level, not in callbacks
    const star1 = { scale: useSharedValue(1), opacity: useSharedValue(1), rotation: useSharedValue(0) };
    const star2 = { scale: useSharedValue(1), opacity: useSharedValue(1), rotation: useSharedValue(0) };
    const star3 = { scale: useSharedValue(1), opacity: useSharedValue(1), rotation: useSharedValue(0) };
    const star4 = { scale: useSharedValue(1), opacity: useSharedValue(1), rotation: useSharedValue(0) };
    const star5 = { scale: useSharedValue(1), opacity: useSharedValue(1), rotation: useSharedValue(0) };
    const star6 = { scale: useSharedValue(1), opacity: useSharedValue(1), rotation: useSharedValue(0) };
    const star7 = { scale: useSharedValue(1), opacity: useSharedValue(1), rotation: useSharedValue(0) };
    const star8 = { scale: useSharedValue(1), opacity: useSharedValue(1), rotation: useSharedValue(0) };
    const star9 = { scale: useSharedValue(1), opacity: useSharedValue(1), rotation: useSharedValue(0) };
    const star10 = { scale: useSharedValue(1), opacity: useSharedValue(1), rotation: useSharedValue(0) };
    
    const allStars = [star1, star2, star3, star4, star5, star6, star7, star8, star9, star10];
    const starAnimations = React.useMemo(() => allStars.slice(0, max), [max, allStars]);

    const sizeConfig = {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 32,
      xl: 40,
    };

    const iconSize = sizeConfig[size];
    const ratingColor = color || '#eab308'; // warning yellow
    const emptyRatingColor = emptyColor || '#6b7280'; // muted gray

    const iconMap = {
      star: { filled: 'star', empty: 'star-outline' },
      heart: { filled: 'heart', empty: 'heart-outline' },
      'thumbs-up': { filled: 'thumbs-up', empty: 'thumbs-up-outline' },
    };


    const handlePress = (index: number, isHalf: boolean = false) => {
      if (readonly || disabled || !onValueChange) return;

      const newValue = isHalf && allowHalf ? index + 0.5 : index + 1;
      
      // Haptic feedback
      if (useHaptics && Platform.OS !== 'web') {
        haptic('selection');
      }
      
      // Trigger animation for the clicked star
      if (animated && shouldAnimate()) {
        if (animationType === 'bounce') {
          starAnimations[index].scale.value = withSequence(
            withSpring(1.3, { damping: 8, stiffness: 200 }),
            withSpring(1, config.spring)
          );
        }
      }
      
      onValueChange(newValue);
    };

    const handleHover = (index: number, isHalf: boolean = false) => {
      if (readonly || disabled || !onValueChange) return;

      const newValue = isHalf && allowHalf ? index + 0.5 : index + 1;
      setHoverValue(newValue);
    };

    const handleHoverEnd = () => {
      setHoverValue(null);
    };

    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      opacity: disabled ? 0.5 : 1,
      ...style,
    };

    // Trigger fill animations when value changes
    useEffect(() => {
      if (animated && shouldAnimate()) {
        starAnimations.forEach((anim, idx) => {
          const delay = animationDelay + (idx * staggerDelay);
          const isFilled = idx < value;
          
          if (animationType === 'fill') {
            anim.opacity.value = withDelay(
              delay,
              withTiming(isFilled ? 1 : 0.3, { duration })
            );
            
            if (isFilled) {
              anim.scale.value = withDelay(
                delay,
                withSequence(
                  withSpring(1.2, { damping: 8, stiffness: 200 }),
                  withSpring(1, config.spring)
                )
              );
            }
          } else if (animationType === 'glow' && isFilled) {
            // Glow animation - continuous pulsing
            anim.opacity.value = withDelay(
              delay,
              withRepeat(
                withSequence(
                  withTiming(0.6, { duration: duration / 2 }),
                  withTiming(1, { duration: duration / 2 })
                ),
                -1,
                true
              )
            );
          }
        });
      }
    }, [value, animated, shouldAnimate, animationType, duration, staggerDelay, animationDelay, config.spring, starAnimations]);
    

    return (
      <View ref={ref} style={containerStyle} testID={testID}>
        {Array.from({ length: max }, (_, index) => (
          <RatingStar
            key={index}
            index={index}
            value={value}
            hoverValue={hoverValue}
            iconSize={iconSize}
            iconMap={iconMap}
            icon={icon}
            ratingColor={ratingColor}
            emptyRatingColor={emptyRatingColor}
            spacing={spacing[0.5]}
            isInteractive={!readonly && !disabled && !!onValueChange}
            allowHalf={allowHalf}
            animated={animated}
            shouldAnimate={shouldAnimate}
            animationType={animationType}
            scale={starAnimations[index].scale}
            opacity={starAnimations[index].opacity}
            rotation={starAnimations[index].rotation}
            onPress={handlePress}
            onHover={handleHover}
            onHoverEnd={handleHoverEnd}
          />
        ))}
        {showLabel && (
          <Text
            size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'}
            className="text-muted-foreground"
            style={{ marginLeft: spacing[2] }}
          >
            {labelFormat(value, max)}
          </Text>
        )}
      </View>
    );
  }
);

Rating.displayName = 'Rating';

// Rating Display Component (Read-only with additional info)
export interface RatingDisplayProps {
  value: number;
  max?: number;
  count?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showValue?: boolean;
  showCount?: boolean;
  style?: ViewStyle;
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: RatingAnimationType;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  value,
  max = 5,
  count,
  size = 'sm',
  showValue = true,
  showCount = true,
  style,
  animated = true,
  animationVariant = 'moderate',
  animationType = 'fill',
}) => {
  const { spacing } = useSpacing();

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style] as any}>
      <Rating 
        value={value} 
        max={max} 
        size={size} 
        readonly 
        animated={animated}
        animationVariant={animationVariant}
        animationType={animationType}
      />
      {(showValue || showCount) && (
        <Text
          size={size === 'xs' ? 'xs' : 'sm'}
          className="text-muted-foreground"
          style={{ marginLeft: spacing[2] }}
        >
          {showValue && value.toFixed(1)}
          {showValue && showCount && count && ' '}
          {showCount && count && `(${count.toLocaleString()})`}
        </Text>
      )}
    </View>
  );
};

// Rating Statistics Component
export interface RatingBreakdown {
  rating: number;
  count: number;
}

export interface RatingStatisticsProps {
  average: number;
  total: number;
  breakdown: RatingBreakdown[];
  max?: number;
  style?: ViewStyle;
}

export const RatingStatistics: React.FC<RatingStatisticsProps> = ({
  average,
  total,
  breakdown,
  max = 5,
  style,
}) => {
  const { spacing } = useSpacing();

  const maxCount = Math.max(...breakdown.map((b) => b.count));

  return (
    <View style={style}>
      {/* Average Rating */}
      <View style={{ alignItems: 'center', marginBottom: spacing[4] }}>
        <Text size="3xl" weight="bold">
          {average.toFixed(1)}
        </Text>
        <RatingDisplay value={average} max={max} showValue={false} showCount={false} />
        <Text size="sm" className="text-muted-foreground" style={{ marginTop: spacing[1] }}>
          {total.toLocaleString()} ratings
        </Text>
      </View>

      {/* Rating Breakdown */}
      <View>
        {breakdown
          .sort((a, b) => b.rating - a.rating)
          .map((item) => (
            <View
              key={item.rating}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing[2],
              }}
            >
              <Text size="sm" style={{ width: 20 }}>
                {item.rating}
              </Text>
              <Symbol name="star"
                size={16}
                color="#eab308"
                style={{ marginHorizontal: spacing[1] }}
              />
              <View
                style={{
                  flex: 1,
                  height: 8,
                  backgroundColor: '#6b7280',
                  borderRadius: 4 as any,
                  marginHorizontal: spacing[2],
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${(item.count / maxCount) * 100}%`,
                    backgroundColor: '#eab308',
                    borderRadius: 4 as any,
                    ...(Platform.OS === 'web' ? {
                      transition: 'width 0.3s ease-out',
                    } : {}),
                  }}
                />
              </View>
              <Text size="sm" className="text-muted-foreground" style={{ width: 50, textAlign: 'right' }}>
                {item.count}
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
};