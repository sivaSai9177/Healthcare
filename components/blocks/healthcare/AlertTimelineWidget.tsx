import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { VStack, HStack } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Card, Symbol } from '@/components/universal/display';
import { LinearGradient } from 'expo-linear-gradient';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';
import { formatDistanceToNow } from 'date-fns';
import Animated, { FadeInRight, FadeOut } from 'react-native-reanimated';

interface TimelineEvent {
  id: string;
  type: 'created' | 'acknowledged' | 'escalated' | 'resolved' | 'commented';
  timestamp: string;
  user?: string;
  description: string;
  metadata?: any;
}

interface AlertTimelineWidgetProps {
  events: TimelineEvent[];
  alertStatus: string;
  urgencyLevel: number;
}

export const AlertTimelineWidget: React.FC<AlertTimelineWidgetProps> = ({
  events = [],
  alertStatus,
  urgencyLevel,
}) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created':
        return { name: 'plus.circle.fill', color: '#ef4444' };
      case 'acknowledged':
        return { name: 'checkmark.circle.fill', color: '#10b981' };
      case 'escalated':
        return { name: 'arrow.up.circle.fill', color: '#f59e0b' };
      case 'resolved':
        return { name: 'checkmark.seal.fill', color: '#3b82f6' };
      case 'commented':
        return { name: 'bubble.left.fill', color: '#6b7280' };
      default:
        return { name: 'circle.fill', color: '#6b7280' };
    }
  };
  
  const getTimelineColor = () => {
    if (alertStatus === 'resolved') return '#10b981';
    if (urgencyLevel <= 2) return '#ef4444';
    if (urgencyLevel === 3) return '#f59e0b';
    return '#3b82f6';
  };
  
  return (
    <Card className="overflow-hidden">
      <LinearGradient
        colors={[theme.card, theme.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      >
        <VStack gap={spacing[3] as any} p={spacing[4]}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text weight="semibold" size="lg">Alert Timeline</Text>
            <Text size="xs" colorTheme="mutedForeground">
              {events.length} events
            </Text>
          </HStack>
          
          <ScrollView 
            style={{ maxHeight: 300 }} 
            showsVerticalScrollIndicator={false}
          >
            <VStack gap={spacing[3] as any}>
              {events.map((event, index) => {
                const icon = getEventIcon(event.type);
                const isLast = index === events.length - 1;
                
                return (
                  <Animated.View
                    key={event.id}
                    entering={FadeInRight.delay(index * 50)}
                    exiting={FadeOut}
                  >
                    <HStack gap={spacing[3] as any}>
                      {/* Timeline Line */}
                      <View style={styles.timelineContainer}>
                        <View 
                          style={[
                            styles.timelineIcon,
                            { backgroundColor: icon.color + '20' }
                          ]}
                        >
                          <Symbol 
                            name={icon.name as any} 
                            size="sm" 
                            color={icon.color}
                          />
                        </View>
                        {!isLast && (
                          <View 
                            style={[
                              styles.timelineLine,
                              { backgroundColor: getTimelineColor() + '30' }
                            ]} 
                          />
                        )}
                      </View>
                      
                      {/* Event Content */}
                      <VStack style={{ flex: 1 }} gap={spacing[1] as any}>
                        <Text weight="medium" size="sm">
                          {event.description}
                        </Text>
                        {event.user && (
                          <Text size="xs" colorTheme="mutedForeground">
                            by {event.user}
                          </Text>
                        )}
                        <Text size="xs" colorTheme="mutedForeground">
                          {formatDistanceToNow(new Date(event.timestamp))} ago
                        </Text>
                      </VStack>
                    </HStack>
                  </Animated.View>
                );
              })}
            </VStack>
          </ScrollView>
        </VStack>
      </LinearGradient>
    </Card>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  timelineContainer: {
    alignItems: 'center',
    width: 40,
  },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    top: 36,
    width: 2,
    height: '100%',
    marginTop: 4,
  },
});