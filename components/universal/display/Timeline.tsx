import React, { useEffect } from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  FadeIn,
  SlideInLeft,
  SlideInUp,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from '@/components/universal/display/Symbols';
import { 
  AnimationVariant,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';

const AnimatedView = Animated.View;

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string | Date;
  icon?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  status?: 'completed' | 'active' | 'pending';
  content?: React.ReactNode;
}

export type TimelineAnimationType = 'stagger' | 'fade' | 'slide' | 'none';

export interface TimelineProps {
  items: TimelineItem[];
  orientation?: 'vertical' | 'horizontal';
  variant?: 'default' | 'compact' | 'detailed';
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  showConnectors?: boolean;
  activeIndex?: number;
  style?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: TimelineAnimationType;
  animationDuration?: number;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const Timeline = React.forwardRef<View, TimelineProps>(
  (
    {
      items,
      orientation = 'vertical',
      variant = 'default',
      lineStyle = 'solid',
      showConnectors = true,
      activeIndex,
      style,
      testID,
      animated = true,
      animationVariant = 'moderate',
      animationType = 'stagger',
      animationDuration,
      animationConfig,
    },
    ref
  ) => {
    const theme = useTheme();
    const { spacing } = useSpacing();
    const { shouldAnimate } = useAnimationStore();
    const { config, isAnimated } = useAnimationVariant({
      variant: animationVariant,
      overrides: animationConfig,
    });

    const variantConfig = {
      compact: {
        iconSize: 24,
        lineWidth: 2,
        spacing: 2,
        titleSize: 'sm' as const,
        descriptionSize: 'xs' as const,
      },
      default: {
        iconSize: 32,
        lineWidth: 2,
        spacing: 3,
        titleSize: 'md' as const,
        descriptionSize: 'sm' as const,
      },
      detailed: {
        iconSize: 40,
        lineWidth: 3,
        spacing: 4,
        titleSize: 'lg' as const,
        descriptionSize: 'md' as const,
      },
    }[variant];

    const getItemStatus = (index: number, item: TimelineItem): TimelineItem['status'] => {
      if (item.status) return item.status;
      if (activeIndex === undefined) return 'completed';
      if (index < activeIndex) return 'completed';
      if (index === activeIndex) return 'active';
      return 'pending';
    };

    const getItemColor = (status: TimelineItem['status']) => {
      switch (status) {
        case 'completed':
          return theme.success || theme.primary;
        case 'active':
          return theme.primary;
        case 'pending':
          return theme.mutedForeground;
        default:
          return theme.foreground;
      }
    };

    const containerStyle: ViewStyle = {
      flexDirection: orientation === 'vertical' ? 'column' : 'row',
      ...style,
    };

    const renderIcon = (item: TimelineItem, status: TimelineItem['status']) => {
      const iconColor = item.iconColor || getItemColor(status);
      const iconContainerStyle: ViewStyle = {
        width: variantConfig.iconSize,
        height: variantConfig.iconSize,
        borderRadius: variantConfig.iconSize / 2,
        backgroundColor: status === 'active' ? iconColor : theme.background,
        borderWidth: 2,
        borderColor: iconColor,
        alignItems: 'center',
        justifyContent: 'center',
      };

      if (item.icon) {
        return <View style={iconContainerStyle}>{item.icon}</View>;
      }

      if (item.iconName) {
        return (
          <View style={iconContainerStyle}>
            <Symbol
              name={item.iconName}
              size={variantConfig.iconSize * 0.6}
              color={status === 'active' ? theme.background : iconColor}
            />
          </View>
        );
      }

      // Default icons based on status
      const defaultIcons = {
        completed: 'checkmark',
        active: 'ellipse',
        pending: 'ellipse-outline',
      };

      return (
        <View style={iconContainerStyle}>
          <Symbol
            name={defaultIcons[status] as keyof typeof Ionicons.glyphMap}
            size={variantConfig.iconSize * 0.6}
            color={status === 'active' ? theme.background : iconColor}
          />
        </View>
      );
    };

    const TimelineConnector = React.memo(function TimelineConnector({ status, isLast, index }: { status: TimelineItem['status'], isLast: boolean, index: number }) {
      const lineColor = getItemColor(status);
      const height = useSharedValue(0);
      const width = useSharedValue(0);
      
      // Define animated style before any conditional returns
      const animatedStyle = useAnimatedStyle(() => ({
        ...(orientation === 'vertical' 
          ? { height: `${height.value}%` }
          : { width: `${width.value}%` }
        ),
      }));
      
      // Animate connector growth
      useEffect(() => {
        if (animated && isAnimated && shouldAnimate() && animationType !== 'none') {
          const delay = animationType === 'stagger' ? index * 100 + 200 : 0;
          
          if (orientation === 'vertical') {
            height.value = withDelay(delay, withTiming(100, { duration: config.duration.normal }));
          } else {
            width.value = withDelay(delay, withTiming(100, { duration: config.duration.normal }));
          }
        } else {
          height.value = 100;
          width.value = 100;
        }
      }, [index, animated, isAnimated, shouldAnimate, animationType, config, orientation]);

      if (!showConnectors || isLast) return null;
      
      const connectorStyle: ViewStyle = {
        position: 'absolute',
        backgroundColor: lineColor,
        ...(orientation === 'vertical'
          ? {
              width: variantConfig.lineWidth,
              top: variantConfig.iconSize,
              bottom: 0,
              left: variantConfig.iconSize / 2 - variantConfig.lineWidth / 2,
            }
          : {
              height: variantConfig.lineWidth,
              left: variantConfig.iconSize,
              right: 0,
              top: variantConfig.iconSize / 2 - variantConfig.lineWidth / 2,
            }),
      };

      if (lineStyle === 'dashed') {
        // Simulate dashed line with multiple small views
        const dashLength = 4;
        const dashGap = 4;
        const isVertical = orientation === 'vertical';
        
        return (
          <View style={connectorStyle}>
            {/* This is a simplified version - in production, you'd want to calculate the exact number of dashes */}
            {Array.from({ length: 10 }).map((_, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  backgroundColor: lineColor,
                  ...(isVertical
                    ? {
                        width: variantConfig.lineWidth,
                        height: dashLength,
                        top: i * (dashLength + dashGap),
                      }
                    : {
                        height: variantConfig.lineWidth,
                        width: dashLength,
                        left: i * (dashLength + dashGap),
                      }),
                }}
              />
            ))}
          </View>
        );
      }

      return (
        <AnimatedView 
          style={[
            connectorStyle,
            animated && isAnimated && shouldAnimate() && animationType !== 'none' ? animatedStyle : {},
          ]} 
        />
      );
    });

