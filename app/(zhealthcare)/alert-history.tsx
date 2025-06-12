import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
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
  SelectTrigger,
  SelectValue,
  SelectContent,
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
} from '@/components/universal/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';

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
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Mock data - replace with tRPC query
  const [alerts] = useState<AlertHistoryItem[]>([
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
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh history
    setTimeout(() => setRefreshing(false), 1000);
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
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <Calendar size={16} />
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </View>
              
              <View className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter size={16} />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </View>
              
              <View className="flex-1">
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger>
                    <AlertCircle size={16} />
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="1">Level 1 - Critical</SelectItem>
                    <SelectItem value="2">Level 2 - High</SelectItem>
                    <SelectItem value="3">Level 3 - Medium</SelectItem>
                    <SelectItem value="4">Level 4 - Low</SelectItem>
                    <SelectItem value="5">Level 5 - Info</SelectItem>
                  </SelectContent>
                </Select>
              </View>
            </HStack>
          </VStack>

          {/* Alert History List */}
          <VStack spacing="md">
            {filteredAlerts.map((alert) => (
              <Pressable
                key={alert.id}
                onPress={() => router.push(`/(zmodals)/alert-details?id=${alert.id}`)}
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
    </ScrollView>
  );
}