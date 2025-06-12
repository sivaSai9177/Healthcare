import React from 'react';
import { ScrollView, RefreshControl, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Container,
  Stack,
  Card,
  Text,
  Button,
  Badge,
  Separator,
  Box,
  HStack,
  VStack,
  Avatar,
  Symbol,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { format } from 'date-fns';

interface AlertEvent {
  id: string;
  timestamp: Date;
  type: 'created' | 'acknowledged' | 'escalated' | 'resolved' | 'note_added';
  user: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  description: string;
  metadata?: {
    tier?: number;
    note?: string;
    responseTime?: number;
  };
}

export default function AlertDetailsModal() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const theme = useTheme();
  const spacing = useSpacing();
  const [refreshing, setRefreshing] = React.useState(false);

  // Mock alert data - replace with API call
  const alert = {
    id: alertId || '1',
    type: 'Code Blue',
    urgency: 1,
    status: 'active' as const,
    patient: {
      name: 'John Doe',
      id: 'P123456',
      room: '302',
      age: 65,
      conditions: ['Diabetes', 'Hypertension'],
    },
    location: {
      building: 'Main Hospital',
      floor: '3rd Floor',
      department: 'Cardiology',
    },
    description: 'Patient experiencing cardiac distress, immediate response required',
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    createdBy: {
      id: 'U001',
      name: 'Sarah Johnson',
      role: 'Nurse',
      department: 'Emergency',
    },
    acknowledgments: 2,
    escalationTier: 2,
    nextEscalation: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  };

  // Mock timeline events
  const timeline: AlertEvent[] = [
    {
      id: '1',
      timestamp: alert.createdAt,
      type: 'created',
      user: alert.createdBy,
      description: 'Alert created',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      type: 'acknowledged',
      user: {
        id: 'U002',
        name: 'Dr. Michael Chen',
        role: 'Doctor',
      },
      description: 'Acknowledged alert',
      metadata: { responseTime: 180 }, // 3 minutes
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      type: 'escalated',
      user: {
        id: 'SYSTEM',
        name: 'System',
        role: 'Automated',
      },
      description: 'Alert escalated to Tier 2',
      metadata: { tier: 2 },
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      type: 'note_added',
      user: {
        id: 'U002',
        name: 'Dr. Michael Chen',
        role: 'Doctor',
      },
      description: 'Added note',
      metadata: { note: 'Patient stabilized, monitoring vitals' },
    },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleAcknowledge = () => {
    router.push(`/(zmodals)/acknowledge-alert?alertId=${alert.id}`);
  };

  const handleResolve = () => {
    // TODO: Implement resolve action
// TODO: Replace with structured logging - console.log('Resolve alert:', alert.id);
  };

  const getEventIcon = (type: AlertEvent['type']) => {
    switch (type) {
      case 'created':
        return 'bell.fill';
      case 'acknowledged':
        return 'checkmark.circle.fill';
      case 'escalated':
        return 'arrow.up.circle.fill';
      case 'resolved':
        return 'checkmark.seal.fill';
      case 'note_added':
        return 'note.text';
      default:
        return 'circle.fill';
    }
  };

  const getEventColor = (type: AlertEvent['type']) => {
    switch (type) {
      case 'created':
        return theme.colors.primary;
      case 'acknowledged':
        return theme.colors.emerald;
      case 'escalated':
        return theme.colors.orange;
      case 'resolved':
        return theme.colors.gray;
      case 'note_added':
        return theme.colors.blue;
      default:
        return theme.colors.gray;
    }
  };

  return (
    <Container style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Stack spacing="lg">
          {/* Alert Header */}
          <Card>
            <Stack spacing="md">
              <HStack justify="between" align="start">
                <VStack spacing="xs" style={{ flex: 1 }}>
                  <HStack spacing="sm" align="center">
                    <Badge variant="destructive">
                      Level {alert.urgency} - {alert.type}
                    </Badge>
                    {alert.status === 'active' && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </HStack>
                  <Text size="sm" weight="medium" color="muted">
                    {alert.location.department} • {alert.location.building}
                  </Text>
                </VStack>
                <Text size="xs" color="muted">
                  {format(alert.createdAt, 'HH:mm')}
                </Text>
              </HStack>

              <Text size="sm">{alert.description}</Text>

              <Separator />

              {/* Patient Info */}
              <VStack spacing="sm">
                <Text size="sm" weight="semibold">Patient Information</Text>
                <HStack spacing="md" wrap>
                  <Text size="sm">
                    <Text weight="medium">Name:</Text> {alert.patient.name}
                  </Text>
                  <Text size="sm">
                    <Text weight="medium">Room:</Text> {alert.patient.room}
                  </Text>
                  <Text size="sm">
                    <Text weight="medium">Age:</Text> {alert.patient.age}
                  </Text>
                </HStack>
                {alert.patient.conditions.length > 0 && (
                  <HStack spacing="sm" wrap>
                    <Text size="sm" weight="medium">Conditions:</Text>
                    {alert.patient.conditions.map((condition, index) => (
                      <Badge key={index} variant="secondary" size="sm">
                        {condition}
                      </Badge>
                    ))}
                  </HStack>
                )}
              </VStack>

              <Separator />

              {/* Alert Stats */}
              <HStack spacing="xl" justify="around">
                <VStack spacing="xs" align="center">
                  <Text size="lg" weight="bold">{alert.acknowledgments}</Text>
                  <Text size="xs" color="muted">Acknowledged</Text>
                </VStack>
                <VStack spacing="xs" align="center">
                  <Text size="lg" weight="bold">Tier {alert.escalationTier}</Text>
                  <Text size="xs" color="muted">Escalation</Text>
                </VStack>
                <VStack spacing="xs" align="center">
                  <Text size="lg" weight="bold">
                    {Math.floor((Date.now() - alert.createdAt.getTime()) / 60000)}m
                  </Text>
                  <Text size="xs" color="muted">Duration</Text>
                </VStack>
              </HStack>
            </Stack>
          </Card>

          {/* Action Buttons */}
          <HStack spacing="md">
            <Button
              onPress={handleAcknowledge}
              style={{ flex: 1 }}
              size="lg"
            >
              Acknowledge
            </Button>
            <Button
              onPress={handleResolve}
              variant="secondary"
              style={{ flex: 1 }}
              size="lg"
            >
              Resolve
            </Button>
          </HStack>

          {/* Timeline */}
          <Card>
            <Stack spacing="md">
              <Text size="lg" weight="semibold">Alert Timeline</Text>
              <Separator />
              
              {timeline.map((event, index) => (
                <View key={event.id}>
                  <HStack spacing="md" align="start">
                    <View style={{ paddingTop: spacing.xs }}>
                      <Symbol
                        name={getEventIcon(event.type)}
                        size={20}
                        color={getEventColor(event.type)}
                      />
                    </View>
                    
                    <VStack spacing="xs" style={{ flex: 1 }}>
                      <HStack justify="between">
                        <Text size="sm" weight="medium">
                          {event.description}
                        </Text>
                        <Text size="xs" color="muted">
                          {format(event.timestamp, 'HH:mm:ss')}
                        </Text>
                      </HStack>
                      
                      <HStack spacing="sm" align="center">
                        <Text size="xs" color="muted">
                          by {event.user.name} • {event.user.role}
                        </Text>
                        {event.metadata?.responseTime && (
                          <Badge variant="outline" size="sm">
                            {Math.floor(event.metadata.responseTime / 60)}m response
                          </Badge>
                        )}
                      </HStack>
                      
                      {event.metadata?.note && (
                        <Box
                          style={{
                            padding: spacing.sm,
                            backgroundColor: theme.colors.muted,
                            borderRadius: spacing.xs,
                            marginTop: spacing.xs,
                          }}
                        >
                          <Text size="sm">{event.metadata.note}</Text>
                        </Box>
                      )}
                    </VStack>
                  </HStack>
                  
                  {index < timeline.length - 1 && (
                    <View
                      style={{
                        marginLeft: 10,
                        marginVertical: spacing.xs,
                        width: 1,
                        height: spacing.lg,
                        backgroundColor: theme.colors.border,
                      }}
                    />
                  )}
                </View>
              ))}
            </Stack>
          </Card>

          {/* Created By */}
          <Card>
            <HStack spacing="md" align="center">
              <Avatar
                source={undefined}
                fallback={alert.createdBy.name.charAt(0)}
                size="md"
              />
              <VStack spacing="xs" style={{ flex: 1 }}>
                <Text size="sm" weight="medium">Created by</Text>
                <Text size="sm">{alert.createdBy.name}</Text>
                <Text size="xs" color="muted">
                  {alert.createdBy.role} • {alert.createdBy.department}
                </Text>
              </VStack>
            </HStack>
          </Card>
        </Stack>
      </ScrollView>
    </Container>
  );
}