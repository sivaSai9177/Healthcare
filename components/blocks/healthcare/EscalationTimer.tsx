import {
  Badge,
  Box,
  Button,
  Card,
  HStack,
  Symbol as IconSymbol,
  Progress,
  Text,
  VStack,
} from "@/components/universal";
import { useActivityAwareEscalation } from "@/hooks/healthcare";
import { api } from "@/lib/api/trpc";
import { log } from "@/lib/core/debug/logger";
import { cn } from "@/lib/core/utils";
import { haptic } from "@/lib/ui/haptics";
import React, { useEffect, useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

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
  isAdmin = false,
}: EscalationTimerProps) {
  const [showPausedNotice, setShowPausedNotice] = useState(false);

  // Animation values
  const fadeOpacity = useSharedValue(0);
  const scaleValue = useSharedValue(0.9);
  const shakeTranslateX = useSharedValue(0);

  // Animated styles
  const cardFadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const pausedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeTranslateX.value }],
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
  const {
    data: escalationStatus,
  } = api.healthcare.getEscalationStatus.useQuery(
    { alertId },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!alertId,
    }
  );

  // Use activity-aware escalation timer
  const { timeRemaining, isPaused } = useActivityAwareEscalation(
    nextEscalationAt,
    {
      onInactive: () => {
        setShowPausedNotice(true);
        scaleIn();
        haptic("medium");
        log.info(
          "Escalation timer paused due to inactivity",
          "ESCALATION_TIMER",
          { alertId }
        );
      },
      onActive: () => {
        setShowPausedNotice(false);
        scaleOut();
        haptic("medium");
        log.info("Escalation timer resumed", "ESCALATION_TIMER", { alertId });
      },
      inactivityTimeout: 30000, // 30 seconds
    }
  );

  const isOverdue = timeRemaining === 0;

  // Shake animation when overdue
  useEffect(() => {
    if (isOverdue) {
      shake();
      haptic("warning");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOverdue]);

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "Overdue";

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

  // Get tier color class
  const getTierColorClass = (tier: number) => {
    switch (tier) {
      case 1:
        return "text-accent";
      case 2:
        return "text-destructive";
      case 3:
        return "text-destructive";
      default:
        return "text-primary";
    }
  };

  // Get tier label
  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1:
        return "Nurses";
      case 2:
        return "Doctors";
      case 3:
        return "Department Head";
      default:
        return "Unknown";
    }
  };

  // Calculate progress
  const progress =
    escalationStatus?.timeUntilNextEscalation &&
    escalationStatus?.currentTierConfig
      ? 1 -
        escalationStatus.timeUntilNextEscalation /
          (escalationStatus.currentTierConfig.timeout_minutes * 60 * 1000)
      : 0;

  return (
    <Animated.View style={[cardFadeStyle, isOverdue ? shakeStyle : {}]}>
      <Card className="p-3 border border-border">
        <VStack gap={3}>
          {/* Header */}
          <HStack justify="between" align="center">
            <HStack gap={2} align="center">
              <IconSymbol
                name="clock"
                size={20}
                className={getTierColorClass(currentTier)}
              />
              <Text size="sm" weight="semibold">
                Escalation Timer
              </Text>
            </HStack>
            <Badge
              variant={isOverdue ? "error" : "outline"}
              size="sm"
            >
              {`Tier ${currentTier} - ${getTierLabel(currentTier)}`}
            </Badge>
          </HStack>

          {/* Timer Display */}
          {timeRemaining !== null && (
            <VStack gap={2}>
              <HStack justify="between" align="center">
                <HStack gap={1} align="center">
                  <Text size="xs" colorTheme="mutedForeground">
                    Next escalation in:
                  </Text>
                  {isPaused && (
                    <Badge variant="outline" size="sm">
                      <HStack gap={1} align="center">
                        <IconSymbol
                          name="pause"
                          size={12}
                          className="text-accent"
                        />
                        <Text size="xs">Paused</Text>
                      </HStack>
                    </Badge>
                  )}
                </HStack>
                <Text
                  size="lg"
                  weight="bold"
                  className={cn(
                    isOverdue && "text-destructive",
                    isPaused && !isOverdue && "text-accent"
                  )}
                >
                  {formatTimeRemaining(timeRemaining)}
                </Text>
              </HStack>

              {/* Progress Bar */}
              <Progress
                value={progress * 100}
                className={cn(
                  "h-2 bg-muted",
                  isPaused && "opacity-50"
                )}
              />

              {/* Paused Notice */}
              {showPausedNotice && (
                <Animated.View style={pausedScaleStyle}>
                  <Box
                    className="p-2 bg-accent rounded-md opacity-20"
                  >
                    <Text size="xs" style={{ textAlign: "center" }}>
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
              className="p-2 bg-muted rounded-md border border-border"
            >
              <Text
                size="sm"
                colorTheme="mutedForeground"
                style={{ textAlign: "center" }}
              >
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
                haptic("warning");
                onManualEscalate();
              }}
              fullWidth
            >
              <HStack gap={2} align="center">
                <IconSymbol
                  name="arrow.up.circle"
                  size={16}
                  className="text-primary"
                />
                <Text size="sm">Manual Escalate</Text>
              </HStack>
            </Button>
          )}

          {/* Escalation Info */}
          {escalationStatus?.canEscalate && (
            <Box
              className="p-2 bg-accent rounded-md border border-border"
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
  const fadeOpacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const fadeIn = () => {
    fadeOpacity.value = withTiming(1, { duration: 400 });
  };

  useEffect(() => {
    fadeIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    data: escalations,
    isLoading,
  } = api.healthcare.getActiveEscalations.useQuery(
    { hospitalId },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!hospitalId,
    }
  );

  if (isLoading) {
    return (
      <Card className="p-4">
        <Text colorTheme="mutedForeground">Loading escalations...</Text>
      </Card>
    );
  }

  if (!escalations) {
    return null;
  }

  return (
    <Animated.View style={animatedStyle}>
      <Card className="p-4">
        <VStack gap={4}>
          <HStack justify="between" align="center">
            <Text size="lg" weight="semibold">
              Escalation Overview
            </Text>
            <Badge size="lg">{`${escalations.totalActive} Active`}</Badge>
          </HStack>

          {/* Quick Stats */}
          <HStack gap={3} className="flex-wrap">
            {escalations.overdue > 0 && (
              <Badge size="sm" variant="error">
                {`${escalations.overdue} Overdue`}
              </Badge>
            )}
            {escalations.nextEscalationIn5Minutes > 0 && (
              <Badge size="sm" variant="warning">
                {`${escalations.nextEscalationIn5Minutes} Escalating Soon`}
              </Badge>
            )}
          </HStack>

          {/* Tier Breakdown */}
          <VStack gap={2}>
            {Object.entries(escalations.byTier).map(([tier, alerts]) => (
              <Box key={tier} className="p-2 bg-muted rounded-md">
                <HStack justify="between" align="center">
                  <Text size="sm" weight="medium">
                    Tier {tier} ({getTierLabel(parseInt(tier))})
                  </Text>
                  <Badge size="sm" variant="outline">
                    {`${(alerts as any[]).length} alerts`}
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
    case 1:
      return "Nurses";
    case 2:
      return "Doctors";
    case 3:
      return "Department Head";
    default:
      return "Unknown";
  }
}
