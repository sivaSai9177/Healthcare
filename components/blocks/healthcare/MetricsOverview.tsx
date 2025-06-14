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
import { useSpacing } from '@/lib/stores/spacing-store';
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';

import { api } from '@/lib/api/trpc';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { log } from '@/lib/core/debug/logger';

import { useFadeAnimation, useEntranceAnimation } from '@/lib/ui/animations';
import { haptic } from '@/lib/ui/haptics';
import { SpacingScale } from '@/lib/design';
import { useAuthStore } from '@/lib/stores/auth-store';

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
  variant: 'destructive' | 'secondary' | 'default' | 'success';
  icon: string;
}) => {
  const { spacing, componentSizes } = useSpacing();
  const shadowStyle = useShadow({ size: 'lg' });
  
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
      className={cn(
        "p-6 border-t-[3px] min-h-[120px]",
        variant === 'destructive' && "border-t-destructive",
        variant === 'secondary' && "border-t-warning",
        variant === 'success' && "border-t-success",
        variant === 'default' && "border-t-primary"
      )}
      style={shadowStyle}
    >
      <HStack justifyContent="space-between" alignItems="flex-start">
        <VStack gap={spacing[3]}>
          <Animated.Text style={[{ fontSize: 48, fontWeight: 'bold' }, animatedTextStyle]} className="text-foreground">
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
          <Progress value={(value / capacity) * 100} variant={variant} />
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
  const { spacing, componentSizes } = useSpacing();
  const shadowStyle = useShadow({ size: 'md' });
  const getStatusVariant = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return 'success';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'default';
    }
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
      className={cn(
        "p-5 border-l-[3px]",
        status && getStatusVariant(status) === 'success' && "border-l-success",
        status && getStatusVariant(status) === 'secondary' && "border-l-warning",
        status && getStatusVariant(status) === 'destructive' && "border-l-destructive",
        !status && "border-l-border"
      )}
      style={[{
        height: componentSizes.button.lg.height * 2,
      }, shadowStyle]}
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
const MiniStat = ({ label, value, variant, index }: { label: string; value: number; variant: 'destructive' | 'secondary' | 'default' | 'success'; index: number }) => {
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
      className={cn(
        "p-3 rounded-md",
        variant === 'destructive' && "bg-destructive/10",
        variant === 'secondary' && "bg-warning/10",
        variant === 'success' && "bg-success/10",
        variant === 'default' && "bg-primary/10"
      )}
      style={{
        height: componentSizes.button.sm.height,
      }}
    >
      <Box
        width={8}
        height={8}
        className={cn(
          "rounded-full",
          variant === 'destructive' && "bg-destructive",
          variant === 'secondary' && "bg-warning",
          variant === 'success' && "bg-success",
          variant === 'default' && "bg-primary"
        )}
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
            className="p-8 bg-muted opacity-50"
            style={{
              height: componentSizes.button.lg.height * 3,
            }}
          />
        </Animated.View>
      ))}
    </Grid>
  );
};

// Main metrics content
const MetricsContent = ({ hospitalId }: { hospitalId: string }) => {
  const { spacing } = useSpacing();
  const { timeRange, department, refreshInterval, setTimeRange } = useMetricsStore();
  const [isPending, startTransition] = useTransition();
  const { user } = useAuthStore();
  
  // Deferred values for smooth interactions
  const deferredTimeRange = useDeferredValue(timeRange);
  const deferredDepartment = useDeferredValue(department);
  
  // Early return if no user
  if (!user) {
    return <MetricsSkeleton />;
  }
  
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
      enabled: !!user, // Only fetch if user is authenticated
    }
  );
  
  // Real-time subscription
  api.healthcare.subscribeToMetrics.useSubscription(
    undefined,
    {
      enabled: !!user, // Only subscribe if user is authenticated
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
          variant="destructive"
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
          <MiniStat label="Critical" value={metrics.criticalAlerts} variant="destructive" index={0} />
          <MiniStat label="Urgent" value={metrics.urgentAlerts} variant="secondary" index={1} />
          <MiniStat label="Standard" value={metrics.standardAlerts} variant="default" index={2} />
          <MiniStat label="Resolved" value={metrics.resolvedToday} variant="success" index={3} />
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
                <Badge size="sm" variant={dept.alerts > 0 ? "destructive" : "outline"}>
                  {dept.alerts}
                </Badge>
              </HStack>
              <Progress 
                value={(dept.responseRate || 0) * 100} 
                size="sm"
                variant={dept.responseRate >= 0.8 ? "default" : "secondary"}
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
  const { spacing } = useSpacing();
  const { animatedStyle: blockFadeStyle, fadeIn } = useFadeAnimation({ duration: 500 });
  const { user } = useAuthStore();
  
  useEffect(() => {
    fadeIn();
  }, [fadeIn]);
  
  // Don't render if no user
  if (!user) {
    return null;
  }
  
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