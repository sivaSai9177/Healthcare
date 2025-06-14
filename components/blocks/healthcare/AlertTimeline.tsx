import {
  Badge,
  Card,
  HStack,
  Skeleton,
  Stack,
  Symbols,
  Text,
  VStack,
} from "@/components/universal";
import { cn } from "@/lib/core/utils";
import { useSpacing } from "@/lib/stores/spacing-store";
import { format, formatDistanceToNow } from "date-fns";
import React from "react";
import { View } from "react-native";

interface TimelineEvent {
  id: string;
  eventType:
    | "created"
    | "acknowledged"
    | "escalated"
    | "resolved"
    | "urgency_changed"
    | "note_added";
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

export function AlertTimeline({
  alertId,
  events,
  loading,
}: AlertTimelineProps) {
  const { spacing } = useSpacing();

  const getEventIcon = (eventType: TimelineEvent["eventType"]) => {
    switch (eventType) {
      case "created":
        return { name: "plus.circle.fill", colorClass: "text-primary" };
      case "acknowledged":
        return { name: "checkmark.circle.fill", colorClass: "text-success" };
      case "escalated":
        return {
          name: "exclamationmark.triangle.fill",
          colorClass: "text-destructive",
        };
      case "resolved":
        return { name: "checkmark.seal.fill", colorClass: "text-primary" };
      case "urgency_changed":
        return {
          name: "arrow.up.arrow.down.circle.fill",
          colorClass: "text-accent",
        };
      case "note_added":
        return { name: "note.text", colorClass: "text-muted-foreground" };
      default:
        return { name: "circle.fill", colorClass: "text-muted-foreground" };
    }
  };

  const formatEventTime = (timestamp: Date) => {
    const now = new Date();
    const diffInHours =
      (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } else if (diffInHours < 24) {
      return format(timestamp, "h:mm a");
    } else {
      return format(timestamp, "MMM d, h:mm a");
    }
  };

  const renderEventDetails = (event: TimelineEvent) => {
    const { metadata } = event;
    if (!metadata) return null;

    switch (event.eventType) {
      case "acknowledged":
        return (
          <Stack gap={1} className="mt-2">
            {metadata.responseAction && (
              <HStack spacing={1} align="center">
                <Symbols
                  name="arrow.right.circle.fill"
                  size={14}
                  className="text-muted-foreground"
                />
                <Text size="xs" color="muted">
                  Response: {metadata.responseAction.replace("_", " ")}
                </Text>
              </HStack>
            )}
            {metadata.estimatedResponseTime && (
              <HStack spacing={1} align="center">
                <Symbols
                  name="clock.fill"
                  size={14}
                  className="text-muted-foreground"
                />
                <Text size="xs" color="muted">
                  ETA: {metadata.estimatedResponseTime} minutes
                </Text>
              </HStack>
            )}
            {metadata.urgencyAssessment &&
              metadata.urgencyAssessment !== "maintain" && (
                <HStack spacing={1} align="center">
                  <Symbols
                    name="flag.fill"
                    size={14}
                    className="text-muted-foreground"
                  />
                  <Text size="xs" color="muted">
                    Urgency: {metadata.urgencyAssessment}d
                  </Text>
                </HStack>
              )}
          </Stack>
        );

      case "escalated":
        return (
          <Stack gap={1} className="mt-2">
            <HStack gap={1} align="center">
              <Symbols
                name="person.fill"
                size={14}
                className="text-destructive"
              />
              <Text size="xs" color="muted">
                From {metadata.fromRole} to {metadata.toRole}
              </Text>
            </HStack>
            {metadata.reason && (
              <Text size="xs" color="muted" className="ml-6">
                {metadata.reason}
              </Text>
            )}
          </Stack>
        );

      case "urgency_changed":
        return (
          <HStack spacing={2} align="center" className="mt-2">
            <Badge
              variant={
                metadata.previousUrgency > metadata.newUrgency
                  ? "error"
                  : "default"
              }
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
      <Stack gap={4}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <HStack spacing={2} align="start">
              <Skeleton width={32} height={32} rounded="full" />
              <VStack spacing={1} style={{ flex: 1 }}>
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
      <Card variant="default">
        <HStack spacing={2} align="center">
          <Symbols
            name="clock.arrow.circlepath"
            size={20}
            className="text-muted-foreground"
          />
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
          <View key={event.id} style={{ position: "relative" }}>
            {/* Connection line */}
            {!isLast && (
              <View
                className="absolute bg-border"
                style={{
                  left: 16,
                  top: 40,
                  bottom: -(spacing[4] as number),
                  width: 2,
                  zIndex: 0,
                }}
              />
            )}

            <Card className="relative z-10">
              <HStack spacing={4} align="start">
                {/* Icon */}
                <View
                  className={cn(
                    "w-8 h-8 rounded-full items-center justify-center",
                    icon.colorClass === "text-primary" && "bg-primary/20",
                    icon.colorClass === "text-success" && "bg-success/20",
                    icon.colorClass === "text-destructive" &&
                      "bg-destructive/20",
                    icon.colorClass === "text-accent" && "bg-accent/20",
                    icon.colorClass === "text-muted-foreground" && "bg-muted/20"
                  )}
                >
                  <Symbols
                    name={icon.name}
                    size={20}
                    className={icon.colorClass}
                  />
                </View>

                {/* Content */}
                <VStack spacing={1} style={{ flex: 1 }}>
                  <HStack spacing={0} justify="between" align="start">
                    <VStack spacing={1} style={{ flex: 1 }}>
                      <Text weight="medium">{event.description}</Text>
                      {event.userName && (
                        <Text size="sm" color="muted">
                          by {event.userName}
                        </Text>
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
