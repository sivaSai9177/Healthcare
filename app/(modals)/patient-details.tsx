import React from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Text,
  Button,
  Card,
  VStack,
  HStack,
  Container,
  Badge,
  Avatar,
  Symbol,
} from '@/components/universal';
import { useSpacing } from '@/hooks/core/useSpacing';
import { useHealthcareAccess } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/blocks/auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { usePatientDetails } from '@/hooks/healthcare/useHealthcareApi';
import { useTheme } from '@/lib/theme/provider';
import { format } from 'date-fns';

// Mock vitals data - will be replaced with real API later
const mockVitals = {
  bloodPressure: '120/80',
  heartRate: 72,
  temperature: 98.6,
  oxygenLevel: 98,
};

export default function PatientDetailsModal() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const spacing = useSpacing();
  const theme = useTheme();
  const { canViewPatients } = useHealthcareAccess();

  // Fetch actual patient data
  const { data: patientData, isLoading, error } = usePatientDetails(patientId || '', {
    enabled: !!patientId && canViewPatients,
  });

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: Date | string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleClose = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <Container className="flex-1 bg-background">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ marginTop: spacing[4] }} colorTheme="mutedForeground">Loading patient details...</Text>
        </View>
      </Container>
    );
  }

  if (error || !patientData) {
    return (
      <Container className="flex-1 bg-background">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[8] }}>
          <Symbol name="exclamationmark.triangle" size={48} color={theme.destructive} />
          <Text size="xl" weight="semibold" style={{ marginTop: spacing[4], marginBottom: spacing[3] }}>Unable to Load Patient</Text>
          <Text colorTheme="mutedForeground" align="center">
            {error?.message || 'Failed to load patient details'}
          </Text>
          <Button variant="outline" onPress={handleClose} style={{ marginTop: spacing[6] }}>
            Go Back
          </Button>
        </View>
      </Container>
    );
  }

  const patient = patientData;
  const age = calculateAge(patient.dateOfBirth);

  return (
    <PermissionGuard permission={PERMISSIONS.VIEW_PATIENTS}>
      <Container className="flex-1 bg-background">
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: spacing[8],
          }}
        >
          <VStack gap={6}>
            {/* Header */}
            <HStack gap={3} align="center">
              <Avatar 
                size="default" 
                name={patient.name}
              />
              <VStack gap={1} style={{ flex: 1 }}>
                <Text size="2xl" weight="bold">{patient.name}</Text>
                <Text size="sm" style={{ opacity: 0.7 }}>
                  MRN: {patient.mrn}
                </Text>
              </VStack>
              {patient.activeAlerts && patient.activeAlerts.length > 0 && (
                <Badge variant="error">
                  {patient.activeAlerts.length} Active Alert{patient.activeAlerts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </HStack>

            {/* Basic Information */}
            <Card>
              <VStack gap={4}>
                <Text size="lg" weight="semibold">Basic Information</Text>
                <VStack gap={3}>
                  <HStack justify="between">
                    <Text>Age</Text>
                    <Text weight="medium">
                      {age} years
                    </Text>
                  </HStack>
                  <HStack justify="between">
                    <Text>Gender</Text>
                    <Text weight="medium" style={{ textTransform: 'capitalize' }}>
                      {patient.gender}
                    </Text>
                  </HStack>
                  <HStack justify="between">
                    <Text>Blood Type</Text>
                    <Text weight="medium">
                      {patient.bloodType || 'Unknown'}
                    </Text>
                  </HStack>
                  <HStack justify="between">
                    <Text>Admission Date</Text>
                    <Text weight="medium">
                      {format(new Date(patient.admissionDate), 'MMM dd, yyyy')}
                    </Text>
                  </HStack>
                  <HStack justify="between">
                    <Text>Location</Text>
                    <Text weight="medium">
                      {patient.roomNumber ? `Room ${patient.roomNumber}` : 'Not assigned'}
                      {patient.bedNumber && ` - Bed ${patient.bedNumber}`}
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            </Card>

            {/* Diagnosis */}
            <Card>
              <VStack gap={4}>
                <Text size="lg" weight="semibold">Diagnosis</Text>
                <Text>{patient.primaryDiagnosis || 'No diagnosis recorded'}</Text>
                {patient.secondaryDiagnoses && Array.isArray(patient.secondaryDiagnoses) && patient.secondaryDiagnoses.length > 0 && (
                  <>
                    <Text weight="medium" style={{ marginTop: spacing[3] }}>
                      Secondary Diagnoses:
                    </Text>
                    {(patient.secondaryDiagnoses as string[]).map((diagnosis: string, index: number) => (
                      <Text key={index}>• {diagnosis}</Text>
                    ))}
                  </>
                )}
              </VStack>
            </Card>

            {/* Care Team */}
            {(patient.primaryDoctor || patient.attendingNurse || (patient.careTeam && patient.careTeam.length > 0)) && (
              <Card>
                <VStack gap={4}>
                  <Text size="lg" weight="semibold">Care Team</Text>
                  <VStack gap={3}>
                    {patient.primaryDoctor && (
                      <HStack justify="between">
                        <Text>Primary Doctor</Text>
                        <Text weight="medium">
                          Dr. {patient.primaryDoctor.name}
                        </Text>
                      </HStack>
                    )}
                    {patient.attendingNurse && (
                      <HStack justify="between">
                        <Text>Attending Nurse</Text>
                        <Text weight="medium">
                          {patient.attendingNurse.name}
                        </Text>
                      </HStack>
                    )}
                    {patient.careTeam && patient.careTeam.length > 0 && (
                      <>
                        {patient.careTeam.map((member: any, index: number) => (
                          <HStack key={index} justify="between">
                            <Text>{member.role}</Text>
                            <Text weight="medium">
                              {member.user?.name || 'Unknown'}
                            </Text>
                          </HStack>
                        ))}
                      </>
                    )}
                  </VStack>
                </VStack>
              </Card>
            )}

            {/* Vitals - Using mock data for now */}
            <Card>
              <VStack gap={4}>
                <HStack justify="between" align="center">
                  <Text size="lg" weight="semibold">Current Vitals</Text>
                  <Badge variant="secondary" size="xs">Mock Data</Badge>
                </HStack>
                <VStack gap={3}>
                  <HStack justify="between">
                    <Text>Blood Pressure</Text>
                    <Badge variant="secondary">{mockVitals.bloodPressure}</Badge>
                  </HStack>
                  <HStack justify="between">
                    <Text>Heart Rate</Text>
                    <Badge variant="secondary">{`${mockVitals.heartRate} bpm`}</Badge>
                  </HStack>
                  <HStack justify="between">
                    <Text>Temperature</Text>
                    <Badge variant="secondary">{`${mockVitals.temperature}°F`}</Badge>
                  </HStack>
                  <HStack justify="between">
                    <Text>Oxygen Level</Text>
                    <Badge variant="secondary">{`${mockVitals.oxygenLevel}%`}</Badge>
                  </HStack>
                </VStack>
              </VStack>
            </Card>

            {/* Allergies */}
            <Card>
              <VStack gap={4}>
                <Text size="lg" weight="semibold">Allergies</Text>
                {patient.allergies && Array.isArray(patient.allergies) && patient.allergies.length > 0 ? (
                  <HStack gap={2} style={{ flexWrap: 'wrap' }}>
                    {(patient.allergies as string[]).map((allergy: string, index: number) => (
                      <Badge key={index} variant="error">
                        {allergy}
                      </Badge>
                    ))}
                  </HStack>
                ) : (
                  <Text colorTheme="mutedForeground">No known allergies</Text>
                )}
              </VStack>
            </Card>

            {/* Medications */}
            <Card>
              <VStack gap={4}>
                <Text size="lg" weight="semibold">Current Medications</Text>
                {patient.medications && Array.isArray(patient.medications) && patient.medications.length > 0 ? (
                  <VStack gap={2}>
                    {(patient.medications as any[]).map((medication: any, index: number) => (
                      <View key={index}>
                        <Text>
                          • {typeof medication === 'string' ? medication : `${medication.name} - ${medication.dosage} (${medication.frequency})`}
                        </Text>
                      </View>
                    ))}
                  </VStack>
                ) : (
                  <Text colorTheme="mutedForeground">No medications recorded</Text>
                )}
              </VStack>
            </Card>

            {/* Emergency Contact */}
            {patient.emergencyContact && (
              <Card>
                <VStack gap={4}>
                  <Text size="lg" weight="semibold">Emergency Contact</Text>
                  <VStack gap={3}>
                    <HStack justify="between">
                      <Text>Name</Text>
                      <Text weight="medium">
                        {(patient.emergencyContact as any).name}
                      </Text>
                    </HStack>
                    <HStack justify="between">
                      <Text>Relationship</Text>
                      <Text weight="medium">
                        {(patient.emergencyContact as any).relationship}
                      </Text>
                    </HStack>
                    <HStack justify="between">
                      <Text>Phone</Text>
                      <Text weight="medium">
                        {(patient.emergencyContact as any).phone || (patient.emergencyContact as any).phoneNumber}
                      </Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Card>
            )}

            {/* Active Alerts */}
            {patient.activeAlerts && patient.activeAlerts.length > 0 && (
              <Card>
                <VStack gap={4}>
                  <Text size="lg" weight="semibold">Active Alerts</Text>
                  <VStack gap={3}>
                    {patient.activeAlerts.map((alert: any, index: number) => (
                      <HStack key={index} justify="between" align="center">
                        <VStack gap={1} style={{ flex: 1 }}>
                          <Text weight="medium">{alert.type}</Text>
                          <Text size="xs" colorTheme="mutedForeground">
                            {format(new Date(alert.createdAt), 'MMM dd, h:mm a')}
                          </Text>
                        </VStack>
                        <Badge 
                          variant={alert.urgencyLevel <= 2 ? 'error' : 'warning'}
                          size="sm"
                        >
                          Level {alert.urgencyLevel}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Card>
            )}

            {/* Actions */}
            <VStack gap={3}>
              <Button variant="default" onPress={() => {
                // TODO: Navigate to edit patient screen
                // router.push(`/(modals)/edit-patient?patientId=${patient.id}`);
              }}>
                Update Patient Information
              </Button>
              <Button variant="outline" onPress={handleClose}>
                Close
              </Button>
            </VStack>
          </VStack>
        </ScrollView>
      </Container>
    </PermissionGuard>
  );
}