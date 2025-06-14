import React from 'react';
import { View } from 'react-native';
import { Card, Text, VStack, HStack } from '@/components/universal';
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';
import { useResponsive } from '@/hooks/responsive';
import { useSpacing } from '@/lib/stores/spacing-store';
import { TrendingUp, TrendingDown, Activity } from '@/components/universal/display/Symbols';
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

export interface OrganizationMetricsBlockProps {
  metrics: Metric[];
  title?: string;
  animated?: boolean;
}

export function OrganizationMetricsBlock({
  metrics,
  title = "Key Metrics",
  animated = true,
}: OrganizationMetricsBlockProps) {
  const { spacing } = useSpacing();
  const { isMobile } = useResponsive();
  const shadowMd = useShadow({ size: 'md' });
  
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
      shadow="md"
      className={cn(
        "animate-fade-in",
        "transition-all duration-200",
        "w-full"
      )}
      style={{
        maxWidth: goldenWidth,
        minHeight: goldenHeight,
      }}
    >
      <Card.Header style={{ paddingBottom: spacing[1] }}>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      
      <Card.Content style={{ flex: 1 }}>
        <VStack gap={spacing[2] as any} className="flex-1">
          {metrics.map((metric, index) => (
            <Animated.View
              key={`${metric.label}-${index}`}
              entering={animated ? FadeIn.delay(index * 100) : undefined}
              className={cn(
                "flex-row items-center justify-between p-2 rounded bg-muted",
                "transition-all duration-200"
              )}
              style={[
                index === 0 && animated ? animatedStyle : {},
              ]}
            >
              <HStack align="center" gap={spacing[1] as any}>
                {metric.icon || <Activity size={14} className="text-muted-foreground" />}
                <Text size="xs" colorTheme="mutedForeground">{metric.label}</Text>
              </HStack>
              
              <HStack align="center" gap={spacing[1] as any}>
                <Text 
                  size="sm" 
                  weight="bold"
                  className={cn(
                    metric.color === 'primary' && "text-primary",
                    metric.color === 'secondary' && "text-secondary",
                    metric.color === 'destructive' && "text-destructive",
                    metric.color === 'success' && "text-success",
                    metric.color === 'warning' && "text-warning",
                    !metric.color && "text-foreground"
                  )}
                >
                  {metric.value}
                </Text>
                
                {metric.change !== undefined && (
                  <HStack align="center">
                    {metric.change > 0 ? (
                      <>
                        <TrendingUp size={12} className="text-success" />
                        <Text size="xs" className="text-success">
                          +{metric.change}%
                        </Text>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={12} className="text-destructive" />
                        <Text size="xs" className="text-destructive">
                          {metric.change}%
                        </Text>
                      </>
                    )}
                  </HStack>
                )}
              </HStack>
            </Animated.View>
          ))}
        </VStack>
      </Card.Content>
    </Card>
  );
}