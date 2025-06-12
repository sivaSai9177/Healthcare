import React from 'react';
import { View } from 'react-native';
import { Card } from '@/components/universal/Card';
import { Text } from '@/components/universal/Text';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { TrendingUp, TrendingDown, Activity } from '@/components/universal/Symbols';
import Animated, { 
  FadeIn, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

interface Metric {
  label: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
}

interface OrganizationMetricsBlockProps {
  metrics: Metric[];
  title?: string;
  animated?: boolean;
}

export function OrganizationMetricsBlock({
  metrics,
  title = "Key Metrics",
  animated = true,
}: OrganizationMetricsBlockProps) {
  const { colors } = useTheme();
  const spacing = useSpacing();
  
  // Golden ratio dimensions: 233x144px
  const goldenWidth = 233;
  const goldenHeight = 144;
  
  const pulseValue = useSharedValue(1);
  
  React.useEffect(() => {
    if (animated) {
      pulseValue.value = withRepeat(
        withSequence(
          withSpring(1.05, { damping: 2, stiffness: 80 }),
          withSpring(1, { damping: 2, stiffness: 80 })
        ),
        -1,
        true
      );
    }
  }, [animated]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));
  
  return (
    <Card
      animated
      animationType="lift"
      style={{
        width: '100%',
        maxWidth: goldenWidth,
        minHeight: goldenHeight,
      }}
    >
      <Card.Header style={{ paddingBottom: spacing.xs }}>
        <Card.Title size="sm">{title}</Card.Title>
      </Card.Header>
      
      <Card.Content style={{ flex: 1 }}>
        <View style={{ flex: 1, gap: spacing.sm }}>
          {metrics.map((metric, index) => (
            <Animated.View
              key={`${metric.label}-${index}`}
              entering={animated ? FadeIn.delay(index * 100) : undefined}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.sm,
                  borderRadius: spacing.xs,
                  backgroundColor: colors.muted,
                },
                index === 0 && animated ? animatedStyle : {},
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                {metric.icon || <Activity size={14} color={colors.mutedForeground} />}
                <Text size="xs" variant="muted">{metric.label}</Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Text 
                  size="sm" 
                  weight="bold"
                  style={{ color: metric.color || colors.foreground }}
                >
                  {metric.value}
                </Text>
                
                {metric.change !== undefined && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {metric.change > 0 ? (
                      <>
                        <TrendingUp size={12} color={colors.success} />
                        <Text size="xs" style={{ color: colors.success }}>
                          +{metric.change}%
                        </Text>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={12} color={colors.destructive} />
                        <Text size="xs" style={{ color: colors.destructive }}>
                          {metric.change}%
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}