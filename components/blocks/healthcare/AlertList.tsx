import React, { useRef, useTransition, memo, useEffect } from 'react';
import { Platform, FlatList, View } from 'react-native';
import {
  Card,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Box,
  ScrollContainer,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { api } from '@/lib/api/trpc';
import { formatDistanceToNow } from 'date-fns';
import { log } from '@/lib/core/debug/logger';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';
import { HealthcareUserRole } from '@/types/healthcare';
import { cn } from '@/lib/core/utils';

// Animation imports will be replaced with Tailwind classes
import { haptic } from '@/lib/ui/haptics';
import { SpacingScale } from '@/lib/design';
import { useAuthStore } from '@/lib/stores/auth-store';

interface AlertItem {
  id: string;
  roomNumber: string;
  alertType: string;
  urgency: number;
  description?: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  acknowledgedByName?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolvedByName?: string;
  createdByName: string;
}

// Alert card item component with memo for performance
const AlertCardItem = memo(({ 
  alert, 
  onAcknowledge, 
  onResolve,
  canAcknowledge,
  canResolve,
  index 
}: {
  alert: AlertItem;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  canAcknowledge: boolean;
  canResolve: boolean;
  index: number;
}) => {
  const { spacing } = useSpacing();
  const [isPending, startTransition] = useTransition();
  const shadowMd = useShadow({ size: 'md' });
  
  // Calculate stagger delay for list animations
  const staggerDelay = Math.min(index + 1, 6);
  
  const getUrgencyVariant = (urgency: number) => {
    if (urgency >= 4) return 'destructive'; // high urgency
    if (urgency === 3) return 'secondary'; // medium urgency
    return 'default'; // low urgency
  };
  
  const getAlertIcon = (type: string) => {
    const icons: Record<string, string> = {
      'cardiac': '❤️',
      'code-blue': '🔵',
      'fall': '🚶',
      'fire': '🔥',
      'security': '🔒',
      'medical-emergency': '🚨',
    };
    return icons[type] || '⚠️';
  };
  
  return (
    <View className={cn(
      "animate-fade-in",
      `delay-stagger-${staggerDelay}`,
      "transition-all duration-200"
    )}>
      <Card
      className={cn(
        "border-l-4",
        alert.resolved && 'opacity-70',
        getUrgencyVariant(alert.urgency) === 'destructive' && 'border-l-destructive',
        getUrgencyVariant(alert.urgency) === 'secondary' && 'border-l-secondary',
        getUrgencyVariant(alert.urgency) === 'default' && 'border-l-primary'
      )}
      style={[
        {
          minHeight: 120,
          padding: spacing[5],
          gap: spacing[4],
        },
        shadowMd
      ]}
    >
      {/* Header Row */}
      <HStack justify="between" align="center">
        <HStack gap={spacing[4] as SpacingScale} align="center">
          <Text size="2xl">{getAlertIcon(alert.alertType)}</Text>
          <VStack gap={spacing[1] as SpacingScale}>
            <HStack gap={spacing[3] as SpacingScale}>
              <Text weight="bold" size="lg">Room {alert.roomNumber}</Text>
              <Badge
                variant={alert.urgency >= 4 ? "error" : alert.urgency >= 3 ? "secondary" : "default"}
                size="sm"
              >
                Urgency {alert.urgency}
              </Badge>
            </HStack>
            <Text size="sm" colorTheme="mutedForeground">
              {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
            </Text>
          </VStack>
        </HStack>
        
        {/* Status Badges */}
        <VStack gap={spacing[2] as SpacingScale} align="end">
          {alert.resolved ? (
            <Badge variant="outline" size="sm">
              ✓ Resolved
            </Badge>
          ) : alert.acknowledged ? (
            <Badge variant="secondary" size="sm">
              ✓ Acknowledged
            </Badge>
          ) : (
            <Badge variant="error" size="sm">
              New Alert
            </Badge>
          )}
        </VStack>
      </HStack>
      
      {/* Alert Details */}
      {alert.description && (
        <Text size="sm" numberOfLines={2}>
          {alert.description}
        </Text>
      )}
      
      {/* Metadata */}
      <HStack gap={spacing[4] as SpacingScale} className="flex-wrap">
        <Text size="xs" colorTheme="mutedForeground">
          Created by {alert.createdByName}
        </Text>
        {alert.acknowledged && (
          <Text size="xs" colorTheme="mutedForeground">
            • Ack by {alert.acknowledgedByName}
          </Text>
        )}
        {alert.resolved && (
          <Text size="xs" colorTheme="mutedForeground">
            • Resolved by {alert.resolvedByName}
          </Text>
        )}
      </HStack>
      
      {/* Action Buttons */}
      {!alert.resolved && (
        <HStack gap={spacing[4] as SpacingScale} style={{ marginTop: spacing[3] }}>
          {!alert.acknowledged && canAcknowledge && (
            <Button
              variant="default"
              size="sm"
              style={{ flex: 1.618 }}
              onPress={() => {
                haptic('medium');
                startTransition(() => {
                  onAcknowledge(alert.id);
                });
              }}
              isLoading={isPending}
            >
              Acknowledge
            </Button>
          )}
          {alert.acknowledged && canResolve && (
            <Button
              variant="secondary"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => {
                haptic('success');
                startTransition(() => {
                  onResolve(alert.id);
                });
              }}
              isLoading={isPending}
            >
              Resolve
            </Button>
          )}
        </HStack>
      )}
    </Card>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.alert.id === nextProps.alert.id &&
    prevProps.alert.acknowledged === nextProps.alert.acknowledged &&
    prevProps.alert.resolved === nextProps.alert.resolved &&
    prevProps.index === nextProps.index
  );
});

AlertCardItem.displayName = 'AlertCardItem';

// Main alert list block
export const AlertList = ({ 
  hospitalId, 
  role,
  maxHeight 
}: { 
  hospitalId: string;
  role: HealthcareUserRole;
  maxHeight?: number;
}) => {
  const { spacing } = useSpacing();
  const queryClient = api.useUtils();
  const listRef = useRef<FlatList>(null);
  const shadowMd = useShadow({ size: 'md' });
  const { user } = useAuthStore();
  
  // Don't render if no user
  if (!user) {
    return null;
  }
  
  // Permissions based on role
  const canAcknowledge = ['nurse', 'doctor', 'head_doctor', 'admin'].includes(role);
  const canResolve = ['doctor', 'head_doctor', 'admin'].includes(role);
  
  // Fetch active alerts
  const { data, isLoading, refetch } = api.healthcare.getActiveAlerts.useQuery(
    { hospitalId },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      refetchIntervalInBackground: true,
      enabled: !!user,
    }
  );
  
  // Acknowledge mutation
  const acknowledgeMutation = api.healthcare.acknowledgeAlert.useMutation({
    onMutate: async (input) => {
      if (!input || !('alertId' in input) || !input.alertId) return;
      
      await queryClient.healthcare.getActiveAlerts.cancel();
      const previousData = queryClient.healthcare.getActiveAlerts.getData();
      
      queryClient.healthcare.getActiveAlerts.setData(
        { hospitalId },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            alerts: old.alerts.map((alert: AlertItem) =>
              alert.id === input.alertId
                ? { ...alert, acknowledged: true, acknowledgedAt: new Date() }
                : alert
            ),
          };
        }
      );
      
      return { previousData };
    },
    onError: (err, _variables, context) => {
      if (context?.previousData) {
        queryClient.healthcare.getActiveAlerts.setData(
          { hospitalId },
          context.previousData
        );
      }
      showErrorAlert('Failed to acknowledge alert', err.message);
    },
    onSuccess: () => {
      showSuccessAlert('Alert acknowledged');
      queryClient.healthcare.getActiveAlerts.invalidate();
    },
  });
  
  // Resolve mutation
  const resolveMutation = api.healthcare.resolveAlert.useMutation({
    onMutate: async (input) => {
      if (!input || !('alertId' in input) || !input.alertId) return;
      
      await queryClient.healthcare.getActiveAlerts.cancel();
      const previousData = queryClient.healthcare.getActiveAlerts.getData();
      
      queryClient.healthcare.getActiveAlerts.setData(
        { hospitalId },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            alerts: old.alerts.map((alert: AlertItem) =>
              alert.id === input.alertId
                ? { ...alert, resolved: true, resolvedAt: new Date() }
                : alert
            ),
          };
        }
      );
      
      return { previousData };
    },
    onError: (err, _variables, context) => {
      if (context?.previousData) {
        queryClient.healthcare.getActiveAlerts.setData(
          { hospitalId },
          context.previousData
        );
      }
      showErrorAlert('Failed to resolve alert', err.message);
    },
    onSuccess: () => {
      showSuccessAlert('Alert resolved');
      queryClient.healthcare.getActiveAlerts.invalidate();
    },
  });
  
  // Real-time subscription (only if WebSocket is enabled)
  const wsEnabled = process.env.EXPO_PUBLIC_ENABLE_WS === 'true';
  
  api.healthcare.subscribeToAlerts.useSubscription(
    undefined,
    {
      enabled: wsEnabled, // Only enable if WebSocket is configured
      onData: (event) => {
        log.info('Alert subscription event', 'ALERT_LIST', { event });
        // Refetch to get latest data
        refetch();
      },
      onError: (error) => {
        // Only log error if WebSocket was expected to work
        if (wsEnabled) {
          log.error('Alert subscription error', 'ALERT_LIST', error);
        }
      },
    }
  );
  
  const renderItem = ({ item, index }: { item: AlertItem; index: number }) => (
    <AlertCardItem
      alert={item}
      onAcknowledge={(id) => acknowledgeMutation.mutate({ alertId: id })}
      onResolve={(id) => resolveMutation.mutate({ alertId: id })}
      canAcknowledge={canAcknowledge}
      canResolve={canResolve}
      index={index}
    />
  );
  
  const keyExtractor = (item: AlertItem) => item.id;
  
  // Remove unused showResolved parameter
  // showResolved is intentionally not used in the query
  
  // Add defensive check after all hooks
  if (!hospitalId || !role) {
    log.error('AlertList missing required props', 'ALERT_LIST', { hospitalId, role });
    return (
      <Box className="flex-1 items-center justify-center">
        <Text colorTheme="mutedForeground">Missing required data</Text>
      </Box>
    );
  }
  
  if (isLoading) {
    return (
      <VStack gap={spacing[4] as SpacingScale}>
        {[1, 2, 3].map((i) => (
          <View key={i} className="animate-pulse">
            <Box
              className="bg-muted opacity-50 rounded-lg"
              style={[
                {
                  height: 120,
                  padding: spacing[5],
                },
                shadowMd
              ]}
            />
          </View>
        ))}
      </VStack>
    );
  }
  
  const alerts = data?.alerts || [];
  
  if (alerts.length === 0) {
    return (
      <View className="animate-scale-in">
        <Card
          className="items-center justify-center"
          style={[
            {
              minHeight: 200,
              padding: spacing[8],
            },
            shadowMd
          ]}
        >
          <VStack gap={spacing[4] as SpacingScale} align="center">
            <Text size="4xl">✅</Text>
            <Text size="lg" weight="medium">No Active Alerts</Text>
            <Text colorTheme="mutedForeground" align="center">
              All alerts have been handled
            </Text>
          </VStack>
        </Card>
      </View>
    );
  }
  
  // Use FlatList for native, regular mapping for web
  if (Platform.OS !== 'web') {
    return (
      <View className="animate-fade-in">
        <FlatList
          ref={listRef}
          data={alerts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            gap: spacing[4],
          }}
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
          removeClippedSubviews={true}
          style={{
            maxHeight: maxHeight || 600,
          }}
        />
      </View>
    );
  }
  
  // Web version with CSS animations
  return (
    <View className="animate-fade-in">
      <ScrollContainer
        style={{ 
          maxHeight: maxHeight || 600,
        }}
      >
        <VStack gap={spacing[4] as SpacingScale}>
          {alerts.map((alert: AlertItem, index: number) => (
            <AlertCardItem
              key={alert.id}
              alert={alert}
              onAcknowledge={(id) => acknowledgeMutation.mutate({ alertId: id })}
              onResolve={(id) => resolveMutation.mutate({ alertId: id })}
              canAcknowledge={canAcknowledge}
              canResolve={canResolve}
              index={index}
            />
          ))}
        </VStack>
      </ScrollContainer>
    </View>
  );
};