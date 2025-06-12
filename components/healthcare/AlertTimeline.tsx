import React from 'react';
import { View } from 'react-native';
import {
  Card,
  Stack,
  HStack,
  VStack,
  Text,
  Badge,
  Symbol,
  Skeleton,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { format, formatDistanceToNow } from 'date-fns';

interface TimelineEvent {
  id: string;
  eventType: 'created' | 'acknowledged' | 'escalated' | 'resolved' | 'urgency_changed' | 'note_added';
  userId: string;
  userName?: string;
  timestamp: Date;
  description: string;
  metadata?: Record<string, any>;
}

interface AlertTimelineProps {
  alertId: string;
  events: TimelineEvent[];
  loading?: boolean;
}

export function AlertTimeline({ alertId, events, loading }: AlertTimelineProps) {
  const theme = useTheme();
  const spacing = useSpacing();

  const getEventIcon = (eventType: TimelineEvent['eventType']) => {
    switch (eventType) {
      case 'created':
        return { name: 'plus.circle.fill', color: theme.colors.blue };
      case 'acknowledged':
        return { name: 'checkmark.circle.fill', color: theme.colors.green };
      case 'escalated':
        return { name: 'exclamationmark.triangle.fill', color: theme.colors.orange };
      case 'resolved':
        return { name: 'checkmark.seal.fill', color: theme.colors.primary };
      case 'urgency_changed':
        return { name: 'arrow.up.arrow.down.circle.fill', color: theme.colors.yellow };
      case 'note_added':
        return { name: 'note.text', color: theme.colors.muted };
      default:
        return { name: 'circle.fill', color: theme.colors.muted };
    }
  };

  const formatEventTime = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } else if (diffInHours < 24) {
      return format(timestamp, 'h:mm a');
    } else {
      return format(timestamp, 'MMM d, h:mm a');
    }
  };

  const renderEventDetails = (event: TimelineEvent) => {
    const { metadata } = event;
    if (!metadata) return null;

    switch (event.eventType) {
      case 'acknowledged':
        return (
          <Stack spacing="xs" style={{ marginTop: spacing.xs }}>
            {metadata.responseAction && (
              <HStack spacing="xs" align="center">
                <Symbol name="arrow.right.circle.fill" size={14} color={theme.colors.muted} />
                <Text size="xs" color="muted">
                  Response: {metadata.responseAction.replace('_', ' ')}
                </Text>
              </HStack>
            )}
            {metadata.estimatedResponseTime && (
              <HStack spacing="xs" align="center">
                <Symbol name="clock.fill" size={14} color={theme.colors.muted} />
                <Text size="xs" color="muted">
                  ETA: {metadata.estimatedResponseTime} minutes
                </Text>
              </HStack>
            )}
            {metadata.urgencyAssessment && metadata.urgencyAssessment !== 'maintain' && (
              <HStack spacing="xs" align="center">
                <Symbol name="flag.fill" size={14} color={theme.colors.muted} />
                <Text size="xs" color="muted">
                  Urgency: {metadata.urgencyAssessment}d
                </Text>
              </HStack>
            )}
          </Stack>
        );
      
      case 'escalated':
        return (
          <Stack spacing="xs" style={{ marginTop: spacing.xs }}>
            <HStack spacing="xs" align="center">
              <Symbol name="person.fill" size={14} color={theme.colors.orange} />
              <Text size="xs" color="muted">
                From {metadata.fromRole} to {metadata.toRole}
              </Text>
            </HStack>
            {metadata.reason && (
              <Text size="xs" color="muted" style={{ marginLeft: spacing.lg }}>
                {metadata.reason}
              </Text>
            )}
          </Stack>
        );
      
      case 'urgency_changed':
        return (
          <HStack spacing="xs" align="center" style={{ marginTop: spacing.xs }}>
            <Badge 
              variant={metadata.previousUrgency > metadata.newUrgency ? 'destructive' : 'secondary'}
              size="sm"
            >
              Level {metadata.previousUrgency} → {metadata.newUrgency}
            </Badge>
          </HStack>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Stack spacing="md">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <HStack spacing="md" align="start">
              <Skeleton width={32} height={32} radius={16} />
              <VStack spacing="xs" style={{ flex: 1 }}>
                <Skeleton width="80%" height={16} />
                <Skeleton width="60%" height={14} />
              </VStack>
            </HStack>
          </Card>
        ))}
      </Stack>
    );
  }

  if (events.length === 0) {
    return (
      <Card variant="secondary">
        <HStack spacing="sm" align="center">
          <Symbol name="clock.arrow.circlepath" size={20} color={theme.colors.muted} />
          <Text color="muted">No timeline events yet</Text>
        </HStack>
      </Card>
    );
  }

  return (
    <Stack spacing="md">
      {events.map((event, index) => {
        const icon = getEventIcon(event.eventType);
        const isLast = index === events.length - 1;
        
        return (
          <View key={event.id} style={{ position: 'relative' }}>
            {/* Connection line */}
            {!isLast && (
              <View
                style={{
                  position: 'absolute',
                  left: 16,
                  top: 40,
                  bottom: -spacing.md,
                  width: 2,
                  backgroundColor: theme.colors.border,
                  zIndex: 0,
                }}
              />
            )}
            
            <Card style={{ zIndex: 1 }}>
              <HStack spacing="md" align="start">
                {/* Icon */}
                <View 
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: `${icon.color}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Symbol name={icon.name} size={20} color={icon.color} />
                </View>
                
                {/* Content */}
                <VStack spacing="xs" style={{ flex: 1 }}>
                  <HStack justify="between" align="start">
                    <VStack spacing="xs" style={{ flex: 1 }}>
                      <Text weight="medium">{event.description}</Text>
                      {event.userName && (
                        <Text size="sm" color="muted">by {event.userName}</Text>
                      )}
                    </VStack>
                    <Text size="xs" color="muted">
                      {formatEventTime(event.timestamp)}
                    </Text>
                  </HStack>
                  
                  {renderEventDetails(event)}
                </VStack>
              </HStack>
            </Card>
          </View>
        );
      })}
    </Stack>
  );
}