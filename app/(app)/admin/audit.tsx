import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme/provider';
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
  Box,
} from '@/components/universal';
import { Symbol } from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { api } from '@/lib/api/trpc';

export default function AuditScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Check admin access
  if (!user || user.role !== 'admin') {
    return (
      <Container>
        <VStack p={4} gap={4 as any} alignItems="center" justifyContent="center" style={{ flex: 1 }}>
          <Text size="base">Access Restricted</Text>
          <Text colorTheme="mutedForeground">
            This section is only available to administrators
          </Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </VStack>
      </Container>
    );
  }

  // Mock audit logs - replace with tRPC query
  const auditLogs = [
    {
      id: '1',
      timestamp: '2025-01-11T10:30:00Z',
      user: 'admin@example.com',
      action: 'user.created',
      resource: 'User #123',
      details: 'Created new user account for john.doe@example.com',
      ip: '192.168.1.1',
      severity: 'info',
      status: 'success',
    },
    {
      id: '2',
      timestamp: '2025-01-11T10:25:00Z',
      user: 'manager@example.com',
      action: 'auth.login',
      resource: 'Authentication',
      details: 'Successful login from new device',
      ip: '10.0.0.5',
      severity: 'info',
      status: 'success',
    },
    {
      id: '3',
      timestamp: '2025-01-11T10:20:00Z',
      user: 'user@example.com',
      action: 'auth.failed',
      resource: 'Authentication',
      details: 'Failed login attempt - invalid password',
      ip: '203.0.113.0',
      severity: 'warning',
      status: 'failed',
    },
    {
      id: '4',
      timestamp: '2025-01-11T10:15:00Z',
      user: 'admin@example.com',
      action: 'system.config',
      resource: 'System Settings',
      details: 'Modified email notification settings',
      ip: '192.168.1.1',
      severity: 'critical',
      status: 'success',
    },
    {
      id: '5',
      timestamp: '2025-01-11T10:10:00Z',
      user: 'system',
      action: 'backup.completed',
      resource: 'Database',
      details: 'Daily backup completed successfully (2.3GB)',
      ip: 'localhost',
      severity: 'info',
      status: 'success',
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh audit logs
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info':
        return <Symbol name="info.circle" size={16} className="text-blue-500" />;
      case 'warning':
        return <Symbol name="exclamationmark.triangle" size={16} className="text-yellow-500" />;
      case 'critical':
        return <Symbol name="exclamationmark.triangle" size={16} className="text-red-500" />;
      default:
        return <Symbol name="info.circle" size={16} className="text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Symbol name="checkmark.circle" size={16} className="text-green-500" />;
      case 'failed':
        return <Symbol name="xmark.circle" size={16} className="text-red-500" />;
      default:
        return <Symbol name="waveform" size={16} className="text-muted-foreground" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string): any => {
    switch (severity) {
      case 'info':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action.startsWith(actionFilter);
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesAction && matchesSeverity;
  });

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
            <Text size="2xl" weight="bold">Audit Logs</Text>
            <Text size="sm" colorTheme="mutedForeground">
              System activity and security events
            </Text>
          </VStack>
        </HStack>
        <Button
          variant="outline"
          size="sm"
          onPress={() => {
            // Export logs
          }}
        >
          <Symbol name="arrow.down.circle" size={16} />
          <Text>Export</Text>
        </Button>
      </HStack>

      {/* Filters */}
      <VStack gap={3 as any}>
        <Input
          placeholder="Search logs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Symbol name="magnifyingglass" size={16} className="text-muted-foreground" />}
        />
        
        <HStack gap={2 as any}>
          <Box style={{ flex: 1 }}>
            <Select 
              value={actionFilter} 
              onValueChange={(value) => setActionFilter(value as string)}
              options={[
                { label: "All actions", value: "all" },
                { label: "Authentication", value: "auth" },
                { label: "User Management", value: "user" },
                { label: "System", value: "system" },
                { label: "Backup", value: "backup" }
              ]}
            />
          </Box>
          
          <Box style={{ flex: 1 }}>
            <Select 
              value={severityFilter} 
              onValueChange={(value) => setSeverityFilter(value as string)}
              options={[
                { label: "All severities", value: "all" },
                { label: "Info", value: "info" },
                { label: "Warning", value: "warning" },
                { label: "Critical", value: "critical" }
              ]}
            />
          </Box>
        </HStack>
      </VStack>

      {/* Log Entries */}
      <VStack gap={3 as any}>
        {filteredLogs.map((log) => (
          <Card key={log.id}>
            <Box p={4 as any}>
              <VStack gap={3 as any}>
                {/* Log Header */}
                <HStack justifyContent="space-between" alignItems="flex-start">
                  <HStack gap={2 as any} alignItems="center">
                    {getSeverityIcon(log.severity)}
                    <VStack gap={1 as any}>
                      <HStack gap={2 as any} alignItems="center">
                        <Text weight="semibold">
                          {log.action}
                        </Text>
                        {getStatusIcon(log.status)}
                      </HStack>
                      <Text size="xs" colorTheme="mutedForeground">
                        {formatTimestamp(log.timestamp)}
                      </Text>
                    </VStack>
                  </HStack>
                  <Badge size="sm" variant={getSeverityBadgeVariant(log.severity)}>
                    {log.severity}
                  </Badge>
                </HStack>

                {/* Log Details */}
                <VStack gap={2 as any}>
                  <Text size="sm">
                    {log.details}
                  </Text>
                  
                  <HStack gap={3 as any} style={{ paddingTop: spacing[2] as any }}>
                    <HStack gap={1 as any} alignItems="center">
                      <Symbol name="person" size={14} className="text-muted-foreground" />
                      <Text size="xs" colorTheme="mutedForeground">
                        {log.user}
                      </Text>
                    </HStack>
                    
                    <Text size="xs" colorTheme="mutedForeground">
                      {log.resource}
                    </Text>
                    
                    <Text size="xs" colorTheme="mutedForeground">
                      IP: {log.ip}
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            </Box>
          </Card>
        ))}
      </VStack>

      {/* Empty State */}
      {filteredLogs.length === 0 && (
        <Card>
          <Box p={6} alignItems="center">
            <VStack gap={3 as any} alignItems="center">
              <Symbol name="waveform" size={48} className="text-muted-foreground" />
              <Text colorTheme="mutedForeground">
                No audit logs found
              </Text>
              <Text size="sm" colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
                Try adjusting your search or filters
              </Text>
            </VStack>
          </Box>
        </Card>
      )}

      {/* Load More */}
      {filteredLogs.length > 0 && (
        <Button 
          variant="outline" 
          size="default" 
          fullWidth
          onPress={() => {
            // Load more logs
          }}
        >
          Load More
        </Button>
      )}
    </VStack>
  );

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing[4] as any, paddingBottom: spacing[6] as any }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ paddingBottom: spacing[16] as any }}
      >
        <VStack p={6} gap={4 as any}>
          {content}
        </VStack>
      </ScrollView>
    </Container>
  );
}