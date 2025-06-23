import React, { useState, useCallback, useMemo } from 'react';
import { 
  ScrollView, 
  RefreshControl, 
  View, 
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Badge,
  GlassCard,
  Symbol,
  Heading2,
  Separator,
  Checkbox,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';
import { formatDistanceToNow } from 'date-fns';
import { haptic } from '@/lib/ui/haptics';
import { AnimatedPageWrapper, pageEnteringAnimations } from '@/lib/navigation/page-transitions';
import { useLayoutTransition } from '@/hooks/useLayoutTransition';
import { DashboardGrid, Widget } from '@/components/universal/layout/WidgetGrid';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';
import { useAlertWebSocket, useHospitalContext } from '@/hooks/healthcare';
import { useHealthcareAccess } from '@/hooks/usePermissions';
import { URGENCY_LEVEL_CONFIG } from '@/types/healthcare';
import { log } from '@/lib/core/debug/unified-logger';


export default function AlertEscalationQueueScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { user } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | '1' | '2' | '3'>('all');
  
  // Page transition
  const { animatedStyle } = useLayoutTransition({ 
    type: 'glass', 
    duration: 400,
    hapticFeedback: true 
  });
  
  // Permission checks
  const { canAcknowledgeAlerts } = useHealthcareAccess();
  
  // Hospital context validation
  const hospitalContext = useHospitalContext();
  const hospitalId = hospitalContext.hospitalId || user?.defaultHospitalId || user?.organizationId || '';
  
  // WebSocket integration for real-time updates
  useAlertWebSocket({
    hospitalId,
    enabled: !!hospitalId,
    showNotifications: true,
    onAlertEscalated: (event) => {
      log.info('Alert escalated - refreshing queue', 'ESCALATION_QUEUE', event);
      refetch();
    },
    onAlertAcknowledged: () => {
      log.info('Alert acknowledged - refreshing queue', 'ESCALATION_QUEUE');
      refetch();
    },
  });
  
  // Fetch escalated alerts
  const { data, isLoading, error, refetch } = api.healthcare.getActiveAlerts.useQuery(
    { hospitalId },
    {
      enabled: !!hospitalId,
      refetchInterval: 10000, // Refresh every 10 seconds
      select: (data) => {
        // Filter only escalated alerts
        return {
          ...data,
          alerts: data.alerts.filter(a => 
            a.currentEscalationTier > 1 && 
            a.status === 'active'
          ),
        };
      },
    }
  );
  
  // Filter alerts by urgency
  const filteredAlerts = useMemo(() => {
    if (!data?.alerts) return [];
    
    return data.alerts.filter(alert => {
      if (urgencyFilter === 'all') return true;
      return alert.urgencyLevel.toString() === urgencyFilter;
    });
  }, [data?.alerts, urgencyFilter]);
  
  // Group alerts by escalation tier
  const alertsByTier = useMemo(() => {
    const grouped: Record<number, typeof filteredAlerts> = {};
    
    filteredAlerts.forEach(alert => {
      const tier = alert.currentEscalationTier || 1;
      if (!grouped[tier]) grouped[tier] = [];
      grouped[tier].push(alert);
    });
    
    return grouped;
  }, [filteredAlerts]);
  
  // Calculate stats
  const stats = useMemo(() => ({
    total: filteredAlerts.length,
    tier2: alertsByTier[2]?.length || 0,
    tier3: alertsByTier[3]?.length || 0,
    tier4Plus: Object.entries(alertsByTier)
      .filter(([tier]) => parseInt(tier) >= 4)
      .reduce((sum, [_, alerts]) => sum + alerts.length, 0),
    averageResponseTime: '4m 30s', // This would come from real data
  }), [filteredAlerts, alertsByTier]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptic('light');
    try {
      await refetch();
      haptic('success');
    } catch {
      showErrorAlert('Failed to refresh alerts');
      haptic('error');
    }
    setRefreshing(false);
  }, [refetch]);
  
  const handleToggleAlert = useCallback((alertId: string) => {
    haptic('light');
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  }, []);
  
  const handleSelectAll = useCallback(() => {
    haptic('light');
    if (selectedAlerts.length === filteredAlerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map(a => a.id));
    }
  }, [selectedAlerts, filteredAlerts]);
  
  const acknowledgeMutation = api.healthcare.acknowledgeAlert.useMutation();
  
  const handleBulkAcknowledge = useCallback(async () => {
    if (selectedAlerts.length === 0 || !canAcknowledgeAlerts) return;
    
    haptic('medium');
    
    try {
      await Promise.all(
        selectedAlerts.map(alertId => 
          acknowledgeMutation.mutateAsync({
            alertId,
            notes: 'Bulk acknowledged from escalation queue',
          })
        )
      );
      
      showSuccessAlert(`${selectedAlerts.length} alerts acknowledged`);
      setSelectedAlerts([]);
      await refetch();
    } catch {
      showErrorAlert('Failed to acknowledge some alerts');
    }
  }, [selectedAlerts, canAcknowledgeAlerts, acknowledgeMutation, refetch]);
  
  
  if (isLoading && !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <VStack style={{ flex: 1 }} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={theme.primary} />
          <Text mt={4} colorTheme="mutedForeground">Loading escalation queue...</Text>
        </VStack>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Container>
          <VStack p={4} gap={4 as any} alignItems="center" justifyContent="center" style={{ flex: 1 }}>
            <Symbol name="exclamationmark.triangle" size="xl" color={theme.destructive} />
            <Text size="base" weight="semibold">Failed to Load Escalation Queue</Text>
            <Text colorTheme="mutedForeground" align="center">
              {error.message || 'An error occurred'}
            </Text>
            <Button onPress={() => refetch()} variant="outline">
              Try Again
            </Button>
          </VStack>
        </Container>
      </SafeAreaView>
    );
  }
  
  const tierColors = {
    2: '#f59e0b',
    3: '#ef4444',
    4: '#dc2626',
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Escalation Queue',
          headerBackTitle: 'Alerts',
          presentation: 'card',
          headerShown: false,
        }}
      />
      
      <AnimatedPageWrapper entering={pageEnteringAnimations.slideInUp} style={animatedStyle}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 , paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
              />
            }
          >
            <DashboardGrid>
              {/* Header with Stats */}
              <Widget size="full">
                <Animated.View entering={FadeInDown.delay(100)}>
                  <LinearGradient
                    colors={[theme.destructive + '20', theme.background]}
                    style={{ borderRadius: 16, overflow: 'hidden' }}
                  >
                    <Box p={4 as any}>
                      <VStack gap={3 as any}>
                        <HStack gap={2 as any} alignItems="center">
                          <Button
                            onPress={() => router.push('/(app)/(tabs)/alerts')}
                            variant="ghost"
                            size="icon"
                          >
                            <Symbol name="chevron.left" size={24} />
                          </Button>
                          <Text size="xl" weight="bold">Escalation Queue</Text>
                        </HStack>
                        <HStack justifyContent="space-between" alignItems="center">
                          <VStack gap={1 as any}>
                            <Text size="sm" colorTheme="mutedForeground">
                              Alerts requiring immediate attention
                            </Text>
                          </VStack>
                          {canAcknowledgeAlerts && selectedAlerts.length > 0 && (
                            <Button
                              size="default"
                              onPress={handleBulkAcknowledge}
                              style={{ backgroundColor: theme.destructive }}
                            >
                              <HStack gap={2 as any} alignItems="center">
                                <Symbol name="checkmark.circle.fill" size={16} color="white" />
                                <Text weight="semibold" style={{ color: 'white' }}>
                                  Acknowledge ({selectedAlerts.length})
                                </Text>
                              </HStack>
                            </Button>
                          )}
                        </HStack>
                        
                        <Separator />
                        
                        {/* Stats Row */}
                        <HStack gap={3 as any} flexWrap="wrap">
                          <VStack gap={1 as any} minWidth={80}>
                            <Text size="xs" color="muted">Total Escalated</Text>
                            <Text size="2xl" weight="bold">{stats.total}</Text>
                          </VStack>
                          <VStack gap={1 as any} minWidth={80}>
                            <Text size="xs" color="muted">Tier 2</Text>
                            <Text size="2xl" weight="bold" style={{ color: tierColors[2] }}>
                              {stats.tier2}
                            </Text>
                          </VStack>
                          <VStack gap={1 as any} minWidth={80}>
                            <Text size="xs" color="muted">Tier 3</Text>
                            <Text size="2xl" weight="bold" style={{ color: tierColors[3] }}>
                              {stats.tier3}
                            </Text>
                          </VStack>
                          <VStack gap={1 as any} minWidth={80}>
                            <Text size="xs" color="muted">Tier 4+</Text>
                            <Text size="2xl" weight="bold" style={{ color: tierColors[4] }}>
                              {stats.tier4Plus}
                            </Text>
                          </VStack>
                          <VStack gap={1 as any} minWidth={120}>
                            <Text size="xs" color="muted">Avg Response</Text>
                            <Text size="2xl" weight="bold">{stats.averageResponseTime}</Text>
                          </VStack>
                        </HStack>
                      </VStack>
                    </Box>
                  </LinearGradient>
                </Animated.View>
              </Widget>
              
              {/* Filter Tabs */}
              <Widget size="full">
                <Animated.View entering={FadeInDown.delay(200)}>
                  <HStack gap={2 as any}>
                    {['all', '1', '2', '3'].map((level) => (
                      <Pressable
                        key={level}
                        onPress={() => {
                          haptic('light');
                          setUrgencyFilter(level as any);
                        }}
                        style={{ flex: 1 }}
                      >
                        <View
                          style={{
                            backgroundColor: urgencyFilter === level 
                              ? theme.primary 
                              : theme.card,
                            borderRadius: 8,
                            paddingVertical: spacing[2] as any,
                            paddingHorizontal: spacing[3] as any,
                            borderWidth: 1,
                            borderColor: urgencyFilter === level 
                              ? theme.primary 
                              : theme.border,
                          }}
                        >
                          <Text
                            align="center"
                            size="sm"
                            weight="medium"
                            style={{ 
                              color: urgencyFilter === level 
                                ? 'white' 
                                : theme.foreground 
                            }}
                          >
                            {level === 'all' 
                              ? 'All Levels' 
                              : `Level ${level}`}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </HStack>
                </Animated.View>
              </Widget>
              
              {/* Select All Option */}
              {filteredAlerts.length > 0 && canAcknowledgeAlerts && (
                <Widget size="full">
                  <Animated.View entering={FadeInDown.delay(250)}>
                    <Pressable onPress={handleSelectAll}>
                      <HStack gap={3 as any} alignItems="center">
                        <Checkbox
                          checked={selectedAlerts.length === filteredAlerts.length}
                          onCheckedChange={handleSelectAll}
                        />
                        <Text size="sm" weight="medium">
                          Select all {filteredAlerts.length} alerts
                        </Text>
                      </HStack>
                    </Pressable>
                  </Animated.View>
                </Widget>
              )}
              
              {/* Alerts by Tier */}
              {Object.entries(alertsByTier)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([tier, alerts], groupIndex) => (
                  <Widget size="full" key={tier}>
                    <Animated.View entering={FadeInDown.delay(300 + groupIndex * 50)}>
                      <VStack gap={3 as any}>
                        {/* Tier Header */}
                        <HStack gap={2 as any} alignItems="center">
                          <View
                            style={{
                              width: 4,
                              height: 24,
                              backgroundColor: tierColors[parseInt(tier)] || theme.destructive,
                              borderRadius: 2,
                            }}
                          />
                          <Text size="base" weight="semibold">
                            Escalation Tier {tier}
                          </Text>
                          <Badge variant="error" size="sm">
                            {alerts.length} alerts
                          </Badge>
                        </HStack>
                        
                        {/* Alert Cards */}
                        <VStack gap={2 as any}>
                          {alerts.map((alert, index) => (
                            <Animated.View 
                              key={alert.id}
                              entering={SlideInRight.delay(350 + groupIndex * 50 + index * 25)}
                            >
                              <Pressable
                                onPress={() => handleToggleAlert(alert.id)}
                              >
                                <View
                                  style={{
                                    opacity: selectedAlerts.includes(alert.id) ? 0.9 : 1,
                                    transform: [{
                                      scale: selectedAlerts.includes(alert.id) ? 0.98 : 1,
                                    }],
                                  }}
                                >
                                  <GlassCard
                                    style={[
                                      selectedAlerts.includes(alert.id) && {
                                        borderColor: theme.primary,
                                        borderWidth: 2,
                                      }
                                    ] as any}
                                  >
                                    <Box p={3 as any}>
                                      <HStack gap={3 as any} alignItems="flex-start">
                                        {/* Selection Checkbox */}
                                        {canAcknowledgeAlerts && (
                                          <Checkbox
                                            checked={selectedAlerts.includes(alert.id)}
                                            onCheckedChange={() => handleToggleAlert(alert.id)}
                                          />
                                        )}
                                        
                                        {/* Alert Content */}
                                        <VStack gap={2 as any} style={{ flex: 1 }}>
                                          <HStack justifyContent="space-between" alignItems="flex-start">
                                            <VStack gap={1 as any}>
                                              <HStack gap={2 as any} alignItems="center">
                                                <Text weight="semibold" size="base">
                                                  Room {alert.roomNumber}
                                                </Text>
                                                <Badge
                                                  variant="outline"
                                                  size="sm"
                                                  style={{
                                                    borderColor: tierColors[parseInt(tier)] || theme.destructive,
                                                    backgroundColor: (tierColors[parseInt(tier)] || theme.destructive) + '10',
                                                  }}
                                                >
                                                  <Text size="xs" style={{ color: tierColors[parseInt(tier)] || theme.destructive }}>
                                                    {URGENCY_LEVEL_CONFIG[alert.urgencyLevel]?.label || `Level ${alert.urgencyLevel}`}
                                                  </Text>
                                                </Badge>
                                              </HStack>
                                              <Text size="sm" colorTheme="mutedForeground">
                                                {alert.alertType.replace(/_/g, ' ').toUpperCase()}
                                              </Text>
                                            </VStack>
                                            
                                            {/* Time in Tier */}
                                            <VStack gap={1 as any} alignItems="flex-end">
                                              <Text size="xs" color="muted">In tier for</Text>
                                              <Text size="sm" weight="semibold" style={{ color: tierColors[parseInt(tier)] || theme.destructive }}>
                                                {formatDistanceToNow(new Date(alert.createdAt))}
                                              </Text>
                                            </VStack>
                                          </HStack>
                                          
                                          {alert.description && (
                                            <Text size="sm" color="foreground" numberOfLines={2}>
                                              {alert.description}
                                            </Text>
                                          )}
                                          
                                          {/* Target Department */}
                                          {alert.targetDepartment && (
                                            <HStack gap={2 as any} alignItems="center">
                                              <Text size="xs" color="muted">Target department:</Text>
                                              <Badge variant="outline" size="sm">
                                                {alert.targetDepartment}
                                              </Badge>
                                            </HStack>
                                          )}
                                          
                                          {/* Next Escalation Timer */}
                                          {parseInt(tier) < 4 && (
                                            <HStack gap={2 as any} alignItems="center">
                                              <Symbol name="clock.arrow.circlepath" size="xs" color={theme.destructive} />
                                              <Text size="xs" colorTheme="destructive">
                                                Next escalation in 5 minutes
                                              </Text>
                                            </HStack>
                                          )}
                                        </VStack>
                                        
                                        {/* Quick Actions */}
                                        <VStack gap={1 as any}>
                                          <Pressable
                                            onPress={() => router.push(`/(app)/(tabs)/alerts/${alert.id}`)}
                                            style={{
                                              padding: spacing[2] as any,
                                              borderRadius: 8,
                                              backgroundColor: theme.card,
                                            }}
                                          >
                                            <Symbol name="arrow.right.circle" size="sm" color={theme.primary} />
                                          </Pressable>
                                        </VStack>
                                      </HStack>
                                    </Box>
                                  </GlassCard>
                                </View>
                              </Pressable>
                            </Animated.View>
                          ))}
                        </VStack>
                      </VStack>
                    </Animated.View>
                  </Widget>
                ))}
              
              {/* Empty State */}
              {filteredAlerts.length === 0 && (
                <Widget size="full">
                  <Animated.View entering={FadeInDown.delay(300)}>
                    <GlassCard>
                      <VStack gap={4 as any} alignItems="center" p={8}>
                        <Symbol name="checkmark.circle.fill" size="xl" color={theme.success} />
                        <VStack gap={2 as any} alignItems="center">
                          <Text size="base" weight="semibold">No Escalated Alerts</Text>
                          <Text colorTheme="mutedForeground" align="center">
                            {urgencyFilter === 'all' 
                              ? 'All alerts are being handled appropriately'
                              : `No Level ${urgencyFilter} alerts have been escalated`}
                          </Text>
                        </VStack>
                      </VStack>
                    </GlassCard>
                  </Animated.View>
                </Widget>
              )}
            </DashboardGrid>
          </ScrollView>
        </SafeAreaView>
      </AnimatedPageWrapper>
    </>
  );
}