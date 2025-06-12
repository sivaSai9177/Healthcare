import React, { useEffect, useState } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withSpring, 
  withRepeat 
} from 'react-native-reanimated';
import { api } from '@/lib/api/trpc';
import { 
  Box, 
  Text, 
  VStack, 
  HStack, 
  Progress,
  Badge,
  Button,
  Card,
  Symbol as IconSymbol 
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { log } from '@/lib/core/debug/logger';
import { useActivityAwareEscalation } from '@/hooks/healthcare';
import { haptic } from '@/lib/ui/haptics';
import { SpacingScale } from '@/lib/design';

interface EscalationTimerProps {
  alertId: string;
  currentTier: number;
  nextEscalationAt: Date | null;
  onManualEscalate?: () => void;
  isAdmin?: boolean;
}

export function EscalationTimer({ 
  alertId, 
  currentTier, 
  nextEscalationAt,
  onManualEscalate,
  isAdmin = false
}: EscalationTimerProps) {
  const theme = useTheme();
  const [showPausedNotice, setShowPausedNotice] = useState(false);
  
  // Animation values
  const fadeOpacity = useSharedValue(0);
  const scaleValue = useSharedValue(0.9);
  const shakeTranslateX = useSharedValue(0);
  
  // Animated styles
  const cardFadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value
  }));
  
  const pausedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }]
  }));
  
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeTranslateX.value }]
  }));
  
  // Animation functions
  const fadeInCard = () => {
    fadeOpacity.value = withTiming(1, { duration: 300 });
  };
  
  const scaleIn = () => {
    scaleValue.value = withSpring(1, { damping: 10, stiffness: 100 });
  };
  
  const scaleOut = () => {
    scaleValue.value = withSpring(0.9, { damping: 10, stiffness: 100 });
  };
  
  const shake = () => {
    shakeTranslateX.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withRepeat(withTiming(5, { duration: 100 }), 3, true),
      withTiming(0, { duration: 50 })
    );
  };
  
  useEffect(() => {
    fadeInCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get escalation status
  const { data: escalationStatus } = api.healthcare.getEscalationStatus.useQuery(
    { alertId },
    { 
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!alertId 
    }
  );

  // Use activity-aware escalation timer
  const { timeRemaining, isPaused } = useActivityAwareEscalation(
    nextEscalationAt,
    {
      onInactive: () => {
        setShowPausedNotice(true);
        scaleIn();
        haptic('medium');
        log.info('Escalation timer paused due to inactivity', 'ESCALATION_TIMER', { alertId });
      },
      onActive: () => {
        setShowPausedNotice(false);
        scaleOut();
        haptic('medium');
        log.info('Escalation timer resumed', 'ESCALATION_TIMER', { alertId });
      },
      inactivityTimeout: 30000, // 30 seconds
    }
  );

  const isOverdue = timeRemaining === 0;
  
  // Shake animation when overdue
  useEffect(() => {
    if (isOverdue) {
      shake();
      haptic('warning');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOverdue]);

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Overdue';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get tier color using design system
  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return theme.accent;
      case 2: return theme.destructive;
      case 3: return theme.destructive;
      default: return theme.primary;
    }
  };

  // Get tier label
  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return 'Nurses';
      case 2: return 'Doctors';
      case 3: return 'Department Head';
      default: return 'Unknown';
    }
  };

  // Calculate progress
  const progress = escalationStatus?.timeUntilNextEscalation && escalationStatus?.currentTierConfig
    ? 1 - (escalationStatus.timeUntilNextEscalation / (escalationStatus.currentTierConfig.timeout_minutes * 60 * 1000))
    : 0;

  return (
    <Animated.View style={[cardFadeStyle, isOverdue ? shakeStyle : {}]}>
      <Card p={3 as SpacingScale} borderWidth={1} borderTheme="border">
        <VStack spacing={3}>
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center">
            <HStack spacing={2} alignItems="center">
              <IconSymbol 
                name="clock" 
                size={20} 
                color={getTierColor(currentTier)} 
              />
              <Text size="sm" weight="semibold">
                Escalation Timer
              </Text>
            </HStack>
            <Badge 
              variant={isOverdue ? "default" : "outline"}
              size="sm"
              style={isOverdue ? { backgroundColor: theme.destructive } : {}}
            >
              Tier {currentTier} - {getTierLabel(currentTier)}
            </Badge>
          </HStack>

          {/* Timer Display */}
          {timeRemaining !== null && (
            <VStack spacing={2}>
              <HStack justifyContent="space-between" alignItems="center">
                <HStack spacing={1} alignItems="center">
                  <Text size="xs" colorTheme="mutedForeground">
                    Next escalation in:
                  </Text>
                  {isPaused && (
                    <Badge variant="outline" size="sm">
                      <HStack spacing={1} alignItems="center">
                        <IconSymbol name="pause" size={12} color={theme.accent} />
                        <Text size="xs">Paused</Text>
                      </HStack>
                    </Badge>
                  )}
                </HStack>
                <Text 
                  size="lg" 
                  weight="bold" 
                  style={{ 
                    color: isOverdue ? theme.destructive : isPaused ? theme.accent : theme.foreground 
                  }}
                >
                  {formatTimeRemaining(timeRemaining)}
                </Text>
              </HStack>

              {/* Progress Bar */}
              <Progress 
                value={progress * 100} 
                style={{
                  backgroundColor: theme.muted,
                  opacity: isPaused ? 0.5 : 1,
                  height: 8
                }}
              />
              
              {/* Paused Notice */}
              {showPausedNotice && (
                <Animated.View style={pausedScaleStyle}>
                  <Box 
                    p={2 as SpacingScale} 
                    bgTheme="accent"
                    rounded="md"
                    style={{ opacity: 0.2 }}
                  >
                    <Text size="xs" style={{ textAlign: 'center' }}>
                      Timer paused due to inactivity
                    </Text>
                  </Box>
                </Animated.View>
              )}
            </VStack>
          )}

          {/* Max Tier Reached */}
          {!nextEscalationAt && currentTier >= 3 && (
            <Box 
              p={2 as SpacingScale} 
              bgTheme="muted" 
              rounded="md"
              borderWidth={1}
              borderTheme="border"
            >
              <Text size="sm" colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
                Maximum escalation tier reached
              </Text>
            </Box>
          )}

          {/* Manual Escalation (Admin Only) */}
          {isAdmin && onManualEscalate && currentTier < 3 && (
            <Button
              size="sm"
              variant="outline"
              onPress={() => {
                haptic('warning');
                onManualEscalate();
              }}
              fullWidth
            >
              <HStack spacing={2} alignItems="center">
                <IconSymbol name="arrow.up.circle" size={16} color={theme.primary} />
                <Text size="sm">Manual Escalate</Text>
              </HStack>
            </Button>
          )}

          {/* Escalation Info */}
          {escalationStatus?.canEscalate && (
            <Box 
              p={2 as SpacingScale} 
              bgTheme="accent" 
              rounded="md"
              borderWidth={1}
              borderTheme="border"
            >
              <Text size="xs" colorTheme="mutedForeground">
                Will notify: {getTierLabel(currentTier + 1)}
              </Text>
            </Box>
          )}
        </VStack>
      </Card>
    </Animated.View>
  );
}

