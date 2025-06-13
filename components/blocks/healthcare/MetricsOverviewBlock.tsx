import React, { Suspense, useDeferredValue, useTransition, useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  Card,
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Button,
  Grid,
  Progress,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { PLATFORM_TOKENS } from '@/lib/design/responsive';

import { api } from '@/lib/api/trpc';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { log } from '@/lib/core/debug/logger';

import { useFadeAnimation, useEntranceAnimation } from '@/lib/ui/animations/hooks';
import { haptic } from '@/lib/ui/haptics';
import { SpacingScale } from '@/lib/design';

// Metrics store with Zustand
interface MetricsState {
  timeRange: '1h' | '6h' | '24h' | '7d';
  department: string;
  refreshInterval: number;
  setTimeRange: (range: '1h' | '6h' | '24h' | '7d') => void;
  setDepartment: (dept: string) => void;
  setRefreshInterval: (interval: number) => void;
}

const useMetricsStore = create<MetricsState>()(
  devtools(
    subscribeWithSelector((set) => ({
      timeRange: '24h',
      department: 'all',
      refreshInterval: 30000, // 30 seconds
      
      setTimeRange: (range) => set({ timeRange: range }),
      setDepartment: (dept) => set({ department: dept }),
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
    }))
  )
);

// Primary metric card component
const PrimaryMetricCard = ({ 
  value, 
  label, 
  trend, 
  capacity, 
  color,
  icon 
}: { 
  value: number;
  label: string;
  trend?: number;
  capacity?: number;
  color: string;
  icon: string;
}) => {
  const theme = useTheme();
  const { spacing, componentSizes } = useSpacing();
  
  // Animation for card entrance
  const { animatedStyle: cardEntranceStyle, fadeIn } = useFadeAnimation({ 
    duration: 600,
    delay: 100 
  });
  
  // Animated value for number transitions
  const animatedValue = useSharedValue(0);
  const progressAnimation = useSharedValue(0);
  
  useEffect(() => {
    fadeIn();
    // Animate number value
    animatedValue.value = withSpring(value, {
      damping: 15,
      stiffness: 100,
    });
    
    // Animate progress bar
    if (capacity) {
      progressAnimation.value = withTiming((value / capacity) * 100, {
        duration: 1000,
      });
    }
  }, [value, capacity, fadeIn, animatedValue, progressAnimation]);
  
  // Animated text style
  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        animatedValue.value,
        [0, value],
        [0.5, 1],
        Extrapolate.CLAMP
      ),
    };
  });
  
  return (
    <Animated.View style={cardEntranceStyle}>
      <Card
      padding={spacing[6]}
      gap={spacing[4]}
      shadow={PLATFORM_TOKENS.shadow?.lg}
      style={{
        minHeight: 120,
        borderTopWidth: 3,
        borderTopColor: color,
      }}
    >
      <HStack justifyContent="space-between" alignItems="flex-start">
        <VStack gap={spacing[3]}>
          <Animated.Text style={[{ fontSize: 48, fontWeight: 'bold', color: theme.foreground }, animatedTextStyle]}>
            {Math.round(animatedValue.value)}
          </Animated.Text>
          <Text size="sm" colorTheme="mutedForeground">{label}</Text>
        </VStack>
        <Text size="3xl">{icon}</Text>
      </HStack>
      
      {capacity !== undefined && (
        <VStack gap={spacing[2]}>
          <HStack justifyContent="space-between">
            <Text size="xs" colorTheme="mutedForeground">Capacity</Text>
            <Text size="xs" weight="medium">{Math.round((value / capacity) * 100)}%</Text>
          </HStack>
          <Progress value={(value / capacity) * 100} colorTheme={color} />
        </VStack>
      )}
      
      {trend !== undefined && (
        <HStack gap={spacing[2]} alignItems="center">
          <Text size="sm" colorTheme={trend > 0 ? "destructive" : "success"}>
            {trend > 0 ? '↑' : '↓'}
          </Text>
          <Text size="sm" colorTheme="mutedForeground">
            {Math.abs(trend)}% from last period
          </Text>
        </HStack>
      )}
    </Card>
    </Animated.View>
  );
};

