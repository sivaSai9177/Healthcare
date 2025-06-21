import React, { useState } from 'react';
import { ScrollView, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme/provider';
import {
  Text,
  Card,
  Badge,
  Button,
  VStack,
  HStack,
  Container,
  Select,
  Progress,
  Grid,
  Box,
} from '@/components/universal';
import { Symbol } from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';

export default function ResponseAnalyticsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [department, setDepartment] = useState('all');


  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh analytics data
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Mock analytics data
  const analyticsData = {
    summary: {
      totalAlerts: 245,
      avgResponseTime: 3.2,
      resolvedPercentage: 92,
      activeAlerts: 12,
    },
    trends: {
      responseTime: [
        { date: '1/10', value: 2.8 },
        { date: '1/11', value: 3.1 },
        { date: '1/12', value: 2.9 },
        { date: '1/13', value: 3.5 },
        { date: '1/14', value: 3.2 },
        { date: '1/15', value: 2.7 },
        { date: '1/16', value: 3.2 },
      ],
      alertVolume: [
        { date: '1/10', value: 32 },
        { date: '1/11', value: 41 },
        { date: '1/12', value: 38 },
        { date: '1/13', value: 45 },
        { date: '1/14', value: 29 },
        { date: '1/15', value: 35 },
        { date: '1/16', value: 25 },
      ],
    },
    byDepartment: [
      { name: 'Emergency', alerts: 89, avgResponse: 2.1 },
      { name: 'ICU', alerts: 67, avgResponse: 2.8 },
      { name: 'General Ward', alerts: 54, avgResponse: 4.2 },
      { name: 'Pediatrics', alerts: 35, avgResponse: 3.5 },
    ],
    byUrgency: [
      { level: 'Critical', count: 45, percentage: 18 },
      { level: 'High', count: 78, percentage: 32 },
      { level: 'Medium', count: 122, percentage: 50 },
    ],
  };

  const content = (
    <VStack gap={4 as any}>
      {/* Header */}
      <HStack justifyContent="space-between" alignItems="center">
        <HStack alignItems="center" gap={2 as any}>
          <Button
            onPress={() => router.back()}
            variant="ghost"
            size="icon"
          >
            <Symbol name="chevron.left" size={24} />
          </Button>
          <VStack gap={1 as any}>
            <Text size="2xl" weight="bold">Response Analytics</Text>
            <Text size="sm" colorTheme="mutedForeground">
              Alert response performance metrics
            </Text>
          </VStack>
        </HStack>
        <Button
          variant="outline"
          size="sm"
          onPress={() => {
            // Export analytics
          }}
        >
          <Symbol name="arrow.down.circle" size={16} />
          <Text>Export</Text>
        </Button>
      </HStack>

      {/* Filters */}
      <HStack gap={2 as any}>
        <Box style={{ flex: 1 }}>
          <Select 
            value={timeRange} 
            onValueChange={(value) => setTimeRange(value as string)}
            options={[
              { label: "Today", value: "today" },
              { label: "Last 7 Days", value: "week" },
              { label: "Last 30 Days", value: "month" },
              { label: "Last 3 Months", value: "quarter" }
            ]}
          />
        </Box>
        <Box style={{ flex: 1 }}>
          <Select 
            value={department} 
            onValueChange={(value) => setDepartment(value as string)}
            options={[
              { label: "All Departments", value: "all" },
              { label: "Emergency", value: "emergency" },
              { label: "ICU", value: "icu" },
              { label: "General Ward", value: "general" },
              { label: "Pediatrics", value: "pediatrics" }
            ]}
          />
        </Box>
      </HStack>

      {/* Summary Cards */}
      <Grid columns={2} gap={3 as any}>
        <Card>
          <Box p={4 as any}>
            <VStack gap={2 as any}>
              <HStack justifyContent="space-between" alignItems="center">
                <Symbol name="exclamationmark.triangle" size={20} className="text-primary" />
                <Badge variant="outline" size="sm">
                  +12% vs last period
                </Badge>
              </HStack>
              <Text size="2xl" weight="bold">{analyticsData.summary.totalAlerts}</Text>
              <Text size="sm" colorTheme="mutedForeground">Total Alerts</Text>
            </VStack>
          </Box>
        </Card>

        <Card>
          <Box p={4 as any}>
            <VStack gap={2 as any}>
              <HStack justifyContent="space-between" alignItems="center">
                <Symbol name="clock" size={20} className="text-primary" />
                <Badge variant="success" size="sm">
                  -8% vs last period
                </Badge>
              </HStack>
              <Text size="2xl" weight="bold">{analyticsData.summary.avgResponseTime}m</Text>
              <Text size="sm" colorTheme="mutedForeground">Avg Response</Text>
            </VStack>
          </Box>
        </Card>

        <Card>
          <Box p={4 as any}>
            <VStack gap={2 as any}>
              <HStack justifyContent="space-between" alignItems="center">
                <Symbol name="checkmark.circle" size={20} className="text-success" />
                <Badge variant="success" size="sm">
                  +3% vs last period
                </Badge>
              </HStack>
              <Text size="2xl" weight="bold">{analyticsData.summary.resolvedPercentage}%</Text>
              <Text size="sm" colorTheme="mutedForeground">Resolved</Text>
            </VStack>
          </Box>
        </Card>

        <Card>
          <Box p={4 as any}>
            <VStack gap={2 as any}>
              <HStack justifyContent="space-between" alignItems="center">
                <Symbol name="waveform" size={20} className="text-warning" />
                <Badge variant="secondary" size="sm">
                  {`${analyticsData.summary.activeAlerts} active`}
                </Badge>
              </HStack>
              <Text size="2xl" weight="bold">{analyticsData.summary.activeAlerts}</Text>
              <Text size="sm" colorTheme="mutedForeground">Active Now</Text>
            </VStack>
          </Box>
        </Card>
      </Grid>

      {/* Department Performance */}
      <Card>
        <Box p={4 as any}>
          <VStack gap={3 as any}>
            <Text weight="semibold">Department Performance</Text>
            {analyticsData.byDepartment.map((dept) => (
              <VStack key={dept.name} gap={2 as any}>
                <HStack justifyContent="space-between">
                  <Text size="sm">{dept.name}</Text>
                  <HStack gap={2 as any}>
                    <Badge variant="outline" size="sm">{`${dept.alerts} alerts`}</Badge>
                    <Text size="sm" colorTheme="mutedForeground">{dept.avgResponse}m avg</Text>
                  </HStack>
                </HStack>
                <Progress value={(dept.alerts / analyticsData.summary.totalAlerts) * 100} />
              </VStack>
            ))}
          </VStack>
        </Box>
      </Card>

      {/* Urgency Distribution */}
      <Card>
        <Box p={4 as any}>
          <VStack gap={3 as any}>
            <Text weight="semibold">Alert Urgency Distribution</Text>
            {analyticsData.byUrgency.map((urgency) => {
              const variant = urgency.level === 'Critical' ? 'destructive' : 
                             urgency.level === 'High' ? 'warning' : 'secondary';
              return (
                <HStack key={urgency.level} justifyContent="space-between" alignItems="center">
                  <HStack gap={2 as any} alignItems="center">
                    <Badge variant={variant as any} size="sm">{urgency.level}</Badge>
                    <Text size="sm">{`${urgency.count} alerts`}</Text>
                  </HStack>
                  <Text size="sm" colorTheme="mutedForeground">{urgency.percentage}%</Text>
                </HStack>
              );
            })}
          </VStack>
        </Box>
      </Card>
    </VStack>
  );

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing[4] as any, paddingBottom: spacing[6] as any }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <VStack p={4} gap={4 as any}>
          {content}
        </VStack>
      </ScrollView>
    </Container>
  );
}