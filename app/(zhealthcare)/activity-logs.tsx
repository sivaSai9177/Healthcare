import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';

import { api } from '@/lib/api/trpc';
import {
  Box,
  Text,
  Card,
  VStack,
  HStack,
  Badge,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Separator,
  IconSymbol,
  DatePicker,
} from '@/components/universal';
import { Download, Search, Activity, Clock, User, Shield } from '@/components/universal/Symbols';
import { format } from 'date-fns';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LoadingView } from '@/components/LoadingView';
import { useTheme } from '@/lib/theme/provider';
import { showErrorAlert } from '@/lib/core/alert';

interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  severity: 'info' | 'warning' | 'error' | 'critical';
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  timestamp: Date;
}

export default function ActivityLogsScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Fetch audit logs
  const { data, isLoading, refetch } = api.admin.getAuditLogs.useQuery({
    search: searchQuery || undefined,
    severity: selectedSeverity !== 'all' ? selectedSeverity as any : undefined,
    resourceType: selectedType !== 'all' ? selectedType : undefined,
    startDate: dateRange.start?.toISOString(),
    endDate: dateRange.end?.toISOString(),
    limit: 100,
  });

  const handleExportCSV = useCallback(async () => {
    try {
      // TODO: Implement CSV export
      showErrorAlert('Export functionality coming soon');
    } catch (error) {
      showErrorAlert('Failed to export logs');
    }
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return theme.colors.destructive;
      case 'error':
        return 'rgb(239, 68, 68)';
      case 'warning':
        return 'rgb(245, 158, 11)';
      default:
        return theme.colors.muted.foreground;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return 'plus-circle';
    if (action.includes('update')) return 'edit';
    if (action.includes('delete')) return 'trash-2';
    if (action.includes('login')) return 'log-in';
    if (action.includes('logout')) return 'log-out';
    return 'activity';
  };

  if (isLoading) {
    return <LoadingView message="Loading activity logs..." />;
  }

  const logs = data?.logs || [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => refetch()}
          tintColor={theme.colors.primary}
        />
      }
    >
      <Box padding="medium">
        {/* Header */}
        <VStack spacing="large">
          <HStack justify="between" align="center">
            <VStack spacing="small">
              <Text variant="largeTitle" weight="bold">
                Activity Logs
              </Text>
              <Text variant="body" color="secondary">
                System audit trail and security events
              </Text>
            </VStack>
            <Button
              size="medium"
              variant="secondary"
              onPress={handleExportCSV}
              icon={<Download size={16} />}
            >
              Export CSV
            </Button>
          </HStack>

          {/* Filters */}
          <Card padding="medium">
            <VStack spacing="medium">
              {/* Search */}
              <HStack spacing="small" align="center">
                <Search size={20} color={theme.colors.muted.foreground} />
                <Input
                  flex={1}
                  placeholder="Search by user, action, or resource..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </HStack>

              <Separator />

              {/* Filter Row */}
              <HStack spacing="medium" align="center" wrap>
                {/* Severity Filter */}
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger style={{ minWidth: 150 }}>
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger style={{ minWidth: 150 }}>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="alert">Alerts</SelectItem>
                    <SelectItem value="patient">Patients</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Range */}
                <HStack spacing="small" align="center">
                  <DatePicker
                    value={dateRange.start}
                    onChange={(date) => setDateRange({ ...dateRange, start: date })}
                    placeholder="Start Date"
                  />
                  <Text variant="caption">to</Text>
                  <DatePicker
                    value={dateRange.end}
                    onChange={(date) => setDateRange({ ...dateRange, end: date })}
                    placeholder="End Date"
                  />
                </HStack>
              </HStack>
            </VStack>
          </Card>

          {/* Logs List */}
          <VStack spacing="small">
            {logs.length === 0 ? (
              <Card padding="large">
                <VStack spacing="medium" align="center">
                  <Activity size={48} color={theme.colors.muted.foreground} />
                  <Text variant="body" color="secondary" align="center">
                    No activity logs found
                  </Text>
                  <Text variant="caption" color="tertiary" align="center">
                    Try adjusting your filters or date range
                  </Text>
                </VStack>
              </Card>
            ) : (
              logs.map((log) => (
                <Card key={log.id} padding="medium">
                  <VStack spacing="small">
                    {/* Header Row */}
                    <HStack justify="between" align="start">
                      <HStack spacing="small" align="center">
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: theme.colors.muted.background,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconSymbol
                            name={getActionIcon(log.action)}
                            size={16}
                            color={getSeverityColor(log.severity)}
                          />
                        </View>
                        <VStack spacing="tiny">
                          <Text variant="subheadline" weight="semibold">
                            {log.action}
                          </Text>
                          <HStack spacing="tiny" align="center">
                            <User size={12} color={theme.colors.muted.foreground} />
                            <Text variant="caption" color="secondary">
                              {log.userName || 'System'}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                      <Badge
                        variant={
                          log.severity === 'critical' ? 'destructive' :
                          log.severity === 'error' ? 'destructive' :
                          log.severity === 'warning' ? 'warning' :
                          'default'
                        }
                      >
                        {log.severity}
                      </Badge>
                    </HStack>

                    {/* Details */}
                    <VStack spacing="tiny">
                      {log.resourceType && (
                        <HStack spacing="tiny" align="center">
                          <Text variant="caption" color="tertiary">
                            Resource:
                          </Text>
                          <Text variant="caption" color="secondary">
                            {log.resourceType}
                            {log.resourceId && ` (${log.resourceId})`}
                          </Text>
                        </HStack>
                      )}

                      {/* Metadata */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <Text variant="caption" color="secondary">
                          {JSON.stringify(log.metadata, null, 2)}
                        </Text>
                      )}

                      {/* Footer */}
                      <HStack spacing="medium" align="center">
                        <HStack spacing="tiny" align="center">
                          <Clock size={12} color={theme.colors.muted.foreground} />
                          <Text variant="caption" color="tertiary">
                            {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                          </Text>
                        </HStack>
                        {log.ipAddress && (
                          <HStack spacing="tiny" align="center">
                            <Shield size={12} color={theme.colors.muted.foreground} />
                            <Text variant="caption" color="tertiary">
                              {log.ipAddress}
                            </Text>
                          </HStack>
                        )}
                      </HStack>
                    </VStack>
                  </VStack>
                </Card>
              ))
            )}
          </VStack>
        </VStack>
      </Box>
    </ScrollView>
  );
}