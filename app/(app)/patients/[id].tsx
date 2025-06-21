import type { SpacingValue, ButtonVariant, BadgeVariant } from '@/types/components';
import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, Platform, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  GlassCard,
  StatusGlassCard,
  Symbol,
  Heading2,
  Heading3,
} from '@/components/universal';
import { 
  DashboardGrid, 
  Widget, 
  MetricWidget,
  ChartWidget,
  useWidgetSize,
} from '@/components/universal/layout/WidgetGrid';
import { EscalationTimeline } from '@/components/blocks/healthcare';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';
import { format } from 'date-fns';
import { cn } from '@/lib/core/utils';
import { ROUTES } from '@/lib/navigation/routes';
import { haptic } from '@/lib/ui/haptics';

// Mock patient type until we have real types
interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  mrn: string; // Medical Record Number
  room: string;
  bed: string;
  department: string;
  admittedAt: string;
  primaryDiagnosis: string;
  conditions: string[];
  allergies: string[];
  medications: {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    startDate: string;
  }[];
  vitals: {
    timestamp: string;
    bloodPressure: { systolic: number; diastolic: number };
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
    oxygenSaturation: number;
  }[];
  notes: {
    id: string;
    timestamp: string;
    author: string;
    role: string;
    content: string;
    type: 'progress' | 'nursing' | 'physician' | 'consultation';
  }[];
  alerts: {
    id: string;
    type: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'acknowledged' | 'resolved';
    createdAt: string;
  }[];
  assignedNurse?: {
    id: string;
    name: string;
    shiftEnds: string;
  };
  attendingPhysician: {
    id: string;
    name: string;
    specialty: string;
  };
}

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { user } = useAuth();
  const { isDesktop } = useWidgetSize();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch patient data with TRPC
  const { data: patient, isLoading, error, refetch } = api.healthcare.getPatient.useQuery(
    { patientId: id! },
    { 
      enabled: !!id,
      // Fallback to mock data for demo
      placeholderData: {
        id: id!,
        name: 'John Doe',
        age: 65,
        gender: 'male',
        dateOfBirth: '1958-03-15',
        mrn: 'MRN-123456',
        room: '302',
        bed: 'A',
        department: 'Cardiology',
        admittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        primaryDiagnosis: 'Acute Myocardial Infarction',
        conditions: ['Hypertension', 'Type 2 Diabetes', 'Hyperlipidemia'],
        allergies: ['Penicillin', 'Sulfa drugs'],
        medications: [
          {
            id: '1',
            name: 'Aspirin',
            dosage: '81mg',
            frequency: 'Once daily',
            route: 'PO',
            startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            route: 'PO',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            route: 'PO',
            startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        vitals: [
          {
            timestamp: new Date().toISOString(),
            bloodPressure: { systolic: 145, diastolic: 90 },
            heartRate: 88,
            temperature: 37.2,
            respiratoryRate: 18,
            oxygenSaturation: 96,
          },
          {
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            bloodPressure: { systolic: 150, diastolic: 95 },
            heartRate: 92,
            temperature: 37.5,
            respiratoryRate: 20,
            oxygenSaturation: 95,
          },
        ],
        notes: [
          {
            id: '1',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            author: 'Dr. Sarah Chen',
            role: 'Attending Physician',
            content: 'Patient stable post-PCI. Continue dual antiplatelet therapy. Monitor for bleeding.',
            type: 'physician',
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            author: 'RN Jennifer Smith',
            role: 'Primary Nurse',
            content: 'Patient reports mild chest discomfort (3/10). Vital signs stable. PRN nitroglycerin administered with good effect.',
            type: 'nursing',
          },
        ],
        alerts: [
          {
            id: '1',
            type: 'Medication Due',
            urgency: 'medium',
            status: 'active',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
        ],
        assignedNurse: {
          id: 'nurse-1',
          name: 'Jennifer Smith, RN',
          shiftEnds: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        },
        attendingPhysician: {
          id: 'doc-1',
          name: 'Dr. Sarah Chen',
          specialty: 'Cardiology',
        },
      } as Patient,
    }
  );
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);
  
  const handleCreateAlert = useCallback(() => {
    haptic('medium');
    router.push(`${ROUTES.modals.createAlert}?patientId=${id}`);
  }, [id, router]);
  
  const handleAddNote = useCallback(() => {
    haptic('light');
    // TODO: Implement add note modal
  }, []);
  
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Container className="flex-1 items-center justify-center p-4">
          <Alert variant="error">
            <Text>Failed to load patient data</Text>
            <Text size="sm" color="muted">{error.message}</Text>
          </Alert>
          <Button onPress={() => router.back()} variant="outline" className="mt-4">
            Go Back
          </Button>
        </Container>
      </SafeAreaView>
    );
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          title: patient?.name || 'Patient Details',
          headerBackTitle: 'Patients',
        }}
      />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
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
            {/* Patient Header */}
            <Widget size="full">
              <Animated.View entering={FadeIn}>
                <StatusGlassCard>
                  <Box p={4 as any}>
                    <HStack gap={4 as any} alignItems="flex-start">
                      <Avatar
                        size="xl"
                        name={patient?.name || 'Patient'}
                        source={undefined}
                      />
                      
                      <VStack gap={2 as any} style={{ flex: 1 }}>
                        <HStack justifyContent="between" alignItems="flex-start">
                          <VStack gap={1 as any}>
                            <Heading2>{patient?.name || <Skeleton width={150} />}</Heading2>
                            <HStack gap={2 as any} alignItems="center">
                              <Badge variant="outline">
                                {patient?.age || '--'} years • {patient?.gender || '--'}
                              </Badge>
                              <Badge variant="secondary">
                                MRN: {patient?.mrn || '--'}
                              </Badge>
                            </HStack>
                          </VStack>
                          
                          <VStack gap={2 as any} alignItems="flex-end">
                            <Badge variant="default">
                              Room {patient?.room || '--'}-{patient?.bed || '--'}
                            </Badge>
                            <Text size="sm" color="muted">
                              {patient?.department || '--'}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        <HStack gap={2 as any} className="mt-2">
                          <Button
                            variant="glass-destructive"
                            size="sm"
                            onPress={handleCreateAlert}
                            leftIcon={<Symbol name="exclamationmark.triangle" size={16} />}
                          >
                            Create Alert
                          </Button>
                          <Button
                            variant="glass"
                            size="sm"
                            onPress={handleAddNote}
                            leftIcon={<Symbol name="note.text" size={16} />}
                          >
                            Add Note
                          </Button>
                        </HStack>
                      </VStack>
                    </HStack>
                    
                    {/* Key Information */}
                    <VStack gap={3 as any} className="mt-4">
                      <HStack gap={4 as any}>
                        <VStack gap={1 as any} style={{ flex: 1 }}>
                          <Text size="sm" color="muted">Primary Diagnosis</Text>
                          <Text weight="medium">
                            {patient?.primaryDiagnosis || <Skeleton width={200} />}
                          </Text>
                        </VStack>
                        <VStack gap={1 as any} style={{ flex: 1 }}>
                          <Text size="sm" color="muted">Admitted</Text>
                          <Text weight="medium">
                            {patient?.admittedAt ? format(new Date(patient.admittedAt), 'MMM d, yyyy') : '--'}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <HStack gap={4 as any}>
                        <VStack gap={1 as any} style={{ flex: 1 }}>
                          <Text size="sm" color="muted">Attending Physician</Text>
                          <Text weight="medium">
                            {patient?.attendingPhysician?.name || '--'}
                          </Text>
                        </VStack>
                        <VStack gap={1 as any} style={{ flex: 1 }}>
                          <Text size="sm" color="muted">Primary Nurse</Text>
                          <Text weight="medium">
                            {patient?.assignedNurse?.name || 'Not assigned'}
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </Box>
                </StatusGlassCard>
              </Animated.View>
            </Widget>
            
            {/* Tab Navigation */}
            <Widget size="full">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="vitals">Vitals</TabsTrigger>
                  <TabsTrigger value="medications">Medications</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-4">
                  <VStack gap={4 as any}>
                    {/* Active Alerts */}
                    {patient?.alerts && patient.alerts.length > 0 && (
                      <Animated.View entering={SlideInRight.delay(100)}>
                        <GlassCard urgency="medium">
                          <Box p={3 as any}>
                            <HStack justifyContent="between" alignItems="center" className="mb-2">
                              <Heading3>Active Alerts</Heading3>
                              <Badge variant="warning">{patient.alerts.length}</Badge>
                            </HStack>
                            
                            <VStack gap={2 as any}>
                              {patient.alerts.map((alert) => (
                                <Pressable
                                  key={alert.id}
                                  onPress={() => router.push(ROUTES.modals.alertDetails(alert.id))}
                                >
                                  <HStack gap={2 as any} alignItems="center">
                                    <Symbol 
                                      name="exclamationmark.circle.fill" 
                                      size={20} 
                                      color={alert.urgency === 'critical' ? theme.destructive : theme.warning}
                                    />
                                    <VStack gap={1 as any} style={{ flex: 1 }}>
                                      <Text weight="medium">{alert.type}</Text>
                                      <Text size="xs" color="muted">
                                        {format(new Date(alert.createdAt), 'h:mm a')} • {alert.status}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                </Pressable>
                              ))}
                            </VStack>
                          </Box>
                        </GlassCard>
                      </Animated.View>
                    )}
                    
                    {/* Conditions & Allergies */}
                    <Animated.View entering={SlideInRight.delay(200)}>
                      <HStack gap={4 as any}>
                        <GlassCard className="flex-1">
                          <Box p={3 as any}>
                            <Heading3 className="mb-2">Conditions</Heading3>
                            <VStack gap={1 as any}>
                              {patient?.conditions?.map((condition, index) => (
                                <Text key={index} size="sm">• {condition}</Text>
                              )) || <Skeleton count={3} />}
                            </VStack>
                          </Box>
                        </GlassCard>
                        
                        <GlassCard className="flex-1" urgency={patient?.allergies?.length ? 'high' : undefined}>
                          <Box p={3 as any}>
                            <Heading3 className="mb-2">Allergies</Heading3>
                            <VStack gap={1 as any}>
                              {patient?.allergies?.length ? (
                                patient.allergies.map((allergy, index) => (
                                  <Text key={index} size="sm" color="error">• {allergy}</Text>
                                ))
                              ) : (
                                <Text size="sm" color="muted">No known allergies</Text>
                              )}
                            </VStack>
                          </Box>
                        </GlassCard>
                      </HStack>
                    </Animated.View>
                    
                    {/* Latest Vitals */}
                    <Animated.View entering={SlideInRight.delay(300)}>
                      <GlassCard>
                        <Box p={3 as any}>
                          <HStack justifyContent="between" alignItems="center" className="mb-3">
                            <Heading3>Latest Vitals</Heading3>
                            <Text size="xs" color="muted">
                              {patient?.vitals?.[0] && format(new Date(patient.vitals[0].timestamp), 'h:mm a')}
                            </Text>
                          </HStack>
                          
                          {patient?.vitals?.[0] ? (
                            <HStack gap={3 as any} flexWrap="wrap">
                              <VStack gap={1 as any}>
                                <Text size="xs" color="muted">Blood Pressure</Text>
                                <Text weight="medium">
                                  {patient.vitals[0].bloodPressure.systolic}/{patient.vitals[0].bloodPressure.diastolic}
                                </Text>
                              </VStack>
                              <VStack gap={1 as any}>
                                <Text size="xs" color="muted">Heart Rate</Text>
                                <Text weight="medium">{patient.vitals[0].heartRate} bpm</Text>
                              </VStack>
                              <VStack gap={1 as any}>
                                <Text size="xs" color="muted">Temperature</Text>
                                <Text weight="medium">{patient.vitals[0].temperature}°C</Text>
                              </VStack>
                              <VStack gap={1 as any}>
                                <Text size="xs" color="muted">O₂ Sat</Text>
                                <Text weight="medium">{patient.vitals[0].oxygenSaturation}%</Text>
                              </VStack>
                              <VStack gap={1 as any}>
                                <Text size="xs" color="muted">Resp Rate</Text>
                                <Text weight="medium">{patient.vitals[0].respiratoryRate}/min</Text>
                              </VStack>
                            </HStack>
                          ) : (
                            <Skeleton height={50} />
                          )}
                        </Box>
                      </GlassCard>
                    </Animated.View>
                  </VStack>
                </TabsContent>
                
                <TabsContent value="vitals">
                  <Text>Vitals charts and history will be implemented here</Text>
                </TabsContent>
                
                <TabsContent value="medications">
                  <VStack gap={3 as any}>
                    {patient?.medications?.map((med, index) => (
                      <Animated.View key={med.id} entering={SlideInRight.delay(index * 100)}>
                        <GlassCard>
                          <Box p={3 as any}>
                            <HStack justifyContent="between" alignItems="flex-start">
                              <VStack gap={1 as any} style={{ flex: 1 }}>
                                <Text weight="semibold">{med.name}</Text>
                                <Text size="sm" color="muted">
                                  {med.dosage} • {med.frequency} • {med.route}
                                </Text>
                                <Text size="xs" color="muted">
                                  Started {format(new Date(med.startDate), 'MMM d, yyyy')}
                                </Text>
                              </VStack>
                              <Button size="sm" variant="ghost">
                                <Symbol name="ellipsis" size={16} />
                              </Button>
                            </HStack>
                          </Box>
                        </GlassCard>
                      </Animated.View>
                    )) || <Skeleton count={3} height={80} />}
                  </VStack>
                </TabsContent>
                
                <TabsContent value="notes">
                  <VStack gap={3 as any}>
                    {patient?.notes?.map((note, index) => (
                      <Animated.View key={note.id} entering={SlideInRight.delay(index * 100)}>
                        <GlassCard>
                          <Box p={3 as any}>
                            <HStack gap={3 as any} alignItems="flex-start">
                              <Avatar size="sm" name={note.author} />
                              <VStack gap={1 as any} style={{ flex: 1 }}>
                                <HStack justifyContent="between">
                                  <Text weight="medium">{note.author}</Text>
                                  <Text size="xs" color="muted">
                                    {format(new Date(note.timestamp), 'h:mm a')}
                                  </Text>
                                </HStack>
                                <Text size="xs" color="muted">{note.role}</Text>
                                <Text size="sm" className="mt-1">{note.content}</Text>
                              </VStack>
                            </HStack>
                          </Box>
                        </GlassCard>
                      </Animated.View>
                    )) || <Skeleton count={3} height={100} />}
                  </VStack>
                </TabsContent>
              </Tabs>
            </Widget>
          </DashboardGrid>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}