// Secondary metric card
const SecondaryMetricCard = ({ 
  value, 
  label, 
  unit, 
  status 
}: { 
  value: number | string;
  label: string;
  unit?: string;
  status?: 'good' | 'warning' | 'critical';
}) => {
  const theme = useTheme();
  const { spacing, componentSizes } = useSpacing();
  const statusColors = {
    good: healthcareColors.success,
    warning: healthcareColors.warning,
    critical: healthcareColors.emergency,
  };
  
  // Slide in animation
  const { animatedStyle: slideInStyle } = useEntranceAnimation({
    type: 'slide',
    delay: 200,
    duration: 400,
    from: 'right',
  });
  
  return (
    <Animated.View style={slideInStyle}>
      <Card
      padding={spacing[5]}
      gap={spacing[3]}
      shadow={PLATFORM_TOKENS.shadow?.md}
      style={{
        height: componentSizes.button.lg.height * 2,
        borderLeftWidth: 3,
        borderLeftColor: status ? statusColors[status] : theme.border,
      }}
    >
      <Text size="xs" colorTheme="mutedForeground">{label}</Text>
      <HStack gap={spacing[2]} alignItems="baseline">
        <Text size="2xl" weight="bold">{value}</Text>
        {unit && <Text size="sm" colorTheme="mutedForeground">{unit}</Text>}
      </HStack>
    </Card>
    </Animated.View>
  );
};

// Mini stat component
const MiniStat = ({ label, value, color, index }: { label: string; value: number; color: string; index: number }) => {
  const theme = useTheme();
  const { spacing, componentSizes } = useSpacing();
  
  // Staggered fade in for mini stats
  const { animatedStyle } = useEntranceAnimation({
    type: 'fade',
    delay: 300 + (index * 100),
    duration: 400,
  });
  
  return (
    <Animated.View style={animatedStyle}>
      <HStack
      gap={spacing[4]}
      alignItems="center"
      padding={spacing[3]}
      style={{
        height: componentSizes.button.sm.height,
        borderRadius: theme.radius?.md || 8,
        backgroundColor: color + '10',
      }}
    >
      <Box
        width={8}
        height={8}
        style={{
          backgroundColor: color,
          borderRadius: 8,
        }}
      />
      <VStack gap={2 as SpacingScale} flex={1}>
        <Text size="xs" colorTheme="mutedForeground">{label}</Text>
        <Text weight="bold">{value}</Text>
      </VStack>
    </HStack>
    </Animated.View>
  );
};

// Metrics skeleton loader
const MetricsSkeleton = () => {
  const theme = useTheme();
  const { spacing, componentSizes } = useSpacing();
  const { animatedStyle: pulseStyle } = useFadeAnimation({
    duration: 1000,
    loop: true,
    reverseOnComplete: true,
  });
  
  return (
    <Grid
      columns={Platform.OS === 'web' ? "1.618fr 1fr 0.618fr" : "1fr"}
      gap={spacing[6]}
    >
      {[1, 2, 3].map((i) => (
        <Animated.View key={i} style={pulseStyle}>
          <Card
            padding={spacing[8]}
            style={{
              height: componentSizes.button.lg.height * 3,
              backgroundColor: theme.muted,
              opacity: 0.5,
            }}
          />
        </Animated.View>
      ))}
    </Grid>
  );
};

