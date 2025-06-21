import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  RefreshControl, 
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, Redirect } from 'expo-router';
import {
  VStack,
  HStack,
  Text,
  Container,
  Button,
  Badge,
  Box,
  Symbol,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useResponsive } from '@/hooks/responsive';
import { log } from '@/lib/core/debug/unified-logger';
import { useAlertWebSocket, useHospitalContext } from '@/hooks/healthcare';
import { useActiveAlerts, useAcknowledgeAlert, useResolveAlert } from '@/hooks/healthcare/useHealthcareApi';
import { haptic } from '@/lib/ui/haptics';
import { useSpacing } from '@/lib/stores/spacing-store';
import { 
  AlertCardPremium,
  AlertTimelineWidget,
  AlertFilters,
} from '@/components/blocks/healthcare';
import { ApiErrorBoundary } from '@/components/blocks/errors/ApiErrorBoundary';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealthcareAccess } from '@/hooks/usePermissions';
import { useSSRPrefetchHealthcare } from '@/lib/api/use-ssr-prefetch';
import Animated, { 
  FadeInDown, 
  useAnimatedStyle, 
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { AnimatedPageWrapper, pageEnteringAnimations } from '@/lib/navigation/page-transitions';
import { useLayoutTransition } from '@/hooks/useLayoutTransition';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function AlertsScreenContent() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { isMobile } = useResponsive();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const scrollY = useSharedValue(0);
  
  // Page transition animation
  const { animatedStyle } = useLayoutTransition({ 
    type: 'glass', 
    duration: 300,
    hapticFeedback: true 
  });
  
  // Permission checks
  const { canViewAlerts, canCreateAlerts, canAcknowledgeAlerts, canResolveAlerts } = useHealthcareAccess();
  
  // Hospital context validation
  const hospitalContext = useHospitalContext();
  
  // SSR prefetch for web - use empty string as default when no hospitalId
  useSSRPrefetchHealthcare(hospitalContext.hospitalId || '');
  
  // Use the hospitalId or empty string for hooks that require it
  const hospitalId = hospitalContext.hospitalId || '';
  
  // Use enhanced API hooks with error handling and caching
  // These hooks must be called before any conditional returns
  const { 
    data, 
    isLoading, 
    refetch, 
    error,
    isOffline,
    cachedData,
  } = useActiveAlerts({
    enabled: !!user && !!hospitalId && hospitalContext.canAccessHealthcare,
    refetchInterval: 30000, // 30 seconds
  }) as any;
  
  // Use enhanced mutations
  const acknowledgeMutation = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();
  
  // WebSocket integration - must be called before conditional returns
  useAlertWebSocket({
    hospitalId,
    showNotifications: true,
    onAlertCreated: () => {
      log.info('New alert created - refreshing list', 'ALERTS');
      refetch();
    },
    onAlertAcknowledged: () => {
      log.info('Alert acknowledged - refreshing list', 'ALERTS');
      refetch();
    },
    onAlertResolved: () => {
      log.info('Alert resolved - refreshing list', 'ALERTS');
      refetch();
    },
  });
  
  // Log query state for debugging
  useEffect(() => {
    log.debug('Alerts query state', 'ALERTS', {
      enabled: !!user && !!hospitalId && hospitalContext.canAccessHealthcare,
      hospitalId,
      userId: user?.id,
      userRole: user?.role,
      canAccessHealthcare: hospitalContext.canAccessHealthcare,
      hasValidHospital: hospitalContext.hasValidHospital,
      hospitalError: hospitalContext.error,
    });
  }, [user, hospitalId, hospitalContext]);
  
  // Callbacks - must be defined before conditional returns
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    haptic('light');
    try {
      await refetch();
      haptic('success');
    } catch {
      // Error handling is done by the hook
      haptic('error');
    }
    setRefreshing(false);
  }, [refetch]);
  
  const handleCreateAlert = useCallback(() => {
    haptic('medium');
    if (canCreateAlerts) {
      router.push('/(modals)/create-alert');
    } else {
      // Error alert is handled by the hook
    }
  }, [canCreateAlerts, router]);
  
  const handleAcknowledge = useCallback(async (alertId: string) => {
    await acknowledgeMutation.mutateWithFeedback({ 
      alertId,
      notes: 'Acknowledged via mobile app',
    });
  }, [acknowledgeMutation]);
  
  const handleResolve = useCallback(async (alertId: string) => {
    await resolveMutation.mutateWithFeedback({ 
      alertId,
      resolution: 'Resolved via mobile app',
    });
  }, [resolveMutation]);
  
  // Header animation based on scroll - must be defined before conditional returns
  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [180, 100],
      'clamp'
    );
    return {
      height,
    };
  });
  
  // For now, disable timeline data as it requires alertId
  // TODO: Create a separate query for getting timeline events for all alerts in a hospital
  const timelineData = null;
  
  // Now we can do conditional returns after all hooks have been called
  // Check permissions
  if (!canViewAlerts) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }
  
  // Show simple message if hospital is missing (non-blocking)
  if (!hospitalContext.hospitalId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Container>
          <VStack p={4} gap={4 as any}>
            <Box p={6} gap={4 as any} style={{ 
              alignItems: 'center',
              backgroundColor: theme.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border
            }}>
              <Symbol name="bell.badge" size={48} color={theme.mutedForeground} />
              <VStack gap={2 as any} style={{ alignItems: 'center' }}>
                <Text size="lg" weight="medium">No Hospital Selected</Text>
                <Text size="sm" style={{ color: theme.mutedForeground, textAlign: 'center' }}>
                  Please select a hospital from settings to view alerts.
                </Text>
              </VStack>
              <Button 
                variant="outline" 
                size="sm"
                onPress={() => {
                  haptic('light');
                  router.push('/(tabs)/settings' as any);
                }}
              >
                Go to Settings
              </Button>
            </Box>
          </VStack>
        </Container>
      </SafeAreaView>
    );
  }
  
  // Return early if no valid hospital
  if (!hospitalContext.hospitalId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Container>
          <VStack p={4} gap={4 as any} alignItems="center" justifyContent="center" style={{ flex: 1 }}>
            <Text size="base" weight="semibold">Unable to Access Alerts</Text>
            <Text colorTheme="mutedForeground" align="center">
              {hospitalContext.errorMessage || 'No hospital assigned'}
            </Text>
            <Button onPress={() => router.push('/(app)/(tabs)/home')} variant="outline">
              Return to Home
            </Button>
          </VStack>
        </Container>
      </SafeAreaView>
    );
  }
  
  const filteredAlerts = data?.alerts.filter(alert => {
    if (searchQuery && !alert.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (urgencyFilter !== 'all' && alert.urgencyLevel.toString() !== urgencyFilter) {
      return false;
    }
    if (statusFilter === 'active' && (alert.resolved || alert.acknowledged)) {
      return false;
    }
    if (statusFilter === 'acknowledged' && !alert.acknowledged) {
      return false;
    }
    return true;
  }) || [];
  
  // Stats calculation
  const stats = {
    total: filteredAlerts.length,
    critical: filteredAlerts.filter(a => a.urgencyLevel <= 2).length,
    acknowledged: filteredAlerts.filter(a => a.status === 'acknowledged').length,
    avgResponseTime: '2m 15s', // This would come from real data
  };
  
  if (isLoading && !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <VStack style={{ flex: 1 }} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={theme.primary} />
          <Text mt={4} colorTheme="mutedForeground">Loading alerts...</Text>
        </VStack>
      </SafeAreaView>
    );
  }
  
  return (
    <AnimatedPageWrapper entering={pageEnteringAnimations.glassIn} style={animatedStyle}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        {/* Animated Header */}
        <Animated.View style={[headerStyle, { overflow: 'hidden' }] as any}>
        <LinearGradient
          colors={[theme.primary + '20', theme.background]}
          style={{ flex: 1, paddingHorizontal: spacing[4] as any, paddingTop: spacing[4] as any }}
        >
          <VStack gap={spacing[3] as any}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack>
                <Text size="3xl" weight="bold">Alerts</Text>
                <Text size="sm" colorTheme="mutedForeground">
                  Real-time monitoring
                </Text>
              </VStack>
              
              {canCreateAlerts && (
                <Button
                  onPress={handleCreateAlert}
                  size="default"
                  style={{
                    backgroundColor: '#ef4444',
                    borderRadius: 12,
                  }}
                >
                  <HStack gap={spacing[1] as any} alignItems="center">
                    <Symbol name="plus.circle.fill" size="sm" color="white" />
                    <Text style={{ color: 'white' }}>New Alert</Text>
                  </HStack>
                </Button>
              )}
            </HStack>
            
            {/* Quick Stats */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing[2] as any , paddingBottom: 20 }}
              style={{ flexGrow: 0 }}
            >
              <StatCard
                icon="bell.fill"
                label="Total"
                value={stats.total.toString()}
                color="#3b82f6"
              />
              <StatCard
                icon="exclamationmark.triangle.fill"
                label="Critical"
                value={stats.critical.toString()}
                color="#ef4444"
              />
              <StatCard
                icon="checkmark.circle.fill"
                label="Acknowledged"
                value={stats.acknowledged.toString()}
                color="#10b981"
              />
              <StatCard
                icon="clock.fill"
                label="Avg Response"
                value={stats.avgResponseTime}
                color="#f59e0b"
              />
            </ScrollView>
          </VStack>
        </LinearGradient>
      </Animated.View>
      
      <ScrollView
        contentContainerStyle={{ 
          padding: spacing[4] as any, 
          paddingBottom: spacing[8] as any 
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        onScroll={(event) => {
          scrollY.value = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <VStack gap={spacing[4] as any}>
          {/* Filters */}
          <AlertFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            urgencyFilter={urgencyFilter}
            onUrgencyChange={setUrgencyFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />
          
          {/* Alert Cards */}
          <VStack gap={spacing[3] as any}>
            {filteredAlerts.map((alert, index) => (
              <AlertCardPremium
                key={alert.id}
                alert={alert}
                index={index}
                onPress={() => router.push(`/(app)/(tabs)/alerts/${alert.id}`)}
                onAcknowledge={canAcknowledgeAlerts ? handleAcknowledge : undefined}
                onResolve={canResolveAlerts ? handleResolve : undefined}
                canAcknowledge={canAcknowledgeAlerts}
                canResolve={canResolveAlerts}
              />
            ))}
            
            {filteredAlerts.length === 0 && (
              <EmptyState 
                searchQuery={searchQuery}
                hasFilters={urgencyFilter !== 'all' || statusFilter !== 'active'}
              />
            )}
          </VStack>
          
          {/* Timeline Widget - Show for recent events */}
          {timelineData && timelineData.events && timelineData.events.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)}>
              <AlertTimelineWidget
                events={timelineData.events.slice(0, 10)}
                alertStatus="active"
                urgencyLevel={3}
              />
            </Animated.View>
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
    </AnimatedPageWrapper>
  );
}

// Stat Card Component
const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  
  return (
    <View style={{
      backgroundColor: color + '10',
      borderRadius: 12,
      padding: spacing[3] as any,
      minWidth: 100,
      borderWidth: 1,
      borderColor: color + '30',
    }}>
      <VStack gap={spacing[1] as any} alignItems="center">
        <Symbol name={icon as any} size="sm" color={color} />
        <Text size="xs" colorTheme="mutedForeground">{label}</Text>
        <Text size="base" weight="bold" style={{ color }}>{value}</Text>
      </VStack>
    </View>
  );
};

// Empty State Component
const EmptyState: React.FC<{
  searchQuery: string;
  hasFilters: boolean;
}> = ({ searchQuery, hasFilters }) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  
  return (
    <VStack 
      gap={spacing[4] as any} 
      alignItems="center" 
      p={spacing[8] as any}
      style={{
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <Symbol name="bell.slash" size="xl" color={theme.mutedForeground} />
      <VStack gap={spacing[2] as any} alignItems="center">
        <Text size="base" weight="semibold">No alerts found</Text>
        <Text colorTheme="mutedForeground" align="center">
          {searchQuery || hasFilters
            ? 'Try adjusting your filters'
            : 'All alerts have been handled'}
        </Text>
      </VStack>
    </VStack>
  );
};

// Export component wrapped with error boundary
export default function AlertsScreen() {
  return (
    <ApiErrorBoundary retryRoute="/(app)/(tabs)/alerts">
      <AlertsScreenContent />
    </ApiErrorBoundary>
  );
}