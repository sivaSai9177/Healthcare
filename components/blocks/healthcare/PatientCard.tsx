import React, { useTransition, useDeferredValue, useOptimistic, useCallback, Suspense, useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  Card,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Avatar,
  Separator,
  Grid,
  Skeleton,
} from '@/components/universal';
import { cn } from '@/lib/core/utils';
import { api } from '@/lib/api/trpc';
import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { log } from '@/lib/core/debug/logger';

import { useAnimation } from '@/lib/ui/animations/hooks';
import { haptic } from '@/lib/ui/haptics';
// Height constants for cards
const heights = {
  small: 80,
  medium: 144,
  large: 200,
  huge: 400
};

// Patient state management
interface PatientState {
  selectedPatientId: string | null;
  expandedCards: Set<string>;
  vitalFilter: 'all' | 'critical' | 'warning' | 'normal';
  selectPatient: (id: string) => void;
  toggleCardExpansion: (id: string) => void;
  setVitalFilter: (filter: 'all' | 'critical' | 'warning' | 'normal') => void;
}

const usePatientStore = create<PatientState>()(
  devtools(
    subscribeWithSelector((set) => ({
      selectedPatientId: null,
      expandedCards: new Set(),
      vitalFilter: 'all',
      
      selectPatient: (id) => set({ selectedPatientId: id }),
      
      toggleCardExpansion: (id) =>
        set((state) => {
          const newExpanded = new Set(state.expandedCards);
          if (newExpanded.has(id)) {
            newExpanded.delete(id);
          } else {
            newExpanded.add(id);
          }
          return { expandedCards: newExpanded };
        }),
        
      setVitalFilter: (filter) => set({ vitalFilter: filter }),
    })),
    {
      name: 'patient-store',
    }
  )
);

// Vital sign component with React 19 optimizations
const VitalSign = React.memo(({ 
  label, 
  value, 
  unit, 
  status,
  trend 
}: { 
  label: string;
  value: string | number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}) => {
  const statusClasses = {
    normal: 'border-b-success',
    warning: 'border-b-warning',
    critical: 'border-b-destructive',
  };
  
  // Use deferred value for smooth animations
  const deferredStatus = useDeferredValue(status) as 'normal' | 'warning' | 'critical';
  
  // Pulse animation for critical status
  const pulseAnimation = useSharedValue(1);
  
  useEffect(() => {
    if (status === 'critical') {
      pulseAnimation.value = withSpring(
        1.05,
        { damping: 2, stiffness: 80 },
        () => {
          pulseAnimation.value = withSpring(1, { damping: 2, stiffness: 80 });
        }
      );
    }
  }, [status, pulseAnimation]);
  
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));
  
  return (
    <Animated.View style={status === 'critical' ? animatedCardStyle : {}}>
      <Card
      className={cn("p-4 border-b-[3px] h-[120px]", statusClasses[deferredStatus])}
    >
      <VStack gap={2} align="center">
        <HStack gap={1} align="center">
          <Text size="xs" colorTheme="mutedForeground">
            {label}
          </Text>
          {trend && (
            <Text size="xs" colorTheme={trend === 'up' ? 'destructive' : trend === 'down' ? 'success' : 'mutedForeground'}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </Text>
          )}
        </HStack>
        <HStack gap={2} className="items-baseline">
          <Text weight="bold" size="lg">
            {value}
          </Text>
          <Text size="xs" colorTheme="mutedForeground">
            {unit}
          </Text>
        </HStack>
      </VStack>
    </Card>
    </Animated.View>
  );
});

VitalSign.displayName = 'VitalSign';