    const formatDate = (date: string | Date) => {
      if (typeof date === 'string') return date;
      return date.toLocaleDateString();
    };

    const TimelineItemComponent = React.memo(function TimelineItemComponent({ item, index }: { item: TimelineItem, index: number }) {
      const status = getItemStatus(index, item);
      const isLast = index === items.length - 1;
      
      // Animation values
      const opacity = useSharedValue(0);
      const translateX = useSharedValue(orientation === 'vertical' ? -30 : 0);
      const translateY = useSharedValue(orientation === 'horizontal' ? -30 : 0);
      const scale = useSharedValue(0.8);
      
      // Animate item entrance
      useEffect(() => {
        if (animated && isAnimated && shouldAnimate() && animationType !== 'none') {
          const delay = animationType === 'stagger' ? index * 100 : 0;
          
          opacity.value = withDelay(delay, withTiming(1, { duration: config.duration.normal }));
          
          if (animationType === 'slide') {
            if (orientation === 'vertical') {
              translateX.value = withDelay(delay, withSpring(0, config.spring));
            } else {
              translateY.value = withDelay(delay, withSpring(0, config.spring));
            }
          }
          
          if (animationType === 'stagger') {
            scale.value = withDelay(delay, withSpring(1, config.spring));
          }
        } else {
          opacity.value = 1;
          translateX.value = 0;
          translateY.value = 0;
          scale.value = 1;
        }
      }, [index, animated, isAnimated, shouldAnimate, animationType, config, orientation]);
      
      const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
      }));

      const itemContainerStyle: ViewStyle = {
        flexDirection: orientation === 'vertical' ? 'row' : 'column',
        alignItems: orientation === 'vertical' ? 'flex-start' : 'center',
        marginBottom: orientation === 'vertical' && !isLast ? spacing[variantConfig.spacing * 2] : 0,
        marginRight: orientation === 'horizontal' && !isLast ? spacing[variantConfig.spacing * 2] : 0,
        position: 'relative',
      };

      const contentContainerStyle: ViewStyle = {
        flex: 1,
        marginLeft: orientation === 'vertical' ? spacing[variantConfig.spacing] : 0,
        marginTop: orientation === 'horizontal' ? spacing[variantConfig.spacing] : 0,
      };

      return (
        <AnimatedView 
          key={item.id} 
          style={[
            itemContainerStyle,
            animated && isAnimated && shouldAnimate() && animationType !== 'none' ? animatedStyle : {},
            Platform.OS === 'web' && animated && isAnimated && shouldAnimate() && {
              transition: 'all 0.3s ease',
            } as any,
          ]}
        >
          {/* Icon and Connector */}
          <View style={{ position: 'relative' }}>
            {renderIcon(item, status)}
            <TimelineConnector status={status} isLast={isLast} index={index} />
          </View>

          {/* Content */}
          <View style={contentContainerStyle}>
            {item.date && variant !== 'compact' && (
              <Text
                size="xs"
                colorTheme="mutedForeground"
                style={{ marginBottom: spacing[1] }}
              >
                {formatDate(item.date)}
              </Text>
            )}
            
            <Text
              size={variantConfig.titleSize}
              weight="semibold"
              colorTheme={status === 'pending' ? 'mutedForeground' : 'foreground'}
            >
              {item.title}
            </Text>

            {item.description && variant !== 'compact' && (
              <Text
                size={variantConfig.descriptionSize}
                colorTheme="mutedForeground"
                style={{ marginTop: spacing[1] }}
              >
                {item.description}
              </Text>
            )}

            {item.content && variant === 'detailed' && (
              <View style={{ marginTop: spacing[2] }}>{item.content}</View>
            )}
          </View>
        </AnimatedView>
      );
    });

    return (
      <View ref={ref} style={containerStyle} testID={testID}>
        {items.map((item, index) => <TimelineItemComponent key={item.id || index} item={item} index={index} />)}
      </View>
    );
  }
);

