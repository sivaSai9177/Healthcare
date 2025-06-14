import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  VStack,
  Text,
  Container,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { api } from '@/lib/api/trpc';
import { 
  HealthcareUserRole,
  type AlertWithRelations,
} from '@/types/healthcare';
import { useResponsive } from '@/hooks/responsive';
import { showErrorAlert } from '@/lib/core/alert';
import { getModuleLogger } from '@/lib/core/debug/window-logger';
import { useAlertSubscription } from '@/hooks/healthcare';
import { haptic } from '@/lib/ui/haptics';
import { useSpacing } from '@/lib/stores/spacing-store';

// Create module logger for this screen
const logger = getModuleLogger('Healthcare:Alerts');

// Import block components
import { 
  AlertItem,
  AlertSummary,
  AlertFilters,
  AlertActions 
} from '@/components/blocks/healthcare';

export default function AlertsScreen() {
  const { user } = useAuthStore();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { isMobile } = useResponsive();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  
  // Get hospital ID from user context
  const hospitalId = user?.organizationId || 'default-hospital';
  const role = user?.role as HealthcareUserRole;
  
  // Log component lifecycle
  useEffect(() => {
    logger.info('Alerts screen mounted', {
      user: user?.email,
      role,
      hospitalId,
    });
    
    return () => {
      logger.info('Alerts screen unmounted');
    };
  }, []);
  
  if (!user) {
    return (
      <Container>
        <VStack gap={spacing[3]} align="center" justify="center" className="flex-1">
          <Text size="lg">Please log in to view alerts</Text>
        </VStack>
      </Container>
    );
  }
  
  // Subscribe to real-time updates
  useAlertSubscription({
    hospitalId,
    onAlertCreated: (event) => {
      logger.info('New alert created', event);
      haptic('success');
    },
    onAlertEscalated: (event) => {
      logger.warn('Alert escalated', event);
      haptic('warning');
    },
    showNotifications: true,
  });
  
  // Fetch active alerts (will be refreshed by subscription)
  const { data, refetch, isLoading } = api.healthcare.getActiveAlerts.useQuery({
    hospitalId,
    limit: 50,
  }, {
    refetchInterval: 30000, // Reduced interval since we have subscriptions
  });
  
  // Acknowledge alert mutation
  const acknowledgeMutation = api.healthcare.acknowledgeAlert.useMutation({
    onSuccess: (data) => {
      logger.info('Alert acknowledged successfully', { alertId: data.id });
      refetch();
    },
    onError: (error) => {
      logger.error('Failed to acknowledge alert', error);
      showErrorAlert('Failed to Acknowledge', error.message);
    },
  });
  
  // Resolve alert mutation
  const resolveMutation = api.healthcare.resolveAlert.useMutation({
    onSuccess: (data) => {
      logger.info('Alert resolved successfully', { alertId: data.id });
      refetch();
    },
    onError: (error) => {
      logger.error('Failed to resolve alert', error);
      showErrorAlert('Failed to Resolve', error.message);
    },
  });
  
  // Handle refresh
  const handleRefresh = async () => {
    logger.time('refresh-alerts');
    logger.debug('Refreshing alerts list');
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    logger.timeEnd('refresh-alerts');
  };
  
  // Handle acknowledge
  const handleAcknowledge = (alertId: string, notes?: string) => {
    logger.debug('Acknowledging alert', { alertId, hasNotes: !!notes });
    acknowledgeMutation.mutate({
      alertId,
      notes,
    });
  };
  
  // Handle resolve
  const handleResolve = (alertId: string, resolution: string) => {
    logger.debug('Resolving alert', { alertId, resolution });
    resolveMutation.mutate({
      alertId,
      resolution,
    });
  };
  
  // Filter and group alerts
  const alerts = data?.alerts || [];
  const filteredAlerts = alerts.filter((alert: AlertWithRelations) => {
    // Status filter
    if (statusFilter !== 'all' && alert.status !== statusFilter) {
      return false;
    }
    
    // Urgency filter
    if (urgencyFilter !== 'all' && alert.urgencyLevel !== parseInt(urgencyFilter)) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        alert.roomNumber.toLowerCase().includes(searchLower) ||
        alert.description?.toLowerCase().includes(searchLower) ||
        alert.alertType.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  const activeAlerts = filteredAlerts.filter((a: AlertWithRelations) => a.status === 'active');
  const acknowledgedAlerts = filteredAlerts.filter((a: AlertWithRelations) => a.status === 'acknowledged');
  
  // Can the user acknowledge/resolve alerts?
  const canAcknowledge = ['doctor', 'nurse', 'head_doctor', 'admin'].includes(role);
  const canResolve = ['doctor', 'head_doctor', 'admin'].includes(role);
  
  // Calculate stats for AlertSummary
  const stats = {
    totalActive: data?.alerts.filter((a: AlertWithRelations) => a.status === 'active').length || 0,
    totalAcknowledged: data?.alerts.filter((a: AlertWithRelations) => a.status === 'acknowledged').length || 0,
    totalResolved: data?.alerts.filter((a: AlertWithRelations) => a.status === 'resolved').length || 0,
    criticalCount: data?.alerts.filter((a: AlertWithRelations) => a.status === 'active' && a.urgencyLevel <= 2).length || 0,
    responseTime: 5.2, // This would come from actual data
  };
  
  const handleResetFilters = () => {
    setSearchQuery('');
    setUrgencyFilter('all');
    setStatusFilter('active');
  };
  
  if (isLoading && !data) {
    return (
      <Container>
        <VStack gap={spacing[4]} align="center" justify="center" className="flex-1" style={{ padding: spacing[4] }}>
          <Text>Loading alerts...</Text>
        </VStack>
      </Container>
    );
  }
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="animate-fade-in">
          <VStack gap={spacing[4]} style={{ padding: spacing[4] }}>
            {/* Summary Stats */}
            <View className="animate-scale-in">
              <AlertSummary
                totalActive={stats.totalActive}
                totalAcknowledged={stats.totalAcknowledged}
                totalResolved={stats.totalResolved}
                criticalCount={stats.criticalCount}
                responseTime={stats.responseTime}
                role={role}
              />
            </View>
            
            {/* Filters and Actions */}
            <VStack gap={spacing[3]}>
              <AlertFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                urgencyFilter={urgencyFilter}
                onUrgencyChange={setUrgencyFilter}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                onReset={handleResetFilters}
              />
              
              <AlertActions
                role={role}
                onRefresh={handleRefresh}
                isRefreshing={refreshing}
              />
            </VStack>
            
            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <VStack gap={spacing[3]}>
                <Text size="lg" weight="semibold">Active Alerts ({activeAlerts.length})</Text>
                {activeAlerts.map((alertData: AlertWithRelations, index: number) => (
                  <AlertItem
                    key={alertData.id}
                    alertData={alertData}
                    index={index}
                    role={role}
                    canAcknowledge={canAcknowledge}
                    canResolve={canResolve}
                    onAcknowledge={handleAcknowledge}
                    onResolve={handleResolve}
                    isAcknowledging={acknowledgeMutation.isPending}
                    isResolving={resolveMutation.isPending}
                  />
                ))}
              </VStack>
            )}
            
            {/* Acknowledged Alerts */}
            {acknowledgedAlerts.length > 0 && (
              <VStack gap={spacing[3]}>
                <Text size="lg" weight="semibold">Acknowledged Alerts ({acknowledgedAlerts.length})</Text>
                {acknowledgedAlerts.map((alertData: AlertWithRelations, index: number) => (
                  <AlertItem
                    key={alertData.id}
                    alertData={alertData}
                    index={activeAlerts.length + index}
                    role={role}
                    canAcknowledge={canAcknowledge}
                    canResolve={canResolve}
                    onAcknowledge={handleAcknowledge}
                    onResolve={handleResolve}
                    isAcknowledging={acknowledgeMutation.isPending}
                    isResolving={resolveMutation.isPending}
                  />
                ))}
              </VStack>
            )}
            
            {/* Empty State */}
            {filteredAlerts.length === 0 && (
              <VStack gap={spacing[4]} align="center" justify="center" className="py-12">
                <Text size="xl">🎉</Text>
                <Text size="lg" colorTheme="mutedForeground">No alerts found</Text>
                <Text size="sm" colorTheme="mutedForeground">
                  {searchQuery || urgencyFilter !== 'all' || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'All clear!'}
                </Text>
              </VStack>
            )}
          </VStack>
        </View>
        
        {/* Floating Action Button for mobile */}
        {isMobile && (
          <AlertActions
            role={role}
            showFloatingAction
          />
        )}
      </ScrollView>
    </View>
  );
}