// Vitals grid component with suspense
const VitalsGrid = ({ patientId }: { patientId: string }) => {
  // const { vitalFilter } = usePatientStore(); // For future filtering
  // const deferredFilter = useDeferredValue(vitalFilter); // Not currently used
  
  // Grid entrance animation
  const { animatedStyle: gridEntranceStyle, trigger: fadeInGrid } = useAnimation('fadeIn');
  
  useEffect(() => {
    fadeInGrid();
  }, [fadeInGrid]);
  
  // Use React 19's use() hook for data fetching
  const { data: vitals } = api.patient.getCurrentVitals.useQuery(
    { patientId },
    { suspense: true }
  );
  
  const getVitalStatus = useCallback((value: number, type: string): 'normal' | 'warning' | 'critical' => {
    // Implementation of vital status logic
    const ranges: Record<string, { normal: number[], warning: number[] }> = {
      heartRate: { normal: [60, 100], warning: [50, 110] },
      bloodPressureSystolic: { normal: [90, 140], warning: [80, 160] },
      bloodPressureDiastolic: { normal: [60, 90], warning: [50, 100] },
      oxygen: { normal: [95, 100], warning: [90, 94] },
      temperature: { normal: [36.5, 37.5], warning: [36, 38] },
      respiratoryRate: { normal: [12, 20], warning: [10, 25] },
    };
    
    const range = ranges[type];
    if (!range) return 'normal';
    
    if (value >= range.normal[0] && value <= range.normal[1]) return 'normal';
    if (value >= range.warning[0] && value <= range.warning[1]) return 'warning';
    return 'critical';
  }, []);
  
  if (!vitals) return null;
  
  return (
    <Animated.View style={gridEntranceStyle}>
      <Grid columns={4} gap={3}>
      <VitalSign
        label="HR"
        value={vitals.heartRate}
        unit="bpm"
        status={getVitalStatus(vitals.heartRate, 'heartRate')}
        trend={vitals.heartRateTrend}
      />
      <VitalSign
        label="BP"
        value={`${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`}
        unit="mmHg"
        status={getVitalStatus(vitals.bloodPressure.systolic, 'bloodPressureSystolic')}
        trend={vitals.bloodPressureTrend}
      />
      <VitalSign
        label="O₂"
        value={vitals.oxygen}
        unit="%"
        status={getVitalStatus(vitals.oxygen, 'oxygen')}
        trend={vitals.oxygenTrend}
      />
      <VitalSign
        label="Temp"
        value={vitals.temperature}
        unit="°C"
        status={getVitalStatus(vitals.temperature, 'temperature')}
        trend={vitals.temperatureTrend}
      />
      <VitalSign
        label="RR"
        value={vitals.respiratoryRate}
        unit="/min"
        status={getVitalStatus(vitals.respiratoryRate, 'respiratoryRate')}
        trend={vitals.respiratoryRateTrend}
      />
    </Grid>
    </Animated.View>
  );
};

// Alert indicator with optimistic updates
interface AlertIndicatorProps {
  alert: {
    id: string;
    type: 'critical' | 'warning' | 'normal';
    acknowledged: boolean;
  };
  onAcknowledge: () => void;
}

const AlertIndicator = ({ alert, onAcknowledge }: AlertIndicatorProps) => {
  const [optimisticAcknowledged, setOptimisticAcknowledged] = useOptimistic(
    alert.acknowledged,
    (_, newState: boolean) => newState
  );
  
  const handleAcknowledge = useCallback(() => {
    haptic('success');
    setOptimisticAcknowledged(true);
    onAcknowledge();
  }, [onAcknowledge, setOptimisticAcknowledged]);
  
  if (optimisticAcknowledged) {
    return (
      <Badge variant="secondary" size="sm">
        ✓
      </Badge>
    );
  }
  
  return (
    <Button
      variant="destructive"
      size="sm"
      onPress={handleAcknowledge}
      style={Platform.OS === 'web' ? {
        animationName: 'pulse',
        animationDuration: '1000ms',
        animationIterationCount: 'infinite'
      } as any : {}}
    >
      {alert.type === 'critical' ? '🚨' : '⚠️'}
    </Button>
  );
};

