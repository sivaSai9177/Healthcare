import React, { useState, useMemo } from 'react';
import { View, ScrollView, RefreshControl, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Text,
  Card,
  Badge,
  Button,
  Input,
  VStack,
  HStack,
  Container,
  Select,
  SelectValue,
  SelectItem,
  Grid,
} from '@/components/universal';
import { 
  Symbol,
  Calendar,
  Filter,
  AlertCircle,
  TrendingUp,
  FileText,
  History
} from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';
import { api } from '@/lib/api/trpc';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LoadingView } from '@/components/universal/feedback';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ALERT_TYPE_CONFIG, URGENCY_LEVEL_CONFIG } from '@/types/healthcare';
import { DatePicker } from '@/components/universal/form';

interface AlertHistoryItem {
  id: string;
  patientName: string;
  roomNumber: string;
  alertType: string;
  urgencyLevel: number;
  status: 'resolved' | 'acknowledged' | 'escalated' | 'expired';
  createdAt: Date;
  resolvedAt?: Date;
  responseTime: number; // seconds
  acknowledgedBy: string[];
  escalationCount: number;
  resolutionNote?: string;
}

export default function AlertHistoryScreen() {
  const router = useRouter();
  const { spacing } = useSpacing();
  const theme = useTheme();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Calculate date range based on selection
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return {
          startDate: startOfDay(now),
          endDate: endOfDay(now),
        };
      case 'yesterday':
        return {
          startDate: startOfDay(subDays(now, 1)),
          endDate: endOfDay(subDays(now, 1)),
        };
      case 'week':
        return {
          startDate: startOfDay(subDays(now, 7)),
          endDate: endOfDay(now),
        };
      case 'month':
        return {
          startDate: startOfDay(subDays(now, 30)),
          endDate: endOfDay(now),
        };
      case 'custom':
        return {
          startDate: customStartDate || startOfDay(subDays(now, 7)),
          endDate: customEndDate || endOfDay(now),
        };
      default:
        return {
          startDate: startOfDay(now),
          endDate: endOfDay(now),
        };
    }
  }, [dateRange, customStartDate, customEndDate]);

  // Fetch alert history using tRPC
  const { 
    data: alertHistoryData, 
    isLoading, 
    refetch 
  } = api.healthcare.getAlertHistory.useQuery({
    hospitalId: user?.organizationId || user?.hospitalId || '',
    startDate,
    endDate,
    limit: 100,
    offset: 0,
  }, {
    enabled: !!(user?.organizationId || user?.hospitalId),
  });

  // Mock data for fallback if needed
  const mockAlerts: AlertHistoryItem[] = [
    {
      id: '1',
      patientName: 'John Doe',
      roomNumber: '205A',
      alertType: 'Cardiac Arrest',
      urgencyLevel: 1,
      status: 'resolved',
      createdAt: new Date(Date.now() - 2 * 60 * 60000),
      resolvedAt: new Date(Date.now() - 1.5 * 60 * 60000),
      responseTime: 45,
      acknowledgedBy: ['Dr. Wilson', 'Nurse Sarah'],
      escalationCount: 1,
      resolutionNote: 'Patient stabilized, transferred to ICU',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      roomNumber: '312B',
      alertType: 'Medical Emergency',
      urgencyLevel: 2,
      status: 'acknowledged',
      createdAt: new Date(Date.now() - 30 * 60000),
      responseTime: 120,
      acknowledgedBy: ['Dr. Chen'],
      escalationCount: 0,
    },
    {
      id: '3',
      patientName: 'Bob Johnson',
      roomNumber: '108',
      alertType: 'Code Blue',
      urgencyLevel: 1,
      status: 'escalated',
      createdAt: new Date(Date.now() - 4 * 60 * 60000),
      responseTime: 180,
      acknowledgedBy: ['Nurse Davis'],
      escalationCount: 2,
    },
  ];

  // Transform API data to match our interface
  const alerts: AlertHistoryItem[] = useMemo(() => {
    if (!alertHistoryData?.alerts) return mockAlerts;
    
    return alertHistoryData.alerts.map(alert => ({
      id: alert.id,
      patientName: alert.patientName || 'Unknown Patient',
      roomNumber: alert.roomNumber,
      alertType: alert.alertType,
      urgencyLevel: alert.urgencyLevel,
      status: alert.status as 'resolved' | 'acknowledged' | 'escalated' | 'expired',
      createdAt: new Date(alert.createdAt),
      resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined,
      responseTime: alert.acknowledgedAt 
        ? Math.floor((new Date(alert.acknowledgedAt).getTime() - new Date(alert.createdAt).getTime()) / 1000)
        : 0,
      acknowledgedBy: alert.acknowledgedBy ? [alert.acknowledgedBy] : [],
      escalationCount: alert.currentEscalationTier || 0,
      resolutionNote: alert.description,
    }));
  }, [alertHistoryData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleExport = () => {
    // Export functionality
// TODO: Replace with structured logging - console.log('Exporting alert history...');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Symbol name="checkmark.circle.fill" size={16} color={theme.emerald} />;
      case 'acknowledged':
        return <Symbol name="clock.fill" size={16} color={theme.blue} />;
      case 'escalated':
        return <Symbol name="arrow.up.right.circle.fill" size={16} color={theme.yellow} />;
      case 'expired':
        return <Symbol name="xmark.circle.fill" size={16} color={theme.destructive} />;
      default:
        return <Symbol name="exclamationmark.circle.fill" size={16} color={theme.muted} />;
    }
  };

  const getStatusBadgeVariant = (status: string): any => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'acknowledged':
        return 'default';
      case 'escalated':
        return 'secondary';
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatResponseTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getResponseTimeColor = (seconds: number) => {
    if (seconds < 120) return theme.success; // Under 2 minutes
    if (seconds < 300) return theme.warning; // Under 5 minutes
    return theme.destructive; // Over 5 minutes
  };

  // Calculate statistics
  const stats = {
    total: alerts.length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    avgResponseTime: Math.round(alerts.reduce((sum, a) => sum + a.responseTime, 0) / alerts.length),
    escalationRate: Math.round((alerts.filter(a => a.escalationCount > 0).length / alerts.length) * 100),
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.alertType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || alert.urgencyLevel.toString() === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  if (isLoading && !refreshing) {
    return <LoadingView message="Loading alert history..." />;
  }

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
              <Text variant="h3">Alert History</Text>
              <Text variant="body2" className="text-muted-foreground">
                Review past alerts and response metrics
              </Text>
            </VStack>
            <Button
              variant="outline"
              size="sm"
              onPress={handleExport}
            >
              <Symbol name="arrow.down.circle.fill" size={16} color={theme.foreground} />
              <Text>Export</Text>
            </Button>
          </HStack>

          {/* Statistics */}
          <Grid cols={4} spacing="md">
            <Card padding="md">
              <VStack spacing="xs">
                <Text variant="caption" className="text-muted-foreground">
                  Total Alerts
                </Text>
                <Text variant="h5" weight="bold">
                  {stats.total}
                </Text>
              </VStack>
            </Card>
            
            <Card padding="md">
              <VStack spacing="xs">
                <Text variant="caption" className="text-muted-foreground">
                  Resolved
                </Text>
                <Text variant="h5" weight="bold" className="text-green-500">
                  {stats.resolved}
                </Text>
              </VStack>
            </Card>
            
            <Card padding="md">
              <VStack spacing="xs">
                <Text variant="caption" className="text-muted-foreground">
                  Avg Response
                </Text>
                <Text variant="h5" weight="bold">
                  {formatResponseTime(stats.avgResponseTime)}
                </Text>
              </VStack>
            </Card>
            
            <Card padding="md">
              <VStack spacing="xs">
                <Text variant="caption" className="text-muted-foreground">
                  Escalation Rate
                </Text>
                <Text variant="h5" weight="bold" className="text-yellow-500">
                  {stats.escalationRate}%
                </Text>
              </VStack>
            </Card>
          </Grid>

          {/* Filters */}
          <VStack spacing="md">
            <Input
              placeholder="Search by patient, room, or alert type..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="w-full"
              icon={<Symbol name="magnifyingglass" size={16} color={theme.mutedForeground} />}
            />
            
            <HStack spacing="md">
              <View className="flex-1">
                <Select 
                  value={dateRange} 
                  onValueChange={setDateRange}
                  placeholder="Date range"
                  options={[
                    { value: "today", label: "Today" },
                    { value: "yesterday", label: "Yesterday" },
                    { value: "week", label: "This Week" },
                    { value: "month", label: "This Month" },
                    { value: "custom", label: "Custom Range" },
                  ]}
                />
              </View>
              
              <View className="flex-1">
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                  placeholder="Status"
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "resolved", label: "Resolved" },
                    { value: "acknowledged", label: "Acknowledged" },
                    { value: "escalated", label: "Escalated" },
                    { value: "expired", label: "Expired" },
                  ]}
                />
              </View>
              
              <View className="flex-1">
                <Select 
                  value={urgencyFilter} 
                  onValueChange={setUrgencyFilter}
                  placeholder="Urgency"
                  options={[
                    { value: "all", label: "All Levels" },
                    { value: "1", label: "Level 1 - Critical" },
                    { value: "2", label: "Level 2 - High" },
                    { value: "3", label: "Level 3 - Medium" },
                    { value: "4", label: "Level 4 - Low" },
                    { value: "5", label: "Level 5 - Info" },
                  ]}
                />
              </View>
            </HStack>

            {/* Custom Date Range Pickers */}
            {dateRange === 'custom' && (
              <HStack spacing="md" align="center">
                <View className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Symbol name="calendar" size={16} />
                    <Text>{customStartDate ? format(customStartDate, 'MMM dd, yyyy') : 'Start Date'}</Text>
                  </Button>
                </View>
                
                <Text variant="caption" className="text-muted-foreground">to</Text>
                
                <View className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Symbol name="calendar" size={16} />
                    <Text>{customEndDate ? format(customEndDate, 'MMM dd, yyyy') : 'End Date'}</Text>
                  </Button>
                </View>
              </HStack>
            )}
          </VStack>

          {/* Alert History List */}
          <VStack spacing="md">
            {filteredAlerts.map((alert) => (
              <Pressable
                key={alert.id}
                onPress={() => router.push(`/(modals)/alert-details?id=${alert.id}`)}
              >
                <Card padding="md" className="active:scale-[0.99]">
                  <VStack spacing="sm">
                    {/* Alert Header */}
                    <HStack justify="between" align="start">
                      <HStack spacing="sm" align="center">
                        {getStatusIcon(alert.status)}
                        <VStack spacing="xs">
                          <Text variant="body1" weight="semibold">
                            {alert.alertType}
                          </Text>
                          <Text variant="caption" className="text-muted-foreground">
                            {alert.patientName} • Room {alert.roomNumber}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <VStack spacing="xs" align="end">
                        <Badge variant={getStatusBadgeVariant(alert.status)} size="sm">
                          {alert.status}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          Level {alert.urgencyLevel}
                        </Badge>
                      </VStack>
                    </HStack>

                    {/* Response Metrics */}
                    <HStack spacing="lg">
                      <VStack spacing="xs">
                        <Text variant="caption" className="text-muted-foreground">
                          Response Time
                        </Text>
                        <Text 
                          variant="body2" 
                          weight="medium"
                          style={{ color: getResponseTimeColor(alert.responseTime) }}
                        >
                          {formatResponseTime(alert.responseTime)}
                        </Text>
                      </VStack>
                      
                      <VStack spacing="xs">
                        <Text variant="caption" className="text-muted-foreground">
                          Created
                        </Text>
                        <Text variant="body2">
                          {alert.createdAt.toLocaleTimeString()}
                        </Text>
                      </VStack>
                      
                      {alert.resolvedAt && (
                        <VStack spacing="xs">
                          <Text variant="caption" className="text-muted-foreground">
                            Resolved
                          </Text>
                          <Text variant="body2">
                            {alert.resolvedAt.toLocaleTimeString()}
                          </Text>
                        </VStack>
                      )}
                      
                      {alert.escalationCount > 0 && (
                        <VStack spacing="xs">
                          <Text variant="caption" className="text-muted-foreground">
                            Escalations
                          </Text>
                          <HStack spacing="xs" align="center">
                            <TrendingUp size={14} className="text-yellow-500" />
                            <Text variant="body2" className="text-yellow-500">
                              {alert.escalationCount}
                            </Text>
                          </HStack>
                        </VStack>
                      )}
                    </HStack>

                    {/* Acknowledgments */}
                    {alert.acknowledgedBy.length > 0 && (
                      <HStack spacing="sm" wrap>
                        {alert.acknowledgedBy.map((person, index) => (
                          <Badge key={index} variant="outline" size="sm">
                            {person}
                          </Badge>
                        ))}
                      </HStack>
                    )}

                    {/* Resolution Note */}
                    {alert.resolutionNote && (
                      <Card padding="sm" className="bg-muted/50">
                        <HStack spacing="sm" align="start">
                          <FileText size={14} className="text-muted-foreground mt-0.5" />
                          <Text variant="caption" className="flex-1">
                            {alert.resolutionNote}
                          </Text>
                        </HStack>
                      </Card>
                    )}
                  </VStack>
                </Card>
              </Pressable>
            ))}
          </VStack>

          {/* Empty State */}
          {filteredAlerts.length === 0 && (
            <Card padding="xl" className="items-center">
              <VStack spacing="md" align="center">
                <History size={48} className="text-muted-foreground" />
                <Text variant="body1" className="text-muted-foreground">
                  No alerts found
                </Text>
                <Text variant="caption" className="text-muted-foreground text-center">
                  Try adjusting your filters or date range
                </Text>
              </VStack>
            </Card>
          )}
        </VStack>
      </Container>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DatePicker
          value={customStartDate || new Date()}
          onChange={(date) => {
            setShowStartDatePicker(false);
            if (date) {
              setCustomStartDate(date);
            }
          }}
          onClose={() => setShowStartDatePicker(false)}
        />
      )}

      {showEndDatePicker && (
        <DatePicker
          value={customEndDate || new Date()}
          onChange={(date) => {
            setShowEndDatePicker(false);
            if (date) {
              setCustomEndDate(date);
            }
          }}
          onClose={() => setShowEndDatePicker(false)}
        />
      )}
    </ScrollView>
  );
}