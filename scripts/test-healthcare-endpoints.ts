#!/usr/bin/env bun
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/src/server/routers';
import { log } from '@/lib/core/debug/logger';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';

// Create tRPC client
const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      headers: async () => ({
        // Add auth token if needed
        authorization: 'Bearer test-token',
      }),
    }),
  ],
});

async function testHealthcareEndpoints() {
  try {
    log.info('Testing Healthcare API Endpoints', 'TEST');
    log.info(`API URL: ${API_URL}`, 'TEST');

    // 1. Test creating a patient
    log.info('Testing patient creation...', 'TEST');
    const newPatient = await trpc.patient.createPatient.mutate({
      mrn: `MRN-${Date.now()}`,
      name: 'John Doe',
      dateOfBirth: new Date('1980-01-01'),
      gender: 'male',
      bloodType: 'O+',
      roomNumber: '101',
      bedNumber: 'A',
      admissionDate: new Date(),
      primaryDiagnosis: 'Routine checkup',
      allergies: ['Penicillin'],
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '555-1234',
      },
    });
    log.success('Patient created successfully', 'TEST', { patientId: newPatient.id });

    // 2. Test recording vitals
    log.info('Testing vitals recording...', 'TEST');
    const vitals = await trpc.patient.recordVitals.mutate({
      patientId: newPatient.id,
      heartRate: 72,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      temperature: '98.6',
      respiratoryRate: 16,
      oxygenSaturation: 98,
      notes: 'Normal vitals on admission',
    });
    log.success('Vitals recorded successfully', 'TEST', { vitalsId: vitals.id });

    // 3. Test creating an alert
    log.info('Testing alert creation...', 'TEST');
    const newAlert = await trpc.healthcare.createAlert.mutate({
      roomNumber: '101',
      alertType: 'medical_emergency',
      urgencyLevel: 3,
      description: 'Patient requires immediate attention',
      patientId: newPatient.id,
    });
    log.success('Alert created successfully', 'TEST', { alertId: newAlert.id });

    // 4. Test acknowledging alert
    log.info('Testing alert acknowledgment...', 'TEST');
    const acknowledgment = await trpc.healthcare.acknowledgeAlert.mutate({
      alertId: newAlert.id,
      notes: 'Responding to alert',
    });
    log.success('Alert acknowledged', 'TEST', acknowledgment);

    // 5. Test getting alert timeline
    log.info('Testing alert timeline...', 'TEST');
    const timeline = await trpc.healthcare.getAlertTimeline.query({
      alertId: newAlert.id,
    });
    log.success('Alert timeline retrieved', 'TEST', { events: timeline.events.length });

    // 6. Test getting patient list
    log.info('Testing patient list...', 'TEST');
    const patients = await trpc.patient.getPatientsList.query({
      hospitalId: 'test-hospital-id', // You may need to adjust this
      limit: 10,
    });
    log.success('Patient list retrieved', 'TEST', { count: patients.total });

    // 7. Test getting alerts dashboard
    log.info('Testing alerts dashboard...', 'TEST');
    const dashboard = await trpc.healthcare.getAlertsDashboard.query();
    log.success('Dashboard data retrieved', 'TEST', {
      activeAlerts: dashboard.activeAlerts,
      todayAlerts: dashboard.todayAlerts,
    });

    log.info('All healthcare endpoint tests completed successfully!', 'TEST');
  } catch (error) {
    log.error('Test failed', 'TEST', error);
    process.exit(1);
  }
}

// Run tests
testHealthcareEndpoints()
  .then(() => {
    log.info('Healthcare API tests completed', 'TEST');
    process.exit(0);
  })
  .catch(error => {
    log.error('Unexpected error', 'TEST', error);
    process.exit(1);
  });