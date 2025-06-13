import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
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
  XCircle,
  TrendingUp,
  Users,
  ChevronRight,
} from '@/components/universal/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';

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

interface AlertSummaryBlockProps {
  alerts?: Alert[];
  showDetails?: boolean;
  maxItems?: number;
}

export function AlertSummaryBlock({ 
  alerts: propAlerts,
  showDetails = true,
  maxItems = 5
}: AlertSummaryBlockProps) {
  const router = useRouter();
  const { spacing } = useSpacing();
  const theme = useTheme();

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
        return <AlertCircle size={16} className="text-red-500" />;
      case 'urgent':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return <AlertCircle size={16} className="text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive" size="sm">Active</Badge>;
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
    <Card padding="lg">
      <VStack spacing="md">
        {/* Header */}
        <HStack justify="between" align="center">
          <HStack spacing="sm" align="center">
            <AlertCircle size={24} className="text-destructive" />
            <Text variant="h5" weight="semibold">Alert Summary</Text>
          </HStack>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(healthcare)/alerts')}
          >
            <Text>View All</Text>
            <ChevronRight size={16} />
          </Button>
        </HStack>

        {/* Stats Grid */}
        <HStack spacing="md" className="pb-2">
          <VStack spacing="xs" className="flex-1">
            <Text variant="h6" weight="bold" className="text-destructive">
              {stats.active}
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              Active
            </Text>
          </VStack>
          
          <VStack spacing="xs" className="flex-1">
            <Text variant="h6" weight="bold" className="text-yellow-500">
              {stats.acknowledged}
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              In Progress
            </Text>
          </VStack>
          
          <VStack spacing="xs" className="flex-1">
            <Text variant="h6" weight="bold" className="text-green-500">
              {stats.resolved}
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              Resolved
            </Text>
          </VStack>
          
          <VStack spacing="xs" className="flex-1">
            <Text variant="h6" weight="bold">
              {stats.critical}
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              Critical
            </Text>
          </VStack>
        </HStack>

        {/* Response Rate */}
        <VStack spacing="xs">
          <HStack justify="between">
            <Text variant="body2">Response Rate</Text>
            <Text variant="body2" weight="semibold">85%</Text>
          </HStack>
          <Progress value={85} className="h-2" />
        </VStack>

        {/* Alert List */}
        {showDetails && displayAlerts.length > 0 && (
          <VStack spacing="sm">
            <Text variant="body2" weight="semibold">Recent Alerts</Text>
            
            {displayAlerts.map((alert) => (
              <Pressable
                key={alert.id}
                onPress={() => router.push(`/(modals)/patient-details?id=${alert.id}`)}
              >
                <Card padding="sm" className="active:scale-[0.98]">
                  <HStack spacing="sm" align="center">
                    {getAlertIcon(alert.alertType)}
                    
                    <VStack spacing="xs" className="flex-1">
                      <HStack justify="between" align="center">
                        <Text variant="body2" weight="medium">
                          {alert.patientName} - Room {alert.roomNumber}
                        </Text>
                        {getStatusBadge(alert.status)}
                      </HStack>
                      
                      <HStack spacing="md">
                        <Text variant="caption" className="text-muted-foreground">
                          {getTimeSince(alert.createdAt)}
                        </Text>
                        
                        {alert.acknowledgedBy && (
                          <Text variant="caption" className="text-muted-foreground">
                            • {alert.acknowledgedBy}
                          </Text>
                        )}
                        
                        {alert.escalationLevel > 0 && (
                          <HStack spacing="xs" align="center">
                            <TrendingUp size={12} className="text-yellow-500" />
                            <Text variant="caption" className="text-yellow-500">
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
            ))}
          </VStack>
        )}

        {/* Empty State */}
        {alerts.length === 0 && (
          <VStack spacing="sm" align="center" className="py-4">
            <CheckCircle size={48} className="text-green-500" />
            <Text variant="body1" className="text-muted-foreground">
              No active alerts
            </Text>
            <Text variant="caption" className="text-muted-foreground text-center">
              All patients are stable. Great job!
            </Text>
          </VStack>
        )}
      </VStack>
    </Card>
  );
}