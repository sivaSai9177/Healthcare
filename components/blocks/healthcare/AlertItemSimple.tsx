import React from 'react';
import { Pressable } from 'react-native';
import { VStack, HStack, Box } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Card, Badge } from '@/components/universal/display';
import { 
  ALERT_TYPE_CONFIG, 
  URGENCY_LEVEL_CONFIG,
} from '@/types/healthcare';
import { cn } from '@/lib/core/utils';
import { haptic } from '@/lib/ui/haptics';
import { useSpacing } from '@/lib/stores/spacing-store';
import { formatDistanceToNow } from 'date-fns';

interface SimpleAlert {
  id: string;
  roomNumber: string;
  alertType: string;
  urgencyLevel: number;
  description?: string;
  status: string;
  createdAt: string;
  acknowledged?: boolean;
  resolved?: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  currentEscalationTier?: number;
}

interface AlertItemSimpleProps {
  alert: SimpleAlert;
  onPress?: () => void;
}

export const AlertItemSimple: React.FC<AlertItemSimpleProps> = ({
  alert,
  onPress,
}) => {
  const { spacing } = useSpacing();
  
  const config = ALERT_TYPE_CONFIG[alert.alertType] || { icon: '🚨', color: 'destructive' };
  const urgencyConfig = URGENCY_LEVEL_CONFIG[alert.urgencyLevel] || { label: `Level ${alert.urgencyLevel}`, color: 'destructive' };
  
  const handlePress = () => {
    haptic('light');
    onPress?.();
  };
  
  return (
    <Pressable onPress={handlePress}>
      <Card
        className={cn(
          "border-l-4",
          alert.urgencyLevel <= 2 && "border-l-destructive",
          alert.urgencyLevel === 3 && "border-l-warning",
          alert.urgencyLevel >= 4 && "border-l-primary",
          (alert.status === 'acknowledged' || alert.acknowledged) && "opacity-80"
        )}
      >
        <Box p={spacing[4]}>
          <VStack gap={spacing[2]}>
            {/* Header */}
            <HStack gap={spacing[2]} alignItems="center">
              <Text size="2xl">{config.icon}</Text>
              <VStack style={{ flex: 1 }}>
                <HStack gap={spacing[2]} alignItems="center">
                  <Text weight="bold" size="lg">
                    Room {alert.roomNumber}
                  </Text>
                  <Badge
                    variant={alert.urgencyLevel <= 2 ? 'destructive' : alert.urgencyLevel === 3 ? 'secondary' : 'outline'}
                    size="sm"
                  >
                    <Text size="xs">{urgencyConfig.label}</Text>
                  </Badge>
                </HStack>
                <Text size="sm" colorTheme="mutedForeground">
                  {alert.alertType.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </VStack>
              
              {/* Status Badge */}
              {(alert.status === 'acknowledged' || alert.acknowledged) && (
                <Badge variant="secondary">
                  <Text size="xs">Acknowledged</Text>
                </Badge>
              )}
              {(alert.status === 'resolved' || alert.resolved) && (
                <Badge variant="success">
                  <Text size="xs">Resolved</Text>
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
            <HStack gap={spacing[3]}>
              <Text size="xs" colorTheme="mutedForeground">
                Created {formatDistanceToNow(new Date(alert.createdAt))} ago
              </Text>
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
            
            {/* Escalation Warning */}
            {alert.currentEscalationTier && alert.currentEscalationTier > 1 && (
              <HStack gap={spacing[1]} alignItems="center">
                <Text size="sm" colorTheme="destructive">
                  ⚠️ Escalated to Tier {alert.currentEscalationTier}
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>
      </Card>
    </Pressable>
  );
};