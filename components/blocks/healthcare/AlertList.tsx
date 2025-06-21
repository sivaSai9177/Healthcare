import React, { useRef, useTransition, memo, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Platform, FlatList, ScrollView } from 'react-native';
import { Badge } from '@/components/universal/display';
import { GlassCard, AlertGlassCard } from '@/components/universal/display/GlassCard';
import { VStack, HStack, Box } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { useSpacing } from '@/lib/stores/spacing-store';
import { formatDistanceToNow } from 'date-fns';
import { log } from '@/lib/core/debug/logger';
import { HealthcareUserRole } from '@/types/healthcare';
import { cn } from '@/lib/core/utils';

// Animation imports will be replaced with Tailwind classes
import { haptic } from '@/lib/ui/haptics';
import { SpacingScale } from '@/lib/design';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAlertWebSocket, useMobileAlertWebSocket, useHospitalContext } from '@/hooks/healthcare';
import { useActiveAlerts, useAcknowledgeAlert, useResolveAlert } from '@/hooks/healthcare/useHealthcareApi';

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
  organizationId?: string;
  organizationName?: string;
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
  
  // Calculate stagger delay for list animations
  const staggerDelay = Math.min(index + 1, 6);
  
  const getUrgencyVariant = (urgency: number) => {
    if (urgency >= 4) return 'destructive'; // high urgency
    if (urgency === 3) return 'secondary'; // medium urgency
    return 'default'; // low urgency
  };
  
  const getUrgencyLevel = (urgency: number): 'critical' | 'high' | 'medium' | 'low' => {
    if (urgency >= 5) return 'critical';
    if (urgency >= 4) return 'high';
    if (urgency === 3) return 'medium';
    return 'low';
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
  
  // Use spring animation for entry
  const entryScale = useSharedValue(0.95);
  const entryOpacity = useSharedValue(0);
  
  React.useEffect(() => {
    entryScale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
      mass: 1,
    });
    entryOpacity.value = withTiming(1, {
      duration: 300 + (staggerDelay * 50),
    });
  }, [entryScale, entryOpacity, staggerDelay]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: entryScale.value }],
    opacity: entryOpacity.value,
  }));
  
  return (
    <Animated.View style={animatedStyle}>
      <AlertGlassCard
        urgency={getUrgencyLevel(alert.urgency)}
        className={cn(
          "border-l-4",
          alert.resolved && 'opacity-70',
          getUrgencyVariant(alert.urgency) === 'destructive' && 'border-l-destructive',
          getUrgencyVariant(alert.urgency) === 'secondary' && 'border-l-secondary',
          getUrgencyVariant(alert.urgency) === 'default' && 'border-l-primary',
          // Add pulse animation for critical alerts
          alert.urgency >= 5 && !alert.acknowledged && 'animate-pulse'
        )}
        style={[
          {
            minHeight: 120,
            padding: spacing[5],
            gap: spacing[4],
          }
        ]}
        pressable
        onPress={() => haptic('light')}
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
              {alert.organizationName && (
                <Badge variant="outline" size="sm">
                  {alert.organizationName}
                </Badge>
              )}
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
              variant={alert.urgency >= 4 ? "glass-primary" : "default"}
              size="sm"
              style={{ flex: 1.618 }}
              onPress={() => {
                haptic('medium');
                startTransition(() => {
                  onAcknowledge(alert.id);
                });
              }}
              isLoading={isPending}
              className="shadow-md"
            >
              Acknowledge
            </Button>
          )}
          {alert.acknowledged && canResolve && (
            <Button
              variant="glass"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => {
                haptic('success');
                startTransition(() => {
                  onResolve(alert.id);
                });
              }}
              isLoading={isPending}
              className="shadow-md"
            >
              Resolve
            </Button>
          )}
        </HStack>
      )}
      </AlertGlassCard>
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
export const AlertList = ({ 
  hospitalId: propHospitalId, 
  role,
  maxHeight,
  scrollEnabled = true 
}: { 
  hospitalId?: string;
  role: HealthcareUserRole;
  maxHeight?: number;
  scrollEnabled?: boolean;
}) => {
  const { spacing } = useSpacing();
  const listRef = useRef<FlatList>(null);
  const { user } = useAuthStore();
  const hospitalContext = useHospitalContext();
  
  // Use enhanced API hooks
  const alertsQuery = useActiveAlerts({
    enabled: !!user && !!hospitalContext.hospitalId && hospitalContext.hospitalId !== '',
  });
  
  // Use enhanced mutations with built-in error handling
  const acknowledgeMutation = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();
  
  // Use hospital context to determine the actual hospital ID
  const hospitalId = propHospitalId || hospitalContext.hospitalId;
  
  // Permissions based on role
  const canAcknowledge = ['nurse', 'doctor', 'head_doctor', 'admin'].includes(role);
  const canResolve = ['doctor', 'head_doctor', 'admin'].includes(role);
  
  // Subscribe to real-time alert updates with WebSocket
  // Use mobile-optimized WebSocket for native platforms
  const useWebSocket = Platform.OS === 'web' ? useAlertWebSocket : useMobileAlertWebSocket;
  const { isConnected, isPolling } = useWebSocket({
    hospitalId: hospitalId || '',
    enabled: !!user && !!hospitalId,
    showNotifications: true,
    onAlertCreated: () => {
      log.info('New alert received, list will auto-refresh', 'ALERT_LIST');
    },
    onAlertAcknowledged: () => {
      log.info('Alert acknowledged, list will auto-refresh', 'ALERT_LIST');
    },
    onAlertResolved: () => {
      log.info('Alert resolved, list will auto-refresh', 'ALERT_LIST');
    },
    onAlertEscalated: () => {
      log.info('Alert escalated, list will auto-refresh', 'ALERT_LIST');
    },
  });
  
  // Show connection status in development
  useEffect(() => {
    if (__DEV__) {
      log.debug('Alert subscription status', 'ALERT_LIST', {
        isConnected,
        isPolling,
        hospitalId,
      });
    }
  }, [isConnected, isPolling, hospitalId]);
  
  // Don't render if no user
  if (!user) {
    return null;
  }
  
  // Show a simple message if hospital is missing (non-blocking)
  if (!hospitalId) {
    return (
      <VStack className="p-4" gap={spacing[3] as SpacingScale}>
        <GlassCard>
          <VStack className="p-4" gap={spacing[2] as SpacingScale}>
            <Text size="lg" weight="medium">No Hospital Selected</Text>
            <Text size="sm" className="text-muted-foreground">
              Please select a hospital from settings to view alerts.
            </Text>
            <Button 
              variant="outline" 
              size="sm"
              onPress={() => {
                // Navigate to settings where user can select hospital
                haptic('light');
              }}
            >
              Go to Settings
            </Button>
          </VStack>
        </GlassCard>
      </VStack>
    );
  }
  
  // Real-time subscription is handled by useAlertWebSocket hook above
  
  const renderItem = ({ item, index }: { item: AlertItem; index: number }) => (
    <AlertCardItem
      alert={item}
      onAcknowledge={(id) => (acknowledgeMutation as any).mutateAsync({ alertId: id })}
      onResolve={(id) => (resolveMutation as any).mutateAsync({ alertId: id })}
      canAcknowledge={canAcknowledge}
      canResolve={canResolve}
      index={index}
    />
  );
  
  const keyExtractor = (item: AlertItem) => item.id;
  
  // Remove unused showResolved parameter
  // showResolved is intentionally not used in the query
  
  // Add defensive check after all hooks
  if (!role) {
    log.error('AlertList missing required role', 'ALERT_LIST', { role });
    return (
      <Box className="flex-1 items-center justify-center">
        <Text colorTheme="mutedForeground">Missing user role</Text>
      </Box>
    );
  }
  
  if ((alertsQuery as any).isLoading || (alertsQuery as any).isFetching) {
    return (
      <VStack gap={spacing[4] as SpacingScale}>
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            className="bg-muted opacity-50 rounded-lg"
            style={[
              {
                height: 120,
                padding: spacing[5],
              }
            ]}
          />
        ))}
      </VStack>
    );
  }
  
  const alerts = ((alertsQuery as any).data)?.alerts || [];
  
  if (alerts.length === 0) {
    return (
      <GlassCard
        className="items-center justify-center"
        style={[
          {
            minHeight: 200,
            padding: spacing[8],
          }
        ]}
        animationType="scale"
      >
        <VStack gap={spacing[4] as SpacingScale} align="center">
          <Text size="4xl">✅</Text>
          <Text size="lg" weight="medium">No Active Alerts</Text>
          <Text colorTheme="mutedForeground" align="center">
            All alerts have been handled
          </Text>
        </VStack>
      </GlassCard>
    );
  }
  
  // Use FlatList for native, regular mapping for web
  if (Platform.OS !== 'web') {
    return (
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
        scrollEnabled={scrollEnabled}
        style={scrollEnabled ? {
          maxHeight: maxHeight || 600,
        } : undefined}
      />
    );
  }
  
  // Web version with CSS animations
  return scrollEnabled ? (
    <ScrollView
      style={{ 
        maxHeight: maxHeight || 600,
      }}
      showsVerticalScrollIndicator={false}
    >
      <VStack gap={spacing[4] as SpacingScale}>
        {alerts.map((alert: AlertItem, index: number) => (
          <AlertCardItem
            key={alert.id}
            alert={alert}
            onAcknowledge={(id) => (acknowledgeMutation as any).mutate({ alertId: id })}
            onResolve={(id) => (resolveMutation as any).mutate({ alertId: id })}
            canAcknowledge={canAcknowledge}
            canResolve={canResolve}
            index={index}
          />
        ))}
      </VStack>
    </ScrollView>
  ) : (
    <VStack gap={spacing[4] as SpacingScale}>
      {alerts.map((alert: AlertItem, index: number) => (
        <AlertCardItem
          key={alert.id}
          alert={alert}
          onAcknowledge={(id) => (acknowledgeMutation as any).mutate({ alertId: id })}
          onResolve={(id) => (resolveMutation as any).mutate({ alertId: id })}
          canAcknowledge={canAcknowledge}
          canResolve={canResolve}
          index={index}
        />
      ))}
    </VStack>
  );
};