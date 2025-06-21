import type { SpacingValue, ButtonVariant, BadgeVariant } from '@/types/components';
import React from 'react';
import { View, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Text,
  Button,
  Card,
  Stack,
  Container,
  Badge,
  Separator,
  Avatar,
} from '@/components/universal';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/hooks/core/useSpacing';
import { useHealthcareAccess } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/blocks/auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/auth/permissions';

interface PatientInfo {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string; // Medical Record Number
  admissionDate: string;
  ward: string;
  bed: string;
  diagnosis: string;
  allergies: string[];
  medications: string[];
  vitals: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenLevel: number;
  };
}

// Mock patient data - replace with actual data fetching
const mockPatient: PatientInfo = {
  id: '1',
  name: 'John Doe',
  age: 45,
  gender: 'Male',
  mrn: 'MRN123456',
  admissionDate: '2025-01-15',
  ward: 'Cardiology',
  bed: 'B-203',
  diagnosis: 'Acute Myocardial Infarction',
  allergies: ['Penicillin', 'Peanuts'],
  medications: ['Aspirin', 'Metoprolol', 'Lisinopril'],
  vitals: {
    bloodPressure: '120/80',
    heartRate: 72,
    temperature: 98.6,
    oxygenLevel: 98,
  },
};

export default function PatientDetailsModal() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const spacing = useSpacing();
  const { canViewPatients } = useHealthcareAccess();

  // TODO: Fetch actual patient data based on patientId
  const patient = mockPatient;

  const handleClose = () => {
    router.back();
  };

  return (
    <PermissionGuard permission={PERMISSIONS.VIEW_PATIENTS}>
      <Container className="flex-1 bg-background">
        <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xl,
        }}
      >
        <Stack spacing="lg">
          {/* Header */}
          <Stack spacing="sm" direction="row" align="center">
            <Avatar
              size="default"
              fallback={patient.name.split(' ').map(n => n[0]).join('')}
            />
            <Stack spacing="xs" style={{ flex: 1 }}>
              <Text variant="h2">{patient.name}</Text>
              <Text variant="body" style={{ opacity: 0.7 }}>
                MRN: {patient.mrn}
              </Text>
            </Stack>
          </Stack>

          {/* Basic Information */}
          <Card>
            <Stack spacing="md">
              <Text variant="h4">Basic Information</Text>
              <Stack spacing="sm">
                <Stack direction="row" justify="between">
                  <Text variant="body">Age</Text>
                  <Text variant="body" weight="medium">
                    {patient.age} years
                  </Text>
                </Stack>
                <Stack direction="row" justify="between">
                  <Text variant="body">Gender</Text>
                  <Text variant="body" weight="medium">
                    {patient.gender}
                  </Text>
                </Stack>
                <Stack direction="row" justify="between">
                  <Text variant="body">Admission Date</Text>
                  <Text variant="body" weight="medium">
                    {new Date(patient.admissionDate).toLocaleDateString()}
                  </Text>
                </Stack>
                <Stack direction="row" justify="between">
                  <Text variant="body">Location</Text>
                  <Text variant="body" weight="medium">
                    {patient.ward} - Bed {patient.bed}
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          </Card>

          {/* Diagnosis */}
          <Card>
            <Stack spacing="md">
              <Text variant="h4">Diagnosis</Text>
              <Text variant="body">{patient.diagnosis}</Text>
            </Stack>
          </Card>

          {/* Vitals */}
          <Card>
            <Stack spacing="md">
              <Text variant="h4">Current Vitals</Text>
              <Stack spacing="sm">
                <Stack direction="row" justify="between">
                  <Text variant="body">Blood Pressure</Text>
                  <Badge variant="secondary">{patient.vitals.bloodPressure}</Badge>
                </Stack>
                <Stack direction="row" justify="between">
                  <Text variant="body">Heart Rate</Text>
                  <Badge variant="secondary">{`${patient.vitals.heartRate} bpm`}</Badge>
                </Stack>
                <Stack direction="row" justify="between">
                  <Text variant="body">Temperature</Text>
                  <Badge variant="secondary">{`${patient.vitals.temperature}°F`}</Badge>
                </Stack>
                <Stack direction="row" justify="between">
                  <Text variant="body">Oxygen Level</Text>
                  <Badge variant="secondary">{`${patient.vitals.oxygenLevel}%`}</Badge>
                </Stack>
              </Stack>
            </Stack>
          </Card>

          {/* Allergies */}
          <Card>
            <Stack spacing="md">
              <Text variant="h4">Allergies</Text>
              <Stack direction="row" spacing="sm" style={{ flexWrap: 'wrap' }}>
                {patient.allergies.map((allergy, index) => (
                  <Badge key={index} variant="error">
                    {allergy}
                  </Badge>
                ))}
              </Stack>
            </Stack>
          </Card>

          {/* Medications */}
          <Card>
            <Stack spacing="md">
              <Text variant="h4">Current Medications</Text>
              <Stack spacing="sm">
                {patient.medications.map((medication, index) => (
                  <View key={index}>
                    <Text variant="body">• {medication}</Text>
                  </View>
                ))}
              </Stack>
            </Stack>
          </Card>

          {/* Actions */}
          <Stack spacing="sm">
            <Button variant="default" onPress={() => {
              // TODO: Navigate to edit patient screen
// TODO: Replace with structured logging - /* console.log('Edit patient') */;
            }}>
              Update Patient Information
            </Button>
            <Button variant="outline" onPress={handleClose}>
              Close
            </Button>
          </Stack>
        </Stack>
      </ScrollView>
    </Container>
    </PermissionGuard>
  );
}