Timeline.displayName = 'Timeline';

// Timeline Card Component (for more complex timeline items)
export interface TimelineCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  actions?: React.ReactNode;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationDuration?: number;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const TimelineCard: React.FC<TimelineCardProps> = ({
  title,
  subtitle,
  description,
  tags,
  actions,
  style,
  animated = true,
  animationVariant = 'moderate',
  animationDuration,
  animationConfig,
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  // Animation values
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  
  // Animate card entrance
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      opacity.value = withTiming(1, { duration: config.duration.normal });
      scale.value = withSpring(1, config.spring);
    } else {
      opacity.value = 1;
      scale.value = 1;
    }
  }, [animated, isAnimated, shouldAnimate, config]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const cardStyle: ViewStyle = {
    backgroundColor: theme.card,
    borderRadius: 8,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: theme.border,
    ...style,
  };

  return (
    <AnimatedView 
      style={[
        cardStyle,
        animated && isAnimated && shouldAnimate() ? animatedStyle : {},
        Platform.OS === 'web' && animated && isAnimated && shouldAnimate() && {
          transition: 'all 0.3s ease',
        } as any,
      ]}
    >
      <Text size="md" weight="semibold">
        {title}
      </Text>
      
      {subtitle && (
        <Text size="sm" colorTheme="mutedForeground" style={{ marginTop: spacing[0.5] }}>
          {subtitle}
        </Text>
      )}

      {description && (
        <Text size="sm" style={{ marginTop: spacing[2] }}>
          {description}
        </Text>
      )}

      {tags && tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing[2] }}>
          {tags.map((tag, index) => (
            <AnimatedView
              key={index}
              entering={Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() 
                ? FadeIn.delay(index * 50).duration(config.duration.fast)
                : undefined}
              style={{
                backgroundColor: theme.muted,
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[1],
                borderRadius: 4,
                marginRight: spacing[1],
                marginBottom: spacing[1],
              }}
            >
              <Text size="xs" colorTheme="mutedForeground">
                {tag}
              </Text>
            </AnimatedView>
          ))}
        </View>
      )}

      {actions && <View style={{ marginTop: spacing[3] }}>{actions}</View>}
    </AnimatedView>
  );
};