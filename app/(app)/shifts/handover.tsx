import type { SpacingValue, ButtonVariant, BadgeVariant } from '@/types/components';
import React, { useState, useCallback } from 'react';
import { 
  ScrollView, 
  RefreshControl, 
  View, 
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
  Layout,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import {
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Box,
  Badge,
  Avatar,
  Skeleton,
  Alert,
  GlassCard,
  StatusGlassCard,
  Symbol,
  Heading2,
  Heading3,
  Separator,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';
import { format } from 'date-fns';
import { cn } from '@/lib/core/utils';
import { haptic } from '@/lib/ui/haptics';
import { AnimatedPageWrapper, pageEnteringAnimations } from '@/lib/navigation/page-transitions';
import { useLayoutTransition } from '@/hooks/useLayoutTransition';
import { DashboardGrid, Widget } from '@/components/universal/layout/WidgetGrid';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';

interface HandoverNote {
  patientId: string;
  patientName: string;
  room: string;
  priority: 'high' | 'medium' | 'low';
  notes: string;
  medications: string[];
  alerts: number;
}

export default function ShiftHandoverScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { user } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [handoverNotes, setHandoverNotes] = useState<HandoverNote[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Page transition
  const { animatedStyle } = useLayoutTransition({ 
    type: 'glass', 
    duration: 400,
    hapticFeedback: true 
  });
  
  // Mock current shift data
  const currentShift = {
    start: new Date(Date.now() - 8 * 60 * 60 * 1000),
    end: new Date(),
    totalPatients: 12,
    criticalAlerts: 3,
    resolvedAlerts: 8,
    pendingTasks: 5,
  };
  
  // Mock next shift staff
  const nextShiftStaff = [
    { id: '1', name: 'Dr. Sarah Wilson', role: 'Doctor', avatar: null },
    { id: '2', name: 'RN Jennifer Smith', role: 'Nurse', avatar: null },
    { id: '3', name: 'RN Michael Chen', role: 'Nurse', avatar: null },
  ];
  
  // Mock handover notes
  React.useEffect(() => {
    setHandoverNotes([
      {
        patientId: '1',
        patientName: 'John Doe',
        room: '302A',
        priority: 'high',
        notes: 'Post-op day 2, monitor for bleeding. Pain management needs adjustment.',
        medications: ['Morphine PRN', 'Antibiotics Q6H'],
        alerts: 2,
      },
      {
        patientId: '2',
        patientName: 'Jane Smith',
        room: '305B',
        priority: 'medium',
        notes: 'Stable, preparing for discharge tomorrow. Ensure discharge paperwork is ready.',
        medications: ['Metformin', 'Lisinopril'],
        alerts: 0,
      },
      {
        patientId: '3',
        patientName: 'Robert Johnson',
        room: '310A',
        priority: 'low',
        notes: 'Routine monitoring, vitals stable throughout shift.',
        medications: ['Aspirin', 'Atorvastatin'],
        alerts: 0,
      },
    ]);
  }, []);
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);
  
  const handleToggleNote = useCallback((noteId: string) => {
    haptic('light');
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  }, []);
  
  const handleSubmitHandover = useCallback(async () => {
    haptic('medium');
    
    if (selectedNotes.length === 0) {
      showErrorAlert('Please select at least one patient note for handover');
      return;
    }
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSuccessAlert('Shift handover completed successfully');
      router.back();
    } catch (error) {
      showErrorAlert('Failed to submit handover. Please try again.');
    }
  }, [selectedNotes, router]);
  
  const priorityColors = {
    high: theme.destructive,
    medium: theme.warning,
    low: theme.success,
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Shift Handover',
          headerBackTitle: 'Back',
          presentation: 'modal',
        }}
      />
      
      <AnimatedPageWrapper entering={pageEnteringAnimations.slideInUp} style={animatedStyle}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 , paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.primary}
                />
              }
            >
              <DashboardGrid>
                {/* Shift Summary */}
                <Widget size="full">
                  <Animated.View entering={FadeInDown.delay(100)}>
                    <StatusGlassCard>
                      <Box p={4 as any}>
                        <VStack gap={3 as any}>
                          <HStack justifyContent="between" alignItems="center">
                            <VStack gap={1 as any}>
                              <Heading2>Shift Summary</Heading2>
                              <Text size="sm" color="muted">
                                {format(currentShift.start, 'h:mm a')} - {format(currentShift.end, 'h:mm a')}
                              </Text>
                            </VStack>
                            <Badge variant="secondary" size="default">
                              {user?.role === 'nurse' ? 'Nurse' : 'Doctor'}
                            </Badge>
                          </HStack>
                          
                          <Separator />
                          
                          <HStack gap={3 as any} flexWrap="wrap">
                            <VStack gap={1 as any} minWidth={100}>
                              <Text size="xs" color="muted">Total Patients</Text>
                              <Text size="2xl" weight="bold">{currentShift.totalPatients}</Text>
                            </VStack>
                            <VStack gap={1 as any} minWidth={100}>
                              <Text size="xs" color="muted">Critical Alerts</Text>
                              <Text size="2xl" weight="bold" color={theme.destructive}>
                                {currentShift.criticalAlerts}
                              </Text>
                            </VStack>
                            <VStack gap={1 as any} minWidth={100}>
                              <Text size="xs" color="muted">Resolved</Text>
                              <Text size="2xl" weight="bold" color={theme.success}>
                                {currentShift.resolvedAlerts}
                              </Text>
                            </VStack>
                            <VStack gap={1 as any} minWidth={100}>
                              <Text size="xs" color="muted">Pending Tasks</Text>
                              <Text size="2xl" weight="bold" color={theme.warning}>
                                {currentShift.pendingTasks}
                              </Text>
                            </VStack>
                          </HStack>
                        </VStack>
                      </Box>
                    </StatusGlassCard>
                  </Animated.View>
                </Widget>
                
                {/* Next Shift Staff */}
                <Widget size="full">
                  <Animated.View entering={FadeInDown.delay(200)}>
                    <GlassCard>
                      <Box p={4 as any}>
                        <VStack gap={3 as any}>
                          <Heading3>Incoming Shift Team</Heading3>
                          <VStack gap={2 as any}>
                            {nextShiftStaff.map((staff, index) => (
                              <Animated.View 
                                key={staff.id}
                                entering={SlideInRight.delay(250 + index * 50)}
                              >
                                <HStack gap={3 as any} alignItems="center">
                                  <Avatar
                                    size="default"
                                    name={staff.name}
                                    source={staff.avatar ? { uri: staff.avatar } : undefined}
                                  />
                                  <VStack gap={1 as any} style={{ flex: 1 }}>
                                    <Text weight="medium">{staff.name}</Text>
                                    <Text size="sm" color="muted">{staff.role}</Text>
                                  </VStack>
                                  <Badge variant="outline">{staff.role}</Badge>
                                </HStack>
                              </Animated.View>
                            ))}
                          </VStack>
                        </VStack>
                      </Box>
                    </GlassCard>
                  </Animated.View>
                </Widget>
                
                {/* Patient Handover Notes */}
                <Widget size="full">
                  <Animated.View entering={FadeInDown.delay(300)}>
                    <VStack gap={3 as any}>
                      <HStack justifyContent="between" alignItems="center">
                        <Heading3>Patient Handover Notes</Heading3>
                        <Text size="sm" color="muted">
                          {selectedNotes.length} selected
                        </Text>
                      </HStack>
                      
                      <VStack gap={2 as any}>
                        {handoverNotes.map((note, index) => (
                          <Animated.View 
                            key={note.patientId}
                            entering={SlideInRight.delay(350 + index * 50)}
                            layout={Layout.springify()}
                          >
                            <Pressable
                              onPress={() => handleToggleNote(note.patientId)}
                            >
                              <GlassCard
                                style={[
                                  selectedNotes.includes(note.patientId) && {
                                    borderColor: theme.primary,
                                    borderWidth: 2,
                                  }
                                ] as any}
                              >
                                <Box p={3 as any}>
                                  <HStack gap={3 as any} alignItems="flex-start">
                                    <Box
                                      style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: selectedNotes.includes(note.patientId)
                                          ? theme.primary
                                          : theme.border,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      {selectedNotes.includes(note.patientId) && (
                                        <Symbol name="checkmark" size={16} color="white" />
                                      )}
                                    </Box>
                                    
                                    <VStack gap={2 as any} style={{ flex: 1 }}>
                                      <HStack justifyContent="between" alignItems="flex-start">
                                        <VStack gap={1 as any}>
                                          <Text weight="semibold">{note.patientName}</Text>
                                          <HStack gap={2 as any} alignItems="center">
                                            <Badge variant="secondary" size="sm">
                                              Room {note.room}
                                            </Badge>
                                            <Badge 
                                              variant="outline" 
                                              size="sm"
                                              style={{ 
                                                borderColor: priorityColors[note.priority],
                                                backgroundColor: priorityColors[note.priority] + '10',
                                              }}
                                            >
                                              <Text size="xs" style={{ color: priorityColors[note.priority] }}>
                                                {note.priority.toUpperCase()}
                                              </Text>
                                            </Badge>
                                            {note.alerts > 0 && (
                                              <Badge variant="error" size="sm">
                                                {note.alerts} alerts
                                              </Badge>
                                            )}
                                          </HStack>
                                        </VStack>
                                      </HStack>
                                      
                                      <Text size="sm" color="foreground">
                                        {note.notes}
                                      </Text>
                                      
                                      {note.medications.length > 0 && (
                                        <VStack gap={1 as any}>
                                          <Text size="xs" color="muted" weight="medium">
                                            Key Medications:
                                          </Text>
                                          <HStack gap={1 as any} flexWrap="wrap">
                                            {note.medications.map((med, i) => (
                                              <Badge key={i} variant="outline" size="sm">
                                                {med}
                                              </Badge>
                                            ))}
                                          </HStack>
                                        </VStack>
                                      )}
                                    </VStack>
                                  </HStack>
                                </Box>
                              </GlassCard>
                            </Pressable>
                          </Animated.View>
                        ))}
                      </VStack>
                    </VStack>
                  </Animated.View>
                </Widget>
                
                {/* Additional Notes */}
                <Widget size="full">
                  <Animated.View entering={FadeInDown.delay(400)}>
                    <GlassCard>
                      <Box p={4 as any}>
                        <VStack gap={3 as any}>
                          <Heading3>Additional Notes</Heading3>
                          <View
                            style={{
                              borderWidth: 1,
                              borderColor: theme.border,
                              borderRadius: 8,
                              padding: spacing[3] as any,
                              minHeight: 120,
                              backgroundColor: theme.background,
                            }}
                          >
                            <TextInput
                              value={additionalNotes}
                              onChangeText={setAdditionalNotes}
                              placeholder="Add any additional notes for the incoming shift..."
                              placeholderTextColor={theme.mutedForeground}
                              multiline
                              style={{
                                color: theme.foreground,
                                fontSize: 14,
                                lineHeight: 20,
                              }}
                            />
                          </View>
                        </VStack>
                      </Box>
                    </GlassCard>
                  </Animated.View>
                </Widget>
                
                {/* Submit Button */}
                <Widget size="full">
                  <Animated.View entering={FadeInDown.delay(500)}>
                    <VStack gap={2 as any}>
                      <Button
                        size="default"
                        onPress={handleSubmitHandover}
                        disabled={selectedNotes.length === 0}
                        style={{
                          opacity: selectedNotes.length === 0 ? 0.5 : 1,
                        }}
                      >
                        <HStack gap={2 as any} alignItems="center">
                          <Symbol name="checkmark.circle.fill" size={20} color="white" />
                          <Text weight="semibold" color="white">
                            Complete Handover ({selectedNotes.length} patients)
                          </Text>
                        </HStack>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        onPress={() => router.back()}
                      >
                        Cancel
                      </Button>
                    </VStack>
                  </Animated.View>
                </Widget>
              </DashboardGrid>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </AnimatedPageWrapper>
    </>
  );
}