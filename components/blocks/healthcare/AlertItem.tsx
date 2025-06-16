import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { VStack, HStack, Box, Separator } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { Card, Badge } from '@/components/universal/display';
import { Alert } from '@/components/universal/feedback';
import { 
  HealthcareUserRole,
  ALERT_TYPE_CONFIG, 
  URGENCY_LEVEL_CONFIG,
  type AlertWithRelations,
} from '@/types/healthcare';
import { cn } from '@/lib/core/utils';
import { EscalationTimer } from './EscalationTimer';
import { haptic } from '@/lib/ui/haptics';
import { SpacingScale } from '@/lib/design';
import { useSpacing } from '@/lib/stores/spacing-store';
import { formatDistanceToNow } from 'date-fns';
import { log } from '@/lib/core/debug/logger';

export interface AlertItemProps {
  alertData: AlertWithRelations;
  index: number;
  role: HealthcareUserRole;
  canAcknowledge: boolean;
  canResolve: boolean;
  onAcknowledge: (alertId: string, notes?: string) => void;
  onResolve: (alertId: string, resolution: string) => void;
  isAcknowledging?: boolean;
  isResolving?: boolean;
  defaultExpanded?: boolean;
}

export const AlertItem: React.FC<AlertItemProps> = ({
  alertData,
  index,
  role,
  canAcknowledge,
  canResolve,
  onAcknowledge,
  onResolve,
  isAcknowledging = false,
  isResolving = false,
  defaultExpanded = false,
}) => {
  const router = useRouter();
  const { spacing } = useSpacing();
  const [isSelected, setIsSelected] = useState(defaultExpanded);
  
  const alert = alertData;
  const config = ALERT_TYPE_CONFIG[alert.alertType];
  const urgencyConfig = URGENCY_LEVEL_CONFIG[alert.urgencyLevel];
  
  // Calculate stagger delay for list animations
  const staggerDelay = Math.min(index + 1, 6);
  
  const handlePress = () => {
    haptic('light');
    setIsSelected(!isSelected);
  };
  
  const handleViewDetails = () => {
    router.push(`/(healthcare)/alert-details?id=${alert.id}`);
  };
  
  return (
    <View className={cn(
      "animate-slide-in-up",
      `delay-stagger-${staggerDelay}`,
      "transition-all duration-200"
    )}>
      <Pressable onPress={handlePress}>
        <Card
          shadow="md"
          className={cn(
            "border-l-4",
            alert.urgencyLevel <= 2 && "border-l-destructive",
            alert.urgencyLevel === 3 && "border-l-secondary",
            alert.urgencyLevel >= 4 && "border-l-primary",
            alert.status === 'acknowledged' && "opacity-80"
          )}
          style={{
            marginBottom: spacing[3],
          }}
        >
          <VStack gap={spacing[2] as SpacingScale}>
            {/* Header */}
            <HStack gap={spacing[2] as SpacingScale} align="center">
              <Text size="2xl">{config?.icon}</Text>
              <VStack style={{ flex: 1 }}>
                <HStack gap={spacing[2] as SpacingScale} align="center">
                  <Text weight="bold" size="lg">
                    Room {alert.roomNumber}
                  </Text>
                  <Badge
                    variant={alert.urgencyLevel <= 2 ? 'error' : alert.urgencyLevel === 3 ? 'secondary' : 'default'}
                    size="sm"
                  >
                    {urgencyConfig.label}
                  </Badge>
                </HStack>
                <Text size="sm" colorTheme="mutedForeground">
                  {alert.alertType.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </VStack>
              
              {/* Status Badge */}
              {alert.status === 'acknowledged' && (
                <Badge variant="secondary">
                  <Text size="xs">Acknowledged</Text>
                </Badge>
              )}
            </HStack>
            
            {/* Alert Details */}
            {alert.description && (
              <Text size="sm" colorTheme="mutedForeground">
                {alert.description}
              </Text>
            )}
            
            {/* Metadata */}
            <HStack gap={spacing[3] as SpacingScale}>
              <Text size="xs" colorTheme="mutedForeground">
                Created {formatDistanceToNow(new Date(alert.createdAt))} ago
              </Text>
              {alert.createdBy && (
                <Text size="xs" colorTheme="mutedForeground">
                  by {alert.createdBy}
                </Text>
              )}
            </HStack>
            
            {/* Acknowledged Info */}
            {alert.acknowledgedAt && alert.acknowledgedBy && (
              <Box className="bg-muted rounded-md p-2">
                <Text size="xs">
                  Acknowledged by {alert.acknowledgedBy} at{' '}
                  {new Date(alert.acknowledgedAt).toLocaleTimeString()}
                </Text>
              </Box>
            )}
            
            {/* Escalation Timer - Only for active alerts */}
            {alert.status === 'active' && (
              <EscalationTimer
                alertId={alert.id}
                currentTier={alert.currentEscalationTier || 1}
                nextEscalationAt={alert.nextEscalationAt ? new Date(alert.nextEscalationAt) : null}
                isAdmin={role === 'admin'}
                onManualEscalate={() => {
                  log.info('Manual escalation requested', 'HEALTHCARE', { alertId: alert.id });
                }}
              />
            )}
            
            {/* Escalation Warning */}
            {alert.currentEscalationTier > 1 && (
              <Alert variant="error">
                <Text size="sm" weight="semibold">
                  ⚠️ Escalated to Tier {alert.currentEscalationTier}
                </Text>
              </Alert>
            )}
            
            {/* Actions */}
            {isSelected && (
              <VStack gap={spacing[2] as SpacingScale} style={{ marginTop: 8 }}>
                <Separator />
                
                {/* View Details */}
                <Button
                  onPress={handleViewDetails}
                  variant="outline"
                  size="sm"
                  fullWidth
                >
                  View Full Details
                </Button>
                
                {/* Acknowledge Button */}
                {alert.status === 'active' && canAcknowledge && (
                  <Button
                    onPress={() => onAcknowledge(alert.id)}
                    variant="outline"
                    size="lg"
                    disabled={isAcknowledging}
                    fullWidth
                  >
                    {isAcknowledging ? 'Acknowledging...' : 'Acknowledge Alert'}
                  </Button>
                )}
                
                {/* Resolve Button */}
                {alert.status === 'acknowledged' && canResolve && (
                  <Button
                    onPress={() => {
                      // In production, show a dialog to enter resolution notes
                      onResolve(alert.id, 'Situation resolved successfully');
                    }}
                    variant="secondary"
                    disabled={isResolving}
                    fullWidth
                  >
                    {isResolving ? 'Resolving...' : 'Mark as Resolved'}
                  </Button>
                )}
              </VStack>
            )}
          </VStack>
        </Card>
      </Pressable>
    </View>
  );
};