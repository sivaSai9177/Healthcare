import React, { useState } from 'react';
import { ScrollView, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme/provider';
import { api } from '@/lib/api/trpc';
import {
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Box,
  Badge,
  Input,
  Select,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { AlertItem } from '@/components/blocks/healthcare';
import { Symbol } from '@/components/universal/display/Symbols';

export default function AlertHistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  
  const hospitalId = user?.organizationId || 'demo-hospital';
  
  const { data, refetch } = api.healthcare.getAlertHistory.useQuery(
    { 
      hospitalId,
      startDate: timeRange === '24h' ? new Date(Date.now() - 24 * 60 * 60 * 1000) : 
                 timeRange === '7d' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) :
                 timeRange === '30d' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) :
                 new Date(0),
      endDate: new Date(),
    },
    { enabled: !!user }
  );
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  
  const filteredAlerts = data?.alerts.filter(alert => {
    if (searchQuery && !alert.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];
  
  const content = (
    <VStack gap={4 as any}>
      {/* Header */}
      <HStack alignItems="center" gap={2 as any}>
        <Button
          onPress={() => router.back()}
          variant="ghost"
          size="icon"
        >
          <Symbol name="chevron.left" size={24} />
        </Button>
        <Text size="xl" weight="bold">Alert History</Text>
      </HStack>
      
      {/* Stats */}
      <HStack gap={3 as any}>
        <Card style={{ flex: 1 }}>
          <Box p={3 as any}>
            <VStack gap={1 as any} alignItems="center">
              <Text size="2xl" weight="bold">{data?.total || 0}</Text>
              <Text size="sm" colorTheme="mutedForeground">Total Alerts</Text>
            </VStack>
          </Box>
        </Card>
        <Card style={{ flex: 1 }}>
          <Box p={3 as any}>
            <VStack gap={1 as any} alignItems="center">
              <Text size="2xl" weight="bold">{data?.alerts?.filter(a => a.resolved).length || 0}</Text>
              <Text size="sm" colorTheme="mutedForeground">Resolved</Text>
            </VStack>
          </Box>
        </Card>
        <Card style={{ flex: 1 }}>
          <Box p={3 as any}>
            <VStack gap={1 as any} alignItems="center">
              <Text size="2xl" weight="bold">
                {'--'}
              </Text>
              <Text size="sm" colorTheme="mutedForeground">Avg Response</Text>
            </VStack>
          </Box>
        </Card>
      </HStack>
      
      {/* Filters */}
      <Card>
        <Box p={3 as any}>
          <VStack gap={3 as any}>
            <Input
              placeholder="Search by room..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Symbol name="magnifyingglass" size={20} color={theme.mutedForeground} />}
            />
            <Select 
              value={timeRange} 
              onValueChange={(value) => setTimeRange(value as string)}
              options={[
                { label: "Last 24 Hours", value: "24h" },
                { label: "Last 7 Days", value: "7d" },
                { label: "Last 30 Days", value: "30d" },
                { label: "All Time", value: "all" }
              ]}
            />
          </VStack>
        </Box>
      </Card>
      
      {/* Alert List */}
      <VStack gap={3 as any}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text weight="semibold">Historical Alerts</Text>
          <Badge variant="secondary">{`${filteredAlerts.length} alerts`}</Badge>
        </HStack>
        
        {filteredAlerts.map((alert) => (
          <AlertItem
            key={alert.id}
            {...alert}
            onPress={() => router.push(`/(app)/alerts/${alert.id}`)}
          />
        ))}
        
        {filteredAlerts.length === 0 && (
          <Card>
            <Box p={8} alignItems="center">
              <VStack gap={2 as any} alignItems="center">
                <Text size="base" weight="semibold">No alerts found</Text>
                <Text colorTheme="mutedForeground">
                  Try adjusting your filters
                </Text>
              </VStack>
            </Box>
          </Card>
        )}
      </VStack>
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
      >
        <VStack p={4} gap={4 as any}>
          {content}
        </VStack>
      </ScrollView>
    </Container>
  );
}