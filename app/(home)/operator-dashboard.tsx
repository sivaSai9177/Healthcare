import React, { useState } from 'react';
import { Platform, ScrollView, RefreshControl, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Redirect } from 'expo-router';
import { 
  Container, 
  VStack, 
  HStack,
  Text, 
  Card, 
  Button,
  Box,
  Badge,
  Separator,
} from '@/components/universal';
import { 
  AlertCreationFormEnhanced, 
  AlertList
} from '@/components/blocks/healthcare';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useSpacing } from '@/lib/stores/spacing-store';
import { log } from '@/lib/core/debug/logger';
import { api } from '@/lib/api/trpc';
import { haptic } from '@/lib/ui/haptics';
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';

// Constants for better spacing (golden ratio inspired)
const GOLDEN_RATIO = 1.618;

export default function OperatorDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { spacing } = useSpacing();
  const [refreshing, setRefreshing] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const shadowLg = useShadow({ size: 'lg' });
  
  // Check if user is an operator
  if (!user || user.role !== 'operator') {
    log.warn('Non-operator tried to access operator dashboard', 'OPERATOR_DASHBOARD', { 
      userId: user?.id, 
      role: user?.role 
    });
    return <Redirect href="/(home)/" />;
  }
  
  // For demo, use a placeholder hospital ID
  const hospitalId = 'f155b026-01bd-4212-94f3-e7aedef2801d';
  
  // Fetch hospital statistics - simplified version without real-time stats
  const { data: alerts, refetch } = api.healthcare.getActiveAlerts.useQuery(
    { hospitalId },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  
  const toggleAlertForm = () => {
    haptic('light');
    setShowAlertForm(!showAlertForm);
  };
  
  // Calculate stats from alerts
  const alertsData = alerts?.alerts || [];
  const activeAlerts = alertsData.filter(a => a.status === 'active').length || 0;
  const acknowledgedAlerts = alertsData.filter(a => a.status === 'acknowledged').length || 0;
  const criticalAlerts = alertsData.filter(a => a.urgencyLevel <= 2 && a.status === 'active').length || 0;
  
  const isMobile = Platform.OS !== 'web';
  
  const content = (
    <VStack gap={isMobile ? spacing[6] : spacing[8]}>
      {/* Mobile Header */}
      {isMobile && (
        <Card 
          style={{ 
            backgroundColor: theme.card,
            marginHorizontal: -spacing[4],
            marginTop: -spacing[4],
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            borderRadius: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}
        >
          <HStack justify="between" align="center">
            <VStack gap={spacing[1]}>
              <Text weight="semibold" size="md">{user.name || 'Operator'}</Text>
              <Text size="xs" colorTheme="mutedForeground">{user.email}</Text>
            </VStack>
            <Pressable
              onPress={() => {
                haptic('light');
                router.push('/(home)/settings');
              }}
            >
              <Text size="2xl">⚙️</Text>
            </Pressable>
          </HStack>
        </Card>
      )}
      {/* Header Section */}
      <VStack gap={spacing[4]}>
        <HStack 
          justify="between" 
          align={isMobile ? "start" : "center"}
          style={isMobile ? { flexDirection: 'column', gap: spacing[3] } : {}}
        >
          <VStack gap={spacing[2]} style={isMobile ? { flex: 1 } : {}}>
            <HStack gap={spacing[3]} align="center">
              <Text size={isMobile ? "3xl" : "4xl"}>🚨</Text>
              <Text size={isMobile ? "2xl" : "3xl"} weight="bold">
                {isMobile ? "Alert Center" : "Emergency Alert Center"}
              </Text>
            </HStack>
            <Text size={isMobile ? "sm" : "lg"} colorTheme="mutedForeground">
              {isMobile ? "Dispatch emergency alerts" : "Dispatch alerts to medical staff across the hospital"}
            </Text>
          </VStack>
          <Badge 
            variant="error" 
            size={isMobile ? "md" : "lg"}
            style={{
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[2],
              alignSelf: isMobile ? 'flex-start' : 'center',
            }}
          >
            <HStack gap={spacing[2]} align="center">
              <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#ffffff',
                opacity: 0.9,
              }} />
              <Text weight="semibold" size={isMobile ? "xs" : "sm"} style={{ color: '#ffffff' }}>
                {isMobile ? "OPERATOR" : "OPERATOR MODE"}
              </Text>
            </HStack>
          </Badge>
        </HStack>
      </VStack>
      
      {/* Live Statistics Cards */}
      <View style={{ 
        flexDirection: 'row', 
        gap: isMobile ? spacing[3] : spacing[4], 
        flexWrap: 'wrap' 
      }}>
        {/* Active Alerts Card */}
        <Animated.View 
          entering={isMobile ? FadeInDown.delay(100).springify() : FadeIn}
          style={{ flex: 1 }}
        >
          <Card 
            style={{ 
              minWidth: isMobile ? 100 : 150,
              borderTopWidth: 3,
              borderTopColor: theme.destructive || '#ef4444',
            }}
          >
            <VStack gap={spacing[2]} p={isMobile ? spacing[4] : spacing[5]}>
              <HStack justify="between" align="center">
                <Text size={isMobile ? "xs" : "sm"} colorTheme="mutedForeground">
                  Active
                </Text>
                <Badge variant="error" size="sm">
                  <Text size="xs" style={{ color: '#ffffff' }}>LIVE</Text>
                </Badge>
              </HStack>
              <Text 
                size={isMobile ? "3xl" : "4xl"} 
                weight="bold" 
                style={{ color: theme.destructive || '#ef4444' }}
              >
                {activeAlerts}
              </Text>
              {criticalAlerts > 0 && (
                <Text size="xs" colorTheme="destructive">
                  {criticalAlerts} critical
                </Text>
              )}
            </VStack>
          </Card>
        </Animated.View>
        
        {/* In Progress Card */}
        <Animated.View 
          entering={isMobile ? FadeInDown.delay(200).springify() : FadeIn}
          style={{ flex: 1 }}
        >
          <Card 
            style={{ 
              minWidth: isMobile ? 100 : 150,
              borderTopWidth: 3,
              borderTopColor: theme.warning || '#f59e0b',
            }}
          >
            <VStack gap={spacing[2]} p={isMobile ? spacing[4] : spacing[5]}>
              <Text size={isMobile ? "xs" : "sm"} colorTheme="mutedForeground">
                In Progress
              </Text>
              <Text 
                size={isMobile ? "3xl" : "4xl"} 
                weight="bold" 
                style={{ color: theme.warning || '#f59e0b' }}
              >
                {acknowledgedAlerts}
              </Text>
              <Text size="xs" colorTheme="mutedForeground">
                Handled
              </Text>
            </VStack>
          </Card>
        </Animated.View>
        
        {/* Total Alerts Card */}
        <Animated.View 
          entering={isMobile ? FadeInDown.delay(300).springify() : FadeIn}
          style={{ flex: 1 }}
        >
          <Card 
            style={{ 
              minWidth: isMobile ? 100 : 150,
              borderTopWidth: 3,
              borderTopColor: theme.primary || '#0ea5e9',
            }}
          >
            <VStack gap={spacing[2]} p={isMobile ? spacing[4] : spacing[5]}>
              <Text size={isMobile ? "xs" : "sm"} colorTheme="mutedForeground">
                Total
              </Text>
              <Text 
                size={isMobile ? "3xl" : "4xl"} 
                weight="bold" 
                style={{ color: theme.primary || '#0ea5e9' }}
              >
                {(alerts?.alerts.length || 0)}
              </Text>
              <Text size="xs" colorTheme="mutedForeground">
                Today
              </Text>
            </VStack>
          </Card>
        </Animated.View>
      </View>
      
      {/* Alert Creation Section */}
      <VStack gap={spacing[4]}>
        <HStack 
          justify="between" 
          align={isMobile ? "start" : "center"}
          style={isMobile ? { flexDirection: 'column', gap: spacing[3] } : {}}
        >
          <VStack gap={spacing[1]}>
            <Text size={isMobile ? "lg" : "xl"} weight="bold">
              Create Emergency Alert
            </Text>
            <Text size={isMobile ? "xs" : "sm"} colorTheme="mutedForeground">
              {isMobile ? "Dispatch to medical staff" : "Dispatch alerts to all available medical staff"}
            </Text>
          </VStack>
          <Button
            variant={showAlertForm ? "secondary" : "error"}
            size={isMobile ? "sm" : "md"}
            onPress={toggleAlertForm}
            style={{
              minWidth: isMobile ? 120 : 140,
              alignSelf: isMobile ? 'stretch' : 'center',
            }}
          >
            {showAlertForm ? 'Hide Form' : '🚨 New Alert'}
          </Button>
        </HStack>
        
        {showAlertForm && (
          <Animated.View 
            entering={FadeInDown.springify()}
            exiting={FadeOut}
          >
            <Card
              style={{
                borderWidth: isMobile ? 1 : 2,
                borderColor: theme.destructive || '#ef4444',
                borderStyle: 'dashed',
                marginHorizontal: isMobile ? -spacing[1] : 0,
              }}
            >
              <AlertCreationFormEnhanced 
                hospitalId={hospitalId} 
                embedded={true}
                onSuccess={() => {
                  setShowAlertForm(false);
                  refetch();
                }}
              />
            </Card>
          </Animated.View>
        )}
      </VStack>
      
      {!isMobile && <Separator />}
      
      {/* Active Alerts List */}
      <VStack gap={spacing[4]}>
        <HStack 
          justify="between" 
          align={isMobile ? "start" : "center"}
          style={isMobile ? { flexDirection: 'column', gap: spacing[3] } : {}}
        >
          <VStack gap={spacing[1]}>
            <HStack gap={spacing[2]} align="center">
              <Text size={isMobile ? "lg" : "xl"} weight="bold">
                Active Alerts
              </Text>
              {activeAlerts > 0 && (
                <Badge variant="error" size={isMobile ? "sm" : "md"}>
                  <Text size="xs" weight="bold" style={{ color: '#ffffff' }}>
                    {activeAlerts}
                  </Text>
                </Badge>
              )}
            </HStack>
            <Text size={isMobile ? "xs" : "sm"} colorTheme="mutedForeground">
              {isMobile ? "Monitor emergency alerts" : "Monitor and track all emergency alerts"}
            </Text>
          </VStack>
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.push('/(home)/healthcare-dashboard')}
            style={{
              alignSelf: isMobile ? 'stretch' : 'center',
            }}
          >
            {isMobile ? 'Full Dashboard' : 'View Full Dashboard →'}
          </Button>
        </HStack>
        
        <AlertList 
          hospitalId={hospitalId} 
          role="operator"
          maxHeight={isMobile ? 400 : 600}
        />
      </VStack>
      
      {/* Quick Actions */}
      <Card style={{ backgroundColor: theme.muted }}>
        <VStack gap={spacing[3]} p={isMobile ? spacing[4] : spacing[5]}>
          <Text weight="semibold" size={isMobile ? "md" : "lg"}>Quick Actions</Text>
          <VStack gap={spacing[2]}>
            <Button
              variant="outline"
              size={isMobile ? "md" : "sm"}
              onPress={() => router.push('/(home)/healthcare-dashboard')}
              style={{ width: '100%' }}
            >
              <HStack gap={spacing[2]} align="center">
                <Text>📊</Text>
                <Text>{isMobile ? 'Analytics' : 'View Analytics'}</Text>
              </HStack>
            </Button>
            <HStack gap={spacing[2]}>
              <Button
                variant="outline"
                size={isMobile ? "md" : "sm"}
                onPress={() => log.info('Test alert triggered', 'OPERATOR_DASHBOARD')}
                style={{ flex: 1 }}
              >
                <HStack gap={spacing[1]} align="center">
                  <Text>🧪</Text>
                  <Text>{isMobile ? 'Test' : 'Test Alert'}</Text>
                </HStack>
              </Button>
              <Button
                variant="outline"
                size={isMobile ? "md" : "sm"}
                onPress={() => log.info('History viewed', 'OPERATOR_DASHBOARD')}
                style={{ flex: 1 }}
              >
                <HStack gap={spacing[1]} align="center">
                  <Text>📜</Text>
                  <Text>History</Text>
                </HStack>
              </Button>
            </HStack>
          </VStack>
        </VStack>
      </Card>
    </VStack>
  );
  
  // Mobile view
  if (Platform.OS !== 'web') {
    const SafeAreaView = require('react-native-safe-area-context').SafeAreaView;
    
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing[20] }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <VStack p={spacing[4]} gap={spacing[5]}>
            {content}
          </VStack>
        </ScrollView>
        
        {/* Floating Action Button for Mobile */}
        <Pressable
          onPress={() => {
            haptic('medium');
            router.push('/(modals)/create-alert');
          }}
          style={[
            {
              position: 'absolute',
              bottom: spacing[6],
              right: spacing[4],
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: theme.destructive || '#ef4444',
              justifyContent: 'center',
              alignItems: 'center',
            },
            shadowLg,
          ]}
        >
          <Text size="2xl">🚨</Text>
        </Pressable>
      </SafeAreaView>
    );
  }
  
  // Web view
  return (
    <Container 
      maxWidth="7xl" 
      style={{ flex: 1 }}
      scroll={true}
      scrollProps={{
        refreshControl: (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        ),
        contentContainerStyle: { paddingBottom: spacing[8] },
      }}
    >
      <VStack p={spacing[8]} gap={spacing[6]}>
        {content}
      </VStack>
    </Container>
  );
}