import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Container,
  Stack,
  Card,
  Text,
  Button,
  Badge,
  HStack,
  VStack,
  Separator,
  Symbol,
  Skeleton,
} from '@/components/universal';
import { AlertTimeline } from '@/components/healthcare/AlertTimeline';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';
import { format } from 'date-fns';
import { haptic } from '@/lib/ui/haptics';

export default function AlertDetailsScreen() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const theme = useTheme();
  const spacing = useSpacing();
  const { user } = useAuth();
  const utils = api.useUtils();

  // Fetch alert details
  const { 
    data: alert, 
    isLoading: isLoadingAlert,
    refetch: refetchAlert 
  } = api.healthcare.getAlert.useQuery(
    { alertId: alertId! },
    { enabled: !!alertId }
  );

  // Fetch timeline events
  const { 
    data: timeline, 
    isLoading: isLoadingTimeline,
    refetch: refetchTimeline 
  } = api.healthcare.getAlertTimeline.useQuery(
    { alertId: alertId! },
    { enabled: !!alertId }
  );

  // Fetch escalation status
  const { data: escalationStatus } = api.healthcare.getEscalationStatus.useQuery(
    { alertId: alertId! },
    { enabled: !!alertId && alert?.status === 'active' }
  );

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    haptic('light');
    await Promise.all([
      refetchAlert(),
      refetchTimeline(),
      utils.healthcare.getEscalationStatus.invalidate({ alertId: alertId! }),
    ]);
    setIsRefreshing(false);
  };

  const handleAcknowledge = () => {
    router.push(`/(zmodals)/acknowledge-alert?alertId=${alertId}`);
  };

  const handleResolve = () => {
    // TODO: Implement resolve functionality
    haptic('medium');
  };

  const getUrgencyBadgeVariant = (level: number) => {
    if (level <= 2) return 'destructive';
    if (level === 3) return 'warning';
    return 'secondary';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'destructive';
      case 'acknowledged':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'secondary';
    }
  };

  if (isLoadingAlert) {
    return (
      <Container style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          <Stack spacing="lg">
            <Card>
              <Stack spacing="sm">
                <Skeleton width="60%" height={24} />
                <Skeleton width="80%" height={16} />
                <Skeleton width="70%" height={16} />
              </Stack>
            </Card>
            <Card>
              <Skeleton width="100%" height={200} />
            </Card>
          </Stack>
        </ScrollView>
      </Container>
    );
  }

  if (!alert) {
    return (
      <Container style={{ flex: 1 }}>
        <Card style={{ margin: spacing.md }}>
          <Stack spacing="md" align="center">
            <Symbol name="exclamationmark.triangle.fill" size={48} color={theme.colors.destructive} />
            <Text size="lg" weight="medium">Alert not found</Text>
            <Button variant="outline" onPress={() => router.back()}>
              Go Back
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  const canAcknowledge = alert.status === 'active' && 
    (user?.role === 'doctor' || user?.role === 'nurse' || user?.role === 'head_doctor');
  
  const canResolve = alert.status === 'acknowledged' && 
    (alert.acknowledgedBy === user?.id || user?.role === 'head_doctor');

  return (
    <Container style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Stack spacing="lg">
          {/* Alert Header */}
          <Card>
            <Stack spacing="md">
              <HStack justify="between" align="start">
                <VStack spacing="xs">
                  <Text size="xl" weight="bold">
                    {alert.alertType.replace('_', ' ')}
                  </Text>
                  <HStack spacing="sm">
                    <Badge variant={getUrgencyBadgeVariant(alert.urgencyLevel)}>
                      Level {alert.urgencyLevel}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(alert.status)}>
                      {alert.status}
                    </Badge>
                  </HStack>
                </VStack>
                <Text size="xs" color="muted">
                  #{alert.id.slice(0, 8)}
                </Text>
              </HStack>

              <Separator />

              {/* Alert Details */}
              <VStack spacing="sm">
                <HStack spacing="sm">
                  <Symbol name="bed.double.fill" size={16} color={theme.colors.muted} />
                  <Text>Room {alert.roomNumber}</Text>
                </HStack>
                
                {alert.patientName && (
                  <HStack spacing="sm">
                    <Symbol name="person.fill" size={16} color={theme.colors.muted} />
                    <Text>{alert.patientName}</Text>
                  </HStack>
                )}
                
                <HStack spacing="sm">
                  <Symbol name="clock.fill" size={16} color={theme.colors.muted} />
                  <Text>Created {format(new Date(alert.createdAt), 'MMM d, h:mm a')}</Text>
                </HStack>
                
                <HStack spacing="sm">
                  <Symbol name="person.badge.plus" size={16} color={theme.colors.muted} />
                  <Text>By {alert.creatorName || 'Unknown'}</Text>
                </HStack>
              </VStack>

              {alert.description && (
                <>
                  <Separator />
                  <VStack spacing="xs">
                    <Text size="sm" weight="medium" color="muted">Description</Text>
                    <Text>{alert.description}</Text>
                  </VStack>
                </>
              )}
            </Stack>
          </Card>

          {/* Escalation Warning */}
          {escalationStatus && alert.status === 'active' && (
            <Card variant="warning">
              <HStack spacing="sm" align="center">
                <Symbol name="exclamationmark.triangle.fill" size={20} color={theme.colors.orange} />
                <VStack spacing="xs" style={{ flex: 1 }}>
                  <Text weight="medium">Escalation Warning</Text>
                  <Text size="sm">
                    Will escalate to {escalationStatus.nextRole} in {escalationStatus.timeRemaining} minutes
                  </Text>
                </VStack>
              </HStack>
            </Card>
          )}

          {/* Acknowledgment Info */}
          {alert.acknowledgedAt && (
            <Card variant="secondary">
              <VStack spacing="xs">
                <Text size="sm" weight="medium" color="muted">Acknowledged</Text>
                <Text>{format(new Date(alert.acknowledgedAt), 'MMM d, h:mm a')}</Text>
                {alert.acknowledgedBy && (
                  <Text size="sm" color="muted">By User ID: {alert.acknowledgedBy}</Text>
                )}
              </VStack>
            </Card>
          )}

          {/* Actions */}
          {(canAcknowledge || canResolve) && (
            <Card>
              <Stack spacing="sm">
                {canAcknowledge && (
                  <Button onPress={handleAcknowledge} size="lg">
                    <HStack spacing="sm" align="center">
                      <Symbol name="checkmark.circle.fill" size={20} color={theme.background} />
                      <Text color={theme.background} weight="medium">Acknowledge Alert</Text>
                    </HStack>
                  </Button>
                )}
                
                {canResolve && (
                  <Button onPress={handleResolve} variant="success" size="lg">
                    <HStack spacing="sm" align="center">
                      <Symbol name="checkmark.seal.fill" size={20} color={theme.background} />
                      <Text color={theme.background} weight="medium">Resolve Alert</Text>
                    </HStack>
                  </Button>
                )}
              </Stack>
            </Card>
          )}

          {/* Timeline */}
          <VStack spacing="md">
            <Text size="lg" weight="bold">Timeline</Text>
            <AlertTimeline 
              alertId={alertId!} 
              events={timeline || []}
              loading={isLoadingTimeline}
            />
          </VStack>
        </Stack>
      </ScrollView>
    </Container>
  );
}