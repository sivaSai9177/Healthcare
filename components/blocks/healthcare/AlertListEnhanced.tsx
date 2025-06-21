import React, { memo, useCallback } from 'react';
import { FlatList, RefreshControl, Platform } from 'react-native';
import { VStack, HStack } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Symbol, GlassCard } from '@/components/universal/display';
import { Alert as AlertComponent } from '@/components/universal/feedback';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';
import { 
  useActiveAlerts, 
  useAcknowledgeAlert, 
  useResolveAlert,
  useHospitalContext,
} from '@/hooks/healthcare';
import { useHealthcareAccess } from '@/hooks/usePermissions';
import { ApiErrorBoundary } from '@/components/blocks/errors';
// ProfileIncompletePrompt removed - hospital selection is now optional
import { AlertCardPremium } from './AlertCardPremium';
import { haptic } from '@/lib/ui/haptics';
import type { Alert } from '@/types/healthcare';

/**
 * Enhanced Alert List component with built-in error handling,
 * SSR support, and offline caching
 */
function AlertListContent({ 
  maxHeight,
  scrollEnabled = true,
  showResolved = false,
}: { 
  maxHeight?: number;
  scrollEnabled?: boolean;
  showResolved?: boolean;
}) {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const hospitalContext = useHospitalContext();
  const { canAcknowledgeAlerts, canResolveAlerts } = useHealthcareAccess();
  
  // Use enhanced API hooks
  const alertsQuery = useActiveAlerts({
    enabled: !!hospitalContext.hospitalId,
    refetchInterval: 30000, // 30 seconds
  });
  
  // Enhanced mutations with built-in feedback
  const acknowledgeMutation = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();
  
  // Handle actions
  const handleAcknowledge = useCallback(async (alertId: string) => {
    haptic('medium');
    await (acknowledgeMutation as any).mutateWithFeedback({
      alertId,
      notes: 'Acknowledged via enhanced alert list',
    });
  }, [acknowledgeMutation]);
  
  const handleResolve = useCallback(async (alertId: string) => {
    haptic('success');
    await (resolveMutation as any).mutateWithFeedback({
      alertId,
      resolution: 'Resolved via enhanced alert list',
    });
  }, [resolveMutation]);
  
  // Show simple message if hospital is missing
  if (!hospitalContext.hospitalId) {
    return (
      <GlassCard style={{ padding: spacing[4] as any }}>
        <VStack gap={spacing[2] as any} alignItems="center">
          <Symbol name="bell.slash" size="xl" color={theme.mutedForeground} />
          <Text size="lg" weight="medium">No Hospital Selected</Text>
          <Text size="sm" style={{ color: theme.mutedForeground, textAlign: 'center' }}>
            Please select a hospital from settings to view alerts.
          </Text>
        </VStack>
      </GlassCard>
    );
  }
  
  // Filter alerts
  const alerts = ((alertsQuery as any).data?.alerts || (alertsQuery as any).cachedData?.alerts || []).filter((alert: any) => 
    showResolved || (!alert.resolved && !alert.acknowledged)
  );
  
  // Loading state
  if ((alertsQuery as any).isLoading && !(alertsQuery as any).cachedData) {
    return (
      <VStack gap={spacing[4] as any}>
        {[1, 2, 3].map((i) => (
          <GlassCard
            key={i}
            className="animate-pulse"
            style={{ height: 120, padding: spacing[4] as any }}
          >
            <VStack gap={spacing[2] as any}>
              <HStack style={{ height: 20, backgroundColor: theme.muted, borderRadius: 4 }} />
              <HStack style={{ height: 16, backgroundColor: theme.muted, borderRadius: 4, width: '60%' }} />
            </VStack>
          </GlassCard>
        ))}
      </VStack>
    );
  }
  
  // Offline indicator
  if ((alertsQuery as any).isOffline && (alertsQuery as any).cachedData) {
    return (
      <VStack gap={spacing[4] as any}>
        <AlertComponent variant="default">
          <HStack gap={spacing[2] as any} alignItems="center">
            <Symbol name="wifi.slash" size="sm" />
            <Text size="sm">Showing cached data - offline mode</Text>
          </HStack>
        </AlertComponent>
        <AlertsList 
          alerts={alerts}
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
          canAcknowledge={canAcknowledgeAlerts}
          canResolve={canResolveAlerts}
          onRefresh={(alertsQuery as any).refetch}
          isRefreshing={(alertsQuery as any).isLoading}
        />
      </VStack>
    );
  }
  
  // Empty state
  if (alerts.length === 0) {
    return (
      <GlassCard
        className="items-center justify-center"
        style={{ minHeight: 200, padding: spacing[8] as any }}
      >
        <VStack gap={spacing[4] as any} alignItems="center">
          <Symbol name="checkmark.circle.fill" size="xl" color={theme.success} />
          <Text size="lg" weight="medium">No Active Alerts</Text>
          <Text size="sm" colorTheme="mutedForeground">
            All alerts have been handled
          </Text>
        </VStack>
      </GlassCard>
    );
  }
  
  // Alert list
  return (
    <AlertsList 
      alerts={alerts}
      onAcknowledge={handleAcknowledge}
      onResolve={handleResolve}
      canAcknowledge={canAcknowledgeAlerts}
      canResolve={canResolveAlerts}
      onRefresh={(alertsQuery as any).refetch}
      isRefreshing={(alertsQuery as any).isLoading}
      maxHeight={maxHeight}
      scrollEnabled={scrollEnabled}
    />
  );
}

// Memoized alert list component
const AlertsList = memo(({
  alerts,
  onAcknowledge,
  onResolve,
  canAcknowledge,
  canResolve,
  onRefresh,
  isRefreshing,
  maxHeight,
  scrollEnabled,
}: {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => Promise<void>;
  onResolve: (alertId: string) => Promise<void>;
  canAcknowledge: boolean;
  canResolve: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  maxHeight?: number;
  scrollEnabled?: boolean;
}) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  
  const renderItem = useCallback(({ item, index }: { item: Alert; index: number }) => (
    <AlertCardPremium
      key={item.id}
      alert={item}
      index={index}
      onPress={() => {/* Navigate to details */}}
      onAcknowledge={async (id) => await onAcknowledge(id)}
      onResolve={async (id) => await onResolve(id)}
      canAcknowledge={canAcknowledge}
      canResolve={canResolve}
    />
  ), [canAcknowledge, canResolve, onAcknowledge, onResolve]);
  
  const keyExtractor = useCallback((item: Alert) => item.id, []);
  
  if (Platform.OS === 'web' || !scrollEnabled) {
    return (
      <VStack gap={spacing[3] as any}>
        {alerts.map((alert, index) => renderItem({ item: alert, index }))}
      </VStack>
    );
  }
  
  return (
    <FlatList
      data={alerts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ gap: spacing[3] as any }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
      style={maxHeight ? { maxHeight } : undefined}
    />
  );
});

AlertsList.displayName = 'AlertsList';

/**
 * Export component wrapped with API error boundary
 */
export const AlertListEnhanced = ({ ...props }) => {
  return (
    <ApiErrorBoundary>
      <AlertListContent {...props} />
    </ApiErrorBoundary>
  );
};