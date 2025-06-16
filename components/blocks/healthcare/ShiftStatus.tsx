import React, { useState, useEffect } from 'react';
import { Platform, Pressable, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Card,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Badge,
  Avatar,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  TextArea,
  Alert,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useShadow } from '@/hooks/useShadow';
import { haptic } from '@/lib/ui/haptics';
import { api } from '@/lib/api/trpc';
import { log } from '@/lib/core/debug/logger';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ShiftStatusProps {
  onShiftToggle?: () => void;
}

export const ShiftStatus: React.FC<ShiftStatusProps> = ({ onShiftToggle }) => {
  const { spacing } = useSpacing();
  const { theme } = useThemeStore();
  const shadowMd = useShadow({ size: 'md' });
  const router = useRouter();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHandoverSheet, setShowHandoverSheet] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isToggling, setIsToggling] = useState(false);
  
  // Log component mount
  useEffect(() => {
    log.info('ShiftStatus component mounted', 'SHIFT');
    return () => {
      log.info('ShiftStatus component unmounted', 'SHIFT');
    };
  }, []);
  
  // Animation values
  const pulseScale = useSharedValue(1);
  
  // Queries
  const { data: onDutyStatus, refetch: refetchStatus } = api.healthcare.getOnDutyStatus.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
  });
  
  const { data: onDutyStaff } = api.healthcare.getOnDutyStaff.useQuery(
    { department: undefined },
    {
      enabled: !!onDutyStatus?.isOnDuty,
      refetchInterval: 300000, // Refresh every 5 minutes
    }
  );
  
  const { data: activeAlerts } = api.healthcare.getActiveAlerts.useQuery(
    { hospitalId: 'f155b026-01bd-4212-94f3-e7aedef2801d' },
    {
      enabled: !!onDutyStatus?.isOnDuty,
    }
  );
  
  // Mutations
  const toggleOnDutyMutation = api.healthcare.toggleOnDuty.useMutation({
    onMutate: (variables) => {
      log.info('Starting shift toggle', 'SHIFT', { 
        isOnDuty: variables.isOnDuty,
        hasHandoverNotes: !!variables.handoverNotes 
      });
    },
    onSuccess: (data) => {
      log.info('Shift status toggled successfully', 'SHIFT', { 
        isOnDuty: data.isOnDuty,
        shiftDuration: data.shiftDuration,
        success: data.success
      });
      refetchStatus();
      setShowConfirmModal(false);
      setHandoverNotes('');
      onShiftToggle?.();
      
      // Show feedback
      if (data.isOnDuty) {
        log.info('Shift started', 'SHIFT', { timestamp: new Date().toISOString() });
        haptic('medium');
        
        // Navigate to dashboard on mobile after starting shift
        if (Platform.OS !== 'web') {
          setTimeout(() => {
            router.push('/(healthcare)/dashboard');
          }, 500);
        }
      } else if (data.shiftDuration) {
        log.info('Shift ended', 'SHIFT', { 
          durationMinutes: data.shiftDuration,
          durationFormatted: `${Math.floor(data.shiftDuration / 60)}h ${data.shiftDuration % 60}m`
        });
        haptic('success');
        
        // Navigate to dashboard on mobile after ending shift
        if (Platform.OS !== 'web') {
          setTimeout(() => {
            router.push('/(healthcare)/dashboard');
          }, 500);
        }
      }
    },
    onError: (error) => {
      log.error('Failed to toggle shift', 'SHIFT', { 
        error: error.message,
        code: error.data?.code 
      });
      haptic('error');
    },
  });
  
  // Calculate shift duration
  const calculateShiftDuration = () => {
    if (!onDutyStatus?.isOnDuty || !onDutyStatus?.shiftStartTime) return null;
    
    const start = new Date(onDutyStatus.shiftStartTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, formatted: `${hours}h ${minutes}m` };
  };
  
  const [shiftDuration, setShiftDuration] = useState(calculateShiftDuration());
  
  // Update shift duration every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const duration = calculateShiftDuration();
      setShiftDuration(duration);
      if (duration) {
        log.debug('Shift duration updated', 'SHIFT', { 
          hours: duration.hours,
          minutes: duration.minutes,
          formatted: duration.formatted 
        });
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [onDutyStatus]);
  
  // Log query data changes
  useEffect(() => {
    if (onDutyStatus !== undefined) {
      log.info('Duty status loaded', 'SHIFT', {
        isOnDuty: onDutyStatus?.isOnDuty,
        shiftStartTime: onDutyStatus?.shiftStartTime,
        shiftEndTime: onDutyStatus?.shiftEndTime
      });
    }
  }, [onDutyStatus]);
  
  useEffect(() => {
    if (onDutyStaff) {
      log.info('On-duty staff loaded', 'SHIFT', {
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
  }, [onDutyStatus?.isOnDuty]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  
  const handleToggleShift = () => {
    haptic('light');
    
    log.info('Shift toggle requested', 'SHIFT', {
      currentStatus: onDutyStatus?.isOnDuty,
      activeAlerts: activeAlerts?.alerts?.length || 0,
      shiftStartTime: onDutyStatus?.shiftStartTime
    });
    
    // If ending shift and there are active alerts, show confirmation modal
    if (onDutyStatus?.isOnDuty && activeAlerts?.alerts && activeAlerts.alerts.length > 0) {
      log.info('Showing handover confirmation dialog', 'SHIFT', { 
        reason: 'Active alerts present',
        alertCount: activeAlerts.alerts.length 
      });
      setShowConfirmModal(true);
    } else {
      // Direct toggle
      log.info('Direct shift toggle', 'SHIFT', { 
        newStatus: !onDutyStatus?.isOnDuty 
      });
      setIsToggling(true);
      toggleOnDutyMutation.mutate({
        isOnDuty: !onDutyStatus?.isOnDuty,
      });
      setIsToggling(false);
    }
  };
  
  const handleConfirmEndShift = () => {
    log.info('Confirming end shift with handover', 'SHIFT', {
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
  
  const isMobile = Platform.OS !== 'web';
  
  return (
    <>
      <Animated.View 
        entering={FadeIn}
        style={[animatedStyle, shadowMd]}
      >
        <Card
          className={onDutyStatus?.isOnDuty ? 'border-l-4 border-l-success' : ''}
        >
          <Box p={spacing[4]}>
            <VStack gap={spacing[3]}>
              {/* Header */}
              <HStack justifyContent="space-between" alignItems="center">
                <VStack gap={spacing[1]}>
                  <HStack gap={spacing[2]} alignItems="center">
                    <Box
                      width={8}
                      height={8}
                      className={`rounded-full ${onDutyStatus?.isOnDuty ? 'bg-success' : 'bg-muted-foreground'}`}
                    />
                    <Text weight="semibold" size={isMobile ? 'base' : 'lg'}>
                      Duty Status
                    </Text>
                  </HStack>
                  <Text size="sm" colorTheme="mutedForeground">
                    {onDutyStatus?.isOnDuty ? 'Currently on duty' : 'Off duty'}
                  </Text>
                </VStack>
                
                <Button
                  onPress={handleToggleShift}
                  variant={onDutyStatus?.isOnDuty ? 'destructive' : 'secondary'}
                  size={isMobile ? 'sm' : 'md'}
                  loading={isToggling || toggleOnDutyMutation.isPending}
                >
                  {onDutyStatus?.isOnDuty ? 'End Shift' : 'Start Shift'}
                </Button>
              </HStack>
              
              {/* Shift Info */}
              {onDutyStatus?.isOnDuty && (
                <>
                  <HStack gap={spacing[4]}>
                    {/* Shift Duration */}
                    {shiftDuration && (
                      <VStack gap={spacing[1]}>
                        <Text size="xs" colorTheme="mutedForeground">
                          Shift Duration
                        </Text>
                        <Text weight="medium">{shiftDuration.formatted}</Text>
                      </VStack>
                    )}
                    
                    {/* Active Alerts */}
                    {activeAlerts && (
                      <VStack gap={spacing[1]}>
                        <Text size="xs" colorTheme="mutedForeground">
                          Active Alerts
                        </Text>
                        <Badge 
                          variant={activeAlerts.alerts.length > 0 ? 'destructive' : 'outline'}
                          size="sm"
                        >
                          {activeAlerts.alerts.length}
                        </Badge>
                      </VStack>
                    )}
                  </HStack>
                  
                  {/* On-Duty Staff */}
                  {onDutyStaff && onDutyStaff.total > 1 && (
                    <VStack gap={spacing[2]}>
                      <Text size="xs" colorTheme="mutedForeground">
                        On duty with you ({onDutyStaff.total - 1} others)
                      </Text>
                      <HStack gap={spacing[1]} flexWrap="wrap">
                        {onDutyStaff.staff
                          .filter(staff => staff.id !== onDutyStatus?.userId)
                          .slice(0, isMobile ? 3 : 5)
                          .map(staff => (
                            <Avatar
                              key={staff.id}
                              source={staff.image ? { uri: staff.image } : undefined}
                              name={staff.name || 'Staff'}
                              size="sm"
                            />
                          ))}
                        {onDutyStaff.total > (isMobile ? 4 : 6) && (
                          <Badge variant="outline" size="sm">
                            +{onDutyStaff.total - (isMobile ? 4 : 6)}
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  )}
                </>
              )}
              
              {/* Quick Actions */}
              {onDutyStatus?.isOnDuty && (
                <HStack gap={spacing[2]}>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        router.push('/(healthcare)/shift-handover');
                      } else {
                        setShowHandoverSheet(true);
                      }
                    }}
                    fullWidth
                  >
                    Shift Handover
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => router.push('/(healthcare)/alerts')}
                    fullWidth
                  >
                    View Alerts
                  </Button>
                </HStack>
              )}
            </VStack>
          </Box>
        </Card>
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
            
            <VStack gap={spacing[4]} p={spacing[4]}>
              <Alert variant="warning">
                <Text size="sm">
                  All active alerts should be properly handed over to ensure continuity of care.
                </Text>
              </Alert>
              
              <VStack gap={spacing[2]}>
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
              <HStack gap={spacing[2]}>
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
                  loading={isToggling}
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
                    borderTopLeftRadius={20}
                    borderTopRightRadius={20}
                    p={spacing[6]}
                    style={[shadowMd, { paddingBottom: spacing[8] }]}
                  >
                    <VStack gap={spacing[4]}>
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
                      
                      <VStack gap={spacing[2]}>
                        <Text weight="medium">Handover Notes</Text>
                        <TextArea
                          placeholder="Add important information..."
                          value={handoverNotes}
                          onChangeText={setHandoverNotes}
                          rows={3}
                          autoFocus
                        />
                      </VStack>
                      
                      <HStack gap={spacing[2]}>
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
                          loading={isToggling}
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
                    borderTopLeftRadius={20}
                    borderTopRightRadius={20}
                    height={SCREEN_HEIGHT * 0.85}
                    style={shadowMd}
                  >
                    {/* Header */}
                    <HStack
                      justifyContent="space-between"
                      alignItems="center"
                      p={spacing[4]}
                      borderBottomWidth={1}
                      borderBottomColor={theme.mutedForeground + '20'}
                    >
                      <Text size="lg" weight="semibold">Shift Handover</Text>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          setShowHandoverSheet(false);
                          router.push('/(healthcare)/dashboard');
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
    <VStack gap={spacing[4]} className="h-full">
      {/* Active Alerts Summary */}
      <Alert variant="warning">
        <Text size="sm">
          {activeAlerts.length} active alerts require handover to incoming shift
        </Text>
      </Alert>
      
      {/* Active Alerts List */}
      <VStack gap={spacing[3]}>
        <Text size="base" weight="semibold">Active Alerts</Text>
        <VStack gap={spacing[2]}>
          {activeAlerts.map((alert) => (
            <Card key={alert.id} className="p-3">
              <VStack gap={spacing[1]}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text size="sm" weight="medium">{alert.alertType}</Text>
                  <Badge variant="outline" size="sm">Level {alert.urgencyLevel}</Badge>
                </HStack>
                <Text size="xs" colorTheme="mutedForeground">
                  {alert.patientName} • Room {alert.roomNumber}
                </Text>
                <Badge 
                  variant={alert.status === 'active' ? 'error' : 'default'} 
                  size="sm"
                >
                  {alert.status}
                </Badge>
              </VStack>
            </Card>
          ))}
        </VStack>
      </VStack>
      
      {/* Handover Notes */}
      <VStack gap={spacing[2]} className="flex-1">
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
      <HStack gap={spacing[2]}>
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