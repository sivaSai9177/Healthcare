import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Text,
  Card,
  Button,
  VStack,
  HStack,
  Container,
  Badge,
  Select,
  SelectValue,
  SelectItem,
  Grid,
} from '@/components/universal';
import { 
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
} from '@/components/universal/charts';
import { 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Activity,
} from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';

export default function ReportsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { spacing } = useSpacing();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [reportType, setReportType] = useState('overview');

  // Mock data for charts
  const productivityData = [
    { date: 'Mon', value: 75 },
    { date: 'Tue', value: 82 },
    { date: 'Wed', value: 78 },
    { date: 'Thu', value: 85 },
    { date: 'Fri', value: 88 },
    { date: 'Sat', value: 72 },
    { date: 'Sun', value: 68 },
  ];

  const taskDistribution = [
    { name: 'Completed', value: 45, color: theme.success },
    { name: 'In Progress', value: 23, color: theme.primary },
    { name: 'Todo', value: 18, color: '#6b7280' },
    { name: 'Overdue', value: 5, color: '#ef4444' },
  ];

  const teamPerformance = [
    { name: 'Sarah', completed: 12, assigned: 15 },
    { name: 'Mike', completed: 10, assigned: 12 },
    { name: 'Emily', completed: 8, assigned: 10 },
    { name: 'James', completed: 14, assigned: 14 },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh report data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon,
    trend = 'up' 
  }: {
    title: string;
    value: string | number;
    change: string;
    icon: any;
    trend?: 'up' | 'down';
  }) => (
    <Card padding="md">
      <VStack spacing="sm">
        <HStack justify="between" align="center">
          <Text variant="body2" className="text-muted-foreground">
            {title}
          </Text>
          <Icon size={20} className="text-muted-foreground" />
        </HStack>
        <Text variant="h4">{value}</Text>
        <HStack spacing="xs" align="center">
          {trend === 'up' ? (
            <TrendingUp size={16} className="text-green-500" />
          ) : (
            <TrendingDown size={16} className="text-red-500" />
          )}
          <Text 
            variant="caption" 
            className={trend === 'up' ? 'text-green-500' : 'text-red-500'}
          >
            {change} from last {timeRange}
          </Text>
        </HStack>
      </VStack>
    </Card>
  );

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
          <HStack justify="between" align="center">
            <VStack spacing="xs">
              <Text variant="h3">Team Reports</Text>
              <Text variant="body2" className="text-muted-foreground">
                Performance metrics and analytics
              </Text>
            </VStack>
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                // Export report
              }}
            >
              <Download size={16} />
              <Text>Export</Text>
            </Button>
          </HStack>

          {/* Filters */}
          <HStack spacing="md">
            <View className="flex-1">
              <Select 
                value={timeRange} 
                onValueChange={setTimeRange}
                placeholder="Time range"
                options={[
                  { value: "today", label: "Today" },
                  { value: "week", label: "This Week" },
                  { value: "month", label: "This Month" },
                  { value: "quarter", label: "This Quarter" },
                  { value: "year", label: "This Year" },
                ]}
              />
            </View>
            
            <View className="flex-1">
              <Select 
                value={reportType} 
                onValueChange={setReportType}
                placeholder="Report type"
                options={[
                  { value: "overview", label: "Overview" },
                  { value: "productivity", label: "Productivity" },
                  { value: "tasks", label: "Tasks" },
                  { value: "individual", label: "Individual" },
                ]}
              />
            </View>
          </HStack>

          {/* Key Metrics */}
          <Grid cols={2} spacing="md">
            <MetricCard
              title="Total Tasks"
              value="91"
              change="+12%"
              icon={CheckCircle}
              trend="up"
            />
            <MetricCard
              title="Completion Rate"
              value="78%"
              change="+5%"
              icon={Activity}
              trend="up"
            />
            <MetricCard
              title="Avg Response Time"
              value="2.5h"
              change="-15%"
              icon={Clock}
              trend="up"
            />
            <MetricCard
              title="Team Productivity"
              value="85%"
              change="+8%"
              icon={TrendingUp}
              trend="up"
            />
          </Grid>

          {/* Productivity Chart */}
          <Card padding="lg">
            <VStack spacing="md">
              <HStack justify="between" align="center">
                <Text variant="h5" weight="semibold">Productivity Trend</Text>
                <Badge variant="outline">{timeRange}</Badge>
              </HStack>
              <View className="h-48">
                <AreaChart
                  data={productivityData}
                  dataKey="value"
                  xAxisKey="date"
                  className="h-full"
                  colors={['#3b82f6']}
                />
              </View>
            </VStack>
          </Card>

          {/* Task Distribution */}
          <Card padding="lg">
            <VStack spacing="md">
              <Text variant="h5" weight="semibold">Task Distribution</Text>
              <HStack spacing="lg" align="center">
                <View className="h-48 flex-1">
                  <PieChart
                    data={taskDistribution}
                    dataKey="value"
                    nameKey="name"
                    className="h-full"
                  />
                </View>
                <VStack spacing="sm">
                  {taskDistribution.map((item) => (
                    <HStack key={item.name} spacing="sm" align="center">
                      <View 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <Text variant="body2">{item.name}</Text>
                      <Text variant="body2" weight="semibold" className="ml-2">
                        {item.value}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </HStack>
            </VStack>
          </Card>

          {/* Team Performance */}
          <Card padding="lg">
            <VStack spacing="md">
              <Text variant="h5" weight="semibold">Team Performance</Text>
              <View className="h-48">
                <BarChart
                  data={teamPerformance}
                  categories={['completed', 'assigned']}
                  index="name"
                  className="h-full"
                  colors={['#10b981', '#6b7280']}
                />
              </View>
              <HStack spacing="lg" justify="center">
                <HStack spacing="sm" align="center">
                  <View className="w-3 h-3 bg-green-500 rounded-full" />
                  <Text variant="body2">Completed</Text>
                </HStack>
                <HStack spacing="sm" align="center">
                  <View className="w-3 h-3 bg-gray-400 rounded-full" />
                  <Text variant="body2">Assigned</Text>
                </HStack>
              </HStack>
            </VStack>
          </Card>

          {/* Insights */}
          <Card padding="lg" className="bg-blue-50 dark:bg-blue-950">
            <VStack spacing="md">
              <HStack spacing="sm" align="center">
                <Activity size={20} className="text-blue-500" />
                <Text variant="h5" weight="semibold">Key Insights</Text>
              </HStack>
              <VStack spacing="sm">
                <Text variant="body2">
                  • Team productivity increased by 8% this week
                </Text>
                <Text variant="body2">
                  • James has a 100% task completion rate
                </Text>
                <Text variant="body2">
                  • Average response time improved by 15%
                </Text>
                <Text variant="body2">
                  • 5 tasks are currently overdue and need attention
                </Text>
              </VStack>
            </VStack>
          </Card>

          {/* Actions */}
          <VStack spacing="md">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onPress={() => router.push('/(modals)/schedule-report')}
            >
              Schedule Automated Reports
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onPress={() => router.push('/(modals)/custom-report')}
            >
              Create Custom Report
            </Button>
          </VStack>
        </VStack>
      </Container>
    </ScrollView>
  );
}