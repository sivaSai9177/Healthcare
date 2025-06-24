import React, { Suspense, useTransition, useEffect } from 'react';
import { Platform, View, Pressable } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSpring,
  interpolate,
  withRepeat,
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
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTheme } from '@/lib/theme/provider';

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { log } from '@/lib/core/debug/logger';

import { useFadeAnimation, useEntranceAnimation } from '@/lib/ui/animations';
import { haptic } from '@/lib/ui/haptics';
import { SpacingScale } from '@/lib/design';
import { useHealthcareAccess } from '@/hooks/usePermissions';
import { useMetrics } from '@/hooks/healthcare';

// Metrics store with Zustand
interface MetricsState {
  timeRange: '1h' | '6h' | '24h' | '7d';
  department: string;
  refreshInterval: number;
  setTimeRange: (range: '1h' | '6h' | '24h' | '7d') => void;
  setDepartment: (dept: string) => void;
  setRefreshInterval: (interval: number) => void;
}

// Live Indicator Component - More subtle animation
const LiveIndicator = () => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);
  
  useEffect(() => {
    // Subtle pulsing animation with longer delay
    scale.value = withRepeat(
      withTiming(1.3, { duration: 2000 }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(0.1, { duration: 2000 }),
      -1,
      true
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return (
    <View style={{ position: 'relative', marginRight: 8 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.success,
        }}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.success,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

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
  variant,
  icon 
}: { 
  value: number;
  label: string;
  trend?: number;
  capacity?: number;
  variant: 'destructive' | 'secondary' | 'default' | 'success';
  icon: string;
}) => {
  const shadowStyle = useShadow({ size: 'md' });
  
  // Animation for card entrance
  const { animatedStyle: cardEntranceStyle, fadeIn } = useFadeAnimation({ 
    duration: 'normal' as any,
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
        'clamp'
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
        <VStack gap={3 as any}>
          <Animated.Text style={[{ fontSize: 48, fontWeight: 'bold' }, animatedTextStyle]} className="text-foreground">
            {Math.round(animatedValue.value)}
          </Animated.Text>
          <Text size="sm" colorTheme="mutedForeground">{label}</Text>
        </VStack>
        <Text size="3xl">{icon}</Text>
      </HStack>
      
      {capacity !== undefined && (
        <VStack gap={2 as any}>
          <HStack justifyContent="space-between">
            <Text size="xs" colorTheme="mutedForeground">Capacity</Text>
            <Text size="xs" weight="medium">{Math.round((value / capacity) * 100)}%</Text>
          </HStack>
          <Progress value={(value / capacity) * 100} variant={variant as any} />
        </VStack>
      )}
      
      {trend !== undefined && (
        <HStack gap={2 as any} alignItems="center">
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
  const shadowStyle = useShadow({ size: 'sm' });
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
    duration: 'normal' as const,
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
        height: 104, // componentSizes.button.lg.height * 2
      }, shadowStyle]}
    >
      <Text size="xs" colorTheme="mutedForeground">{label}</Text>
      <HStack gap={2 as any} alignItems="baseline">
        <Text size="2xl" weight="bold">{value}</Text>
        {unit && <Text size="sm" colorTheme="mutedForeground">{unit}</Text>}
      </HStack>
    </Card>
    </Animated.View>
  );
};

// Mini stat component - Enhanced UI
const MiniStat = ({ label, value, variant, index }: { label: string; value: number; variant: 'destructive' | 'secondary' | 'default' | 'success'; index: number }) => {
  const theme = useTheme();
  const shadowStyle = useShadow({ size: 'sm' });
  
  // Staggered fade in for mini stats
  const { animatedStyle } = useEntranceAnimation({
    type: 'fade',
    delay: 300 + (index * 100),
    duration: 'normal' as const,
  });
  
  const getColors = () => {
    switch (variant) {
      case 'destructive':
        return { bg: theme.destructive, text: theme.destructive, bgLight: theme.destructive + '15' };
      case 'secondary':
        return { bg: theme.warning, text: theme.warning, bgLight: theme.warning + '15' };
      case 'success':
        return { bg: theme.success, text: theme.success, bgLight: theme.success + '15' };
      default:
        return { bg: theme.primary, text: theme.primary, bgLight: theme.primary + '15' };
    }
  };
  
  const colors = getColors();
  
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          {
            backgroundColor: colors.bgLight,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.bg + '20',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          },
          shadowStyle,
        ]}
      >
        <Box
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.bg,
          }}
        />
        <Box flex={1}>
          <Text size="xs" colorTheme="mutedForeground">{label}</Text>
          <Text size="lg" weight="bold" style={{ color: colors.text }}>
            {value}
          </Text>
        </Box>
      </Pressable>
    </Animated.View>
  );
};

