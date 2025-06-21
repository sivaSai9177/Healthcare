import React, { useState, useMemo } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { Card } from '@/components/universal/display/Card';
import { Text } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout/Stack';
import { Badge } from '@/components/universal/display/Badge';
import { Button } from '@/components/universal/interaction/Button';
import { Select } from '@/components/universal/form/Select';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Target, 
  Calendar 
} from '@/components/universal/display/Symbols';
import { getResponsiveSpacing, getScreenSize } from '@/lib/design/responsive-spacing';
import { api } from '@/lib/api/trpc';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, type TooltipProps } from 'recharts';
import { useGlassTheme } from '@/lib/design/themes/glass-theme';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { EmptyState, SkeletonCard, SkeletonMetricCard } from '@/components/universal/feedback';

type TimeRange = '24h' | '7d' | '30d' | '90d';
type MetricView = 'overview' | 'response_times' | 'department' | 'shift' | 'alert_types';

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  secondary: '#6B7280',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
};

interface ResponseAnalyticsDashboardProps {
  hospitalId?: string;
  departmentId?: string;
}

export function ResponseAnalyticsDashboard({ hospitalId, departmentId }: ResponseAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [selectedView, setSelectedView] = useState<MetricView>('overview');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const screenSize = getScreenSize();
  const spacing = {
    scale: (value: number) => getResponsiveSpacing(value as any, screenSize),
  };
  const glassTheme = useGlassTheme();
  const glassContainer = (glassTheme as any).glassContainer || { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12 };

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = api.healthcare.getResponseAnalytics.useQuery({
    hospitalId,
    departmentId: selectedDepartment === 'all' ? undefined : selectedDepartment,
    timeRange,
  });

  const { data: departments } = api.healthcare.getDepartments.useQuery({
    hospitalId: hospitalId || undefined,
  });

  // Calculate date range
  const dateRange = useMemo(() => {
    const end = new Date();
    let start: Date;

    switch (timeRange) {
      case '24h':
        start = subDays(end, 1);
        break;
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      default:
        start = subDays(end, 7);
    }

    return { start: startOfDay(start), end: endOfDay(end) };
  }, [timeRange]);

  // Use analytics data or mock data
  const data = analyticsData || {
    overview: {
      totalAlerts: 0,
      averageResponseTime: 0,
      responseRate: 0,
      escalationRate: 0,
      acknowledgedAlerts: 0,
      resolvedAlerts: 0,
      activeAlerts: 0,
    },
    responseTimeTrend: [],
    departmentBreakdown: [],
    alertTypeDistribution: [],
  };

  // Mock additional data for demonstration
  const mockData = {
    shiftPerformance: [
      { shift: 'Morning', alerts: 145, avgResponseTime: 3.8, responseRate: 98.2 },
      { shift: 'Afternoon', alerts: 112, avgResponseTime: 4.2, responseRate: 95.8 },
      { shift: 'Night', alerts: 85, avgResponseTime: 4.8, responseRate: 94.1 },
    ],
    staffPerformance: [
      { name: 'Dr. Smith', role: 'Doctor', responseTime: 2.5, alertsHandled: 45 },
      { name: 'Nurse Johnson', role: 'Nurse', responseTime: 3.1, alertsHandled: 38 },
      { name: 'Dr. Williams', role: 'Doctor', responseTime: 3.3, alertsHandled: 42 },
      { name: 'Nurse Davis', role: 'Nurse', responseTime: 3.5, alertsHandled: 35 },
      { name: 'Dr. Brown', role: 'Doctor', responseTime: 3.8, alertsHandled: 39 },
    ],
  };

  // Add colors to department breakdown
  const departmentColors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];
  const departmentBreakdownWithColors = data.departmentBreakdown.map((dept, index) => ({
    ...dept,
    color: departmentColors[index % departmentColors.length],
  }));

  const renderMetricCard = (title: string, value: string | number, subtitle: string, trend?: number, icon?: React.ReactNode): React.ReactElement => (
    <Card style={[glassContainer, { minHeight: spacing.scale(120), padding: spacing.scale(3) }]}>
        <VStack gap={2 as any}>
          <HStack justify="between" align="center">
            <Text style={{ fontSize: 12, color: '#6B7280' }}>{title}</Text>
            {icon && <View style={{ opacity: 0.6 }}>{icon}</View>}
          </HStack>
          <Text style={{ fontSize: 24, fontWeight: '700' }}>{value}</Text>
          <HStack gap={2 as any} align="center">
            <Text style={{ fontSize: 12, color: '#6B7280' }}>{subtitle}</Text>
            {trend !== undefined && (
              <HStack gap={1 as any} align="center">
                {trend > 0 ? (
                  <TrendingUp size={14} color={COLORS.success} />
                ) : (
                  <TrendingDown size={14} color={COLORS.danger} />
                )}
                <Text style={{ fontSize: 12, color: trend > 0 ? COLORS.success : COLORS.danger }}>
                  {Math.abs(trend)}%
                </Text>
              </HStack>
            )}
          </HStack>
        </VStack>
    </Card>
  );

  const renderOverview = (): React.ReactElement => (
    <VStack gap={4 as any}>
      {/* Key Metrics */}
      <View style={{ 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: spacing.scale(3),
        marginHorizontal: -spacing.scale(1.5),
      }}>
        <View style={{ flex: 1, minWidth: 280, paddingHorizontal: spacing.scale(1.5) }}>
          {renderMetricCard(
            'Total Alerts',
            data.overview.totalAlerts,
            `${timeRange} period`,
            12,
            <AlertCircle size={20} color={COLORS.primary} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 280, paddingHorizontal: spacing.scale(1.5) }}>
          {renderMetricCard(
            'Avg Response Time',
            `${data.overview.averageResponseTime}m`,
            'All departments',
            -8,
            <Clock size={20} color={COLORS.warning} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 280, paddingHorizontal: spacing.scale(1.5) }}>
          {renderMetricCard(
            'Response Rate',
            `${data.overview.responseRate}%`,
            'Acknowledged alerts',
            5,
            <CheckCircle size={20} color={COLORS.success} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 280, paddingHorizontal: spacing.scale(1.5) }}>
          {renderMetricCard(
            'Escalation Rate',
            `${data.overview.escalationRate}%`,
            'Required escalation',
            -2,
            <TrendingUp size={20} color={COLORS.danger} />
          )}
        </View>
      </View>

      {/* Response Time Trend */}
      <Card style={[glassContainer, { padding: spacing.scale(4) }]}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: spacing.scale(3) }}>Response Time Trend</Text>
          <View style={{ height: 300, marginLeft: -20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.responseTimeTrend}>
                <defs>
                  <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  stroke="#6B7280"
                />
                <YAxis 
                  stroke="#6B7280"
                  label={{ value: 'Response Time (min)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #E5E7EB',
                    borderRadius: 8 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="avgTime" 
                  stroke={COLORS.primary} 
                  fillOpacity={1} 
                  fill="url(#colorTime)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </View>
      </Card>

      {/* Department Performance */}
      <HStack gap={3 as any} style={{ flexWrap: 'wrap' }}>
        <Card style={[glassContainer, { flex: 1, minWidth: 300, padding: spacing.scale(4) }]}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: spacing.scale(3) }}>Department Breakdown</Text>
            <View style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentBreakdownWithColors}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, alerts }: { name: string; alerts: number }) => `${name}: ${alerts}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="alerts"
                  >
                    {departmentBreakdownWithColors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </View>
        </Card>

        <Card style={[glassContainer, { flex: 1, minWidth: 300, padding: spacing.scale(4) }]}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: spacing.scale(3) }}>Top Performers</Text>
            <VStack gap={3 as any}>
              {mockData.staffPerformance.map((staff, index) => (
                <HStack key={index} justify="between" align="center">
                  <VStack gap={1 as any}>
                    <Text style={{ fontSize: 14, fontWeight: '600' }}>{staff.name}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>{staff.role}</Text>
                  </VStack>
                  <HStack gap={3 as any} align="center">
                    <Badge variant="secondary">
                      {staff.responseTime}m avg
                    </Badge>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                      {staff.alertsHandled} alerts
                    </Text>
                  </HStack>
                </HStack>
              ))}
            </VStack>
        </Card>
      </HStack>
    </VStack>
  );

  const renderResponseTimes = (): React.ReactElement => (
    <VStack gap={4 as any}>
      <Card style={[glassContainer, { padding: spacing.scale(4) }]}>
          <HStack justify="between" align="center" style={{ marginBottom: spacing.scale(3) }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Response Time Analysis</Text>
            <Select 
              value={selectedDepartment} 
              onValueChange={(value) => setSelectedDepartment(value as string)}
              options={[
                { value: 'all', label: 'All Departments' },
                ...(departments?.map((dept) => ({
                  value: dept.id,
                  label: dept.name,
                })) || [])
              ]}
              placeholder="All Departments"
            />
          </HStack>
          <View style={{ height: 400, marginLeft: -20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentBreakdownWithColors}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #E5E7EB',
                    borderRadius: 8 
                  }}
                />
                <Legend />
                <Bar dataKey="avgResponseTime" fill={COLORS.primary} name="Avg Response Time (min)" />
                <Bar dataKey="alerts" fill={COLORS.secondary} name="Total Alerts" />
              </BarChart>
            </ResponsiveContainer>
          </View>
      </Card>

      {/* Shift Performance Comparison */}
      <Card style={[glassContainer, { padding: spacing.scale(4) }]}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: spacing.scale(3) }}>Shift Performance</Text>
          <VStack gap={4}>
            {mockData.shiftPerformance.map((shift, index) => (
              <Animated.View
                key={shift.shift}
                entering={FadeInUp.delay(index * 100)}
                layout={Layout.springify()}
              >
                <VStack gap={2 as any}>
                  <HStack justify="between" align="center">
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{shift.shift}</Text>
                    <HStack gap={3 as any}>
                      <Badge variant="secondary">{shift.alerts} alerts</Badge>
                      <Badge variant={shift.responseRate > 95 ? 'success' : 'warning'}>
                        {shift.responseRate}% response rate
                      </Badge>
                    </HStack>
                  </HStack>
                  <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                    <View 
                      style={{ 
                        height: '100%', 
                        width: `${shift.responseRate}%`,
                        backgroundColor: shift.responseRate > 95 ? COLORS.success : COLORS.warning,
                      }} 
                    />
                  </View>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    Average response time: {shift.avgResponseTime} minutes
                  </Text>
                </VStack>
              </Animated.View>
            ))}
          </VStack>
      </Card>
    </VStack>
  );

  const renderContent = () => {
    switch (selectedView) {
      case 'overview':
        return renderOverview();
      case 'response_times':
        return renderResponseTimes();
      // Add more views as needed
      default:
        return renderOverview();
    }
  };

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.scale(4) }}
      showsVerticalScrollIndicator={false}
    >
      <VStack gap={4 as any}>
        {/* Header */}
        <Animated.View entering={FadeInDown}>
          <HStack justify="between" align="center" style={{ flexWrap: 'wrap', gap: spacing.scale(3) }}>
            <VStack gap={1 as any}>
              <Text style={{ fontSize: 24, fontWeight: '700' }}>Response Analytics</Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>
                Monitor and analyze alert response performance
              </Text>
            </VStack>
            
            <HStack gap={2 as any} align="center" style={{ flexWrap: 'wrap' }}>
              {/* View Selector */}
              <Select 
                value={selectedView} 
                onValueChange={(value) => setSelectedView(value as MetricView)}
                options={[
                  { value: 'overview', label: 'Overview' },
                  { value: 'response_times', label: 'Response Times' },
                  { value: 'department', label: 'By Department' },
                  { value: 'shift', label: 'By Shift' },
                  { value: 'alert_types', label: 'Alert Types' },
                ]}
                placeholder="Select view"
                style={{ minWidth: 150 }}
              />

              {/* Time Range Selector */}
              <HStack gap={1 as any}>
                {(['24h', '7d', '30d', '90d'] as TimeRange[]).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'ghost'}
                    size="sm"
                    onPress={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </HStack>

              <Button variant="outline" size="sm" onPress={() => refetch()}>
                Refresh
              </Button>
            </HStack>
          </HStack>
        </Animated.View>

        {/* Content */}
        {isLoading ? (
          <VStack gap={4 as any}>
            {/* Skeleton Metrics */}
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap', 
              gap: spacing.scale(3),
              marginHorizontal: -spacing.scale(1.5),
            }}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ flex: 1, minWidth: 280, paddingHorizontal: spacing.scale(1.5) }}>
                  <SkeletonMetricCard />
                </View>
              ))}
            </View>
            
            {/* Skeleton Charts */}
            <SkeletonCard style={{ height: 300 }} showAvatar={false} />
            
            <HStack gap={3 as any} style={{ flexWrap: 'wrap' }}>
              <View style={{ flex: 1, minWidth: 300 }}>
                <SkeletonCard style={{ height: 250 }} showAvatar={false} />
              </View>
              <View style={{ flex: 1, minWidth: 300 }}>
                <SkeletonCard showAvatar={false} />
              </View>
            </HStack>
          </VStack>
        ) : !analyticsData ? (
          <EmptyState 
            variant="error"
            title="Failed to Load Analytics"
            description="We couldn't fetch the analytics data. Please try again."
            actions={[
              {
                label: 'Retry',
                onPress: () => refetch(),
                variant: 'default' as const,
              }
            ]}
            fullHeight={false}
          />
        ) : (
          renderContent()
        )}
      </VStack>
    </ScrollView>
  );
}