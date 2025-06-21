import React from 'react';
import { View } from 'react-native';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/universal/display';
import { Text } from '@/components/universal/typography';
import { VStack, HStack, Grid } from '@/components/universal/layout';
import { Button } from '@/components/universal/interaction';
import { useResponsive } from '@/hooks/responsive';
import { useSpacing } from '@/lib/stores/spacing-store';
import { TrendingUp, TrendingDown, Activity, Filter } from '@/components/universal/display/Symbols';

interface AnalyticsBlockProps {
  organizationId: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  onExport?: () => void;
}

export function AnalyticsBlock({
  onExport,
}: AnalyticsBlockProps) {
  const { spacing } = useSpacing();
  const { isMobile } = useResponsive();
  
  // Placeholder data
  const metrics = [
    {
      label: 'Total Activities',
      value: '1,234',
      change: 12,
      icon: <Activity size={20} />,
    },
    {
      label: 'Active Users',
      value: '89',
      change: -5,
      icon: <Activity size={20} />,
    },
    {
      label: 'Avg Response Time',
      value: '2.5m',
      change: -15,
      icon: <Activity size={20} />,
    },
    {
      label: 'Completion Rate',
      value: '94%',
      change: 8,
      icon: <TrendingUp size={20} />,
    },
  ];
  
  return (
    <View className="animate-fade-in">
      {/* Header */}
      <View style={{ marginBottom: spacing[6] }}>
        <HStack justifyContent="space-between" alignItems="center">
          <View>
            <Text size="2xl" weight="bold">Analytics Overview</Text>
            <Text colorTheme="mutedForeground" size="sm">
              Organization performance and insights
            </Text>
          </View>
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onPress={onExport}
              leftIcon={<Filter size={16} />}
            >
              Export
            </Button>
          )}
        </HStack>
      </View>
      
      {/* Metrics Cards */}
      <Grid 
        columns={isMobile ? 2 : 4} 
        gap={spacing[4] as any}
        style={{ marginBottom: spacing[6] }}
      >
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            shadow="sm"
            className="animate-scale-in"
          >
            <CardContent>
              <VStack gap={spacing[2] as any}>
                <HStack justifyContent="space-between" alignItems="center">
                  <View 
                    className="p-2 rounded-lg bg-primary/10"
                    style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {metric.icon}
                  </View>
                  <Badge 
                    variant={metric.change > 0 ? 'success' : 'error'}
                    size="xs"
                  >
                    {metric.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(metric.change)}%
                  </Badge>
                </HStack>
                <View>
                  <Text size="2xl" weight="bold">{metric.value}</Text>
                  <Text colorTheme="mutedForeground" size="xs">{metric.label}</Text>
                </View>
              </VStack>
            </CardContent>
          </Card>
        ))}
      </Grid>
      
      {/* Placeholder for charts */}
      <Card shadow="md">
        <CardHeader>
          <CardTitle>Analytics Charts</CardTitle>
          <CardDescription>
            Detailed analytics and charts will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <View style={{ height: 300, alignItems: 'center', justifyContent: 'center' }}>
            <Text colorTheme="mutedForeground">
              Charts coming soon...
            </Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}

export type { AnalyticsBlockProps };