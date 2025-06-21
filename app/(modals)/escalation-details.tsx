import type { SpacingValue, ButtonVariant, BadgeVariant } from '@/types/components';
import React from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Container,
  Stack,
  Card,
  Text,
  Button,
  Badge,
  Progress,
  HStack,
  VStack,
  Separator,
  Symbol,
  Avatar,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { format } from 'date-fns';
import { api } from '@/lib/api/trpc';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LoadingView } from '@/components/universal/feedback';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';
import { haptic } from '@/lib/ui/haptics';

interface EscalationTier {
  tier: number;
  name: string;
  roles: string[];
  responseTime: number; // in seconds
  notificationMethod: string[];
  members: {
    id: string;
    name: string;
    role: string;
    status: 'available' | 'busy' | 'offline';
    avatar?: string;
  }[];
}

interface EscalationEvent {
  id: string;
  timestamp: Date;
  fromTier: number;
  toTier: number;
  reason: string;
  automatic: boolean;
}

export default function EscalationDetailsModal() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const spacing = useSpacing();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);

  // Fetch escalation status
  const { data: escalationStatus, refetch: refetchStatus } = api.healthcare.getEscalationStatus.useQuery({
    alertId: alertId || '',
  }, {
    enabled: !!alertId,
  });

  // Fetch escalation history
  const { data: escalationHistoryData, isLoading, refetch: refetchHistory } = api.healthcare.getEscalationHistory.useQuery({
    alertId: alertId || '',
  }, {
    enabled: !!alertId,
  });

  // Trigger manual escalation mutation
  const triggerEscalationMutation = api.healthcare.triggerEscalation.useMutation({
    onSuccess: () => {
      haptic('success');
      showSuccessAlert('Escalation Triggered', 'Alert has been escalated to the next tier.');
      refetchStatus();
      refetchHistory();
    },
    onError: (error) => {
      haptic('error');
      showErrorAlert('Escalation Failed', error.message || 'Failed to trigger escalation.');
    },
  });

  // Get current tier and timing from escalation status
  const currentTier = escalationStatus?.currentTier || 1;
  const timeToNextEscalation = escalationStatus?.timeToNextEscalation 
    ? Math.max(0, Math.floor(escalationStatus.timeToNextEscalation / 1000)) 
    : 180;
  const totalEscalationTime = 300; // 5 minutes default

  const escalationTiers: EscalationTier[] = [
    {
      tier: 1,
      name: 'First Responders',
      roles: ['Nurse', 'Junior Doctor'],
      responseTime: 300,
      notificationMethod: ['Push Notification', 'In-App Alert'],
      members: [
        { id: '1', name: 'Sarah Johnson', role: 'Nurse', status: 'available' },
        { id: '2', name: 'Mike Wilson', role: 'Nurse', status: 'busy' },
        { id: '3', name: 'Dr. Emily Davis', role: 'Junior Doctor', status: 'available' },
      ],
    },
    {
      tier: 2,
      name: 'Senior Medical Staff',
      roles: ['Senior Doctor', 'Head Nurse'],
      responseTime: 300,
      notificationMethod: ['Push Notification', 'SMS', 'Phone Call'],
      members: [
        { id: '4', name: 'Dr. Michael Chen', role: 'Senior Doctor', status: 'available' },
        { id: '5', name: 'Patricia Moore', role: 'Head Nurse', status: 'available' },
        { id: '6', name: 'Dr. James Taylor', role: 'Senior Doctor', status: 'offline' },
      ],
    },
    {
      tier: 3,
      name: 'Department Heads',
      roles: ['Department Head', 'Medical Director'],
      responseTime: 600,
      notificationMethod: ['Phone Call', 'SMS', 'Email'],
      members: [
        { id: '7', name: 'Dr. Robert Anderson', role: 'Department Head', status: 'available' },
        { id: '8', name: 'Dr. Lisa Thompson', role: 'Medical Director', status: 'busy' },
      ],
    },
  ];

  // Transform escalation history data
  const escalationHistory: EscalationEvent[] = React.useMemo(() => {
    if (!escalationHistoryData?.escalations) {
      return [
        {
          id: '1',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          fromTier: 0,
          toTier: 1,
          reason: 'Alert created',
          automatic: false,
        },
      ];
    }

    return escalationHistoryData.escalations.map((esc) => ({
      id: esc.escalation.id,
      timestamp: new Date(esc.escalation.escalatedAt),
      fromTier: esc.escalation.from_tier || 0,
      toTier: esc.escalation.to_tier,
      reason: esc.escalation.reason || 'No response received',
      automatic: !esc.escalation.manual,
    }));
  }, [escalationHistoryData]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStatus(), refetchHistory()]);
    setRefreshing(false);
  }, [refetchStatus, refetchHistory]);

  const handleManualEscalate = () => {
    if (!alertId) return;
    triggerEscalationMutation.mutate({ alertId });
  };

  const getStatusColor = (status: 'available' | 'busy' | 'offline') => {
    switch (status) {
      case 'available':
        return theme.success;
      case 'busy':
        return theme.destructive;
      case 'offline':
        return theme.muted;
    }
  };

  const progress = (totalEscalationTime - timeToNextEscalation) / totalEscalationTime;

  if (isLoading && !refreshing) {
    return <LoadingView message="Loading escalation details..." />;
  }

  return (
    <Container style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md , paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Stack spacing="lg">
          {/* Current Status */}
          <Card>
            <Stack spacing="md">
              <HStack justify="between" align="center">
                <VStack spacing="xs">
                  <Text size="default" weight="semibold">Current Escalation Status</Text>
                  <Badge variant="default">Tier {currentTier}</Badge>
                </VStack>
                <VStack spacing="xs" align="end">
                  <Text size="sm" weight="medium" color="error">
                    {Math.floor(timeToNextEscalation / 60)}:{(timeToNextEscalation % 60).toString().padStart(2, '0')}
                  </Text>
                  <Text size="xs" color="muted">Until Tier {currentTier + 1}</Text>
                </VStack>
              </HStack>

              <Progress value={progress * 100} />
              
              <Text size="sm" color="muted">
                Alert will automatically escalate to Tier {currentTier + 1} if no response is received
              </Text>

              <Button
                onPress={handleManualEscalate}
                variant="error"
                size="sm"
                loading={triggerEscalationMutation.isPending}
                disabled={triggerEscalationMutation.isPending || currentTier >= 3}
              >
                <HStack spacing="xs" align="center">
                  <Symbol name="arrow.up.circle.fill" size={16} color={theme.background} />
                  <Text>Escalate Now</Text>
                </HStack>
              </Button>
            </Stack>
          </Card>

          {/* Escalation Tiers */}
          {escalationTiers.map((tier) => (
            <Card
              key={tier.tier}
              variant={tier.tier === currentTier ? 'default' : 'secondary'}
              style={tier.tier === currentTier ? {
                borderColor: theme.primary,
                borderWidth: 2,
              } : undefined}
            >
              <Stack spacing="md">
                <HStack justify="between" align="start">
                  <VStack spacing="xs">
                    <HStack spacing="sm" align="center">
                      <Badge
                        variant={tier.tier === currentTier ? 'default' : 'secondary'}
                        size="sm"
                      >
                        Tier {tier.tier}
                      </Badge>
                      <Text weight="semibold">{tier.name}</Text>
                    </HStack>
                    <Text size="sm" color="muted">
                      Response time: {tier.responseTime / 60} minutes
                    </Text>
                  </VStack>
                  {tier.tier === currentTier && (
                    <Badge variant="default" size="sm">Current</Badge>
                  )}
                </HStack>

                <Separator />

                {/* Roles */}
                <VStack spacing="xs">
                  <Text size="sm" weight="medium">Notified Roles:</Text>
                  <HStack spacing="xs" wrap>
                    {tier.roles.map((role, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {role}
                      </Badge>
                    ))}
                  </HStack>
                </VStack>

                {/* Notification Methods */}
                <VStack spacing="xs">
                  <Text size="sm" weight="medium">Notification Methods:</Text>
                  <HStack spacing="xs" wrap>
                    {tier.notificationMethod.map((method, index) => (
                      <HStack key={index} spacing="xs" align="center">
                        <Symbol
                          name={
                            method === 'Push Notification' ? 'bell.fill' :
                            method === 'SMS' ? 'message.fill' :
                            method === 'Phone Call' ? 'phone.fill' :
                            'envelope.fill'
                          }
                          size={14}
                          color={theme.muted}
                        />
                        <Text size="xs" color="muted">{method}</Text>
                      </HStack>
                    ))}
                  </HStack>
                </VStack>

                {/* Team Members */}
                <VStack spacing="sm">
                  <Text size="sm" weight="medium">Team Members ({tier.members.length}):</Text>
                  {tier.members.map((member) => (
                    <HStack key={member.id} spacing="sm" align="center">
                      <Avatar
                        source={undefined}
                        fallback={member.name.charAt(0)}
                        size="sm"
                      />
                      <VStack spacing="xs" style={{ flex: 1 }}>
                        <Text size="sm">{member.name}</Text>
                        <Text size="xs" color="muted">{member.role}</Text>
                      </VStack>
                      <HStack spacing="xs" align="center">
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: getStatusColor(member.status),
                          }}
                        />
                        <Text size="xs" color="muted">{member.status}</Text>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </Stack>
            </Card>
          ))}

          {/* Escalation History */}
          <Card>
            <Stack spacing="md">
              <Text size="default" weight="semibold">Escalation History</Text>
              <Separator />
              
              {escalationHistory.map((event, index) => (
                <HStack key={event.id} spacing="md" align="start">
                  <View style={{ paddingTop: spacing.xs }}>
                    <Symbol
                      name="arrow.up.circle.fill"
                      size={20}
                      color={event.automatic ? theme.destructive : theme.primary}
                    />
                  </View>
                  
                  <VStack spacing="xs" style={{ flex: 1 }}>
                    <HStack justify="between">
                      <Text size="sm" weight="medium">
                        Escalated to Tier {event.toTier}
                      </Text>
                      <Text size="xs" color="muted">
                        {format(event.timestamp, 'HH:mm:ss')}
                      </Text>
                    </HStack>
                    
                    <Text size="xs" color="muted">
                      {event.reason}
                    </Text>
                    
                    {event.automatic && (
                      <Badge variant="outline" size="sm" style={{ alignSelf: 'flex-start' }}>
                        Automatic
                      </Badge>
                    )}
                  </VStack>
                </HStack>
              ))}
            </Stack>
          </Card>

          {/* Actions */}
          <Card variant="secondary">
            <Stack spacing="sm">
              <Text size="sm" weight="medium">Escalation Actions</Text>
              <Button
                variant="outline"
                size="sm"
// TODO: Replace with structured logging - onPress={() => /* console.log('Pause escalation') */}
              >
                Pause Escalation
              </Button>
              <Button
                variant="outline"
                size="sm"
// TODO: Replace with structured logging - onPress={() => /* console.log('Skip to tier') */}
              >
                Skip to Specific Tier
              </Button>
              <Button
                variant="outline"
                size="sm"
// TODO: Replace with structured logging - onPress={() => /* console.log('Notify additional staff') */}
              >
                Notify Additional Staff
              </Button>
            </Stack>
          </Card>
        </Stack>
      </ScrollView>
    </Container>
  );
}