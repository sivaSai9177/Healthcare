import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useSpacing } from '@/lib/stores/spacing-store';
import { cn } from '@/lib/core/utils';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'default' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  duration?: number;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius,
  style,
  variant = 'default',
  animation = 'pulse',
  duration = 1500,
  className,
}: SkeletonProps) {
  const { spacing } = useSpacing();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (animation === 'pulse') {
      shimmer.value = withRepeat(
        withSequence(
          withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    } else if (animation === 'wave') {
      shimmer.value = withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1
      );
    }
  }, [animation, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    if (animation === 'pulse') {
      return {
        opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
      };
    } else if (animation === 'wave') {
      return {
        transform: [
          {
            translateX: interpolate(
              shimmer.value,
              [0, 1],
              [-100, 100]
            ),
          },
        ],
      };
    }
    return {};
  });

  const getBorderRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    if (variant === 'circular') return 9999;
    if (variant === 'rectangular') return 0;
    return 8; // Default border radius
  };

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: getBorderRadius(),
          backgroundColor: '#E5E7EB',
          overflow: 'hidden',
        },
        style,
      ]}
      className={className}
    >
      {animation === 'wave' && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
            },
            animatedStyle,
          ]}
        />
      )}
      {animation === 'pulse' && (
        <Animated.View
          style={[
            {
              width: '100%',
              height: '100%',
              backgroundColor: '#E5E7EB',
            },
            animatedStyle,
          ]}
        />
      )}
    </View>
  );
}

// Preset skeleton components
export function SkeletonText({
  lines = 3,
  gap = 8,
  style,
  lastLineWidth = '60%',
}: {
  lines?: number;
  gap?: number;
  style?: ViewStyle;
  lastLineWidth?: number | string;
}) {
  return (
    <View style={[{ gap }, style] as any}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </View>
  );
}

export function SkeletonCard({
  style,
  className,
  showAvatar = true,
  showActions = false,
}: {
  style?: ViewStyle;
  className?: string;
  showAvatar?: boolean;
  showActions?: boolean;
}) {
  const { spacing } = useSpacing();

  return (
    <View
      className={cn("bg-white p-4 rounded-lg shadow-sm", className)}
      style={[
        {
          padding: spacing[4] as number,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        },
        style,
      ]}
    >
      {showAvatar && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] as number }}>
          <Skeleton variant="circular" width={40} height={40} />
          <View style={{ marginLeft: spacing[3] as number, flex: 1 }}>
            <Skeleton height={16} width="40%" style={{ marginBottom: 4 }} />
            <Skeleton height={12} width="60%" />
          </View>
        </View>
      )}
      
      <SkeletonText lines={3} style={{ marginBottom: spacing[3] as number }} />
      
      {showActions && (
        <View style={{ flexDirection: 'row', gap: spacing[2] as number }}>
          <Skeleton height={32} width={80} borderRadius={16} />
          <Skeleton height={32} width={80} borderRadius={16} />
        </View>
      )}
    </View>
  );
}

export function SkeletonList({
  count = 5,
  gap = 16,
  renderItem,
}: {
  count?: number;
  gap?: number;
  renderItem?: (index: number) => React.ReactNode;
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>
          {renderItem ? renderItem(index) : <SkeletonCard />}
        </React.Fragment>
      ))}
    </View>
  );
}

export function SkeletonAvatar({
  size = 40,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return <Skeleton variant="circular" width={size} height={size} style={style} />;
}

export function SkeletonButton({
  width = 100,
  height = 36,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}) {
  return <Skeleton width={width} height={height} borderRadius={18} style={style} />;
}

export function SkeletonInput({
  style,
}: {
  style?: ViewStyle;
}) {
  return <Skeleton height={40} borderRadius={8} style={style} />;
}

// Healthcare-specific skeletons
export function SkeletonAlert({ style }: { style?: ViewStyle }) {
  const { spacing } = useSpacing();

  return (
    <View
      style={[
        {
          padding: spacing[4] as number,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: '#E5E7EB',
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[2] as number }}>
        <Skeleton height={20} width="30%" />
        <Skeleton height={20} width={60} borderRadius={10} />
      </View>
      <SkeletonText lines={2} style={{ marginBottom: spacing[2] as number }} />
      <View style={{ flexDirection: 'row', gap: spacing[2] as number }}>
        <Skeleton height={24} width={80} borderRadius={12} />
        <Skeleton height={24} width={100} borderRadius={12} />
      </View>
    </View>
  );
}

export function SkeletonPatientCard({ style }: { style?: ViewStyle }) {
  const { spacing } = useSpacing();

  return (
    <View
      style={[
        {
          padding: spacing[4] as number,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] as number }}>
        <SkeletonAvatar size={60} />
        <View style={{ marginLeft: spacing[3] as number, flex: 1 }}>
          <Skeleton height={20} width="60%" style={{ marginBottom: 4 }} />
          <Skeleton height={16} width="40%" style={{ marginBottom: 4 }} />
          <Skeleton height={14} width="80%" />
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', gap: spacing[2] as number, marginTop: spacing[3] as number }}>
        <Skeleton height={28} width="30%" borderRadius={14} />
        <Skeleton height={28} width="30%" borderRadius={14} />
        <Skeleton height={28} width="30%" borderRadius={14} />
      </View>
    </View>
  );
}

export function SkeletonMetricCard({ style }: { style?: ViewStyle }) {
  const { spacing } = useSpacing();

  return (
    <View
      style={[
        {
          padding: spacing[4] as number,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          minHeight: 120,
        },
        style,
      ]}
    >
      <Skeleton height={14} width="40%" style={{ marginBottom: spacing[2] as number }} />
      <Skeleton height={32} width="60%" style={{ marginBottom: spacing[1] as number }} />
      <Skeleton height={12} width="80%" />
    </View>
  );
}