import React, { memo } from 'react';
import { View, FlatList, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { EmptyState } from '@/components/universal/display';
import { HStack, VStack } from '@/components/universal/layout';
import { Symbol } from '@/components/universal/display/Symbols';
import { usePaginatedAlerts, useInfiniteAlerts } from '@/hooks/healthcare/usePaginatedAlerts';
import { AlertItem as AlertCardItem } from './AlertItem';
import { AlertFilters } from './AlertFilters';
import { useSpacing } from '@/lib/stores/spacing-store';
import { cn } from '@/lib/core/utils';
import { useAuth } from '@/hooks/useAuth';
import type { HealthcareUserRole } from '@/types/healthcare';

interface PaginatedAlertListProps {
  hospitalId: string;
  canAcknowledge: boolean;
  canResolve: boolean;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  useInfiniteScroll?: boolean;
  showFilters?: boolean;
}

export const PaginatedAlertList = memo(({
  hospitalId,
  canAcknowledge,
  canResolve,
  onAcknowledge,
  onResolve,
  useInfiniteScroll = Platform.OS !== 'web',
  showFilters = true,
}: PaginatedAlertListProps) => {
  const spacing = useSpacing();
  const { user } = useAuth();
  const userRole = (user?.role || 'operator') as HealthcareUserRole;
  const [filters, setFilters] = React.useState({
    status: 'active' as const,
    urgencyLevel: undefined as number | undefined,
    alertType: undefined as string | undefined,
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
  });

  // Use different hooks based on scroll type
  const paginatedData = usePaginatedAlerts({
    hospitalId,
    ...filters,
    enabled: !useInfiniteScroll,
  });

  const infiniteData = useInfiniteAlerts({
    hospitalId,
    ...filters,
    enabled: useInfiniteScroll,
  });

  // Unified data interface
  const {
    alerts,
    isLoading,
    error,
    refetch,
  } = useInfiniteScroll ? {
    alerts: infiniteData.alerts,
    isLoading: infiniteData.isLoading,
    error: infiniteData.error,
    refetch: infiniteData.refetch,
  } : {
    alerts: paginatedData.alerts,
    isLoading: paginatedData.isLoading,
    error: paginatedData.error,
    refetch: paginatedData.refetch,
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" className="mb-4" />
        <Text className="text-muted-foreground">Loading alerts...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        iconName={"exclamationmark.triangle.fill" as any}
        title="Error Loading Alerts"
        description={error.message || 'Failed to load alerts'}
        action={{
          label: 'Retry',
          onPress: refetch,
        }}
      />
    );
  }

  // Empty state
  if (!alerts.length) {
    return (
      <EmptyState
        iconName={"bell.slash" as any}
        title={filters.status === 'active' ? 'No Active Alerts' : 'No Alerts Found'}
        description={
          filters.status === 'active' 
            ? 'All clear! There are no active alerts at the moment.'
            : 'No alerts match your current filters.'
        }
        action={showFilters && (filters.status !== 'active' || filters.urgencyLevel) ? {
          label: 'Clear Filters',
          onPress: () => setFilters({
            status: 'active',
            urgencyLevel: undefined,
            alertType: undefined,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          }),
        } : undefined}
      />
    );
  }

  // Render alert item
  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <AlertCardItem
      alertData={item}
      onAcknowledge={onAcknowledge}
      onResolve={onResolve}
      canAcknowledge={canAcknowledge}
      canResolve={canResolve}
      index={index}
      role={userRole}
    />
  );

  // Footer component for infinite scroll
  const ListFooter = () => {
    if (!useInfiniteScroll) return null;
    
    if (infiniteData.isLoadingMore) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" />
        </View>
      );
    }
    
    if (!infiniteData.hasMore && alerts.length > 0) {
      return (
        <View className="py-4 items-center">
          <Text className="text-sm text-muted-foreground">
            No more alerts
          </Text>
        </View>
      );
    }
    
    return null;
  };

  // Pagination controls for web
  const PaginationControls = () => {
    if (useInfiniteScroll) return null;
    
    return (
      <View className="border-t border-border bg-background">
        <HStack className="items-center justify-between px-4 py-3">
          <Text className="text-sm text-muted-foreground">
            Showing {paginatedData.paginationInfo.from} to {paginatedData.paginationInfo.to} of {paginatedData.totalAlerts} alerts
          </Text>
          
          <HStack className="items-center" spacing={2}>
            <Button
              variant="outline"
              size="sm"
              onPress={paginatedData.goToPreviousPage}
              disabled={!paginatedData.hasPreviousPage}
              className={cn(
                "flex-row items-center",
                !paginatedData.hasPreviousPage && "opacity-50"
              )}
            >
              <Symbol name="chevron.left" size={16} />
              <Text className="ml-1">Previous</Text>
            </Button>
            
            {/* Page numbers */}
            {Platform.OS === 'web' && paginatedData.totalPages <= 7 && (
              <HStack spacing={1}>
                {Array.from({ length: paginatedData.totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={i === paginatedData.currentPage ? "default" : "ghost"}
                    size="sm"
                    onPress={() => paginatedData.goToPage(i)}
                    className="min-w-[40px]"
                  >
                    <Text>{i + 1}</Text>
                  </Button>
                ))}
              </HStack>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onPress={paginatedData.goToNextPage}
              disabled={!paginatedData.hasNextPage}
              className={cn(
                "flex-row items-center",
                !paginatedData.hasNextPage && "opacity-50"
              )}
            >
              <Text className="mr-1">Next</Text>
              <Symbol name="chevron.right" size={16} />
            </Button>
          </HStack>
        </HStack>
      </View>
    );
  };

  return (
    <VStack className="flex-1">
      {/* Filters */}
      {showFilters && (
        <AlertFilters
          searchQuery=""
          onSearchChange={() => {}}
          urgencyFilter="all"
          onUrgencyChange={(urgency) => {
            setFilters(prev => ({ ...prev, urgencyLevel: urgency === 'all' ? undefined : parseInt(urgency) }));
          }}
          typeFilter={filters.alertType || 'all'}
          onTypeChange={(type) => {
            setFilters(prev => ({ ...prev, alertType: type === 'all' ? undefined : type }));
          }}
          statusFilter={filters.status}
          onStatusChange={(status) => {
            setFilters(prev => ({ ...prev, status: status as any }));
          }}
          onReset={() => {
            setFilters({
              status: 'active',
              urgencyLevel: undefined,
              alertType: undefined,
              sortBy: 'createdAt',
              sortOrder: 'desc',
            });
          }}
        />
      )}

      {/* Alert list */}
      <FlatList
        data={alerts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.spacing[4],
          paddingVertical: spacing.spacing[3],
        }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.spacing[2] }} />}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor="#3B82F6"
          />
        }
        onEndReached={useInfiniteScroll ? infiniteData.loadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={ListFooter}
        showsVerticalScrollIndicator={false}
      />

      {/* Pagination controls for web */}
      {PaginationControls()}
    </VStack>
  );
});

PaginatedAlertList.displayName = 'PaginatedAlertList';