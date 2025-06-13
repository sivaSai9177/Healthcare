import React, { useState } from 'react';
import { ScrollView, View, Platform, RefreshControl } from 'react-native';
import { useSpacing } from '@/hooks/core/useSpacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useBreakpoint } from '@/hooks/responsive/useBreakpoint';
import {
  Card,
  Text,
  Button,
  Badge,
  Stack,
  Grid,
  Progress,
  Tabs,
  Select,
} from '@/components/universal';
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  ChartContainer,
} from '@/components/universal/charts';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/provider';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const metrics: MetricCard[] = [
  {
    title: 'Total Users',
    value: '1,234',
    change: 12.5,
    icon: 'people',
    color: '#3b82f6',
  },
  {
    title: 'Active Sessions',
    value: '456',
    change: -5.2,
    icon: 'pulse',
    color: '#10b981',
  },
  {
    title: 'Alerts Created',
    value: '789',
    change: 23.1,
    icon: 'notifications',
    color: '#f59e0b',
  },
  {
    title: 'Response Time',
    value: '2.3s',
    change: -15.7,
    icon: 'time',
    color: '#8b5cf6',
  },
];

// Mock data for charts
const generateTimeSeriesData = (days: number) => {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: Math.floor(Math.random() * 100) + 50,
      alerts: Math.floor(Math.random() * 50) + 20,
      sessions: Math.floor(Math.random() * 200) + 100,
    });
  }
  return data;
};

const departmentData = [
  { name: 'Emergency', value: 35, color: '#ef4444' },
  { name: 'ICU', value: 25, color: '#3b82f6' },
  { name: 'Surgery', value: 20, color: '#10b981' },
  { name: 'Pediatrics', value: 12, color: '#f59e0b' },
  { name: 'Other', value: 8, color: '#8b5cf6' },
];

const responseTimeData = [
  { hour: '00:00', time: 2.1 },
  { hour: '04:00', time: 1.8 },
  { hour: '08:00', time: 3.2 },
  { hour: '12:00', time: 2.7 },
  { hour: '16:00', time: 3.5 },
  { hour: '20:00', time: 2.3 },
];