// Main metrics content
const MetricsContent = ({ hospitalId }: { hospitalId: string }) => {
  const theme = useTheme();
  const { timeRange, department, refreshInterval, setTimeRange } = useMetricsStore();
  const [isPending, startTransition] = useTransition();
  
  // Deferred values for smooth interactions
  const deferredTimeRange = useDeferredValue(timeRange);
  const deferredDepartment = useDeferredValue(department);
  
  // Fetch metrics data
  const { data: metrics } = api.healthcare.getMetrics.useQuery(
    {
      timeRange: deferredTimeRange,
      department: deferredDepartment,
    },
    {
      refetchInterval: refreshInterval,
      refetchIntervalInBackground: true,
      suspense: true, // Enable suspense for this query
    }
  );
  
  // Real-time subscription
  api.healthcare.subscribeToMetrics.useSubscription(
    undefined,
    {
      onData: (update) => {
        log.info('Metrics update received', 'METRICS', update);
      },
    }
  );
  
  if (!metrics) {
    return <MetricsSkeleton />;
  }
  
  return (
    <>
      {/* Time range selector */}
      <HStack gap={spacing[4]} justifyContent="flex-end">
        {(['1h', '6h', '24h', '7d'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onPress={() => {
              haptic('light');
              startTransition(() => {
                setTimeRange(range);
              });
            }}
            loading={isPending && timeRange === range}
          >
            {range.toUpperCase()}
          </Button>
        ))}
      </HStack>
      
      {/* Main metrics grid */}
      <Grid
        columns={Platform.OS === 'web' ? "1.618fr 1fr 0.618fr" : "1fr"}
        gap={spacing[6]}
        style={{ minHeight: componentSizes.button.xl.height * 3 }}
      >
        {/* Primary Metric */}
        <PrimaryMetricCard
          value={metrics.activeAlerts}
          label="Active Alerts"
          trend={metrics.alertsTrend}
          capacity={metrics.alertCapacity}
          color={healthcareColors.emergency}
          icon="🚨"
        />
        
        {/* Secondary Metrics */}
        <VStack gap={spacing[4]}>
          <SecondaryMetricCard
            value={metrics.avgResponseTime}
            label="Avg Response Time"
            unit="min"
            status={metrics.avgResponseTime <= 3 ? 'good' : metrics.avgResponseTime <= 5 ? 'warning' : 'critical'}
          />
          <SecondaryMetricCard
            value={metrics.staffOnline}
            label="Staff Online"
            unit={`/ ${metrics.totalStaff}`}
            status={metrics.staffOnline >= metrics.minStaffRequired ? 'good' : 'critical'}
          />
        </VStack>
        
        {/* Mini Stats */}
        <VStack gap={spacing[3]}>
          <Text size="sm" weight="medium">By Priority</Text>
          <MiniStat label="Critical" value={metrics.criticalAlerts} color={healthcareColors.emergency} index={0} />
          <MiniStat label="Urgent" value={metrics.urgentAlerts} color={healthcareColors.warning} index={1} />
          <MiniStat label="Standard" value={metrics.standardAlerts} color={healthcareColors.info} index={2} />
          <MiniStat label="Resolved" value={metrics.resolvedToday} color={healthcareColors.success} index={3} />
        </VStack>
      </Grid>
      
      {/* Department breakdown */}
      <Card padding={spacing[6]} gap={spacing[4]}>
        <Text weight="medium">Department Performance</Text>
        <Grid columns={Platform.OS === 'web' ? 4 : 2} gap={spacing[4]}>
          {metrics.departmentStats.map((dept) => (
            <VStack key={dept.id} gap={spacing[2]}>
              <HStack justifyContent="space-between">
                <Text size="sm">{dept.name}</Text>
                <Badge size="sm" variant={dept.alerts > 0 ? "error" : "outline"}>
                  {dept.alerts}
                </Badge>
              </HStack>
              <Progress 
                value={(dept.responseRate || 0) * 100} 
                size="sm"
                colorTheme={dept.responseRate >= 0.8 ? "success" : "warning"}
              />
              <Text size="xs" colorTheme="mutedForeground">
                {Math.round((dept.responseRate || 0) * 100)}% response rate
              </Text>
            </VStack>
          ))}
        </Grid>
      </Card>
    </>
  );
};

// Main component with Suspense boundary
export const MetricsOverviewBlock = ({ hospitalId }: { hospitalId: string }) => {
  const { animatedStyle: blockFadeStyle, fadeIn } = useFadeAnimation({ duration: 500 });
  
  useEffect(() => {
    fadeIn();
  }, [fadeIn]);
  
  return (
    <Animated.View style={blockFadeStyle}>
      <VStack gap={spacing[6]}>
      <HStack justifyContent="space-between" alignItems="center">
        <Text size="xl" weight="bold">System Metrics</Text>
        <Badge variant="outline" size="sm">
          Live
        </Badge>
      </HStack>
      
      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsContent hospitalId={hospitalId} />
      </Suspense>
    </VStack>
    </Animated.View>
  );
};