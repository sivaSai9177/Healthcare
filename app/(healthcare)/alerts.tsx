import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { api } from '@/lib/api/trpc';
import {
  Text,
  Card,
  Button,
  Badge,
  VStack,
  HStack,
  Heading,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  EmptyState,
  Input,
  Select,
  SelectValue,
  SelectItem,
} from '@/components/universal';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Filter, Search } from '@/components/universal/Symbols';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { LoadingView } from '@/components/LoadingView';
import { format } from 'date-fns';

interface Alert {
  id: string;
  roomNumber: string;
  alertType: string;
  urgencyLevel: number;
  description?: string;
  status: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  escalationLevel: number;
  createdBy: {
    name: string;
    role: string;
  };
  acknowledgedBy?: {
    name: string;
    role: string;
  };
}

export default function AlertsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const theme = useTheme();
  const spacing = useSpacing();
  const [activeTab, setActiveTab] = useState('active');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Fetch alerts
  const { data: alerts = [], isLoading, refetch } = api.healthcare.getAlerts.useQuery({
    status: activeTab,
    search: searchQuery,
    urgencyLevel: urgencyFilter === 'all' ? undefined : parseInt(urgencyFilter),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getUrgencyColor = (level: number) => {
    switch (level) {
      case 1: return theme.destructive;
      case 2: return 'theme.destructive';
      case 3: return 'theme.warning';
      case 4: return '#74c0fc';
      case 5: return theme.muted;
      default: return theme.muted;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'cardiac_arrest':
      case 'code_blue':
        return <AlertCircle size={20} color={theme.destructive} />;
      case 'fire':
      case 'security':
        return <AlertCircle size={20} color="theme.destructive" />;
      default:
        return <AlertCircle size={20} color={theme.primary} />;
    }
  };

  const renderAlert = (alert: Alert) => (
    <Card
      key={alert.id}
      style={{ marginBottom: spacing.md }}
      onPress={() => router.push(`/(modals)/patient-details?alertId=${alert.id}`)}
    >
      <VStack space={spacing.sm}>
        <HStack space={spacing.md} style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <HStack space={spacing.sm} style={{ flex: 1, alignItems: 'center' }}>
            {getAlertIcon(alert.alertType)}
            <VStack space={spacing.xs} style={{ flex: 1 }}>
              <HStack space={spacing.xs} style={{ alignItems: 'center' }}>
                <Text style={{ fontWeight: '600' }}>Room {alert.roomNumber}</Text>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: getUrgencyColor(alert.urgencyLevel),
                    backgroundColor: getUrgencyColor(alert.urgencyLevel) + '20',
                  }}
                >
                  <Text style={{ color: getUrgencyColor(alert.urgencyLevel), fontSize: 12 }}>
                    Level {alert.urgencyLevel}
                  </Text>
                </Badge>
              </HStack>
              <Text style={{ color: theme.mutedForeground, fontSize: 14 }}>
                {alert.alertType.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </VStack>
          </HStack>
          
          {alert.status === 'acknowledged' ? (
            <CheckCircle size={20} color={theme.primary} />
          ) : alert.escalationLevel > 1 ? (
            <TrendingUp size={20} color={theme.destructive} />
          ) : (
            <Clock size={20} color={theme.mutedForeground} />
          )}
        </HStack>

        {alert.description && (
          <Text style={{ color: theme.mutedForeground, fontSize: 14 }}>
            {alert.description}
          </Text>
        )}

        <HStack space={spacing.md} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <VStack space={spacing.xs}>
            <Text style={{ fontSize: 12, color: theme.mutedForeground }}>
              Created by {alert.createdBy.name}
            </Text>
            <Text style={{ fontSize: 12, color: theme.mutedForeground }}>
              {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
            </Text>
          </VStack>
          
          {alert.acknowledgedBy && (
            <VStack space={spacing.xs} style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, color: theme.primary }}>
                Ack by {alert.acknowledgedBy.name}
              </Text>
              <Text style={{ fontSize: 12, color: theme.mutedForeground }}>
                {format(new Date(alert.acknowledgedAt!), 'h:mm a')}
              </Text>
            </VStack>
          )}
        </HStack>

        {alert.escalationLevel > 1 && (
          <Badge variant="destructive">
            <Text>Escalated to Level {alert.escalationLevel}</Text>
          </Badge>
        )}
      </VStack>
    </Card>
  );

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: spacing.lg }}
      >
        <VStack space={spacing.lg}>
          {/* Header */}
          <VStack space={spacing.md}>
            <Heading size="lg">Alert Management</Heading>
            
            {/* Search and Filter */}
            <HStack space={spacing.md}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  leftIcon={<Search size={20} />}
                />
              </View>
              <Select 
                value={urgencyFilter} 
                onValueChange={setUrgencyFilter}
                placeholder="Filter"
                style={{ width: 120 }}
                options={[
                  { value: "all", label: "All Levels" },
                  { value: "1", label: "Level 1" },
                  { value: "2", label: "Level 2" },
                  { value: "3", label: "Level 3" },
                  { value: "4", label: "Level 4" },
                  { value: "5", label: "Level 5" },
                ]}
              />
            </HStack>
          </VStack>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {alerts.length === 0 ? (
                <EmptyState
                  icon={<AlertCircle size={48} />}
                  title="No alerts found"
                  description="There are no alerts matching your criteria"
                />
              ) : (
                <VStack space={spacing.md}>
                  {alerts.map(renderAlert)}
                </VStack>
              )}
            </TabsContent>
          </Tabs>
        </VStack>
      </ScrollView>

      {/* Create Alert Button (Operator only) */}
      {user?.role === 'operator' && (
        <View style={{
          position: 'absolute',
          bottom: spacing.xl,
          right: spacing.xl,
        }}>
          <Button
            size="lg"
            onPress={() => router.push('/(modals)/create-alert')}
            style={{
              ...(Platform.OS === 'web' && {
                boxShadow: '0 4px 12px theme.mutedForeground + "10"',
              }),
            }}
          >
            Create Alert
          </Button>
        </View>
      )}
    </View>
  );
}