// Expanded patient content lazy loaded
const ExpandedPatientContent = ({ patientId }: { patientId: string }) => {
  const [isPending, startTransition] = useTransition();
  const { vitalFilter, setVitalFilter } = usePatientStore();
  
  return (
    <>
      <Separator className="my-4" />
      
      {/* Vital filter buttons */}
      <HStack gap={2} className="mb-3">
        {(['all', 'critical', 'warning', 'normal'] as const).map((filter) => (
          <Button
            key={filter}
            variant={vitalFilter === filter ? "default" : "outline"}
            size="sm"
            onPress={() => {
              haptic('light');
              startTransition(() => {
                setVitalFilter(filter);
              });
            }}
            isLoading={isPending && vitalFilter === filter}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </HStack>
      
      <VStack gap={3}>
        <Text weight="medium">Current Vitals</Text>
        <Suspense fallback={<VitalsSkeleton />}>
          <VitalsGrid patientId={patientId} />
        </Suspense>
      </VStack>
      
      <QuickActionsBar patientId={patientId} />
    </>
  );
};

// Quick actions bar
const QuickActionsBar = ({ patientId }: { patientId: string }) => {
  const [isPending, startTransition] = useTransition();
  
  return (
    <HStack gap={3} className="mt-4">
      <Button
        variant="default"
        style={{ flex: 1.618 }}
        onPress={() => {
          startTransition(() => {
            log.info('View full chart clicked', 'PATIENT_CARD', { patientId });
          });
        }}
        isLoading={isPending}
      >
        View Full Chart
      </Button>
      <Button
        variant="outline"
        style={{ flex: 1 }}
        onPress={() => {
          startTransition(() => {
            log.info('Contact doctor clicked', 'PATIENT_CARD', { patientId });
          });
        }}
      >
        Contact Doctor
      </Button>
      <Button
        variant="ghost"
        style={{ flex: 0.618 }}
        onPress={() => {
          log.info('More options clicked', 'PATIENT_CARD', { patientId });
        }}
      >
        •••
      </Button>
    </HStack>
  );
};

// Vitals skeleton loader
const VitalsSkeleton = () => {
  return (
    <Grid columns={4} gap={3}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </Grid>
  );
};

// Main patient card component
export const PatientCardBlock = ({ patientId }: { 
  patientId: string;
  onViewDetails?: (patientId: string) => void;
}) => {
  const queryClient = api.useUtils();
  const [isPending, startTransition] = useTransition();
  
  // Card entrance animation
  const { animatedStyle: cardEntranceStyle, trigger: fadeInCard } = useAnimation('fadeIn');
  
  // Height animation for expansion
  const heightAnimation = useSharedValue(heights.large);
  
  useEffect(() => {
    fadeInCard();
  }, [fadeInCard]);
  
  // Zustand store with React 19 optimization
  const expandedCards = usePatientStore(
    (state: PatientState) => state.expandedCards
  );
  const toggleCardExpansion = usePatientStore(
    (state: PatientState) => state.toggleCardExpansion
  );
  
  const isExpanded = expandedCards.has(patientId);
  
  // Use React 19's optimistic state for expansion
  const [optimisticExpanded, setOptimisticExpanded] = useOptimistic(
    isExpanded,
    (_, newState: boolean) => newState
  );
  
  // Fetch patient data
  const { data: patient } = api.patient.getDetails.useQuery(
    { patientId },
    {
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    }
  );
  
  // Commented out subscription as it's not available in current API
  // TODO: Add real-time subscription when available
  /*
  api.patient.subscribeToVitals.useSubscription(
    { patientId },
    {
      onData: (vitals) => {
        queryClient.patient.getDetails.setData(
          { patientId },
          (old) => old ? { ...old, vitals, lastUpdated: new Date() } : old
        );
        
        // Check for critical values
        const criticalVitals = ['heartRate', 'oxygen', 'bloodPressure'].some(
          vital => vitals[vital]?.status === 'critical'
        );
        
        if (criticalVitals && Platform.OS === 'web') {
          // Show browser notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Critical Vitals', {
              body: `Patient ${patient?.name} has critical vitals`,
              icon: '/icon.png'
            });
          }
        }
      },
    }
  );
  */
  
  // Acknowledge alert mutation with optimistic updates
  const acknowledgeMutation = api.healthcare.acknowledgePatientAlert.useMutation({
    onMutate: async (variables: { alertId: string }) => {
      const alertId = variables.alertId;
      const optimisticUpdate = {
        alertId,
        acknowledged: true,
        acknowledgedAt: new Date(),
      };
      
      queryClient.patient.getDetails.setData(
        { patientId },
        (old: any) => old ? {
          ...old,
          alerts: old.alerts.map((alert: any) =>
            alert.id === alertId
              ? { ...alert, ...optimisticUpdate }
              : alert
          ),
        } : old
      );
      
      return { previousData: queryClient.patient.getDetails.getData({ patientId }) };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.patient.getDetails.setData({ patientId }, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.patient.getDetails.invalidate({ patientId });
    },
  });
  
  const handleToggleExpansion = useCallback(() => {
    haptic('light');
    setOptimisticExpanded(!optimisticExpanded);
    
    // Animate height
    heightAnimation.value = withSpring(
      !optimisticExpanded ? heights.huge : heights.large,
      { damping: 15, stiffness: 100 }
    );
    
    startTransition(() => {
      toggleCardExpansion(patientId);
    });
  }, [optimisticExpanded, patientId, setOptimisticExpanded, toggleCardExpansion, heightAnimation]);
  
  const animatedHeightStyle = useAnimatedStyle(() => ({
    height: heightAnimation.value,
  }));
  
  if (!patient) {
    return (
      <Card
        className="p-6"
        style={{ height: heights.large }}
      >
        <Skeleton className="h-full" />
      </Card>
    );
  }
  
  return (
    <Animated.View style={[cardEntranceStyle, animatedHeightStyle]}>
      <Card
        className="p-6"
        style={{
          flex: 1,
        }}
      >
      {/* Header with React 19 transitions */}
      <HStack gap={4} style={{ height: heights.medium }}>
        <Avatar
          size="lg"
          source={patient.photo ? { uri: patient.photo } : undefined}
          name={patient.name}
        />
        
        <VStack flex={1} gap={2}>
          <HStack justifyContent="space-between">
            <Text size="lg" weight="bold">{patient.name}</Text>
            <HStack gap={2}>
              {patient.alerts.map((alert: any) => (
                <AlertIndicator
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => {
                    startTransition(() => {
                      acknowledgeMutation.mutate({ alertId: alert.id });
                    });
                  }}
                />
              ))}
            </HStack>
          </HStack>
          
          <HStack gap={3}>
            <Text colorTheme="mutedForeground" size="sm">
              {patient.age}yo • {patient.gender}
            </Text>
            <Separator orientation="vertical" style={{ height: 13 }} />
            <Text size="sm">
              MRN: {patient.mrn}
            </Text>
            <Separator orientation="vertical" style={{ height: 13 }} />
            <Text size="sm">
              Room {patient.room}
            </Text>
          </HStack>
          
          <HStack gap={2}>
            <Badge variant="outline" size="sm">
              {patient.department}
            </Badge>
            {patient.primaryCondition && (
              <Badge variant="secondary" size="sm">
                {patient.primaryCondition}
              </Badge>
            )}
            {patient.flags?.dnr && (
              <Badge variant="error" size="sm">
                DNR
              </Badge>
            )}
          </HStack>
        </VStack>
        
        <Button
          variant="ghost"
          size="sm"
          onPress={handleToggleExpansion}
          isLoading={isPending}
        >
          {optimisticExpanded ? '⌃' : '⌄'}
        </Button>
      </HStack>
      
      {/* Expanded content with lazy loading */}
      {optimisticExpanded && (
        <Suspense fallback={<VitalsSkeleton />}>
          <ExpandedPatientContent patientId={patientId} />
        </Suspense>
      )}
    </Card>
    </Animated.View>
  );
};