export default function AnalyticsScreen() {
  const theme = useTheme();
  const spacing = useSpacing();
  const breakpoint = useBreakpoint();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const isDesktop = breakpoint === 'lg' || breakpoint === 'xl';
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');

  const timeSeriesData = generateTimeSeriesData(
    selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const exportData = () => {
    // Mock export functionality
// TODO: Replace with structured logging - console.log('Exporting analytics data...');
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xl * 2,
        }}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {/* Header */}
        <Stack space="lg" style={{ marginBottom: spacing.xl }}>
          <Stack
            direction={isDesktop ? 'horizontal' : 'vertical'}
            space="md"
            style={{
              alignItems: isDesktop ? 'center' : 'stretch',
              justifyContent: 'space-between',
            }}
          >
            <Stack space="sm">
              <Text variant="heading" size="2xl">
                Analytics Dashboard
              </Text>
              <Text variant="muted">
                Monitor your organization&apos;s performance and usage
              </Text>
            </Stack>

            <Stack direction="horizontal" space="sm">
              <Select
                value={selectedPeriod}
                onValueChange={setSelectedPeriod}
                options={[
                  { label: 'Last 7 days', value: '7d' },
                  { label: 'Last 30 days', value: '30d' },
                  { label: 'Last 90 days', value: '90d' },
                ]}
              />
              <Button
                variant="outline"
                onPress={exportData}
                leftIcon={<Ionicons name="download-outline" size={20} />}
              >
                Export
              </Button>
            </Stack>
          </Stack>
        </Stack>

        {/* Metrics Cards */}
        <Grid columns={isDesktop ? 4 : 2} gap={spacing.md} style={{ marginBottom: spacing.xl }}>
          {metrics.map((metric, index) => (
            <Card key={index} style={{ padding: spacing.lg }}>
              <Stack space="sm">
                <Stack direction="horizontal" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: metric.color + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={metric.icon} size={24} color={metric.color} />
                  </View>
                  <Badge
                    variant={metric.change > 0 ? 'success' : 'destructive'}
                    size="sm"
                  >
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </Badge>
                </Stack>
                <Text variant="muted" size="sm">
                  {metric.title}
                </Text>
                <Text variant="heading" size="xl">
                  {metric.value}
                </Text>
              </Stack>
            </Card>
          ))}
        </Grid>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <Tabs.List>
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="users">Users</Tabs.Trigger>
            <Tabs.Trigger value="performance">Performance</Tabs.Trigger>
            <Tabs.Trigger value="departments">Departments</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview">
            <Stack space="lg" style={{ marginTop: spacing.lg }}>
              {/* Activity Chart */}
              <Card style={{ padding: spacing.lg }}>
                <Stack space="md">
                  <Text variant="heading" size="lg">
                    Activity Overview
                  </Text>
                  <ChartContainer height={300}>
                    <AreaChart
                      data={timeSeriesData}
                      categories={['users', 'alerts', 'sessions']}
                      index="date"
                      colors={['#3b82f6', '#10b981', '#f59e0b']}
                    />
                  </ChartContainer>
                </Stack>
              </Card>

              {/* Department Distribution */}
              <Grid columns={isDesktop ? 2 : 1} gap={spacing.lg}>
                <Card style={{ padding: spacing.lg }}>
                  <Stack space="md">
                    <Text variant="heading" size="lg">
                      Department Distribution
                    </Text>
                    <ChartContainer height={250}>
                      <PieChart data={departmentData} />
                    </ChartContainer>
                  </Stack>
                </Card>

                {/* Response Times */}
                <Card style={{ padding: spacing.lg }}>
                  <Stack space="md">
                    <Text variant="heading" size="lg">
                      Average Response Time
                    </Text>
                    <ChartContainer height={250}>
                      <LineChart
                        data={responseTimeData}
                        categories={['time']}
                        index="hour"
                        colors={['#8b5cf6']}
                      />
                    </ChartContainer>
                  </Stack>
                </Card>
              </Grid>
            </Stack>
          </Tabs.Content>

          <Tabs.Content value="users">
            <Card style={{ padding: spacing.lg, marginTop: spacing.lg }}>
              <Stack space="lg">
                <Text variant="heading" size="lg">
                  User Activity
                </Text>
                <ChartContainer height={300}>
                  <BarChart
                    data={timeSeriesData}
                    categories={['users']}
                    index="date"
                    colors={['#3b82f6']}
                  />
                </ChartContainer>
                <Grid columns={isDesktop ? 3 : 1} gap={spacing.md}>
                  <Stack space="xs">
                    <Text variant="muted" size="sm">
                      Daily Active Users
                    </Text>
                    <Text variant="heading" size="xl">
                      342
                    </Text>
                  </Stack>
                  <Stack space="xs">
                    <Text variant="muted" size="sm">
                      Weekly Active Users
                    </Text>
                    <Text variant="heading" size="xl">
                      1,056
                    </Text>
                  </Stack>
                  <Stack space="xs">
                    <Text variant="muted" size="sm">
                      Monthly Active Users
                    </Text>
                    <Text variant="heading" size="xl">
                      1,234
                    </Text>
                  </Stack>
                </Grid>
              </Stack>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="performance">
            <Stack space="lg" style={{ marginTop: spacing.lg }}>
              <Card style={{ padding: spacing.lg }}>
                <Stack space="md">
                  <Text variant="heading" size="lg">
                    System Performance
                  </Text>
                  <Stack space="lg">
                    <Stack space="sm">
                      <Stack direction="horizontal" style={{ justifyContent: 'space-between' }}>
                        <Text variant="muted">API Response Time</Text>
                        <Text>145ms</Text>
                      </Stack>
                      <Progress value={14.5} max={100} />
                    </Stack>
                    <Stack space="sm">
                      <Stack direction="horizontal" style={{ justifyContent: 'space-between' }}>
                        <Text variant="muted">Database Query Time</Text>
                        <Text>23ms</Text>
                      </Stack>
                      <Progress value={23} max={100} />
                    </Stack>
                    <Stack space="sm">
                      <Stack direction="horizontal" style={{ justifyContent: 'space-between' }}>
                        <Text variant="muted">Cache Hit Rate</Text>
                        <Text>87%</Text>
                      </Stack>
                      <Progress value={87} max={100} />
                    </Stack>
                    <Stack space="sm">
                      <Stack direction="horizontal" style={{ justifyContent: 'space-between' }}>
                        <Text variant="muted">Uptime</Text>
                        <Text>99.9%</Text>
                      </Stack>
                      <Progress value={99.9} max={100} />
                    </Stack>
                  </Stack>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Content>

          <Tabs.Content value="departments">
            <Card style={{ padding: spacing.lg, marginTop: spacing.lg }}>
              <Stack space="lg">
                <Text variant="heading" size="lg">
                  Department Activity
                </Text>
                {departmentData.map((dept, index) => (
                  <Stack key={index} space="sm">
                    <Stack direction="horizontal" style={{ justifyContent: 'space-between' }}>
                      <Stack direction="horizontal" space="sm" style={{ alignItems: 'center' }}>
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: dept.color,
                          }}
                        />
                        <Text>{dept.name}</Text>
                      </Stack>
                      <Text variant="muted">{dept.value}%</Text>
                    </Stack>
                    <Progress value={dept.value} max={100} />
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Tabs.Content>
        </Tabs>
      </ScrollView>
    </View>
  );
}