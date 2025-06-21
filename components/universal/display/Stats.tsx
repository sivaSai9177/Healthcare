import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ViewStyle,
  TextStyle,
  ScrollView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  SlideInUp,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Symbol } from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Card } from './Card';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { cn } from '@/lib/core/utils';
import { Text as UniversalText } from '@/components/universal/typography/Text';
import { HStack, VStack } from '@/components/universal/layout/Stack';
import { Box } from '@/components/universal/layout/Box';

export type StatsAnimationType = 'count' | 'barGrow' | 'slideIn' | 'none';

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  iconColor?: string;
  variant?: 'default' | 'compact' | 'large';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  style?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: StatsAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  countFrom?: number;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const StatCard = React.forwardRef<View, StatCardProps>(
  (
    {
      label,
      value,
      change,
      changeLabel,
      trend,
      icon,
      iconColor,
      variant = 'default',
      colorScheme = 'primary',
      style,
      labelStyle,
      valueStyle,
      testID,
      // Animation props
      animated = true,
      animationType = 'count',
      animationDuration,
      animationDelay = 0,
      countFrom = 0,
      animationConfig,
    },
    ref
  ) => {
    const { spacing } = useSpacing();
    const { shouldAnimate } = useAnimationStore();
    
    const duration = animationDuration ?? 300;
    
    // Animation values
    const countProgress = useSharedValue(0);
    const barWidth = useSharedValue(0);
    const scale = useSharedValue(0.9);
    const [displayValue, setDisplayValue] = React.useState(
      animated && shouldAnimate() && animationType === 'count' && typeof value === 'number' 
        ? countFrom 
        : value
    );
    
    // Animate counting effect
    useEffect(() => {
      if (animated && isAnimated && shouldAnimate() && animationType === 'count' && typeof value === 'number') {
        countProgress.value = withDelay(
          animationDelay,
          withTiming(1, { duration }, (finished) => {
            if (finished) {
              runOnJS(setDisplayValue)(value);
            }
          })
        );
      }
    }, [value, animated, shouldAnimate, animationType, duration, animationDelay]);
    
    // Update display value during count animation
    useEffect(() => {
      if (animated && isAnimated && shouldAnimate() && animationType === 'count' && typeof value === 'number') {
        const interval = setInterval(() => {
          const progress = countProgress.value;
          const currentValue = Math.round(countFrom + (value - countFrom) * progress);
          setDisplayValue(currentValue);
          
          if (progress >= 1) {
            clearInterval(interval);
          }
        }, 16); // ~60fps
        
        return () => clearInterval(interval);
      }
    }, [value, countFrom, animated, shouldAnimate, animationType]);
    
    // Bar grow animation
    useEffect(() => {
      if (animated && shouldAnimate() && animationType === 'barGrow') {
        barWidth.value = withDelay(
          animationDelay,
          withTiming(1, { duration })
        );
      }
    }, [animated, shouldAnimate, animationType, duration, animationDelay]);
    
    // Scale animation
    useEffect(() => {
      if (animated && shouldAnimate() && animationType === 'slideIn') {
        scale.value = withDelay(
          animationDelay,
          withSpring(1, config.spring)
        );
      }
    }, [animated, isAnimated, shouldAnimate, animationType, animationDelay, config.spring]);
    
    // Animated styles
    const barAnimatedStyle = useAnimatedStyle(() => ({
      width: `${barWidth.value * 100}%`,
    }));
    
    const scaleAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const sizeMap = {
      compact: {
        padding: spacing[3] as any,
        iconSize: 20,
        valueSize: 20,
        labelSize: 12,
        changeSize: 11,
      },
      default: {
        padding: spacing[4] as any,
        iconSize: 24,
        valueSize: 28,
        labelSize: 14,
        changeSize: 12,
      },
      large: {
        padding: spacing[5] as any,
        iconSize: 32,
        valueSize: 36,
        labelSize: 16,
        changeSize: 14,
      },
    };

    const colorMap = {
      primary: 'text-primary',
      secondary: 'text-secondary',
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-destructive',
      info: 'text-primary',
    };

    const sizes = sizeMap[variant];
    const accentColor = colorMap[colorScheme];

    const getTrendIcon = () => {
      if (!trend && !change) return null;
      
      const actualTrend = trend || (change && change > 0 ? 'up' : 'down');
      const trendIcon = actualTrend === 'up' ? 'trending-up' : actualTrend === 'down' ? 'trending-down' : 'remove';
      const trendColorClass = actualTrend === 'up' ? 'text-success' : actualTrend === 'down' ? 'text-destructive' : 'text-muted-foreground';
      
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing[2] }}>
          <Symbol name={trendIcon as any} size={16} className={trendColorClass} />
          {change !== undefined && (
            <Text
              style={{
                fontSize: sizes.changeSize,
                fontWeight: '500',
                marginLeft: spacing[1],
              }}
              className={trendColorClass}
            >
              {change > 0 ? '+' : ''}{change}%
            </Text>
          )}
          {changeLabel && (
            <Text
              style={{
                fontSize: sizes.changeSize,
                marginLeft: spacing[1],
              }}
              className="text-muted-foreground"
            >
              {changeLabel}
            </Text>
          )}
        </View>
      );
    };

    // Web CSS animations
    const webAnimationStyle = Platform.OS === 'web' && animated && shouldAnimate() ? {
      '@keyframes slideIn': {
        from: { transform: 'scale(0.9)', opacity: 0 as any },
        to: { transform: 'scale(1)', opacity: 1 as any },
      },
      '@keyframes barGrow': {
        from: { width: '0%' },
        to: { width: '100%' },
      },
    } as any : {};

    const AnimatedCard = animated && shouldAnimate() && animationType === 'slideIn'
      ? Animated.createAnimatedComponent(Card)
      : Card;

    return (
      <AnimatedCard
        ref={ref}
        p={0}
        style={[
          { overflow: 'hidden' },
          animated && shouldAnimate() && animationType === 'slideIn' 
            ? Platform.OS === 'web'
              ? { animation: `slideIn ${duration}ms ease-out ${animationDelay}ms backwards` } as any
              : scaleAnimatedStyle
            : {},
          webAnimationStyle,
          style,
        ]}
        testID={testID}
        entering={Platform.OS !== 'web' && animated && shouldAnimate() && animationType === 'slideIn'
          ? SlideInUp.duration(duration).delay(animationDelay)
          : undefined
        }
      >
        <View style={{ padding: sizes.padding }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  {
                    fontSize: sizes.labelSize,
                    marginBottom: spacing[1],
                  },
                  labelStyle,
                ]}
                className="text-muted-foreground"
              >
                {label}
              </Text>
              <Text
                style={[
                  {
                    fontSize: sizes.valueSize,
                    fontWeight: 'bold',
                  },
                  valueStyle,
                ]}
                className="text-foreground"
              >
                {displayValue}
              </Text>
              {getTrendIcon()}
            </View>
            
            {icon && (
              <Animated.View
                style={[
                  {
                    width: sizes.iconSize * 2,
                    height: sizes.iconSize * 2,
                    borderRadius: sizes.iconSize,
                    backgroundColor: `${iconColor || accentColor}20`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: spacing[3],
                  },
                ]}
                entering={Platform.OS !== 'web' && animated && shouldAnimate()
                  ? FadeIn.duration(duration).delay(animationDelay + 200)
                  : undefined
                }
              >
                <Symbol
                  name={icon as any}
                  size={sizes.iconSize}
                  className={cn(iconColor ? undefined : accentColor, !iconColor && !accentColor && 'text-primary') as string}
                  style={iconColor ? { color: iconColor } : undefined}
                />
              </Animated.View>
            )}
          </View>
        </View>
        
        {/* Accent bar at bottom */}
        <Animated.View
          style={[
            {
              height: 3,
              backgroundColor: 'currentColor',
            },
            accentColor && { color: accentColor },
            animated && shouldAnimate() && animationType === 'barGrow'
              ? Platform.OS === 'web'
                ? { animation: `barGrow ${duration}ms ease-out ${animationDelay}ms backwards` } as any
                : barAnimatedStyle
              : {},
          ]}
        />
      </AnimatedCard>
    );
  }
);

