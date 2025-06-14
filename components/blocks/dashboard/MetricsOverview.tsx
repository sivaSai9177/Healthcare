import React from 'react';
import { View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import {
  Text,
  Card,
  Grid,
  VStack,
  HStack,
  Progress,
  Badge,
} from '@/components/universal';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
} from '@/components/universal/display/Symbols';
import { cn } from '@/lib/core/utils';

interface Metric {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
  color?: string;
  progress?: number;
  subtitle?: string;
  roles?: string[];
  organizationRoles?: string[];
}

interface MetricsOverviewBlockProps {
  columns?: 2 | 3 | 4;
  customMetrics?: Metric[];
  showTrends?: boolean;
}

export function MetricsOverviewBlock({ 
  columns = 2,
  customMetrics,
  showTrends = true
}: MetricsOverviewBlockProps) {
  const { user } = useAuth();

  // Default metrics based on role
  const defaultMetrics: Metric[] = [
    // Common metrics
    {
      id: 'tasks',
      title: 'My Tasks',
      value: '12',
      subtitle: 'Active tasks',
      icon: <CheckCircle size={20} />,
      color: 'primary',
      progress: 75,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      value: '5',
      subtitle: 'Unread',
      icon: <AlertCircle size={20} />,
      color: 'destructive',
      change: 2,
      changeType: 'increase',
    },
    
    // Admin metrics
    {
      id: 'total-users',
      title: 'Total Users',
      value: '1,234',
      subtitle: 'Active users',
      icon: <Users size={20} />,
      color: 'secondary',
      change: 5.2,
      changeType: 'increase',
      roles: ['admin'],
    },
    {
      id: 'system-health',
      title: 'System Health',
      value: '98%',
      subtitle: 'Uptime',
      icon: <Activity size={20} />,
      color: 'success',
      progress: 98,
      roles: ['admin'],
    },
    
    // Manager metrics
    {
      id: 'team-size',
      title: 'Team Members',
      value: '24',
      subtitle: 'Active today',
      icon: <Users size={20} />,
      color: 'primary',
      change: 2,
      changeType: 'increase',
      roles: ['manager', 'admin'],
    },
    {
      id: 'team-productivity',
      title: 'Productivity',
      value: '85%',
      subtitle: 'This week',
      icon: <TrendingUp size={20} />,
      color: 'success',
      progress: 85,
      change: 12,
      changeType: 'increase',
      roles: ['manager', 'admin'],
    },
    {
      id: 'pending-reviews',
      title: 'Pending Reviews',
      value: '8',
      subtitle: 'Awaiting approval',
      icon: <Clock size={20} />,
      color: 'warning',
      roles: ['manager', 'admin'],
    },
    
    // Healthcare metrics
    {
      id: 'active-alerts',
      title: 'Active Alerts',
      value: '3',
      subtitle: 'Requires attention',
      icon: <AlertCircle size={20} />,
      color: 'destructive',
      change: 1,
      changeType: 'increase',
      organizationRoles: ['doctor', 'nurse', 'head_doctor', 'operator'],
    },
    {
      id: 'patients-today',
      title: 'Patients Today',
      value: '42',
      subtitle: 'Currently admitted',
      icon: <Users size={20} />,
      color: 'primary',
      organizationRoles: ['doctor', 'nurse', 'head_doctor'],
    },
    {
      id: 'response-time',
      title: 'Avg Response',
      value: '4.2 min',
      subtitle: 'Alert response',
      icon: <Clock size={20} />,
      color: 'success',
      change: -15,
      changeType: 'decrease',
      organizationRoles: ['doctor', 'nurse', 'head_doctor', 'operator'],
    },
  ];

  // Filter metrics based on user role
  const metrics = (customMetrics || defaultMetrics).filter(metric => {
    // Check role-based access
    if (metric.roles && !metric.roles.includes(user?.role || '')) {
      return false;
    }
    
    // Check organization role-based access
    if (metric.organizationRoles && !metric.organizationRoles.includes(user?.organizationRole || '')) {
      return false;
    }
    
    return true;
  });

  const renderTrendIcon = (changeType?: 'increase' | 'decrease') => {
    if (!changeType) return null;
    
    if (changeType === 'increase') {
      return <TrendingUp size={16} className="text-green-500" />;
    }
    return <TrendingDown size={16} className="text-red-500" />;
  };

  const getTrendColor = (changeType?: 'increase' | 'decrease', value?: number) => {
    if (!changeType || !value) return '';
    
    // For some metrics, decrease is good (e.g., response time)
    const isPositive = changeType === 'increase' ? value > 0 : value < 0;
    return isPositive ? 'text-green-500' : 'text-red-500';
  };

  return (
    <VStack gap={4}>
      <HStack justify="between" align="center">
        <Text size="xl" weight="semibold">Overview</Text>
        <Badge variant="outline" size="sm">
          <HStack gap={1} align="center">
            <Activity size={14} />
            <Text size="xs">Live</Text>
          </HStack>
        </Badge>
      </HStack>
      
      <Grid columns={columns} gap={4} className="animate-stagger-in">
        {metrics.slice(0, columns * 2).map((metric) => (
          <Card 
            key={metric.id} 
            className={cn(
              "p-4 transition-all duration-200",
              "hover:scale-[1.02] hover:shadow-lg",
              "animate-fade-in"
            )}
          >
            <VStack gap={2}>
              <HStack justify="between" align="center">
                <View 
                  className={cn(
                    "w-10 h-10 rounded-lg items-center justify-center",
                    metric.color === 'primary' && "bg-primary/10",
                    metric.color === 'secondary' && "bg-secondary/10",
                    metric.color === 'destructive' && "bg-destructive/10",
                    metric.color === 'success' && "bg-success/10",
                    metric.color === 'warning' && "bg-warning/10"
                  )}
                >
                  <View className={cn(
                    metric.color === 'primary' && "text-primary",
                    metric.color === 'secondary' && "text-secondary",
                    metric.color === 'destructive' && "text-destructive",
                    metric.color === 'success' && "text-success",
                    metric.color === 'warning' && "text-warning"
                  )}>
                    {metric.icon}
                  </View>
                </View>
                
                {showTrends && metric.change !== undefined && (
                  <HStack gap={1} align="center">
                    {renderTrendIcon(metric.changeType)}
                    <Text 
                      size="xs" 
                      weight="semibold"
                      className={getTrendColor(metric.changeType, metric.change)}
                    >
                      {Math.abs(metric.change)}%
                    </Text>
                  </HStack>
                )}
              </HStack>
              
              <VStack gap={1}>
                <Text size="2xl" weight="bold">
                  {metric.value}
                </Text>
                <Text size="sm" weight="medium">
                  {metric.title}
                </Text>
                {metric.subtitle && (
                  <Text size="xs" className="text-muted-foreground">
                    {metric.subtitle}
                  </Text>
                )}
              </VStack>
              
              {metric.progress !== undefined && (
                <Progress 
                  value={metric.progress} 
                  className={cn(
                    "h-2",
                    metric.color === 'primary' && "bg-primary",
                    metric.color === 'secondary' && "bg-secondary",
                    metric.color === 'destructive' && "bg-destructive",
                    metric.color === 'success' && "bg-success",
                    metric.color === 'warning' && "bg-warning"
                  )}
                />
              )}
            </VStack>
          </Card>
        ))}
      </Grid>
    </VStack>
  );
}