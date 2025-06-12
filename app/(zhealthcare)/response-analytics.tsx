import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Badge,
  Button,
  VStack,
  HStack,
  Container,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Progress,
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
  Activity,
  Clock,
  Users,
  AlertCircle,
  Calendar,
  Download,
  Filter,
  Target,
  Award,
} from '@/components/universal/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';

export default function ResponseAnalyticsScreen() {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [department, setDepartment] = useState('all');

  // Mock analytics data
  const responseTimeData = [
    { date: 'Mon', nurses: 85, doctors: 120, average: 102 },
    { date: 'Tue', nurses: 92, doctors: 115, average: 103 },
    { date: 'Wed', nurses: 78, doctors: 108, average: 93 },
    { date: 'Thu', nurses: 88, doctors: 125, average: 106 },
    { date: 'Fri', nurses: 95, doctors: 130, average: 112 },
    { date: 'Sat', nurses: 102, doctors: 140, average: 121 },
    { date: 'Sun', nurses: 98, doctors: 135, average: 116 },
  ];

  const alertDistribution = [
    { name: 'Cardiac', value: 35, color: '#EF4444' },
    { name: 'Medical', value: 28, color: '#F59E0B' },
    { name: 'Code Blue', value: 20, color: '#3B82F6' },
    { name: 'Security', value: 10, color: '#8B5CF6' },
    { name: 'Other', value: 7, color: '#6B7280' },
  ];

  const staffPerformance = [
    { name: 'Dr. Wilson', responded: 45, avgTime: 95 },
    { name: 'Dr. Chen', responded: 38, avgTime: 110 },
    { name: 'Nurse Sarah', responded: 52, avgTime: 75 },
    { name: 'Nurse Emily', responded: 48, avgTime: 82 },
    { name: 'Dr. Davis', responded: 41, avgTime: 105 },
  ];

  const hourlyActivity = [
    { hour: '00:00', alerts: 5 },
    { hour: '04:00', alerts: 3 },
    { hour: '08:00', alerts: 12 },
    { hour: '12:00', alerts: 18 },
    { hour: '16:00', alerts: 15 },
    { hour: '20:00', alerts: 10 },
  ];

  const kpiData = {
    avgResponseTime: 98,
    avgResponseChange: -12,
    acknowledgmentRate: 94,
    acknowledgmentChange: 5,
    escalationRate: 18,
    escalationChange: -3,
    resolutionTime: 23,
    resolutionChange: -8,
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
// TODO: Replace with structured logging - console.log('Exporting analytics...');
  };

  const MetricCard = ({ 
    title, 
    value, 
    unit, 
    change, 
    icon: Icon,
    target,
    variant = 'default' 
  }: {
    title: string;
    value: number | string;
    unit?: string;
    change?: number;
    icon: any;
    target?: number;
    variant?: 'default' | 'success' | 'warning' | 'danger';
  }) => {
    const isPositiveChange = change && change > 0;
    const metColor = 
      variant === 'success' ? theme.success :
      variant === 'warning' ? theme.warning :
      variant === 'danger' ? theme.destructive :
      theme.primary;

    return (
      <Card padding="md">
        <VStack spacing="sm">
          <HStack justify="between" align="center">
            <Text variant="caption" className="text-muted-foreground">
              {title}
            </Text>
            <Icon size={20} style={{ color: metColor }} />
          </HStack>
          
          <HStack spacing="xs" align="baseline">
            <Text variant="h4" weight="bold">
              {value}
            </Text>
            {unit && (
              <Text variant="body2" className="text-muted-foreground">
                {unit}
              </Text>
            )}
          </HStack>
          
          {change !== undefined && (
            <HStack spacing="xs" align="center">
              {isPositiveChange ? (
                <TrendingUp size={16} className="text-green-500" />
              ) : (
                <TrendingDown size={16} className="text-green-500" />
              )}
              <Text 
                variant="caption" 
                className={isPositiveChange ? 'text-red-500' : 'text-green-500'}
              >
                {Math.abs(change)}% from last {timeRange}
              </Text>
            </HStack>
          )}
          
          {target && (
            <VStack spacing="xs">
              <HStack justify="between">
                <Text variant="caption" className="text-muted-foreground">
                  Target: {target}{unit}
                </Text>
                <Text variant="caption" weight="medium">
                  {Math.round((Number(value) / target) * 100)}%
                </Text>
              </HStack>
              <Progress 
                value={(Number(value) / target) * 100} 
                className="h-1"
              />
            </VStack>
          )}
        </VStack>
      </Card>
    );
  };

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
              <Text variant="h3">Response Analytics</Text>
              <Text variant="body2" className="text-muted-foreground">
                Track team performance and response metrics
              </Text>
            </VStack>
            <Button
              variant="outline"
              size="sm"
              onPress={handleExport}
            >
              <Download size={16} />
              <Text>Export</Text>
            </Button>
          </HStack>

          {/* Filters */}
          <HStack spacing="md">
            <View className="flex-1">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <Calendar size={16} />
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </View>
            
            <View className="flex-1">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <Filter size={16} />
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="icu">ICU</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="pediatrics">Pediatrics</SelectItem>
                </SelectContent>
              </Select>
            </View>
          </HStack>

          {/* KPI Cards */}
          <Grid cols={2} spacing="md">
            <MetricCard
              title="Avg Response Time"
              value={kpiData.avgResponseTime}
              unit="sec"
              change={kpiData.avgResponseChange}
              icon={Clock}
              target={120}
              variant="success"
            />
            
            <MetricCard
              title="Acknowledgment Rate"
              value={kpiData.acknowledgmentRate}
              unit="%"
              change={kpiData.acknowledgmentChange}
              icon={Target}
              target={95}
              variant="success"
            />
            
            <MetricCard
              title="Escalation Rate"
              value={kpiData.escalationRate}
              unit="%"
              change={kpiData.escalationChange}
              icon={TrendingUp}
              variant="warning"
            />
            
            <MetricCard
              title="Resolution Time"
              value={kpiData.resolutionTime}
              unit="min"
              change={kpiData.resolutionChange}
              icon={Activity}
              target={30}
              variant="default"
            />
          </Grid>

          {/* Response Time Trends */}
          <Card padding="lg">
            <VStack spacing="md">
              <HStack justify="between" align="center">
                <Text variant="h5" weight="semibold">Response Time Trends</Text>
                <Badge variant="outline">{timeRange}</Badge>
              </HStack>
              
              <View className="h-48">
                <LineChart
                  data={responseTimeData}
                  categories={['nurses', 'doctors', 'average']}
                  index="date"
                  className="h-full"
                  colors={['#10B981', '#3B82F6', '#F59E0B']}
                />
              </View>
              
              <HStack spacing="lg" justify="center">
                <HStack spacing="xs" align="center">
                  <View className="w-3 h-3 bg-green-500 rounded-full" />
                  <Text variant="caption">Nurses</Text>
                </HStack>
                <HStack spacing="xs" align="center">
                  <View className="w-3 h-3 bg-blue-500 rounded-full" />
                  <Text variant="caption">Doctors</Text>
                </HStack>
                <HStack spacing="xs" align="center">
                  <View className="w-3 h-3 bg-amber-500 rounded-full" />
                  <Text variant="caption">Average</Text>
                </HStack>
              </HStack>
            </VStack>
          </Card>

          {/* Alert Distribution */}
          <HStack spacing="md">
            {/* Pie Chart */}
            <Card padding="lg" className="flex-1">
              <VStack spacing="md">
                <Text variant="h5" weight="semibold">Alert Types</Text>
                <View className="h-48">
                  <PieChart
                    data={alertDistribution}
                    dataKey="value"
                    nameKey="name"
                    className="h-full"
                  />
                </View>
                <VStack spacing="xs">
                  {alertDistribution.map((item) => (
                    <HStack key={item.name} spacing="sm" align="center">
                      <View 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <Text variant="caption" className="flex-1">
                        {item.name}
                      </Text>
                      <Text variant="caption" weight="medium">
                        {item.value}%
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </Card>

            {/* Hourly Activity */}
            <Card padding="lg" className="flex-1">
              <VStack spacing="md">
                <Text variant="h5" weight="semibold">Peak Hours</Text>
                <View className="h-48">
                  <BarChart
                    data={hourlyActivity}
                    categories={['alerts']}
                    index="hour"
                    className="h-full"
                    colors={['#3B82F6']}
                  />
                </View>
                <Text variant="caption" className="text-muted-foreground text-center">
                  Most alerts occur during shift changes
                </Text>
              </VStack>
            </Card>
          </HStack>

          {/* Staff Performance */}
          <Card padding="lg">
            <VStack spacing="md">
              <HStack justify="between" align="center">
                <Text variant="h5" weight="semibold">Top Responders</Text>
                <Badge variant="secondary">
                  <Award size={14} />
                  <Text>This {timeRange}</Text>
                </Badge>
              </HStack>
              
              <VStack spacing="sm">
                {staffPerformance.map((staff, index) => {
                  const isTopPerformer = index === 0;
                  return (
                    <Card 
                      key={staff.name} 
                      padding="sm" 
                      className={isTopPerformer ? 'border-yellow-500' : ''}
                    >
                      <HStack spacing="md" align="center">
                        <Text variant="h6" className="w-8 text-center">
                          {index + 1}
                        </Text>
                        
                        <VStack spacing="xs" className="flex-1">
                          <HStack spacing="sm" align="center">
                            <Text variant="body1" weight="medium">
                              {staff.name}
                            </Text>
                            {isTopPerformer && (
                              <Award size={16} className="text-yellow-500" />
                            )}
                          </HStack>
                          <Progress 
                            value={(staff.responded / 60) * 100} 
                            className="h-2"
                          />
                        </VStack>
                        
                        <VStack spacing="xs" align="end">
                          <Text variant="body2" weight="semibold">
                            {staff.responded} alerts
                          </Text>
                          <Text variant="caption" className="text-muted-foreground">
                            Avg: {staff.avgTime}s
                          </Text>
                        </VStack>
                      </HStack>
                    </Card>
                  );
                })}
              </VStack>
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
                <HStack spacing="sm" align="start">
                  <Text>•</Text>
                  <Text variant="body2">
                    Response times improved by 12% this week, exceeding target by 18 seconds
                  </Text>
                </HStack>
                <HStack spacing="sm" align="start">
                  <Text>•</Text>
                  <Text variant="body2">
                    Cardiac alerts show fastest response (avg 75s) while Medical emergencies lag (avg 125s)
                  </Text>
                </HStack>
                <HStack spacing="sm" align="start">
                  <Text>•</Text>
                  <Text variant="body2">
                    Night shift maintains 95% acknowledgment rate despite 30% fewer staff
                  </Text>
                </HStack>
                <HStack spacing="sm" align="start">
                  <Text>•</Text>
                  <Text variant="body2">
                    Consider additional coverage during 12-4 PM peak hours
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>
        </VStack>
      </Container>
    </ScrollView>
  );
}