// Escalation Summary Component for Dashboard
interface EscalationSummaryProps {
  hospitalId: string;
}

export function EscalationSummary({ hospitalId }: EscalationSummaryProps) {
  const theme = useTheme();
  const fadeOpacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value
  }));
  
  const fadeIn = () => {
    fadeOpacity.value = withTiming(1, { duration: 400 });
  };
  
  useEffect(() => {
    fadeIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const { data: escalations, isLoading } = api.healthcare.getActiveEscalations.useQuery(
    { hospitalId },
    { 
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!hospitalId 
    }
  );

  if (isLoading) {
    return (
      <Card p={4 as SpacingScale}>
        <Text colorTheme="mutedForeground">Loading escalations...</Text>
      </Card>
    );
  }

  if (!escalations) {
    return null;
  }

  return (
    <Animated.View style={animatedStyle}>
      <Card p={4 as SpacingScale}>
        <VStack spacing={4}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text size="lg" weight="semibold">Escalation Overview</Text>
            <Badge size="lg">
              {escalations.totalActive} Active
            </Badge>
          </HStack>

          {/* Quick Stats */}
          <HStack spacing={3} flexWrap="wrap">
            {escalations.overdue > 0 && (
              <Badge 
                size="sm"
                style={{ backgroundColor: theme.destructive }}
              >
                {escalations.overdue} Overdue
              </Badge>
            )}
            {escalations.nextEscalationIn5Minutes > 0 && (
              <Badge 
                size="sm"
                style={{ backgroundColor: theme.accent }}
              >
                {escalations.nextEscalationIn5Minutes} Escalating Soon
              </Badge>
            )}
          </HStack>

          {/* Tier Breakdown */}
          <VStack spacing={2}>
            {Object.entries(escalations.byTier).map(([tier, alerts]) => (
              <Box key={tier} p={2 as SpacingScale} bgTheme="muted" rounded="md">
                <HStack justifyContent="space-between" alignItems="center">
                  <Text size="sm" weight="medium">
                    Tier {tier} ({getTierLabel(parseInt(tier))})
                  </Text>
                  <Badge size="sm" variant="outline">
                    {(alerts as any[]).length} alerts
                  </Badge>
                </HStack>
              </Box>
            ))}
          </VStack>
        </VStack>
      </Card>
    </Animated.View>
  );
}

// Helper function to get tier label
function getTierLabel(tier: number): string {
  switch (tier) {
    case 1: return 'Nurses';
    case 2: return 'Doctors';
    case 3: return 'Department Head';
    default: return 'Unknown';
  }
}