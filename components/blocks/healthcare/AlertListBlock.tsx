import React, { useRef, useTransition, memo, useEffect } from 'react';
import { Platform, FlatList } from 'react-native';
import Animated from 'react-native-reanimated';
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
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { PLATFORM_TOKENS } from '@/lib/design/responsive';
import { useResponsive , useResponsiveUtils } from '@/hooks/responsive';
import { api } from '@/lib/api/trpc';
import { formatDistanceToNow } from 'date-fns';
import { log } from '@/lib/core/debug/logger';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';
import { HealthcareUserRole } from '@/types/healthcare';

import { useFadeAnimation, useScaleAnimation, useEntranceAnimation } from '@/lib/ui/animations/hooks';
import { haptic } from '@/lib/ui/haptics';

// Alert card item component with memo for performance
const AlertCardItem = memo(({ 
  alert, 
  onAcknowledge, 
  onResolve,
  canAcknowledge,
  canResolve,
  index 
}: {
  alert: any;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  canAcknowledge: boolean;
  canResolve: boolean;
  index: number;
}) => {
  const theme = useTheme();
  const { spacing, componentSizes } = useSpacing();
  const [isPending, startTransition] = useTransition();
  
  // Animation for individual alert cards
  const { animatedStyle: cardEntranceStyle } = useEntranceAnimation({
    type: 'slide',
    delay: index * 100,
    duration: 400,
    from: 'left',
  });
  
  const { animatedStyle: scaleStyle, scaleIn } = useScaleAnimation({
    initialScale: 0.95,
    finalScale: 1,
    springConfig: 'gentle',
  });
  
  useEffect(() => {
    scaleIn();
  }, []);
  
  const getUrgencyColor = (urgency: number) => {
    if (urgency <= 2) return healthcareColors.emergency;
    if (urgency === 3) return healthcareColors.warning;
    return healthcareColors.info;
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
    <Animated.View style={[cardEntranceStyle, scaleStyle]}>
      <Card
      padding={spacing[5]}
      gap={spacing[4]}
      shadow={PLATFORM_TOKENS.shadow?.md}
      style={{
        minHeight: 120,
        borderLeftWidth: 3,
        borderLeftColor: getUrgencyColor(alert.urgency),
        opacity: alert.resolved ? 0.7 : 1,
      }}
    >
      {/* Header Row */}
      <HStack justifyContent="space-between" alignItems="center">
        <HStack gap={spacing[4]} alignItems="center">
          <Text size="2xl">{getAlertIcon(alert.alertType)}</Text>
          <VStack gap={spacing[1]}>
            <HStack gap={spacing[3]}>
              <Text weight="bold" size="lg">Room {alert.roomNumber}</Text>
              <Badge
                variant={alert.urgency >= 4 ? "destructive" : alert.urgency >= 3 ? "secondary" : "default"}
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
        <VStack gap={spacing[2]} alignItems="flex-end">
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
      <HStack gap={spacing[4]} flexWrap="wrap">
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
        <HStack gap={spacing[4]} marginTop={spacing[3]}>
          {!alert.acknowledged && canAcknowledge && (
            <Button
              variant="solid"
              size="sm"
              style={{ flex: 1.618 }}
              onPress={() => {
                haptic('medium');
                startTransition(() => {
                  onAcknowledge(alert.id);
                });
              }}
              loading={isPending}
            >
              Acknowledge
            </Button>
          )}
          {alert.acknowledged && canResolve && (
            <Button
              variant="solid" colorScheme="accent"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => {
                haptic('success');
                startTransition(() => {
                  onResolve(alert.id);
                });
              }}
              loading={isPending}
            >
              Resolve
            </Button>
          )}
        </HStack>
      )}
    </Card>
    </Animated.View>
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
export const AlertListBlock = ({ 
  hospitalId, 
  role,
  showResolved = false,
  maxHeight 
}: { 
  hospitalId: string;
  role: HealthcareUserRole;
  showResolved?: boolean;
  maxHeight?: number;
}) => {
  const theme = useTheme();
  const { spacing, componentSizes } = useSpacing();
  const { isMobile } = useResponsive();
  const { getPlatformShadow } = useResponsiveUtils();
  const queryClient = api.useUtils();
  const listRef = useRef<FlatList>(null);
  
  // List animation
  const { animatedStyle: listFadeStyle, fadeIn: fadeInList } = useFadeAnimation({ 
    duration: 300,
    delay: 100 
  });
  
  useEffect(() => {
    fadeInList();
  }, [fadeInList]);
  
  // Permissions based on role
  const canAcknowledge = ['nurse', 'doctor', 'head_doctor', 'admin'].includes(role);
  const canResolve = ['doctor', 'head_doctor', 'admin'].includes(role);
  
  // Fetch active alerts
  const { data, isLoading, refetch } = api.healthcare.getActiveAlerts.useQuery(
    { includeResolved: showResolved },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      refetchIntervalInBackground: true,
    }
  );
  
  // Acknowledge mutation
  const acknowledgeMutation = api.healthcare.acknowledgeAlert.useMutation({
    onMutate: async ({ alertId }) => {
      await queryClient.healthcare.getActiveAlerts.cancel();
      const previousData = queryClient.healthcare.getActiveAlerts.getData();
      
      queryClient.healthcare.getActiveAlerts.setData(
        { includeResolved: showResolved },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            alerts: old.alerts.map((alert) =>
              alert.id === alertId
                ? { ...alert, acknowledged: true, acknowledgedAt: new Date() }
                : alert
            ),
          };
        }
      );
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.healthcare.getActiveAlerts.setData(
          { includeResolved: showResolved },
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
    onMutate: async ({ alertId }) => {
      await queryClient.healthcare.getActiveAlerts.cancel();
      const previousData = queryClient.healthcare.getActiveAlerts.getData();
      
      queryClient.healthcare.getActiveAlerts.setData(
        { includeResolved: showResolved },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            alerts: old.alerts.map((alert) =>
              alert.id === alertId
                ? { ...alert, resolved: true, resolvedAt: new Date() }
                : alert
            ),
          };
        }
      );
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.healthcare.getActiveAlerts.setData(
          { includeResolved: showResolved },
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
  
  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <AlertCardItem
      alert={item}
      onAcknowledge={(id) => acknowledgeMutation.mutate({ alertId: id })}
      onResolve={(id) => resolveMutation.mutate({ alertId: id })}
      canAcknowledge={canAcknowledge}
      canResolve={canResolve}
      index={index}
    />
  );
  
  const keyExtractor = (item: any) => item.id;
  
  // Skeleton animation (used when loading)
  const { animatedStyle: skeletonStyle } = useFadeAnimation({
    duration: 800,
    loop: true,
    reverseOnComplete: true,
  });
  
  // Empty state animation
  const { animatedStyle: emptyStateStyle } = useScaleAnimation({
    initialScale: 0.8,
    finalScale: 1,
    springConfig: 'bouncy',
  });
  
  // Add defensive check after all hooks
  if (!hospitalId || !role) {
    log.error('AlertListBlock missing required props', 'ALERT_LIST', { hospitalId, role });
    return (
      <Box flex={1} alignItems="center" justifyContent="center">
        <Text colorTheme="mutedForeground">Missing required data</Text>
      </Box>
    );
  }
  
  if (isLoading) {
    return (
      <VStack gap={spacing[4]}>
        {[1, 2, 3].map((i) => (
          <Animated.View key={i} style={skeletonStyle}>
            <Card
              padding={spacing[5]}
              style={{
                height: 120,
                backgroundColor: theme.muted,
                opacity: 0.5,
              }}
            />
          </Animated.View>
        ))}
      </VStack>
    );
  }
  
  const alerts = data?.alerts || [];
  
  if (alerts.length === 0) {
    return (
      <Animated.View style={[listFadeStyle, emptyStateStyle]}>
        <Card
          padding={spacing[8]}
          style={{
            minHeight: 200,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <VStack gap={spacing[4]} alignItems="center">
            <Text size="4xl">✅</Text>
            <Text size="lg" weight="medium">No Active Alerts</Text>
            <Text colorTheme="mutedForeground" align="center">
              All alerts have been handled
            </Text>
          </VStack>
        </Card>
      </Animated.View>
    );
  }
  
  // Use FlatList for native, regular mapping for web
  if (Platform.OS !== 'web') {
    return (
      <Animated.View style={listFadeStyle}>
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
      </Animated.View>
    );
  }
  
  // Web version with CSS animations
  return (
    <Animated.View style={listFadeStyle}>
      <ScrollContainer
        style={{ 
          maxHeight: maxHeight || 600,
        }}
        showsVerticalScrollIndicator={false}
      >
        <VStack gap={spacing[4]}>
          {alerts.map((alert, index) => (
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
    </Animated.View>
  );
};