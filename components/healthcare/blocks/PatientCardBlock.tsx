import React, { useState, useTransition, useDeferredValue, useOptimistic, useMemo, useCallback, Suspense, use, useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import {
  Card,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Box,
  Avatar,
  Separator,
  Grid,
  Skeleton,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';

import { useResponsive , useResponsiveUtils } from '@/hooks/responsive';
import { api } from '@/lib/api/trpc';
import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { log } from '@/lib/core/debug/logger';
import { showUrgentNotification } from '@/lib/core/alert';

import { useFadeAnimation } from '@/lib/ui/animations/hooks';
import { haptic } from '@/lib/ui/haptics';
import { SpacingScale } from '@/lib/design';

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
  const theme = useTheme();
  const statusColors = {
    normal: healthcareColors.success,
    warning: healthcareColors.warning,
    critical: healthcareColors.emergency,
  };
  
  // Use deferred value for smooth animations
  const deferredStatus = useDeferredValue(status);
  
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
      padding={spacing.md}
      style={{
        height: goldenDimensions.heights.small,
        borderBottomWidth: 3,
        borderBottomColor: statusColors[deferredStatus],
        transition: `border-color ${{ spring: { damping: 15, stiffness: 100 } }.durations.fast}ms ${{ spring: { damping: 15, stiffness: 100 } }.easeGolden}`,
      }}
    >
      <VStack gap={2 as SpacingScale} alignItems="center">
        <HStack gap={spacing.xs} alignItems="center">
          <Text size="xs" colorTheme="mutedForeground">
            {label}
          </Text>
          {trend && (
            <Text size="xs" colorTheme={trend === 'up' ? 'destructive' : trend === 'down' ? 'success' : 'mutedForeground'}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </Text>
          )}
        </HStack>
        <HStack gap={2 as SpacingScale} alignItems="baseline">
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
  const { vitalFilter } = usePatientStore();
  const deferredFilter = useDeferredValue(vitalFilter);
  
  // Grid entrance animation
  const { animatedStyle: gridEntranceStyle, fadeIn } = useFadeAnimation({ 
    duration: 400,
    delay: 100 
  });
  
  useEffect(() => {
    fadeIn();
  }, [fadeIn]);
  
  // Use React 19's use() hook for data fetching
  const { data: vitals } = api.patient.getCurrentVitals.useQuery(
    { patientId, filter: deferredFilter },
    { suspense: true }
  );
  
  const getVitalStatus = useCallback((value: number, type: string): 'normal' | 'warning' | 'critical' => {
    // Implementation of vital status logic
    const ranges = {
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
      <Grid columns="repeat(auto-fit, minmax(89px, 1fr))" gap={spacing.md}>
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
const AlertIndicator = ({ alert, onAcknowledge }: { alert: any; onAcknowledge: () => void }) => {
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
      variant="solid" colorScheme="destructive"
      size="sm"
      onPress={handleAcknowledge}
      style={Platform.OS === 'web' ? {
        animation: 'pulse 1000ms infinite',
      } : {}}
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
      <Separator marginVertical={spacing.lg} />
      
      {/* Vital filter buttons */}
      <HStack gap={spacing.sm} marginBottom={spacing.md}>
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
            loading={isPending && vitalFilter === filter}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </HStack>
      
      <VStack gap={spacing.md}>
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
    <HStack gap={spacing.md} marginTop={spacing.lg}>
      <Button
        variant="solid"
        style={{ flex: 1.618 }}
        onPress={() => {
          startTransition(() => {
            log.info('View full chart clicked', 'PATIENT_CARD', { patientId });
          });
        }}
        loading={isPending}
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
    <Grid columns="repeat(auto-fit, minmax(89px, 1fr))" gap={spacing.md}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} height={goldenDimensions.heights.small} />
      ))}
    </Grid>
  );
};

// Main patient card component
export const PatientCardBlock = ({ patientId, onViewDetails }: { 
  patientId: string;
  onViewDetails?: (patientId: string) => void;
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { isMobile, isTablet } = useResponsive();
  const { getPlatformShadow, getResponsiveValue } = useResponsiveUtils();
  const queryClient = api.useUtils();
  const [isPending, startTransition] = useTransition();
  
  // Card entrance animation
  const { animatedStyle: cardEntranceStyle, fadeIn } = useFadeAnimation({ 
    duration: 500,
    delay: 50 
  });
  
  // Height animation for expansion
  const heightAnimation = useSharedValue(goldenDimensions.heights.large);
  
  useEffect(() => {
    fadeIn();
  }, []);
  
  // Zustand store with React 19 optimization
  const { expandedCards, toggleCardExpansion } = usePatientStore(
    (state) => ({
      expandedCards: state.expandedCards,
      toggleCardExpansion: state.toggleCardExpansion,
    }),
    shallow
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
  
  // Real-time vital signs subscription
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
        
        if (criticalVitals) {
          showUrgentNotification('Critical Vitals', `Patient ${patient?.name} has critical vitals`);
        }
      },
    }
  );
  
  // Acknowledge alert mutation with optimistic updates
  const acknowledgeMutation = api.healthcare.acknowledgePatientAlert.useMutation({
    onMutate: async ({ alertId }) => {
      const optimisticUpdate = {
        alertId,
        acknowledged: true,
        acknowledgedAt: new Date(),
      };
      
      queryClient.patient.getDetails.setData(
        { patientId },
        (old) => old ? {
          ...old,
          alerts: old.alerts.map((alert) =>
            alert.id === alertId
              ? { ...alert, ...optimisticUpdate }
              : alert
          ),
        } : old
      );
      
      return { previousData: queryClient.patient.getDetails.getData({ patientId }) };
    },
    onError: (err, variables, context) => {
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
      !optimisticExpanded ? goldenDimensions.heights.huge : goldenDimensions.heights.large,
      { damping: 15, stiffness: 100 }
    );
    
    startTransition(() => {
      toggleCardExpansion(patientId);
    });
  }, [optimisticExpanded, patientId, setOptimisticExpanded, toggleCardExpansion]);
  
  const animatedHeightStyle = useAnimatedStyle(() => ({
    height: heightAnimation.value,
  }));
  
  if (!patient) {
    return (
      <Card
        padding={spacing.xl}
        shadow={getPlatformShadow('md')}
        style={{ height: goldenDimensions.heights.large }}
      >
        <Skeleton height="100%" />
      </Card>
    );
  }
  
  return (
    <Animated.View style={[cardEntranceStyle, animatedHeightStyle]}>
      <Card
      padding={spacing.xl}
      shadow={getPlatformShadow('md')}
      style={{
        flex: 1,
      }}
    >
      {/* Header with React 19 transitions */}
      <HStack gap={spacing.lg} style={{ height: goldenDimensions.heights.medium }}>
        <Avatar
          size={goldenDimensions.heights.medium}
          source={patient.photo ? { uri: patient.photo } : undefined}
          name={patient.name}
        />
        
        <VStack flex={1} gap={spacing.sm}>
          <HStack justifyContent="space-between">
            <Text size="lg" weight="bold">{patient.name}</Text>
            <HStack gap={spacing.sm}>
              {patient.alerts.map((alert) => (
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
          
          <HStack gap={spacing.md}>
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
          
          <HStack gap={spacing.sm}>
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
          loading={isPending}
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