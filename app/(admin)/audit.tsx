import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
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
} from '@/components/universal';
import { 
  Search, 
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  User,
  Activity,
} from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';

export default function AuditScreen() {
  const { spacing } = useSpacing();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

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
        return <Info size={16} className="text-blue-500" />;
      case 'warning':
        return <AlertCircle size={16} className="text-yellow-500" />;
      case 'critical':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Info size={16} className="text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Activity size={16} className="text-muted-foreground" />;
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

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerStyle={{ paddingBottom: spacing[16] }}
    >
      <Container maxWidth="full" padding={6}>
        <VStack spacing="lg">
          {/* Header */}
          <HStack justify="between" align="center">
            <VStack spacing="xs">
              <Text size="2xl" weight="bold">Audit Logs</Text>
              <Text size="sm" className="text-muted-foreground">
                System activity and security events
              </Text>
            </VStack>
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                // Export logs
              }}
            >
              <Download size={16} />
              <Text>Export</Text>
            </Button>
          </HStack>

          {/* Filters */}
          <VStack spacing="md">
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="w-full"
              leftIcon={<Search size={16} className="text-muted-foreground" />}
            />
            
            <HStack spacing="md">
              <View className="flex-1">
                <Select 
                  value={actionFilter} 
                  onValueChange={(value) => setActionFilter(typeof value === 'string' ? value : value[0])}
                  placeholder="All actions"
                  options={[
                    { value: "all", label: "All actions" },
                    { value: "auth", label: "Authentication" },
                    { value: "user", label: "User Management" },
                    { value: "system", label: "System" },
                    { value: "backup", label: "Backup" },
                  ]}
                />
              </View>
              
              <View className="flex-1">
                <Select 
                  value={severityFilter} 
                  onValueChange={(value) => setSeverityFilter(typeof value === 'string' ? value : value[0])}
                  placeholder="All severities"
                  options={[
                    { value: "all", label: "All severities" },
                    { value: "info", label: "Info" },
                    { value: "warning", label: "Warning" },
                    { value: "critical", label: "Critical" },
                  ]}
                />
              </View>
            </HStack>
          </VStack>

          {/* Log Entries */}
          <VStack spacing="md">
            {filteredLogs.map((log) => (
              <Card key={log.id}>
                <VStack spacing="md" className="p-4">
                  {/* Log Header */}
                  <HStack justify="between" align="start">
                    <HStack spacing="sm" align="center">
                      {getSeverityIcon(log.severity)}
                      <VStack spacing="xs">
                        <HStack spacing="sm" align="center">
                          <Text size="base" weight="semibold">
                            {log.action}
                          </Text>
                          {getStatusIcon(log.status)}
                        </HStack>
                        <Text size="xs" className="text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge size="sm" variant={getSeverityBadgeVariant(log.severity)}>
                      {log.severity}
                    </Badge>
                  </HStack>

                  {/* Log Details */}
                  <VStack spacing="xs">
                    <Text size="sm">
                      {log.details}
                    </Text>
                    
                    <HStack spacing="md" className="pt-2">
                      <HStack spacing="xs" align="center">
                        <User size={14} className="text-muted-foreground" />
                        <Text size="xs" className="text-muted-foreground">
                          {log.user}
                        </Text>
                      </HStack>
                      
                      <Text size="xs" className="text-muted-foreground">
                        {log.resource}
                      </Text>
                      
                      <Text size="xs" className="text-muted-foreground">
                        IP: {log.ip}
                      </Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Card>
            ))}
          </VStack>

          {/* Empty State */}
          {filteredLogs.length === 0 && (
            <Card className="items-center">
              <VStack spacing="md" align="center" className="p-6">
                <Activity size={48} className="text-muted-foreground" />
                <Text size="base" className="text-muted-foreground">
                  No audit logs found
                </Text>
                <Text size="sm" className="text-muted-foreground text-center">
                  Try adjusting your search or filters
                </Text>
              </VStack>
            </Card>
          )}

          {/* Load More */}
          {filteredLogs.length > 0 && (
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onPress={() => {
                // Load more logs
              }}
            >
              Load More
            </Button>
          )}
        </VStack>
      </Container>
    </ScrollView>
  );
}