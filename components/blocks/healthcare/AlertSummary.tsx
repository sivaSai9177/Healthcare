import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';
import { useResponsive } from '@/hooks/responsive';
// Animation will be handled with Tailwind classes
import { haptic } from '@/lib/ui/haptics';
import {
  Text,
  Card,
  Badge,
  VStack,
  HStack,
  Progress,
  Button,
} from '@/components/universal';
import { 
  AlertCircle, 
  Clock,
  CheckCircle,
  TrendingUp,
  ChevronRight,
} from '@/components/universal/display/Symbols';

interface Alert {
  id: string;
  patientName: string;
  roomNumber: string;
  alertType: 'critical' | 'urgent' | 'normal';
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  acknowledgedBy?: string;
  escalationLevel: number;
}

export interface AlertSummaryBlockProps {
  alerts?: Alert[];
  showDetails?: boolean;
  maxItems?: number;
}

export function AlertSummary({ 
  alerts: propAlerts,
  showDetails = true,
  maxItems = 5
}: AlertSummaryBlockProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const shadowMd = useShadow({ size: 'md' });
  const shadowSm = useShadow({ size: 'sm' });

  // Mock data if no alerts provided
  const mockAlerts: Alert[] = [
    {
      id: '1',
      patientName: 'John Doe',
      roomNumber: '205A',
      alertType: 'critical',
      status: 'active',
      createdAt: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      escalationLevel: 2,
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      roomNumber: '312B',
      alertType: 'urgent',
      status: 'acknowledged',
      createdAt: new Date(Date.now() - 15 * 60000), // 15 minutes ago
      acknowledgedBy: 'Dr. Wilson',
      escalationLevel: 1,
    },
    {
      id: '3',
      patientName: 'Bob Johnson',
      roomNumber: '108',
      alertType: 'normal',
      status: 'resolved',
      createdAt: new Date(Date.now() - 30 * 60000), // 30 minutes ago
      acknowledgedBy: 'Nurse Davis',
      escalationLevel: 0,
    },
  ];

  const alerts = propAlerts || mockAlerts;
  const displayAlerts = alerts.slice(0, maxItems);

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.alertType === 'critical').length,
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle size={16} className="text-destructive" />;
      case 'urgent':
        return <Clock size={16} className="text-warning" />;
      default:
        return <AlertCircle size={16} className="text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="error" size="sm">Active</Badge>;
      case 'acknowledged':
        return <Badge variant="secondary" size="sm">Acknowledged</Badge>;
      case 'resolved':
        return <Badge variant="success" size="sm">Resolved</Badge>;
      default:
        return null;
    }
  };

  const getTimeSince = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <View className="animate-fade-in">
      <Card className="p-6" style={shadowMd}>
        <VStack gap={4}>
          {/* Header */}
          <HStack justify="between" align="center">
            <HStack gap={2} align="center">
              <AlertCircle size={24} className="text-destructive" />
              <Text size="xl" weight="semibold">Alert Summary</Text>
            </HStack>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                haptic('light');
                router.push('/(healthcare)/alerts');
              }}
            >
              <Text>View All</Text>
              <ChevronRight size={16} />
            </Button>
          </HStack>

          {/* Stats Grid */}
          <View className="animate-scale-in">
            <HStack gap={4} className={cn(isMobile && "flex-wrap")}>
              <VStack gap={1} className="flex-1">
                <Text size="2xl" weight="bold" className="text-destructive">
                  {stats.active}
                </Text>
                <Text size="xs" className="text-muted-foreground">
                  Active
                </Text>
              </VStack>
              
              <VStack gap={1} className="flex-1">
                <Text size="2xl" weight="bold" className="text-warning">
                  {stats.acknowledged}
                </Text>
                <Text size="xs" className="text-muted-foreground">
                  In Progress
                </Text>
              </VStack>
              
              <VStack gap={1} className="flex-1">
                <Text size="2xl" weight="bold" className="text-success">
                  {stats.resolved}
                </Text>
                <Text size="xs" className="text-muted-foreground">
                  Resolved
                </Text>
              </VStack>
              
              <VStack gap={1} className="flex-1">
                <Text size="2xl" weight="bold">
                  {stats.critical}
                </Text>
                <Text size="xs" className="text-muted-foreground">
                  Critical
                </Text>
              </VStack>
            </HStack>
          </View>

          {/* Response Rate */}
          <VStack gap={2}>
            <HStack justify="between">
              <Text size="sm">Response Rate</Text>
              <Text size="sm" weight="semibold">85%</Text>
            </HStack>
            <Progress value={85} size="sm" variant="success" />
          </VStack>

          {/* Alert List */}
          {showDetails && displayAlerts.length > 0 && (
            <VStack gap={3}>
              <Text size="sm" weight="semibold">Recent Alerts</Text>
              
              {displayAlerts.map((alert, index) => {
                // Calculate stagger delay for list animations
                const staggerDelay = Math.min(index + 1, 6);
                
                return (
                  <View key={alert.id} className={cn(
                    "animate-slide-in-up",
                    `delay-stagger-${staggerDelay}`
                  )}>
                    <Pressable
                      onPress={() => {
                        haptic('light');
                        router.push(`/(modals)/patient-details?id=${alert.id}`);
                      }}
                    >
                      <Card 
                        className="p-3 active:scale-[0.98]"
                        style={shadowSm}
                      >
                        <HStack gap={3} align="center">
                          {getAlertIcon(alert.alertType)}
                          
                          <VStack gap={1} className="flex-1">
                            <HStack justify="between" align="center">
                              <Text size="sm" weight="medium">
                                {alert.patientName} - Room {alert.roomNumber}
                              </Text>
                              {getStatusBadge(alert.status)}
                            </HStack>
                            
                            <HStack gap={4}>
                              <Text size="xs" className="text-muted-foreground">
                                {getTimeSince(alert.createdAt)}
                              </Text>
                              
                              {alert.acknowledgedBy && (
                                <Text size="xs" className="text-muted-foreground">
                                  • {alert.acknowledgedBy}
                                </Text>
                              )}
                              
                              {alert.escalationLevel > 0 && (
                                <HStack gap={1} align="center">
                                  <TrendingUp size={12} className="text-warning" />
                                  <Text size="xs" className="text-warning">
                                    L{alert.escalationLevel}
                                  </Text>
                                </HStack>
                              )}
                            </HStack>
                          </VStack>
                          
                          <ChevronRight size={16} className="text-muted-foreground" />
                        </HStack>
                      </Card>
                    </Pressable>
                  </View>
                );
              })}
            </VStack>
          )}

          {/* Empty State */}
          {alerts.length === 0 && (
            <VStack gap={3} align="center" className="py-8">
              <CheckCircle size={48} className="text-success" />
              <Text size="lg" className="text-muted-foreground">
                No active alerts
              </Text>
              <Text size="sm" className="text-muted-foreground text-center">
                All patients are stable. Great job!
              </Text>
            </VStack>
          )}
        </VStack>
      </Card>
    </View>
  );
}