StatCard.displayName = 'StatCard';

// Stats Grid Component
export interface StatsGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  style?: ViewStyle;
  testID?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  children,
  columns = 2,
  gap,
  style,
  testID,
}) => {
  const { spacing } = useSpacing();
  const actualGap = gap ?? spacing[3];

  const childrenArray = React.Children.toArray(children);
  const rows: React.ReactNode[][] = [];
  
  for (let i = 0; i < childrenArray.length; i += columns) {
    rows.push(childrenArray.slice(i, i + columns));
  }

  return (
    <View style={style} testID={testID}>
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: 'row',
            marginBottom: rowIndex < rows.length - 1 ? actualGap : 0,
          }}
        >
          {row.map((child, colIndex) => (
            <View
              key={colIndex}
              style={{
                flex: 1,
                marginRight: colIndex < row.length - 1 ? actualGap : 0,
              }}
            >
              {child}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

// Stat List Component
export interface StatListProps {
  stats: {
    label: string;
    value: string | number;
    icon?: string;
    color?: string;
  }[];
  variant?: 'default' | 'compact';
  orientation?: 'horizontal' | 'vertical';
  style?: ViewStyle;
  testID?: string;
}

export const StatList: React.FC<StatListProps> = ({
  stats,
  variant = 'default',
  orientation = 'horizontal',
  style,
  testID,
}) => {
  const { spacing } = useSpacing();

  const isCompact = variant === 'compact';
  const isHorizontal = orientation === 'horizontal';

  return (
    <ScrollView
      horizontal={isHorizontal}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={style}
      testID={testID}
    >
      <View
        style={{
          flexDirection: isHorizontal ? 'row' : 'column',
        }}
      >
        {stats.map((stat, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: isCompact ? spacing[2] : spacing[3],
              paddingHorizontal: isCompact ? spacing[3] : spacing[4],
              marginRight: isHorizontal && index < stats.length - 1 ? spacing[2] : 0,
              marginBottom: !isHorizontal && index < stats.length - 1 ? spacing[2] : 0,
              backgroundColor: undefined,
              borderRadius: 8 as any,
              borderWidth: 1,
              borderColor: undefined,
            }}
            className="bg-card border-border"
          >
            {stat.icon && (
              <View
                style={{
                  marginRight: spacing[2],
                }}
              >
                <Symbol
                  name={stat.icon as any}
                  size={isCompact ? 18 : 24}
                  className={stat.color ? undefined : 'text-primary'}
                  style={stat.color ? { color: stat.color } : undefined}
                />
              </View>
            )}
            <View>
              <Text
                style={{
                  fontSize: isCompact ? 11 : 12,
                }}
                className="text-muted-foreground"
              >
                {stat.label}
              </Text>
              <Text
                style={{
                  fontSize: isCompact ? 16 : 20,
                  fontWeight: 'bold',
                  marginTop: spacing[0.5],
                }}
                className="text-foreground"
              >
                {stat.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// Mini Stat Component
export interface MiniStatProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  style?: ViewStyle;
  testID?: string;
}

export const MiniStat: React.FC<MiniStatProps> = ({
  label,
  value,
  icon,
  color,
  style,
  testID,
}) => {
  const { spacing } = useSpacing();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing[2] as any,
        },
        style,
      ]}
      testID={testID}
    >
      {icon && (
        <Symbol
          name={icon as any}
          size={16}
          className={color ? undefined : 'text-primary'}
          style={{ marginRight: spacing[2], ...(color ? { color } : {}) }}
        />
      )}
      <Text
        style={{
          fontSize: 12,
          marginRight: spacing[1],
        }}
        className="text-muted-foreground"
      >
        {label}:
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          ...(color ? { color } : {}),
        }}
        className={color ? undefined : 'text-foreground'}
      >
        {value}
      </Text>
    </View>
  );
};