import React, { useState, useEffect } from 'react';
import { Platform, Pressable, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, ScrollView, Dimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Card,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  TextArea,
  Alert,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';
import { useShadow } from '@/hooks/useShadow';
import { haptic } from '@/lib/ui/haptics';
import { api } from '@/lib/api/trpc';
import { logger } from '@/lib/core/debug/unified-logger';
import { useHospitalContext } from '@/hooks/healthcare';
// ProfileIncompletePrompt removed - hospital selection is now optional
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, interpolate } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ShiftStatusProps {
  onShiftToggle?: () => void;
}

export const ShiftStatus: React.FC<ShiftStatusProps> = ({ onShiftToggle }) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const shadowMd = useShadow({ size: 'md' });
  const router = useRouter();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHandoverSheet, setShowHandoverSheet] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isToggling, setIsToggling] = useState(false);
  const hospitalContext = useHospitalContext();
  
  // Animation values - always create them
  const pulseScale = useSharedValue(1);
  
  // State that depends on calculations
  const [shiftDuration, setShiftDuration] = useState<{ hours: number; minutes: number; formatted: string } | null>(null);
  
  // Log component mount
  useEffect(() => {
    logger.healthcare.info('ShiftStatus component mounted', {
      hospitalId: hospitalContext.hospitalId,
      hasValidHospital: hospitalContext.hasValidHospital,
      error: hospitalContext.error
    });
    return () => {
      logger.healthcare.info('ShiftStatus component unmounted');
    };
  }, [hospitalContext]);
  
  // Calculate shift duration - memoized to avoid dependency issues
  const calculateShiftDuration = React.useCallback((onDutyStatus: any) => {
    if (!onDutyStatus?.isOnDuty || !onDutyStatus?.shiftStartTime) return null;
    
    const start = new Date(onDutyStatus.shiftStartTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, formatted: `${hours}h ${minutes}m` };
  }, []);
  
  // Use validated hospital ID from context
  const validHospitalId = hospitalContext.hospitalId || '';
  
  // Queries
  const { data: onDutyStatus, refetch: refetchStatus, error: statusError } = api.healthcare.getOnDutyStatus.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
    enabled: hospitalContext.canAccessHealthcare,
  });
  
  const { data: onDutyStaff, error: staffError } = api.healthcare.getOnDutyStaff.useQuery(
    { 
      hospitalId: validHospitalId,
      department: undefined 
    },
    {
      enabled: !!onDutyStatus?.isOnDuty && hospitalContext.canAccessHealthcare && !!validHospitalId,
      refetchInterval: 300000, // Refresh every 5 minutes
    }
  );
  
  const { data: activeAlerts, error: alertsError } = api.healthcare.getActiveAlerts.useQuery(
    { hospitalId: validHospitalId },
    {
      enabled: !!onDutyStatus?.isOnDuty && hospitalContext.canAccessHealthcare && !!validHospitalId,
    }
  );
  
  // Log any API errors
  useEffect(() => {
    if (statusError) {
      logger.healthcare.error('Failed to fetch duty status', { error: statusError.message });
    }
    if (staffError) {
      logger.healthcare.error('Failed to fetch on-duty staff', { error: staffError.message });
    }
    if (alertsError) {
      logger.healthcare.error('Failed to fetch active alerts', { error: alertsError.message });
    }
  }, [statusError, staffError, alertsError]);
  
  // Mutations
  const toggleOnDutyMutation = api.healthcare.toggleOnDuty.useMutation({
    onMutate: (variables) => {
      if (variables && typeof variables === 'object') {
        logger.healthcare.info('Starting shift toggle', { 
          isOnDuty: 'isOnDuty' in variables ? variables.isOnDuty : undefined,
          hasHandoverNotes: 'handoverNotes' in variables ? !!variables.handoverNotes : false
        });
      }
    },
    onSuccess: (data) => {
      logger.healthcare.info('Shift status toggled successfully', { 
        isOnDuty: data.isOnDuty,
        shiftDuration: 'shiftDuration' in data ? data.shiftDuration : undefined,
        success: data.success
      });
      refetchStatus();
      setShowConfirmModal(false);
      setHandoverNotes('');
      onShiftToggle?.();
      
      // Show feedback
      if (data.isOnDuty) {
        logger.healthcare.info('Shift started', { timestamp: new Date().toISOString() });
        haptic('medium');
        
        // Navigate to dashboard on mobile after starting shift
        if (Platform.OS !== 'web') {
          setTimeout(() => {
            router.push('/(tabs)/home' as any);
          }, 500);
        }
      } else if ('shiftDuration' in data && data.shiftDuration) {
        logger.healthcare.info('Shift ended', { 
          durationMinutes: data.shiftDuration,
          durationFormatted: `${Math.floor(data.shiftDuration / 60)}h ${data.shiftDuration % 60}m`
        });
        haptic('success');
        
        // Navigate to dashboard on mobile after ending shift
        if (Platform.OS !== 'web') {
          setTimeout(() => {
            router.push('/(tabs)/home' as any);
          }, 500);
        }
      }
    },
    onError: (error) => {
      logger.healthcare.error('Failed to toggle shift', { 
        error: error.message,
        code: error.data?.code 
      });
      haptic('error');
    },
  });
  
  // Update shift duration every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const duration = calculateShiftDuration(onDutyStatus);
      setShiftDuration(duration);
      if (duration) {
        logger.healthcare.debug('Shift duration updated', { 
          hours: duration.hours,
          minutes: duration.minutes,
          formatted: duration.formatted 
        });
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [onDutyStatus, calculateShiftDuration]);
  
  // Log query data changes
  useEffect(() => {
    if (onDutyStatus !== undefined) {
      logger.healthcare.info('Duty status loaded', {
        isOnDuty: onDutyStatus?.isOnDuty,
        shiftStartTime: onDutyStatus?.shiftStartTime,
        shiftEndTime: onDutyStatus?.shiftEndTime
      });
    }
  }, [onDutyStatus]);
  
  useEffect(() => {
    if (onDutyStaff) {
      logger.healthcare.info('On-duty staff loaded', {
        total: onDutyStaff.total,
        staffCount: onDutyStaff.staff.length
      });
    }
  }, [onDutyStaff]);
  
  // Pulse animation for active shift
  useEffect(() => {
    if (onDutyStatus?.isOnDuty) {
      pulseScale.value = withSpring(1.05, { damping: 10 }, () => {
        pulseScale.value = withSpring(1, { damping: 10 });
      });
    }
  }, [onDutyStatus?.isOnDuty, pulseScale]);
  
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: interpolate(pulseScale.value, [1, 1.05], [0.5, 0]),
    };
  });
  
  // Return null if no hospital is selected - shift status is only available with a hospital
  if (!hospitalContext.hospitalId) {
    logger.healthcare.debug('ShiftStatus: No hospital selected');
    return null;
  }
  
  // Return null if no valid hospital context
  if (!hospitalContext.hasValidHospital || !hospitalContext.hospitalId) {
    logger.healthcare.warn('ShiftStatus: No valid hospital context', {
      error: hospitalContext.error,
      errorMessage: hospitalContext.errorMessage
    });
    return null;
  }
  
  // Removed handleToggleShift - using shift-management modal instead
  
  const handleConfirmEndShift = () => {
    logger.healthcare.info('Confirming end shift with handover', {
      hasNotes: !!handoverNotes.trim(),
      notesLength: handoverNotes.trim().length
    });
    
    setIsToggling(true);
    toggleOnDutyMutation.mutate({
      isOnDuty: false,
      handoverNotes: handoverNotes.trim() || undefined,
    });
    setIsToggling(false);
  };
  
  return (
    <>
      <Animated.View 
        entering={FadeIn}
        style={animatedStyle}
      >
        <VStack gap={3 as any}>
          {/* Simplified Header */}
          <HStack justifyContent="space-between" alignItems="center">
            <HStack gap={3 as any} alignItems="center">
              {/* Status Indicator */}
              <View style={{ position: 'relative' }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: onDutyStatus?.isOnDuty ? theme.success : theme.muted,
                    borderWidth: 2,
                    borderColor: theme.background,
                  }}
                />
                {onDutyStatus?.isOnDuty && (
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: theme.success,
                      },
                      pulseAnimatedStyle,
                    ]}
                  />
                )}
              </View>
              
              <VStack gap={0.5 as any}>
                <Text weight="semibold" size="sm">
                  {onDutyStatus?.isOnDuty ? 'On Duty' : 'Off Duty'}
                </Text>
                {onDutyStatus?.isOnDuty && shiftDuration && (
                  <Text size="xs" colorTheme="mutedForeground">
                    {shiftDuration.formatted}
                  </Text>
                )}
              </VStack>
            </HStack>
            
            <Button
              onPress={() => {
                haptic('light');
                router.push('/(modals)/shift-management' as any);
              }}
              variant={onDutyStatus?.isOnDuty ? 'outline' : 'default'}
              size="sm"
            >
              {onDutyStatus?.isOnDuty ? 'End Shift' : 'Start Shift'}
            </Button>
          </HStack>
          
          {/* Shift Info - Compact */}
          {onDutyStatus?.isOnDuty && (
            <HStack gap={4 as any} justifyContent="space-between">
              <HStack gap={3 as any}>
                {/* Active Alerts */}
                {activeAlerts && (
                  <HStack gap={1.5 as any} alignItems="center">
                    <Text size="xs" colorTheme="mutedForeground">Alerts:</Text>
                    <Badge 
                      variant={activeAlerts.alerts.length > 0 ? 'error' : 'outline'}
                      size="xs"
                    >
                      <Text>{activeAlerts.alerts.length}</Text>
                    </Badge>
                  </HStack>
                )}
                
                {/* On-Duty Count */}
                {onDutyStaff && onDutyStaff.total > 1 && (
                  <HStack gap={1.5 as any} alignItems="center">
                    <Text size="xs" colorTheme="mutedForeground">Staff:</Text>
                    <Badge variant="outline" size="xs">
                      <Text>{onDutyStaff.total}</Text>
                    </Badge>
                  </HStack>
                )}
              </HStack>
              
              {/* Handover Button */}
              {onDutyStatus?.isOnDuty && (
                <Pressable
                  onPress={() => router.push('/(app)/shifts/handover' as any)}
                  style={{
                    paddingHorizontal: spacing[2],
                    paddingVertical: spacing[1],
                  }}
                >
                  <Text size="xs" weight="medium" colorTheme="primary">
                    Handover →
                  </Text>
                </Pressable>
              )}
            </HStack>
          )}
        </VStack>
      </Animated.View>
      
      {/* End Shift Confirmation Dialog */}
      {Platform.OS === 'web' ? (
        <Dialog 
          open={showConfirmModal} 
          onOpenChange={setShowConfirmModal}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>End Shift Confirmation</DialogTitle>
              <DialogDescription>
                You have {activeAlerts?.alerts.length || 0} active alerts. Please add handover notes for the incoming shift.
              </DialogDescription>
            </DialogHeader>
            
            <VStack gap={4 as any} p={4 as any}>
              <Alert variant="warning">
                <Text size="sm">
                  All active alerts should be properly handed over to ensure continuity of care.
                </Text>
              </Alert>
              
              <VStack gap={2 as any}>
                <Text weight="medium">Handover Notes</Text>
                <TextArea
                  placeholder="Add important information for the incoming shift..."
                  value={handoverNotes}
                  onChangeText={setHandoverNotes}
                  rows={4}
                />
              </VStack>
            </VStack>
            
            <DialogFooter>
              <HStack gap={2 as any}>
                <Button
                  variant="outline"
                  onPress={() => setShowConfirmModal(false)}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onPress={handleConfirmEndShift}
                  isLoading={isToggling}
                  fullWidth
                >
                  End Shift
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        // Mobile-specific modal using React Native Modal
        <Modal
          visible={showConfirmModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowConfirmModal(false)}>
            <Box
              flex={1}
              bg="rgba(0,0,0,0.5)"
              justifyContent="flex-end"
            >
              <TouchableWithoutFeedback>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                  <Box
                    bg={theme.background}
                    p={6 as any}
                    style={[shadowMd, { paddingBottom: spacing[8], borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}
                  >
                    <VStack gap={4 as any}>
                      <HStack justifyContent="space-between" alignItems="center">
                        <Text size="lg" weight="semibold">End Shift</Text>
                        <Pressable 
                          onPress={() => setShowConfirmModal(false)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text size="2xl" colorTheme="mutedForeground">×</Text>
                        </Pressable>
                      </HStack>
                      
                      <Alert variant="warning">
                        <Text size="sm">
                          {activeAlerts?.alerts.length || 0} active alerts need handover
                        </Text>
                      </Alert>
                      
                      <VStack gap={2 as any}>
                        <Text weight="medium">Handover Notes</Text>
                        <TextArea
                          placeholder="Add important information..."
                          value={handoverNotes}
                          onChangeText={setHandoverNotes}
                          rows={3}
                          autoFocus
                        />
                      </VStack>
                      
                      <HStack gap={2 as any}>
                        <Button
                          variant="outline"
                          onPress={() => {
                            setShowConfirmModal(false);
                            setHandoverNotes('');
                          }}
                          fullWidth
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onPress={handleConfirmEndShift}
                          isLoading={isToggling}
                          fullWidth
                        >
                          End Shift
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                </KeyboardAvoidingView>
              </TouchableWithoutFeedback>
            </Box>
          </TouchableWithoutFeedback>
        </Modal>
      )}
      
      {/* Shift Handover Sheet for Mobile */}
      {Platform.OS !== 'web' && (
        <Modal
          visible={showHandoverSheet}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowHandoverSheet(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowHandoverSheet(false)}>
            <Box
              flex={1}
              bg="rgba(0,0,0,0.5)"
              justifyContent="flex-end"
            >
              <TouchableWithoutFeedback>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                  <Box
                    bg={theme.background}
                    height={SCREEN_HEIGHT * 0.85}
                    style={[shadowMd, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}
                  >
                    {/* Header */}
                    <HStack
                      justifyContent="space-between"
                      alignItems="center"
                      p={spacing[4] as any}
                      style={{
                        borderBottomWidth: 1,
                        borderBottomColor: theme.mutedForeground + '20'
                      }}
                    >
                      <Text size="lg" weight="semibold">Shift Handover</Text>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          setShowHandoverSheet(false);
                          router.push('/(tabs)/home' as any);
                        }}
                      >
                        <Text size="sm">Back to Dashboard</Text>
                      </Button>
                    </HStack>
                    
                    {/* Content */}
                    <ScrollView
                      contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}
                      showsVerticalScrollIndicator={false}
                    >
                      <ShiftHandoverContent />
                    </ScrollView>
                  </Box>
                </KeyboardAvoidingView>
              </TouchableWithoutFeedback>
            </Box>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
};

// Simplified shift handover content component for the sheet
const ShiftHandoverContent: React.FC = () => {
  const { spacing } = useSpacing();
  const [handoverNotes, setHandoverNotes] = useState('');
  
  // Mock data for demonstration
  const activeAlerts = [
    {
      id: '1',
      patientName: 'John Doe',
      roomNumber: '205A',
      alertType: 'Medical Emergency',
      urgencyLevel: 2,
      status: 'acknowledged',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      roomNumber: '312B',
      alertType: 'Monitoring Required',
      urgencyLevel: 3,
      status: 'active',
    },
  ];
  
  return (
    <VStack gap={4 as any} className="h-full">
      {/* Active Alerts Summary */}
      <Alert variant="warning">
        <Text size="sm">
          {activeAlerts.length} active alerts require handover to incoming shift
        </Text>
      </Alert>
      
      {/* Active Alerts List */}
      <VStack gap={3 as any}>
        <Text size="base" weight="semibold">Active Alerts</Text>
        <VStack gap={2 as any}>
          {activeAlerts.map((alert) => (
            <Card key={alert.id} className="p-3">
              <VStack gap={1 as any}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text size="sm" weight="medium">{alert.alertType}</Text>
                  <Badge variant="outline" size="sm"><Text>Level {alert.urgencyLevel}</Text></Badge>
                </HStack>
                <Text size="xs" colorTheme="mutedForeground">
                  {alert.patientName} • Room {alert.roomNumber}
                </Text>
                <Badge 
                  variant={alert.status === 'active' ? 'error' : 'default'} 
                  size="sm"
                >
                  <Text>{alert.status}</Text>
                </Badge>
              </VStack>
            </Card>
          ))}
        </VStack>
      </VStack>
      
      {/* Handover Notes */}
      <VStack gap={spacing[2] as any} className="flex-1">
        <Text size="base" weight="semibold">Handover Notes</Text>
        <TextArea
          placeholder="Add important information for the incoming shift..."
          value={handoverNotes}
          onChangeText={setHandoverNotes}
          rows={4}
          className="flex-1"
        />
      </VStack>
      
      {/* Action Buttons */}
      <HStack gap={spacing[2] as any}>
        <Button
          variant="outline"
          onPress={() => {
            // Handle save draft
            haptic('light');
          }}
          fullWidth
        >
          Save Draft
        </Button>
        <Button
          variant="default"
          onPress={() => {
            // Handle complete handover
            haptic('success');
          }}
          fullWidth
        >
          Complete Handover
        </Button>
      </HStack>
    </VStack>
  );
};