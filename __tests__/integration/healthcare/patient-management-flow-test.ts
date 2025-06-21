/**
 * Integration test for patient management flow
 * Tests: Add patient → Update info → Assign to room → Create alert → Track history
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createTestContext, createMockUser, cleanupDatabase } from '../../helpers/test-utils';
import type { AppRouter } from '@/src/server/routers';

// Mock WebSocket
jest.mock('@/src/server/websocket', () => ({
  patientEvents: {
    emitPatientAdded: jest.fn(),
    emitPatientUpdated: jest.fn(),
    emitPatientAssigned: jest.fn(),
    emitPatientDischarged: jest.fn(),
  },
}));

describe('Patient Management Flow Integration', () => {
  let appRouter: AppRouter;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanupDatabase();
    const { appRouter: router } = await import('@/src/server/routers');
    appRouter = router;
  });
  
  afterEach(() => {
    jest.clearAllTimers();
  });
  
  describe('Complete Patient Lifecycle', () => {
    it('should handle full patient flow from admission to discharge', async () => {
      // Setup users
      const nurse = await createMockUser({
        email: 'nurse@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const doctor = await createMockUser({
        email: 'doctor@test.com',
        role: 'doctor',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const operator = await createMockUser({
        email: 'operator@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      // Step 1: Nurse adds new patient
      const nurseCtx = await createTestContext(nurse);
      const nurseCaller = appRouter.createCaller(nurseCtx);
      
      const patientData = {
        name: 'John Doe',
        age: 45,
        gender: 'male' as const,
        medicalRecordNumber: 'MRN-12345',
        admissionReason: 'Chest pain, possible cardiac event',
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'spouse',
          phone: '+1-555-0123',
        },
        allergies: ['Penicillin', 'Latex'],
        medications: ['Aspirin 81mg daily', 'Metoprolol 50mg twice daily'],
        hospitalId: 'test-hospital',
      };
      
      const patient = await nurseCaller.healthcare.addPatient(patientData);
      
      expect(patient).toMatchObject({
        id: expect.any(String),
        name: 'John Doe',
        medicalRecordNumber: 'MRN-12345',
        status: 'admitted',
        createdById: nurse.id,
      });
      
      // Verify WebSocket notification
      const { patientEvents } = await import('@/src/server/websocket');
      expect(patientEvents.emitPatientAdded).toHaveBeenCalledWith(
        'test-hospital',
        expect.objectContaining({
          id: patient.id,
          name: 'John Doe',
        })
      );
      
      // Step 2: Assign patient to room
      const roomAssignment = await nurseCaller.healthcare.assignPatientToRoom({
        patientId: patient.id,
        roomNumber: 'A301',
        bedNumber: '1',
        notes: 'Private room requested due to infection control',
      });
      
      expect(roomAssignment).toMatchObject({
        patientId: patient.id,
        roomNumber: 'A301',
        bedNumber: '1',
        assignedAt: expect.any(Date),
        assignedById: nurse.id,
      });
      
      // Step 3: Doctor updates patient condition
      const doctorCtx = await createTestContext(doctor);
      const doctorCaller = appRouter.createCaller(doctorCtx);
      
      const medicalUpdate = await doctorCaller.healthcare.updatePatientCondition({
        patientId: patient.id,
        diagnosis: 'Acute myocardial infarction',
        treatmentPlan: 'Cardiac catheterization scheduled, continuous monitoring',
        vitalSigns: {
          bloodPressure: '145/90',
          heartRate: 92,
          temperature: 98.6,
          oxygenSaturation: 96,
          respiratoryRate: 18,
        },
        labResults: {
          troponin: '0.8 ng/mL (elevated)',
          creatinine: '1.1 mg/dL',
          hemoglobin: '13.5 g/dL',
        },
      });
      
      expect(medicalUpdate.diagnosis).toBe('Acute myocardial infarction');
      expect(medicalUpdate.lastUpdatedById).toBe(doctor.id);
      
      // Step 4: Create alert for patient
      const operatorCtx = await createTestContext(operator);
      const operatorCaller = appRouter.createCaller(operatorCtx);
      
      const alert = await operatorCaller.healthcare.createAlert({
        roomNumber: 'A301',
        alertType: 'cardiac_arrest' as const,
        urgencyLevel: 5,
        patientId: patient.id,
        hospitalId: 'test-hospital',
        description: 'Patient experiencing severe chest pain, ECG changes noted',
      });
      
      expect(alert.patientId).toBe(patient.id);
      expect(alert.patientName).toBe('John Doe');
      
      // Step 5: Track patient history
      const patientHistory = await nurseCaller.healthcare.getPatientHistory({
        patientId: patient.id,
      });
      
      expect(patientHistory.events).toHaveLength(4); // Admission, Room Assignment, Medical Update, Alert
      expect(patientHistory.events[0].type).toBe('admitted');
      expect(patientHistory.events[1].type).toBe('room_assigned');
      expect(patientHistory.events[2].type).toBe('condition_updated');
      expect(patientHistory.events[3].type).toBe('alert_created');
      
      // Step 6: Get patient alerts
      const patientAlerts = await nurseCaller.healthcare.getPatientAlerts({
        patientId: patient.id,
      });
      
      expect(patientAlerts).toHaveLength(1);
      expect(patientAlerts[0].id).toBe(alert.id);
      
      // Step 7: Discharge patient
      const discharge = await doctorCaller.healthcare.dischargePatient({
        patientId: patient.id,
        dischargeNotes: 'Patient stable, follow up with cardiologist in 1 week',
        medications: [
          'Aspirin 81mg daily',
          'Metoprolol 50mg twice daily',
          'Atorvastatin 40mg daily',
          'Nitroglycerin PRN',
        ],
        followUpInstructions: [
          'Cardiac rehabilitation program',
          'Low sodium diet',
          'Daily weight monitoring',
          'Call if chest pain recurs',
        ],
      });
      
      expect(discharge).toMatchObject({
        status: 'discharged',
        dischargedAt: expect.any(Date),
        dischargedById: doctor.id,
      });
      
      // Verify discharge notification
      expect(patientEvents.emitPatientDischarged).toHaveBeenCalledWith(
        'test-hospital',
        expect.objectContaining({
          id: patient.id,
          dischargedBy: doctor.id,
        })
      );
      
      // Verify room is now available
      const roomStatus = await nurseCaller.healthcare.getRoomStatus({
        roomNumber: 'A301',
      });
      
      expect(roomStatus.occupied).toBe(false);
      expect(roomStatus.patientId).toBeNull();
    });
    
    it('should handle patient transfer between rooms', async () => {
      const nurse = await createMockUser({
        email: 'nurse-transfer@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(nurse);
      const caller = appRouter.createCaller(ctx);
      
      // Add patient
      const patient = await caller.healthcare.addPatient({
        name: 'Transfer Test Patient',
        age: 30,
        gender: 'female' as const,
        hospitalId: 'test-hospital',
      });
      
      // Initial room assignment
      await caller.healthcare.assignPatientToRoom({
        patientId: patient.id,
        roomNumber: 'B201',
      });
      
      // Transfer to new room
      const transfer = await caller.healthcare.transferPatient({
        patientId: patient.id,
        fromRoom: 'B201',
        toRoom: 'ICU-03',
        reason: 'Condition deteriorated, requires intensive monitoring',
      });
      
      expect(transfer).toMatchObject({
        success: true,
        newRoom: 'ICU-03',
        transferredAt: expect.any(Date),
      });
      
      // Verify old room is available
      const oldRoom = await caller.healthcare.getRoomStatus({
        roomNumber: 'B201',
      });
      expect(oldRoom.occupied).toBe(false);
      
      // Verify new room is occupied
      const newRoom = await caller.healthcare.getRoomStatus({
        roomNumber: 'ICU-03',
      });
      expect(newRoom.occupied).toBe(true);
      expect(newRoom.patientId).toBe(patient.id);
    });
  });
  
  describe('Patient Data Validation', () => {
    it('should validate required patient information', async () => {
      const nurse = await createMockUser({
        email: 'nurse-validation@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(nurse);
      const caller = appRouter.createCaller(ctx);
      
      // Missing name
      await expect(
        caller.healthcare.addPatient({
          name: '',
          age: 25,
          gender: 'male' as const,
          hospitalId: 'test-hospital',
        })
      ).rejects.toThrow('Patient name is required');
      
      // Invalid age
      await expect(
        caller.healthcare.addPatient({
          name: 'Test Patient',
          age: -5,
          gender: 'male' as const,
          hospitalId: 'test-hospital',
        })
      ).rejects.toThrow('Invalid age');
    });
    
    it('should prevent duplicate medical record numbers', async () => {
      const nurse = await createMockUser({
        email: 'nurse-duplicate@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(nurse);
      const caller = appRouter.createCaller(ctx);
      
      // Add first patient
      await caller.healthcare.addPatient({
        name: 'First Patient',
        age: 40,
        gender: 'male' as const,
        medicalRecordNumber: 'MRN-99999',
        hospitalId: 'test-hospital',
      });
      
      // Try to add second patient with same MRN
      await expect(
        caller.healthcare.addPatient({
          name: 'Second Patient',
          age: 35,
          gender: 'female' as const,
          medicalRecordNumber: 'MRN-99999',
          hospitalId: 'test-hospital',
        })
      ).rejects.toThrow('Medical record number already exists');
    });
  });
  
  describe('Patient Search and Filtering', () => {
    it('should search patients by name and MRN', async () => {
      const nurse = await createMockUser({
        email: 'nurse-search@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(nurse);
      const caller = appRouter.createCaller(ctx);
      
      // Add multiple patients
      await caller.healthcare.addPatient({
        name: 'John Smith',
        age: 50,
        gender: 'male' as const,
        medicalRecordNumber: 'MRN-001',
        hospitalId: 'test-hospital',
      });
      
      await caller.healthcare.addPatient({
        name: 'Jane Smith',
        age: 45,
        gender: 'female' as const,
        medicalRecordNumber: 'MRN-002',
        hospitalId: 'test-hospital',
      });
      
      await caller.healthcare.addPatient({
        name: 'Bob Johnson',
        age: 60,
        gender: 'male' as const,
        medicalRecordNumber: 'MRN-003',
        hospitalId: 'test-hospital',
      });
      
      // Search by name
      const smithPatients = await caller.healthcare.searchPatients({
        query: 'Smith',
        hospitalId: 'test-hospital',
      });
      
      expect(smithPatients).toHaveLength(2);
      expect(smithPatients.map(p => p.name)).toContain('John Smith');
      expect(smithPatients.map(p => p.name)).toContain('Jane Smith');
      
      // Search by MRN
      const mrnSearch = await caller.healthcare.searchPatients({
        query: 'MRN-003',
        hospitalId: 'test-hospital',
      });
      
      expect(mrnSearch).toHaveLength(1);
      expect(mrnSearch[0].name).toBe('Bob Johnson');
    });
    
    it('should filter patients by status', async () => {
      const nurse = await createMockUser({
        email: 'nurse-filter@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const doctor = await createMockUser({
        email: 'doctor-filter@test.com',
        role: 'doctor',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const nurseCtx = await createTestContext(nurse);
      const nurseCaller = appRouter.createCaller(nurseCtx);
      
      // Add patients
      const patient1 = await nurseCaller.healthcare.addPatient({
        name: 'Active Patient',
        age: 30,
        gender: 'male' as const,
        hospitalId: 'test-hospital',
      });
      
      const patient2 = await nurseCaller.healthcare.addPatient({
        name: 'Discharged Patient',
        age: 40,
        gender: 'female' as const,
        hospitalId: 'test-hospital',
      });
      
      // Discharge one patient
      const doctorCtx = await createTestContext(doctor);
      const doctorCaller = appRouter.createCaller(doctorCtx);
      
      await doctorCaller.healthcare.dischargePatient({
        patientId: patient2.id,
        dischargeNotes: 'Recovered',
      });
      
      // Filter admitted patients
      const admittedPatients = await nurseCaller.healthcare.getPatients({
        status: 'admitted',
        hospitalId: 'test-hospital',
      });
      
      expect(admittedPatients).toHaveLength(1);
      expect(admittedPatients[0].name).toBe('Active Patient');
      
      // Filter discharged patients
      const dischargedPatients = await nurseCaller.healthcare.getPatients({
        status: 'discharged',
        hospitalId: 'test-hospital',
      });
      
      expect(dischargedPatients).toHaveLength(1);
      expect(dischargedPatients[0].name).toBe('Discharged Patient');
    });
  });
  
  describe('Patient Metrics', () => {
    it('should track patient-related metrics', async () => {
      const nurse = await createMockUser({
        email: 'nurse-metrics@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(nurse);
      const caller = appRouter.createCaller(ctx);
      
      // Add patients with different conditions
      await caller.healthcare.addPatient({
        name: 'Cardiac Patient',
        age: 65,
        gender: 'male' as const,
        admissionReason: 'Cardiac arrest',
        hospitalId: 'test-hospital',
      });
      
      await caller.healthcare.addPatient({
        name: 'Trauma Patient',
        age: 25,
        gender: 'female' as const,
        admissionReason: 'Motor vehicle accident',
        hospitalId: 'test-hospital',
      });
      
      // Get patient metrics
      const metrics = await caller.healthcare.getPatientMetrics({
        hospitalId: 'test-hospital',
        timeRange: '24h',
      });
      
      expect(metrics).toMatchObject({
        totalPatients: 2,
        admittedToday: 2,
        dischargedToday: 0,
        averageStayDuration: 0, // Just admitted
        patientsByDepartment: expect.any(Object),
        occupancyRate: expect.any(Number),
      });
    });
  });
});