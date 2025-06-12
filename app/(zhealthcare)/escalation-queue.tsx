import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

import {
  Text,
  Card,
  Badge,
  Button,
  VStack,
  HStack,
  Container,
  Progress,
  Alert,
} from '@/components/universal';
import { 
  AlertCircle, 
  Clock,
  TrendingUp,
  User,
  ChevronRight,
  Bell,
  RefreshCw,
} from '@/components/universal/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';
import { EscalationTimer } from '@/components/healthcare/EscalationTimer';

interface EscalatingAlert {
  id: string;
  patientName: string;
  roomNumber: string;
  alertType: string;
  urgencyLevel: number;
  currentTier: number;
  nextTier: number;
  timeRemaining: number; // seconds
  createdAt: Date;
  lastEscalatedAt: Date;
  acknowledgedBy: string[];
  originalOperator: string;
}

export default function EscalationQueueScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { spacing } = useSpacing();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'mytier' | 'critical'>('all');

  // Mock data - replace with tRPC subscription
  const [escalatingAlerts, setEscalatingAlerts] = useState<EscalatingAlert[]>([
    {
      id: '1',
      patientName: 'John Doe',
      roomNumber: '205A',
      alertType: 'Cardiac Arrest',
      urgencyLevel: 1,
      currentTier: 2,
      nextTier: 3,
      timeRemaining: 45,
      createdAt: new Date(Date.now() - 5 * 60000),
      lastEscalatedAt: new Date(Date.now() - 2 * 60000),
      acknowledgedBy: ['Nurse Sarah'],
      originalOperator: 'Jane Smith',
    },
    {
      id: '2',
      patientName: 'Mary Johnson',
      roomNumber: '312B',
      alertType: 'Medical Emergency',
      urgencyLevel: 2,
      currentTier: 1,
      nextTier: 2,
      timeRemaining: 120,
      createdAt: new Date(Date.now() - 2 * 60000),
      lastEscalatedAt: new Date(Date.now()),
      acknowledgedBy: [],
      originalOperator: 'Mike Chen',
    },
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh escalation queue
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleQuickAcknowledge = async (alertId: string) => {
    // Quick acknowledge API call
    router.push(`/(zmodals)/acknowledge-alert?id=${alertId}`);
  };

  const getTierInfo = (tier: number) => {
    switch (tier) {
      case 1:
        return { role: 'Nurses', color: theme.primary };
      case 2:
        return { role: 'Doctors', color: theme.secondary };
      case 3:
        return { role: 'Head Doctor', color: theme.destructive };
      case 4:
        return { role: 'All Staff', color: theme.destructive };
      default:
        return { role: 'Unknown', color: theme.muted };
    }
  };

  const getUrgencyBadge = (level: number) => {
    const variants: any = {
      1: 'destructive',
      2: 'secondary',
      3: 'default',
      4: 'outline',
      5: 'outline',
    };
    return (
      <Badge variant={variants[level] || 'outline'} size="sm">
        Level {level}
      </Badge>
    );
  };

  const filteredAlerts = escalatingAlerts.filter(alert => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'critical') return alert.urgencyLevel <= 2;
    if (selectedFilter === 'mytier') {
      // Filter based on user role
      const userTier = user?.role === 'nurse' ? 1 : user?.role === 'doctor' ? 2 : 3;
      return alert.nextTier === userTier;
    }
    return true;
  });

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
      <Container size="full" padding="lg">
        <VStack spacing="lg">
          {/* Header */}
          <VStack spacing="xs">
            <Text variant="h3">Escalation Queue</Text>
            <Text variant="body2" className="text-muted-foreground">
              Alerts awaiting acknowledgment with escalation timers
            </Text>
          </VStack>

          {/* Alert Banner */}
          {escalatingAlerts.length > 0 && (
            <Alert variant="warning">
              <AlertCircle size={16} />
              <Text variant="body2">
                {escalatingAlerts.length} alerts in escalation. Immediate attention required.
              </Text>
            </Alert>
          )}

          {/* Filters */}
          <HStack spacing="sm">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onPress={() => setSelectedFilter('all')}
            >
              <Text>All ({escalatingAlerts.length})</Text>
            </Button>
            <Button
              variant={selectedFilter === 'mytier' ? 'default' : 'outline'}
              size="sm"
              onPress={() => setSelectedFilter('mytier')}
            >
              <Text>My Tier</Text>
            </Button>
            <Button
              variant={selectedFilter === 'critical' ? 'destructive' : 'outline'}
              size="sm"
              onPress={() => setSelectedFilter('critical')}
            >
              <Text>Critical Only</Text>
            </Button>
          </HStack>

          {/* Escalation Queue */}
          <VStack spacing="md">
            {filteredAlerts.map((alert) => {
              const currentTierInfo = getTierInfo(alert.currentTier);
              const nextTierInfo = getTierInfo(alert.nextTier);
              
              return (
                <Card key={alert.id} padding="lg" className="border-l-4" style={{ borderLeftColor: theme.destructive }}>
                  <VStack spacing="md">
                    {/* Alert Header */}
                    <HStack justify="between" align="start">
                      <VStack spacing="xs">
                        <HStack spacing="sm" align="center">
                          <AlertCircle size={20} className="text-destructive" />
                          <Text variant="h6" weight="semibold">
                            {alert.alertType}
                          </Text>
                          {getUrgencyBadge(alert.urgencyLevel)}
                        </HStack>
                        <Text variant="body2">
                          {alert.patientName} • Room {alert.roomNumber}
                        </Text>
                      </VStack>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onPress={() => handleQuickAcknowledge(alert.id)}
                      >
                        <Bell size={16} />
                        <Text>Acknowledge</Text>
                      </Button>
                    </HStack>

                    {/* Escalation Timer */}
                    <Card padding="sm" className="bg-destructive/10">
                      <HStack justify="between" align="center">
                        <VStack spacing="xs">
                          <Text variant="caption" className="text-muted-foreground">
                            Escalating from
                          </Text>
                          <Badge variant="outline" size="sm">
                            {currentTierInfo.role}
                          </Badge>
                        </VStack>
                        
                        <VStack spacing="xs" align="center">
                          <EscalationTimer
                            seconds={alert.timeRemaining}
                            onExpire={() => {
                              // Handle escalation
                            }}
                          />
                          <Text variant="caption" className="text-destructive">
                            Time Remaining
                          </Text>
                        </VStack>
                        
                        <VStack spacing="xs" align="end">
                          <Text variant="caption" className="text-muted-foreground">
                            Escalating to
                          </Text>
                          <Badge variant="destructive" size="sm">
                            {nextTierInfo.role}
                          </Badge>
                        </VStack>
                      </HStack>
                    </Card>

                    {/* Acknowledgment Status */}
                    <VStack spacing="xs">
                      <Text variant="caption" className="text-muted-foreground">
                        Acknowledgments
                      </Text>
                      {alert.acknowledgedBy.length > 0 ? (
                        <HStack spacing="sm" wrap>
                          {alert.acknowledgedBy.map((person, index) => (
                            <Badge key={index} variant="outline" size="sm">
                              <User size={12} />
                              <Text>{person}</Text>
                            </Badge>
                          ))}
                        </HStack>
                      ) : (
                        <Text variant="body2" className="text-muted-foreground">
                          No acknowledgments yet
                        </Text>
                      )}
                    </VStack>

                    {/* Alert Timeline */}
                    <HStack spacing="md" className="pt-2 border-t">
                      <VStack spacing="xs">
                        <Text variant="caption" className="text-muted-foreground">
                          Created
                        </Text>
                        <Text variant="caption">
                          {alert.createdAt.toLocaleTimeString()}
                        </Text>
                      </VStack>
                      
                      <VStack spacing="xs">
                        <Text variant="caption" className="text-muted-foreground">
                          Last Escalated
                        </Text>
                        <Text variant="caption">
                          {alert.lastEscalatedAt.toLocaleTimeString()}
                        </Text>
                      </VStack>
                      
                      <VStack spacing="xs">
                        <Text variant="caption" className="text-muted-foreground">
                          Operator
                        </Text>
                        <Text variant="caption">
                          {alert.originalOperator}
                        </Text>
                      </VStack>
                      
                      <Pressable
                        onPress={() => router.push(`/(zmodals)/alert-details?id=${alert.id}`)}
                        className="ml-auto"
                      >
                        <HStack spacing="xs" align="center">
                          <Text variant="caption" className="text-primary">
                            View Details
                          </Text>
                          <ChevronRight size={14} className="text-primary" />
                        </HStack>
                      </Pressable>
                    </HStack>
                  </VStack>
                </Card>
              );
            })}
          </VStack>

          {/* Empty State */}
          {filteredAlerts.length === 0 && (
            <Card padding="xl" className="items-center">
              <VStack spacing="md" align="center">
                <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center">
                  <RefreshCw size={32} className="text-green-500" />
                </View>
                <Text variant="h6" weight="semibold">
                  No Escalating Alerts
                </Text>
                <Text variant="body2" className="text-muted-foreground text-center">
                  All alerts have been acknowledged. Great teamwork!
                </Text>
              </VStack>
            </Card>
          )}

          {/* Auto-refresh Notice */}
          <Card padding="sm" className="bg-muted/50">
            <HStack spacing="sm" align="center">
              <RefreshCw size={16} className="text-muted-foreground" />
              <Text variant="caption" className="text-muted-foreground">
                Auto-refreshing every 10 seconds
              </Text>
            </HStack>
          </Card>
        </VStack>
      </Container>
    </ScrollView>
  );
}