import React, { useState } from 'react';
import { ScrollView, RefreshControl, Platform, View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams , Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Container,
  VStack,
  HStack,
  Card,
  Text,
  Button,
  Badge,
  Separator,
  Box,
  Avatar,
  Skeleton,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { format, formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api/trpc';
import { AlertTimeline } from '@/components/blocks/healthcare';
import { log } from '@/lib/core/debug/logger';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';
import { haptic } from '@/lib/ui/haptics';
import { useAuth } from '@/hooks/useAuth';
import { useAlertWebSocket } from '@/hooks/healthcare';
import { useHealthcareAccess } from '@/hooks/usePermissions';

export default function AlertDetailsScreen() {
  const { id: alertId } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  // Use permission hooks
  const { 
    canViewAlerts, 
    canAcknowledgeAlerts, 
    canResolveAlerts
  } = useHealthcareAccess();
  
  const hospitalId = user?.organizationId || 'demo-hospital';
  const userRole = user?.role as 'doctor' | 'nurse' | 'head_doctor' | 'operator' | 'admin';
  
  // Subscribe to real-time updates for this alert
  useAlertWebSocket({
    hospitalId,
    enabled: !!alertId,
    onAlertAcknowledged: () => {
      log.info('Alert acknowledged, refreshing', 'ALERT_DETAILS');
      refetch();
    },
    onAlertResolved: () => {
      log.info('Alert resolved, refreshing', 'ALERT_DETAILS');
      refetch();
    },
    onAlertEscalated: () => {
      log.info('Alert escalated, refreshing', 'ALERT_DETAILS');
      refetch();
      refetchTimeline();
    },
  });
  
  // Fetch alert details
  const { data: alert, isLoading, refetch } = api.healthcare.getAlertById.useQuery(
    { alertId: alertId || '' },
    { enabled: !!alertId }
  );
  
  // Fetch alert timeline
  const { data: timeline, refetch: refetchTimeline } = api.healthcare.getAlertTimeline.useQuery(
    { alertId: alertId || '' },
    { enabled: !!alertId }
  );
  
  // Acknowledge mutation
  const acknowledgeMutation = api.healthcare.acknowledgeAlert.useMutation({
    onSuccess: () => {
      showSuccessAlert('Alert acknowledged successfully');
      haptic('success');
      refetch();
      refetchTimeline();
    },
    onError: (error) => {
      showErrorAlert('Failed to acknowledge alert', error.message);
      haptic('error');
    },
  });
  
  // Resolve mutation
  const resolveMutation = api.healthcare.resolveAlert.useMutation({
    onSuccess: () => {
      showSuccessAlert('Alert resolved successfully');
      haptic('success');
      refetch();
      refetchTimeline();
      // Navigate back after short delay
      setTimeout(() => router.back(), 1000);
    },
    onError: (error) => {
      showErrorAlert('Failed to resolve alert', error.message);
      haptic('error');
    },
  });
  
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchTimeline()]);
    } catch (error) {
      log.error('Failed to refresh alert details', 'ALERT_DETAILS', error);
    }
    setRefreshing(false);
  };
  
  const handleAcknowledge = () => {
    if (!alert || !canAcknowledgeAlerts) return;
    
    haptic('medium');
    // Navigate to acknowledgment modal with proper parameters
    router.push({
      pathname: '/(modals)/acknowledge-alert',
      params: { alertId: alert.id }
    });
  };
  
  const handleResolve = () => {
    if (!alert || !canResolveAlerts) return;
    
    haptic('medium');
    resolveMutation.mutate({ 
      alertId: alert.id,
      resolution: 'Alert resolved via mobile app',
    });
  };
  
  // Check permissions after all hooks
  if (!canViewAlerts) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }
  
  if (isLoading) {
    return (
      <Container className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
      </Container>
    );
  }
  
  if (!alert) {
    return (
      <Container className="flex-1 items-center justify-center">
        <VStack gap={4 as any} alignItems="center">
          <Text size="base" weight="semibold">Alert not found</Text>
          <Button onPress={() => router.back()} variant="outline">
            Go Back
          </Button>
        </VStack>
      </Container>
    );
  }
  
  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 4) return 'destructive';
    if (urgency === 3) return 'warning';
    return 'default';
  };
  
  const content = (
    <VStack gap={4 as any}>
      {/* Alert Header */}
      <Card>
        <VStack gap={4 as any}>
          <HStack justifyContent="space-between" alignItems="flex-start">
            <VStack gap={2 as any} style={{ flex: 1 }}>
              <HStack gap={2 as any} alignItems="center" flexWrap="wrap">
                <Badge variant={alert.urgencyLevel <= 2 ? 'error' : alert.urgencyLevel === 3 ? 'warning' : 'default'}>
                  Level {alert.urgencyLevel} - {alert.alertType}
                </Badge>
                {alert.status === 'active' && (
                  <Badge variant="default">Active</Badge>
                )}
                {alert.acknowledged && (
                  <Badge variant="secondary">Acknowledged</Badge>
                )}
                {alert.resolved && (
                  <Badge variant="outline">Resolved</Badge>
                )}
                {alert.currentEscalationTier > 1 && (
                  <Badge variant="error">
                    Tier {alert.currentEscalationTier}
                  </Badge>
                )}
              </HStack>
              <Text size="sm" colorTheme="mutedForeground">
                Room {alert.roomNumber} • {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
              </Text>
            </VStack>
          </HStack>
          
          {alert.description && (
            <>
              <Separator />
              <Text>{alert.description}</Text>
            </>
          )}
          
          <Separator />
          
          {/* Alert Stats */}
          <HStack gap={6 as any} justifyContent="space-around">
            <VStack gap={1 as any} alignItems="center">
              <Text size="base" weight="bold">
                {alert.acknowledged ? '✓' : '—'}
              </Text>
              <Text size="xs" colorTheme="mutedForeground">Acknowledged</Text>
            </VStack>
            <VStack gap={1 as any} alignItems="center">
              <Text size="base" weight="bold">
                Tier {alert.currentEscalationTier || 1}
              </Text>
              <Text size="xs" colorTheme="mutedForeground">Escalation</Text>
            </VStack>
            <VStack gap={1 as any} alignItems="center">
              <Text size="base" weight="bold">
                {Math.floor((Date.now() - new Date(alert.createdAt).getTime()) / 60000)}m
              </Text>
              <Text size="xs" colorTheme="mutedForeground">Duration</Text>
            </VStack>
          </HStack>
        </VStack>
      </Card>
      
      {/* Action Buttons */}
      {!alert.resolved && (
        <HStack gap={3 as any}>
          {!alert.acknowledged && canAcknowledgeAlerts && (
            <Button
              onPress={handleAcknowledge}
              style={{ flex: 1 }}
              size="default"
              isLoading={acknowledgeMutation.isPending}
            >
              Acknowledge
            </Button>
          )}
          {alert.acknowledged && canResolveAlerts && (
            <Button
              onPress={handleResolve}
              variant="secondary"
              style={{ flex: 1 }}
              size="default"
              isLoading={resolveMutation.isPending}
            >
              Resolve
            </Button>
          )}
        </HStack>
      )}
      
      {/* Timeline */}
      <Card>
        <VStack gap={4 as any}>
          <Text size="base" weight="semibold">Alert Timeline</Text>
          <Separator />
          {timeline ? (
            <AlertTimeline
              alertId={alert.id}
              events={(timeline?.timeline || []).map(event => ({
                id: event.id,
                eventType: event.type,
                userId: event.user?.id || 'system',
                userName: event.user?.name,
                timestamp: new Date(event.timestamp),
                description: event.description,
                metadata: event.metadata,
              }))}
              loading={false}
            />
          ) : (
            <Skeleton height={200} />
          )}
        </VStack>
      </Card>
      
      {/* Created By */}
      {alert.createdByName && (
        <Card>
          <HStack gap={3 as any} alignItems="center">
            <Avatar
              name={alert.createdByName}
              size="sm"
            />
            <VStack gap={1 as any} style={{ flex: 1 }}>
              <Text size="sm" weight="medium">Created by</Text>
              <Text size="sm">{alert.createdByName}</Text>
              <Text size="xs" colorTheme="mutedForeground">
                {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
              </Text>
            </VStack>
          </HStack>
        </Card>
      )}
      
      {/* Acknowledged By */}
      {alert.acknowledgedByName && (
        <Card>
          <HStack gap={3 as any} alignItems="center">
            <Avatar
              name={alert.acknowledgedByName}
              size="sm"
            />
            <VStack gap={1 as any} style={{ flex: 1 }}>
              <Text size="sm" weight="medium">Acknowledged by</Text>
              <Text size="sm">{alert.acknowledgedByName}</Text>
              <Text size="xs" colorTheme="mutedForeground">
                {alert.acknowledgedAt && format(new Date(alert.acknowledgedAt), 'MMM d, h:mm a')}
              </Text>
            </VStack>
          </HStack>
        </Card>
      )}
    </VStack>
  );
  
  const scrollContent = (
    <ScrollView
      contentContainerStyle={{ 
        padding: spacing[4] as any, 
        paddingBottom: spacing[8] as any 
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
    >
      {content}
    </ScrollView>
  );
  
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        {scrollContent}
      </SafeAreaView>
    );
  }
  
  return (
    <Container>
      {scrollContent}
    </Container>
  );
}