// Metrics skeleton loader
const MetricsSkeleton = () => {
  const { animatedStyle: pulseStyle } = useFadeAnimation({
    duration: 'slow' as const,
    loop: true,
  });
  
  return (
    <Grid
      columns={Platform.OS === 'web' ? 3 : 1}
      gap={6 as any}
    >
      {[1, 2, 3].map((i) => (
        <Animated.View key={i} style={pulseStyle}>
          <Card
            className="p-8 bg-muted opacity-50"
            style={{
              height: 156, // componentSizes.button.lg.height * 3
            }}
          >
            <></>
          </Card>
        </Animated.View>
      ))}
    </Grid>
  );
};

// Main metrics content
const MetricsContent = ({ hospitalId, timeRange, setTimeRange, isPending, startTransition }: { 
  hospitalId: string;
  timeRange: '1h' | '6h' | '24h' | '7d';
  setTimeRange: (range: '1h' | '6h' | '24h' | '7d') => void;
  isPending: boolean;
  startTransition: (callback: () => void) => void;
}) => {
  const { refreshInterval, department } = useMetricsStore();
  const { isHealthcareRole, canViewAlerts, isLoading, isAuthenticated, user } = useHealthcareAccess();
  
  // Deferred values for smooth interactions
  // const deferredTimeRange = useDeferredValue(timeRange);
  // const deferredDepartment = useDeferredValue(department);
  
  // Use enhanced hook for metrics with offline support
  const metricsQuery = useMetrics({
    hospitalId,
    timeRange,
    department,
    enabled: !!user && isAuthenticated && isHealthcareRole && !isLoading,
    refetchInterval: refreshInterval,
  });
  
  // Early return if auth is not ready
  if (isLoading || !isAuthenticated || !user) {
    return <MetricsSkeleton />;
  }
  
  // Check if user has healthcare role and can view alerts
  if (!isHealthcareRole || !canViewAlerts) {
    return (
      <Card>
        <Box p={4}>
          <VStack gap={3 as any} alignItems="center">
            <Text size="lg" colorTheme="mutedForeground">Healthcare Access Required</Text>
            <Text size="sm" colorTheme="mutedForeground">
              This section is only available to healthcare professionals with alert viewing permissions
            </Text>
          </VStack>
        </Box>
      </Card>
    );
  }
  
  // Use cached data when offline
  const displayMetrics = (metricsQuery as any).data || (metricsQuery as any).cachedData;
  
  // Handle error state
  if ((metricsQuery as any).error) {
    log.error('Failed to fetch metrics', 'METRICS', (metricsQuery as any).error);
    return (
      <Card>
        <Box p={4}>
          <VStack gap={3 as any} alignItems="center">
            <Text size="lg" colorTheme="destructive">Unable to load metrics</Text>
            <Text size="sm" colorTheme="mutedForeground">Please check your connection and try again</Text>
          </VStack>
        </Box>
      </Card>
    );
  }
  
  if (!displayMetrics && (metricsQuery as any).isLoading) {
    return <MetricsSkeleton />;
  }
  
  if (!displayMetrics) {
    return (
      <Card>
        <Box p={4}>
          <VStack gap={3 as any} alignItems="center">
            <Text size="lg" colorTheme="mutedForeground">No metrics available</Text>
            <Text size="sm" colorTheme="mutedForeground">
              {(metricsQuery as any).isOffline ? 'You are currently offline' : 'Please try again later'}
            </Text>
            {(metricsQuery as any).isOffline && (metricsQuery as any).cachedData && (
              <Badge variant="outline" size="sm">Using cached data</Badge>
            )}
          </VStack>
        </Box>
      </Card>
    );
  }
  
  return (
    <>
      {/* Main metrics grid - Responsive */}
      <View style={{
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        flexWrap: 'wrap',
        gap: 24,
        marginHorizontal: -12,
      }}>
        {/* Primary Metric - Always full width on mobile */}
        <View style={{
          flex: Platform.OS === 'web' ? 1 : undefined,
          minWidth: Platform.OS === 'web' ? 280 : undefined,
          paddingHorizontal: 12,
          width: '100%',
        }}>
          <PrimaryMetricCard
            value={displayMetrics.activeAlerts}
            label="Active Alerts"
            trend={displayMetrics.alertsTrend}
            capacity={displayMetrics.alertCapacity}
            variant="destructive"
            icon="🚨"
          />
        </View>
        
        {/* Secondary Metrics */}
        <View style={{
          flex: Platform.OS === 'web' ? 1 : undefined,
          minWidth: Platform.OS === 'web' ? 280 : undefined,
          paddingHorizontal: 12,
          width: '100%',
        }}>
          <VStack gap={4 as any}>
            <SecondaryMetricCard
              value={displayMetrics.avgResponseTime}
              label="Avg Response Time"
              unit="min"
              status={displayMetrics.avgResponseTime <= 3 ? 'good' : displayMetrics.avgResponseTime <= 5 ? 'warning' : 'critical'}
            />
            <SecondaryMetricCard
              value={displayMetrics.staffOnline}
              label="Staff Online"
              unit={`/ ${displayMetrics.totalStaff}`}
              status={displayMetrics.staffOnline >= displayMetrics.minStaffRequired ? 'good' : 'critical'}
            />
          </VStack>
        </View>
        
        {/* Mini Stats - Priority Ordered - Responsive */}
        <View style={{
          flex: Platform.OS === 'web' ? 1 : undefined,
          minWidth: Platform.OS === 'web' ? 280 : undefined,
          paddingHorizontal: 12,
          width: '100%',
        }}>
          <VStack gap={3 as any}>
            <Text size="sm" weight="medium">By Priority</Text>
            <VStack gap={Platform.OS === 'web' ? 12 : 8}>
              <HStack gap={Platform.OS === 'web' ? 12 : 8}>
                <View style={{ flex: 1 }}>
                  <MiniStat label="Critical" value={displayMetrics.criticalAlerts} variant="destructive" index={0} />
                </View>
                <View style={{ flex: 1 }}>
                  <MiniStat label="Urgent" value={displayMetrics.urgentAlerts} variant="secondary" index={1} />
                </View>
              </HStack>
              <HStack gap={Platform.OS === 'web' ? 12 : 8}>
                <View style={{ flex: 1 }}>
                  <MiniStat label="Standard" value={displayMetrics.standardAlerts} variant="default" index={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <MiniStat label="Resolved" value={displayMetrics.resolvedToday} variant="success" index={3} />
                </View>
              </HStack>
            </VStack>
          </VStack>
        </View>
      </View>
      
      {/* Department breakdown - No extra card, better spacing */}
      <VStack gap={3 as any}>
        <Text weight="medium">Department Performance</Text>
        <Grid columns={Platform.OS === 'web' ? 4 : 2} gap={4 as any}>
          {(displayMetrics.departmentStats || []).map((dept) => (
            <VStack key={dept.id} gap={2 as any}>
              <HStack justifyContent="space-between">
                <Text size="sm">{dept.name}</Text>
                <Badge size="sm" variant={dept.alerts > 0 ? "error" : "outline"}>
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
      </VStack>
    </>
  );
};

// Main component with Suspense boundary
export const MetricsOverviewBlock = ({ hospitalId }: { hospitalId: string }) => {
  const { animatedStyle: blockFadeStyle, fadeIn } = useFadeAnimation({ duration: 'fast' as any });
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const { timeRange, setTimeRange } = useMetricsStore();
  const [isPending, startTransition] = useTransition();
  
  useEffect(() => {
    fadeIn();
  }, [fadeIn]);
  
  // Don't render if auth is not ready
  if (!hasHydrated || !isAuthenticated || !user) {
    return null;
  }
  
  return (
    <Animated.View style={blockFadeStyle}>
      <Card>
        <Box p={4}>
          <VStack gap={6 as any}>
            <HStack justifyContent="space-between" alignItems="center">
              <HStack gap={2 as any} alignItems="center">
                <LiveIndicator />
                <Text size="xl" weight="bold">System Metrics</Text>
              </HStack>
              
              {/* Time range selector - Responsive */}
              <HStack gap={Platform.OS === 'web' ? 2 : 1} flexWrap="wrap">
                {(['1h', '6h', '24h', '7d'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "ghost"}
                    size={Platform.OS === 'web' ? "sm" : "xs"}
                    onPress={() => {
                      haptic('light');
                      startTransition(() => {
                        setTimeRange(range);
                      });
                    }}
                    isLoading={(isPending && timeRange === range) as any}
                    style={{
                      paddingHorizontal: Platform.OS === 'web' ? 12 : 8,
                      paddingVertical: Platform.OS === 'web' ? 6 : 4,
                    }}
                  >
                    {range.toUpperCase()}
                  </Button>
                ))}
              </HStack>
            </HStack>
            
            <Suspense fallback={<MetricsSkeleton />}>
              <MetricsContent 
                hospitalId={hospitalId} 
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                isPending={isPending}
                startTransition={startTransition}
              />
            </Suspense>
          </VStack>
        </Box>
      </Card>
    </Animated.View>
  );
};