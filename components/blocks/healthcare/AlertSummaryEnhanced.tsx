import React from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { cn } from '@/lib/core/utils';
import { useShadow } from '@/hooks/useShadow';
import { useResponsive } from '@/hooks/responsive';
import { haptic } from '@/lib/ui/haptics';
import { Text } from '@/components/universal/typography';
import { Card, Badge } from '@/components/universal/display';
import { VStack, HStack } from '@/components/universal/layout';
import { Progress } from '@/components/universal/feedback';
import { Button } from '@/components/universal/interaction';
import { 
  AlertCircle, 
  Clock,
  CheckCircle,
  TrendingUp,
  ChevronRight,
  Building2,
} from '@/components/universal/display/Symbols';
import { useActiveAlertsWithOrg, useOrganizationAlertStats } from '@/hooks/healthcare';
import { useActiveOrganization } from '@/lib/stores/organization-store';
import { useCurrentHospital } from '@/lib/stores/hospital-store';
import { formatDistanceToNow } from 'date-fns';


export interface AlertSummaryEnhancedProps {
  hospitalId?: string;
  showOrganizationStats?: boolean;
  showDetails?: boolean;
  maxItems?: number;
}

export function AlertSummaryEnhanced({ 
  hospitalId: propHospitalId,
  showOrganizationStats = true,
  showDetails = true,
  maxItems = 5
}: AlertSummaryEnhancedProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const shadowMd = useShadow({ size: 'md' });
  const shadowSm = useShadow({ size: 'sm' });
  const { organization } = useActiveOrganization();
  const { hospitalId: currentHospitalId } = useCurrentHospital();
  
  // Use prop hospitalId if provided, otherwise use current hospital
  const hospitalId = propHospitalId || currentHospitalId || '';

  // Fetch alerts with organization data using enhanced hooks
  const alertsQuery = useActiveAlertsWithOrg({
    hospitalId,
    enabled: !!hospitalId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch organization-specific stats using enhanced hooks
  const orgStatsQuery = useOrganizationAlertStats({
    organizationId: organization?.id || '',
    enabled: !!organization?.id && showOrganizationStats,
    refetchInterval: 60000, // Refresh every minute
  });

  // Use cached data when offline
  const alerts = ((alertsQuery as any).data)?.alerts || ((alertsQuery as any).cachedData)?.alerts || [];
  const displayAlerts = alerts.slice(0, maxItems);
  const organizationStats = (orgStatsQuery as any).data || (orgStatsQuery as any).cachedData;

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.urgencyLevel >= 4).length,
    byOrganization: alerts.reduce((acc, alert) => {
      const orgName = alert.organizationName || 'Unknown';
      acc[orgName] = (acc[orgName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const getAlertIcon = (type: string, urgencyLevel: number) => {
    if (urgencyLevel >= 4) {
      return <AlertCircle size={16} className="text-destructive" />;
    } else if (urgencyLevel >= 3) {
      return <Clock size={16} className="text-warning" />;
    }
    return <AlertCircle size={16} className="text-primary" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="error" size="sm">Active</Badge>;
      case 'acknowledged':
        return <Badge variant="secondary" size="sm">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="success" size="sm">Resolved</Badge>;
      default:
        return null;
    }
  };

  if ((alertsQuery as any).isLoading) {
    return (
      <Card className="p-6" style={shadowMd}>
        <VStack gap={4}>
          <HStack gap={2} alignItems="center">
            <AlertCircle size={24} className="text-destructive" />
            <Text size="xl" weight="semibold">Loading Alert Summary...</Text>
          </HStack>
        </VStack>
      </Card>
    );
  }

  return (
    <Card className="p-6" style={shadowMd}>
      <VStack gap={4}>
        {/* Header */}
        <HStack justifyContent="space-between" alignItems="center">
          <HStack gap={2} alignItems="center">
            <AlertCircle size={24} className="text-destructive" />
            <Text size="xl" weight="semibold">Alert Summary</Text>
            {organization && (
              <Badge variant="outline" size="sm">
                {organization.name}
              </Badge>
            )}
            {(alertsQuery as any).isOffline && (alertsQuery as any).cachedData && (
              <Badge variant="secondary" size="sm">
                Offline
              </Badge>
            )}
          </HStack>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              haptic('light');
              router.push('/alerts');
            }}
          >
            <Text>View All</Text>
            <ChevronRight size={16} />
          </Button>
        </HStack>

        {/* Stats Grid */}
        <HStack gap={4} className={cn(isMobile ? "flex-wrap" : "")}>
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
              Resolved Today
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

        {/* Organization-specific stats */}
        {showOrganizationStats && organizationStats && (
          <Card className="p-4 bg-muted/50">
            <VStack gap={3}>
              <HStack justifyContent="space-between" alignItems="center">
                <HStack gap={2} alignItems="center">
                  <Building2 size={16} />
                  <Text size="sm" weight="medium">Your Organization Stats</Text>
                </HStack>
              </HStack>
              
              <HStack gap={4} className="flex-wrap">
                <VStack gap={1}>
                  <Text size="lg" weight="semibold">{(organizationStats as any).totalAlerts}</Text>
                  <Text size="xs" className="text-muted-foreground">Total Today</Text>
                </VStack>
                
                <VStack gap={1}>
                  <Text size="lg" weight="semibold">{(organizationStats as any).avgResponseTime}m</Text>
                  <Text size="xs" className="text-muted-foreground">Avg Response</Text>
                </VStack>
                
                <VStack gap={1}>
                  <Text size="lg" weight="semibold">{(organizationStats as any).resolutionRate}%</Text>
                  <Text size="xs" className="text-muted-foreground">Resolution Rate</Text>
                </VStack>
              </HStack>
              
              {/* Response Rate Progress */}
              <VStack gap={2}>
                <HStack justifyContent="space-between">
                  <Text size="xs">Response Performance</Text>
                  <Text size="xs" weight="semibold">{(organizationStats as any).resolutionRate}%</Text>
                </HStack>
                <Progress 
                  value={(organizationStats as any).resolutionRate} 
                  size="sm" 
                  variant={(organizationStats as any).resolutionRate >= 80 ? "success" : (organizationStats as any).resolutionRate >= 60 ? "secondary" : "destructive"} 
                />
              </VStack>
            </VStack>
          </Card>
        )}

        {/* Organization breakdown */}
        {Object.keys(stats.byOrganization).length > 1 && (
          <VStack gap={2}>
            <Text size="sm" weight="semibold">Alerts by Organization</Text>
            <HStack gap={2} className="flex-wrap">
              {Object.entries(stats.byOrganization).map(([org, count]) => (
                <Badge key={org} variant="outline" size="sm">
                  {org}: {count as any}
                </Badge>
              ))}
            </HStack>
          </VStack>
        )}

        {/* Alert List */}
        {showDetails && displayAlerts.length > 0 && (
          <VStack gap={3}>
            <Text size="sm" weight="semibold">Recent Alerts</Text>
            
            {displayAlerts.map((alert, index) => {
              return (
                <Pressable
                  key={alert.id}
                  onPress={() => {
                    haptic('light');
                    router.push(`/patient-details?id=${alert.id}`);
                  }}
                >
                  <Card 
                    className="p-3 active:scale-[0.98]"
                    style={shadowSm}
                  >
                    <HStack gap={3} alignItems="center">
                      {getAlertIcon(alert.alertType, alert.urgencyLevel)}
                      
                      <VStack gap={1} className="flex-1">
                        <HStack justifyContent="space-between" alignItems="center">
                          <Text size="sm" weight="medium">
                            {alert.patientName} - Room {alert.roomNumber}
                          </Text>
                          {getStatusBadge(alert.status)}
                        </HStack>
                        
                        <HStack gap={4}>
                          <Text size="xs" className="text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                          </Text>
                          
                          {alert.organizationName && organization?.name !== alert.organizationName && (
                            <Badge variant="outline" size="xs">
                              {alert.organizationName}
                            </Badge>
                          )}
                          
                          {alert.acknowledgedByName && (
                            <Text size="xs" className="text-muted-foreground">
                              • {alert.acknowledgedByName}
                            </Text>
                          )}
                          
                          {alert.escalationLevel > 0 && (
                            <HStack gap={1} alignItems="center">
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
              );
            })}
          </VStack>
        )}

        {/* Empty State */}
        {alerts.length === 0 && (
          <VStack gap={3} alignItems="center" className="py-8">
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
  );
}