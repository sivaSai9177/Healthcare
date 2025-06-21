import React, { useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import {
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  GlassCard,
  AlertGlassCard,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { cn } from '@/lib/core/utils';
import { format, formatDistanceToNow } from 'date-fns';
import type { Alert } from '@/types/healthcare';

interface AlertEscalation {
  id: string;
  escalatedAt: Date;
  escalatedByName?: string;
  escalatedByRole?: string;
  escalationLevel: number;
  reason?: string;
}

interface EscalationTimelineProps {
  alert: Alert;
  escalations?: AlertEscalation[];
  className?: string;
  style?: ViewStyle;
  compact?: boolean;
}

interface TimelineEvent {
  id: string;
  type: 'created' | 'escalated' | 'acknowledged' | 'resolved';
  timestamp: Date;
  user?: string;
  role?: string;
  level?: number;
  note?: string;
}

const LEVEL_COLORS = {
  0: { color: 'blue', label: 'Initial' },
  1: { color: 'yellow', label: 'Level 1' },
  2: { color: 'orange', label: 'Level 2' },
  3: { color: 'red', label: 'Critical' },
} as const;

const EVENT_ICONS = {
  created: '🆕',
  escalated: '⬆️',
  acknowledged: '✅',
  resolved: '✓',
} as const;

const TimelineItem: React.FC<{
  event: TimelineEvent;
  isLast: boolean;
  index: number;
  compact?: boolean;
}> = ({ event, isLast, index, compact }) => {
  const { spacing } = useSpacing();
  
  const levelConfig = event.level !== undefined ? LEVEL_COLORS[event.level as keyof typeof LEVEL_COLORS] : null;
  
  return (
    <Animated.View
      entering={SlideInRight.delay(index * 100).springify()}
      style={{ width: '100%' }}
    >
      <HStack gap={3} alignItems="flex-start">
        {/* Timeline line and dot */}
        <View style={{ width: 40, alignItems: 'center' }}>
          {/* Dot */}
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: levelConfig?.color || '#3b82f6',
              zIndex: 1,
            }}
          />
          {/* Line */}
          {!isLast && (
            <View
              style={{
                position: 'absolute',
                top: 12,
                width: 2,
                height: '100%',
                backgroundColor: '#e5e7eb',
              }}
            />
          )}
        </View>
        
        {/* Content */}
        <Box flex={1} pb={isLast ? 0 : 4}>
          <VStack gap={1}>
            <HStack gap={2} alignItems="center">
              <Text size="sm" weight="medium">
                {EVENT_ICONS[event.type]} {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </Text>
              {levelConfig && (
                <Badge
                  variant={levelConfig.color === 'red' ? 'error' : levelConfig.color === 'yellow' ? 'warning' : 'default'}
                  size="xs"
                >
                  {levelConfig.label}
                </Badge>
              )}
            </HStack>
            
            {!compact && (
              <>
                <Text size="xs" color="muted">
                  {format(event.timestamp, 'MMM d, h:mm a')} • {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                </Text>
                
                {event.user && (
                  <Text size="xs" color="muted">
                    By {event.user} {event.role && `(${event.role})`}
                  </Text>
                )}
                
                {event.note && (
                  <Text size="sm" style={{ marginTop: spacing[1] }}>
                    {event.note}
                  </Text>
                )}
              </>
            )}
          </VStack>
        </Box>
      </HStack>
    </Animated.View>
  );
};

export const EscalationTimeline: React.FC<EscalationTimelineProps> = ({
  alert,
  escalations = [],
  className,
  style,
  compact = false,
}) => {
  const { spacing } = useSpacing();
  
  // Build timeline events from alert and escalations
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];
    
    // Alert creation
    events.push({
      id: `created-${alert.id}`,
      type: 'created',
      timestamp: new Date(alert.createdAt),
      user: (alert as any).createdByName || 'System',
      role: (alert as any).createdByRole,
      level: 0,
    });
    
    // Escalations
    escalations.forEach((esc) => {
      events.push({
        id: `escalated-${esc.id}`,
        type: 'escalated',
        timestamp: new Date(esc.escalatedAt),
        user: esc.escalatedByName || 'System',
        role: esc.escalatedByRole,
        level: esc.escalationLevel,
        note: esc.reason,
      });
    });
    
    // Acknowledgment
    if (alert.acknowledgedAt) {
      events.push({
        id: `acknowledged-${alert.id}`,
        type: 'acknowledged',
        timestamp: new Date(alert.acknowledgedAt),
        user: (alert as any).acknowledgedByName,
        role: (alert as any).acknowledgedByRole,
      });
    }
    
    // Resolution
    if (alert.resolvedAt) {
      events.push({
        id: `resolved-${alert.id}`,
        type: 'resolved',
        timestamp: new Date(alert.resolvedAt),
        user: (alert as any).resolvedByName,
        role: (alert as any).resolvedByRole,
        note: (alert as any).resolutionNote,
      });
    }
    
    // Sort by timestamp
    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [alert, escalations]);
  
  const CardComponent = (alert as any).urgency === 'critical' || (alert as any).urgency === 'high' 
    ? AlertGlassCard 
    : GlassCard;
  
  return (
    <CardComponent
      className={cn('overflow-hidden', className)}
      style={style}
      urgency={(alert as any).urgency === 'critical' ? 'critical' : (alert as any).urgency === 'high' ? 'high' : undefined}
    >
      <Box p={4}>
        <VStack gap={3}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text size="lg" weight="bold">
              Escalation Timeline
            </Text>
            <Badge variant={alert.status === 'resolved' ? 'success' : 'default'}>
              {alert.status}
            </Badge>
          </HStack>
          
          <VStack gap={0}>
            {timelineEvents.map((event, index) => (
              <TimelineItem
                key={event.id}
                event={event}
                isLast={index === timelineEvents.length - 1}
                index={index}
                compact={compact}
              />
            ))}
          </VStack>
          
          {/* Current escalation timer if active */}
          {alert.status !== 'resolved' && (alert as any).escalationLevel < 3 && (
            <Animated.View
              entering={FadeIn.delay(300)}
              style={{
                marginTop: spacing[2],
                padding: spacing[3],
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.2)',
              }}
            >
              <VStack gap={2}>
                <HStack justifyContent="space-between">
                  <Text size="sm" weight="medium">
                    Next Escalation
                  </Text>
                  <Text size="sm" weight="bold" color="destructive">
                    Level {(alert as any).escalationLevel + 1}
                  </Text>
                </HStack>
                <Text size="xs" color="muted">
                  Escalates in {formatDistanceToNow(
                    new Date(new Date((alert as any).lastEscalatedAt || alert.createdAt).getTime() + 5 * 60 * 1000),
                    { addSuffix: false }
                  )}
                </Text>
              </VStack>
            </Animated.View>
          )}
        </VStack>
      </Box>
    </CardComponent>
  );
};

// Compact version for list views
export const EscalationTimelineCompact: React.FC<Omit<EscalationTimelineProps, 'compact'>> = (props) => (
  <EscalationTimeline {...props} compact />
);