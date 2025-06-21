import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/universal/display';
import { VStack, HStack } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Progress, Alert } from '@/components/universal/feedback';
import { Button } from '@/components/universal/interaction';
import { Symbol } from '@/components/universal/display/Symbols';
import { api } from '@/lib/api/trpc';
import { useSpacing } from '@/lib/stores/spacing-store';

interface SystemHealthBlockProps {
  className?: string;
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
}

export function SystemHealthBlock({ className }: SystemHealthBlockProps) {
  useSpacing();
  
  // Query system health
  const { data: health, isLoading, error, refetch } = api.system.getSystemHealth.useQuery(
    undefined,
    { 
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  );

  // Query system config for maintenance mode
  const { data: config } = api.system.getConfig.useQuery();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-32">
          <ActivityIndicator size="large" />
        </CardContent>
      </Card>
    );
  }

  if (error || !health) {
    return (
      <Card className={className}>
        <CardContent>
          <Alert>
            <Text>Failed to load system health</Text>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'unhealthy':
        return 'error';
      default:
        return 'default';
    }
  };

  const memoryUsagePercent = health.memory.heapUsed / health.memory.heapTotal * 100;
  const isMaintenanceMode = (config as any)?.maintenance?.enabled;

  return (
    <Card className={className}>
      <CardHeader>
        <HStack justifyContent="space-between" alignItems="center">
          <View>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Real-time system monitoring</CardDescription>
          </View>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => refetch()}
          >
            <Symbol name="arrow.clockwise" size={16} />
          </Button>
        </HStack>
      </CardHeader>
      <CardContent>
        <VStack gap={5 as any}>
          {/* Status Overview */}
          <HStack justifyContent="space-between" alignItems="center">
            <HStack gap={2 as any} alignItems="center">
              <Symbol 
                name={health.status === 'healthy' ? 'checkmark.circle' : 'exclamationmark.triangle'} 
                size={20} 
                className={health.status === 'healthy' ? 'text-green-500' : 'text-red-500'}
              />
              <Text weight="semibold">System Status</Text>
            </HStack>
            <HStack gap={2 as any}>
              <Badge variant={getStatusVariant(health.status)}>
                {health.status.toUpperCase()}
              </Badge>
              {isMaintenanceMode && (
                <Badge variant="warning">MAINTENANCE</Badge>
              )}
            </HStack>
          </HStack>

          {/* Uptime and Version */}
          <HStack gap={6 as any}>
            <VStack gap={1 as any}>
              <Text size="xs" className="text-muted-foreground">Uptime</Text>
              <Text size="sm" weight="medium">{formatUptime(health.uptime)}</Text>
            </VStack>
            <VStack gap={1 as any}>
              <Text size="xs" className="text-muted-foreground">Version</Text>
              <Text size="sm" weight="medium">{health.version}</Text>
            </VStack>
            <VStack gap={1 as any}>
              <Text size="xs" className="text-muted-foreground">Environment</Text>
              <Text size="sm" weight="medium">{health.environment}</Text>
            </VStack>
          </HStack>

          {/* Memory Usage */}
          <VStack gap={2 as any}>
            <HStack justifyContent="space-between">
              <Text size="sm" weight="medium">Memory Usage</Text>
              <Text size="xs" className="text-muted-foreground">
                {formatBytes(health.memory.heapUsed)} / {formatBytes(health.memory.heapTotal)}
              </Text>
            </HStack>
            <Progress 
              value={memoryUsagePercent} 
              className="h-2"
            />
            <Text size="xs" className="text-muted-foreground">
              {memoryUsagePercent.toFixed(1)}% utilized
            </Text>
          </VStack>

          {/* Additional Metrics */}
          <VStack gap={2 as any}>
            <Text size="sm" weight="medium">Resource Metrics</Text>
            <HStack gap={4 as any} className="flex-wrap">
              <Badge variant="secondary">
                RSS: {formatBytes(health.memory.rss)}
              </Badge>
              <Badge variant="secondary">
                External: {formatBytes(health.memory.external)}
              </Badge>
              <Badge variant="secondary">
                Array Buffers: {formatBytes(health.memory.arrayBuffers)}
              </Badge>
            </HStack>
          </VStack>

          {/* CPU Usage (if available) */}
          {health.cpu && (
            <HStack gap={4 as any}>
              <VStack gap={1 as any} className="flex-1">
                <Text size="xs" className="text-muted-foreground">User CPU</Text>
                <Text size="sm" weight="medium">
                  {(health.cpu.user / 1000000).toFixed(2)}s
                </Text>
              </VStack>
              <VStack gap={1 as any} className="flex-1">
                <Text size="xs" className="text-muted-foreground">System CPU</Text>
                <Text size="sm" weight="medium">
                  {(health.cpu.system / 1000000).toFixed(2)}s
                </Text>
              </VStack>
            </HStack>
          )}
        </VStack>
      </CardContent>
    </Card>
  );
}