import React, { useEffect } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api/trpc';
import { format } from 'date-fns';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { useResponsive } from '@/hooks/responsive';
import { useAnimation } from '@/lib/ui/animations/hooks';
import { haptic } from '@/lib/ui/haptics';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useActiveOrganization } from '@/lib/stores/organization-store';
import { useHospitalContext } from '@/hooks/healthcare';
import { Card, Badge } from '@/components/universal/display';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { Skeleton } from '@/components/universal/feedback';
import { HStack, VStack, Box } from '@/components/universal/layout';
import {
  Symbol,
  Users,
  Heart,
  Activity,
  Thermometer,
  Clock,
  ChevronRightIcon,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from '@/components/universal/display/Symbols';
import { HealthcareOnly } from '@/components/blocks/auth/PermissionGuard';
import { useHealthcareAccess } from '@/hooks/usePermissions';

interface PatientData {
  id: string;
  name: string;
  age: number;
  condition: string;
  roomNumber: string;
  vitalSigns: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
  };
  lastChecked: Date;
  trend: 'improving' | 'stable' | 'declining';
  alerts: number;
}

interface ActivePatientsProps {
  scrollEnabled?: boolean;
}

export function ActivePatients({ scrollEnabled = true }: ActivePatientsProps) {
  const router = useRouter();
  const { spacing } = useSpacing();
  const { isLargeScreen } = useResponsive();
  const shadowMd = useShadow({ size: 'md' });
  const shadowSm = useShadow({ size: 'sm' });
  const { user } = useAuthStore();
  const { organization: activeOrganization, isLoading: orgLoading } = useActiveOrganization();
  const { canViewPatients, isMedicalStaff } = useHealthcareAccess();
  const { hospitalId, canAccessHealthcare } = useHospitalContext();
  
  // Animation hooks
  const { animatedStyle: blockFadeStyle } = useAnimation('fadeIn', { duration: 'normal' });
  const { animatedStyle: statsScaleStyle } = useAnimation('scaleIn', { duration: 'normal' });
  
  // Fetch active alerts data (using the correct API endpoint)
  const { data: alertsData, isLoading } = api.healthcare.getActiveAlerts.useQuery({
    hospitalId: hospitalId || '',
    limit: 5,
    offset: 0,
  }, {
    enabled: !!user && !!hospitalId && canAccessHealthcare,
  });
  
  // Mock patient data for now (since we're using alerts API)
  const patients = React.useMemo(() => {
    if (!alertsData?.alerts) return [];
    // Transform alerts to patient-like data for display
    return alertsData.alerts.map((alert: any) => {
      // Safe access with fallbacks
      const alertId = alert?.alert?.id || alert?.id || Math.random().toString();
      const roomNumber = alert?.alert?.roomNumber || alert?.roomNumber || 'Unknown';
      
      return {
        id: alertId,
        name: `Patient in Room ${roomNumber}`,
        age: Math.floor(Math.random() * 50) + 20,
        condition: (alert?.alert?.urgencyLevel || alert?.urgencyLevel || 3) <= 2 ? 'critical' : 'stable',
        roomNumber: roomNumber,
        vitalSigns: {
          heartRate: 75 + Math.floor(Math.random() * 20),
          bloodPressure: '120/80',
          temperature: 98.6 + (Math.random() * 2 - 1),
          oxygenSaturation: 95 + Math.floor(Math.random() * 5),
        },
        lastChecked: new Date(alert?.alert?.createdAt || alert?.createdAt || Date.now()),
        trend: Math.random() > 0.5 ? 'improving' : 'stable' as const,
        alerts: (alert?.alert?.status || alert?.status) === 'active' ? 1 : 0,
      };
    });
  }, [alertsData]);

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!patients) return { total: 0, critical: 0, improving: 0 };
    
    return {
      total: patients.length,
      critical: patients.filter((p: any) => p.condition === 'critical').length,
      improving: patients.filter((p: any) => p.trend === 'improving').length,
    };
  }, [patients]);
  
  // Don't render if no user or no permissions
  if (!user || !canViewPatients || !isMedicalStaff) {
    return null;
  }

  // Check if user has hospital assignment
  if (!hospitalId && !orgLoading) {
    return (
      <Animated.View 
        style={[
          Platform.OS !== 'web' && shadowMd,
          blockFadeStyle,
          { backgroundColor: 'white', borderRadius: 12, padding: spacing[4] }
        ]}
      >
        <VStack gap={spacing[3] as any} align="center">
          <Symbol name="building.2" size={48} color="muted" />
          <Text size="lg" weight="semibold" align="center">No Hospital Assigned</Text>
          <Text colorTheme="mutedForeground" align="center">
            Please contact your administrator to be assigned to a hospital
          </Text>
          <Button
            variant="default"
            size="sm"
            onPress={() => router.push('/(app)/(tabs)/settings')}
          >
            Go to Settings
          </Button>
        </VStack>
      </Animated.View>
    );
  }

  if (isLoading) {
    return (
      <Card style={shadowMd}>
        <VStack gap={4} style={{ padding: spacing[6] }}>
          <Skeleton className="h-8 w-48" />
          <VStack gap={3}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </VStack>
        </VStack>
      </Card>
    );
  }

  const getVitalIcon = (type: string) => {
    switch (type) {
      case 'heartRate':
        return <Heart size={16} className="text-destructive" />;
      case 'bloodPressure':
        return <Activity size={16} className="text-primary" />;
      case 'temperature':
        return <Thermometer size={16} className="text-warning" />;
      case 'oxygenSaturation':
        return <Activity size={16} className="text-info" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp size={16} className="text-success" />;
      case 'declining':
        return <TrendingDown size={16} className="text-destructive" />;
      default:
        return null;
    }
  };

  const formatVitalValue = (type: string, value: any) => {
    switch (type) {
      case 'heartRate':
        return `${value} bpm`;
      case 'bloodPressure':
        return value;
      case 'temperature':
        return `${value}°F`;
      case 'oxygenSaturation':
        return `${value}%`;
      default:
        return value;
    }
  };

  const getVitalStatus = (type: string, value: number) => {
    switch (type) {
      case 'heartRate':
        if (value < 60 || value > 100) return 'warning';
        return 'normal';
      case 'temperature':
        if (value < 97.0 || value > 99.5) return 'warning';
        return 'normal';
      case 'oxygenSaturation':
        if (value < 95) return 'warning';
        return 'normal';
      default:
        return 'normal';
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'critical':
        return <Badge variant="error" size="sm">Critical</Badge>;
      case 'stable':
        return <Badge variant="success" size="sm">Stable</Badge>;
      case 'improving':
        return <Badge variant="default" size="sm">Improving</Badge>;
      case 'monitoring':
        return <Badge variant="secondary" size="sm">Monitoring</Badge>;
      default:
        return <Badge variant="default" size="sm">{condition}</Badge>;
    }
  };

  const renderPatientCard = (patient: PatientData, index: number) => {
    return (
      <Card
        key={patient.id}
        pressable
        onPress={() => {
          haptic('light');
          router.push(`/(healthcare)/patient-details?id=${patient.id}` as any);
        }}
        className="border border-border"
        style={shadowSm}
      >
          <Box p={3}>
          <VStack gap={3}>
            {/* Patient Header */}
            <HStack className="justify-between items-start">
              <VStack gap={1}>
                <Text className="text-base font-semibold">{patient.name}</Text>
                <HStack gap={2} className="items-center">
                  <Text className="text-sm text-muted-foreground">
                    {patient.age} years • Room {patient.roomNumber}
                  </Text>
                  {patient.alerts > 0 && (
                    <Badge variant="error" size="xs">
                      <AlertCircle size={12} />
                      <Text className="ml-1">{patient.alerts}</Text>
                    </Badge>
                  )}
                </HStack>
              </VStack>
              <HStack gap={2} className="items-center">
                {getTrendIcon(patient.trend)}
                {getConditionBadge(patient.condition)}
              </HStack>
            </HStack>

            {/* Vital Signs */}
            <HStack gap={4} className="flex-wrap">
              {Object.entries(patient.vitalSigns).map(([key, value]) => {
                const status = getVitalStatus(key, typeof value === 'number' ? value : 0);
                return (
                  <HStack key={key} gap={1} className="items-center">
                    {getVitalIcon(key)}
                    <Text 
                      size="sm"
                      className={cn(
                        status === 'warning' ? 'text-warning font-medium' : 'text-foreground'
                      )}
                    >
                      {formatVitalValue(key, value)}
                    </Text>
                  </HStack>
                );
              })}
            </HStack>

            {/* Last Checked */}
            <HStack gap={1} className="items-center">
              <Clock size={14} className="text-muted-foreground" />
              <Text className="text-xs text-muted-foreground">
                Last checked {format(patient.lastChecked, 'h:mm a')}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </Card>
    );
  };

  return (
    <Animated.View style={blockFadeStyle}>
      <Card style={shadowMd}>
        <Box p={3}>
          <VStack gap={3}>
          {/* Header */}
          <HStack className="justify-between items-center">
            <HStack gap={2} className="items-center">
              <Users size={24} className="text-primary" />
              <Text className="text-xl font-semibold">Active Patients</Text>
            </HStack>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                haptic('light');
                router.push('/(healthcare)/patients' as any);
              }}
            >
              <Text>View All</Text>
              <ChevronRightIcon size={16} />
            </Button>
          </HStack>

          {/* Stats */}
          <Animated.View style={statsScaleStyle}>
            <HStack gap={6}>
              <HStack gap={1} className="items-center">
                <Text className="text-lg font-bold">{stats.total}</Text>
                <Text className="text-sm text-muted-foreground">Total</Text>
              </HStack>
              
              <HStack gap={1} className="items-center">
                <View className="w-2 h-2 rounded-full bg-destructive" />
                <Text className="text-lg font-bold">{stats.critical}</Text>
                <Text className="text-sm text-muted-foreground">Critical</Text>
              </HStack>
              
              <HStack gap={1} className="items-center">
                <View className="w-2 h-2 rounded-full bg-success" />
                <Text className="text-lg font-bold">{stats.improving}</Text>
                <Text className="text-sm text-muted-foreground">Improving</Text>
              </HStack>
            </HStack>
          </Animated.View>

          {/* Patient List */}
          {scrollEnabled ? (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: isLargeScreen ? 400 : 300 }}
            >
              <VStack gap={3}>
                {patients?.slice(0, 5).map((patient: any, index: number) => renderPatientCard(patient, index))}
              </VStack>
            </ScrollView>
          ) : (
            <VStack gap={3}>
              {patients?.slice(0, 5).map((patient: any, index: number) => renderPatientCard(patient, index))}
            </VStack>
          )}

          {/* Empty State */}
          {(!patients || patients.length === 0) && (
            <View className="py-8 items-center">
              <Users size={48} className="text-muted-foreground mb-2" />
              <Text className="text-muted-foreground">No active patients</Text>
            </View>
          )}
          </VStack>
        </Box>
      </Card>
    </Animated.View>
  );
}