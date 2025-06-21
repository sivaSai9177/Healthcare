/**
 * Integration test for complete alert creation flow
 * Tests: Operator creates alert → Notification sent → Nurse acknowledges → Doctor responds → Alert resolved
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TRPCError } from '@trpc/server';
import type { AppRouter } from '@/src/server/routers';
import { createTestContext, createMockUser, cleanupDatabase } from '../../helpers/test-utils';

// Mock WebSocket for real-time notifications
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
  emit: jest.fn(),
};

jest.mock('@/src/server/websocket', () => ({
  alertEvents: {
    emitAlertCreated: jest.fn(),
    emitAlertAcknowledged: jest.fn(),
    emitAlertResolved: jest.fn(),
    emitAlertEscalated: jest.fn(),
  },
}));

describe('Alert Creation Flow Integration', () => {
  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Clean database
    await cleanupDatabase();
  });
  
  afterEach(() => {
    jest.clearAllTimers();
  });
  
  describe('Complete Alert Lifecycle', () => {
    it('should handle full alert flow from creation to resolution', async () => {
      // Step 1: Setup test users
      const operator = await createMockUser({
        email: 'operator@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
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
      
      // Step 2: Operator creates alert
      const createAlertData = {
        roomNumber: 'A301',
        alertType: 'medical_emergency' as const,
        urgencyLevel: 3,
        description: 'Patient experiencing chest pain',
        patientId: 'patient-123',
        hospitalId: 'test-hospital',
      };
      
      const ctx = await createTestContext(operator);
      const { appRouter } = await import('@/src/server/routers');
      const caller = appRouter.createCaller(ctx);
      
      // Create alert
      const createdAlert = await caller.healthcare.createAlert(createAlertData);
      
      // Verify alert was created
      expect(createdAlert).toMatchObject({
        id: expect.any(String),
        roomNumber: 'A301',
        alertType: 'medical_emergency',
        urgencyLevel: 3,
        status: 'active',
        createdById: operator.id,
        hospitalId: 'test-hospital',
      });
      
      // Verify WebSocket notification was sent
      const { alertEvents } = await import('@/src/server/websocket');
      expect(alertEvents.emitAlertCreated).toHaveBeenCalledWith(
        'test-hospital',
        expect.objectContaining({
          id: createdAlert.id,
          roomNumber: 'A301',
        })
      );
      
      // Step 3: Nurse acknowledges alert
      const nurseCtx = await createTestContext(nurse);
      const nurseCaller = appRouter.createCaller(nurseCtx);
      
      const acknowledgedAlert = await nurseCaller.healthcare.acknowledgeAlert({
        alertId: createdAlert.id,
        notes: 'On my way to room A301',
      });
      
      expect(acknowledgedAlert).toMatchObject({
        id: createdAlert.id,
        status: 'acknowledged',
        acknowledgedById: nurse.id,
        acknowledgedAt: expect.any(Date),
      });
      
      // Verify acknowledgment notification
      expect(alertEvents.emitAlertAcknowledged).toHaveBeenCalledWith(
        'test-hospital',
        expect.objectContaining({
          id: createdAlert.id,
          acknowledgedBy: nurse.id,
        })
      );
      
      // Step 4: Doctor responds and resolves alert
      const doctorCtx = await createTestContext(doctor);
      const doctorCaller = appRouter.createCaller(doctorCtx);
      
      const resolvedAlert = await doctorCaller.healthcare.resolveAlert({
        alertId: createdAlert.id,
        resolution: 'Patient stabilized, administered medication',
      });
      
      expect(resolvedAlert).toMatchObject({
        id: createdAlert.id,
        status: 'resolved',
        resolvedById: doctor.id,
        resolvedAt: expect.any(Date),
        resolution: 'Patient stabilized, administered medication',
      });
      
      // Verify resolution notification
      expect(alertEvents.emitAlertResolved).toHaveBeenCalledWith(
        'test-hospital',
        expect.objectContaining({
          id: createdAlert.id,
          resolvedBy: doctor.id,
        })
      );
      
      // Step 5: Verify alert history/timeline
      const timeline = await doctorCaller.healthcare.getAlertTimeline({
        alertId: createdAlert.id,
      });
      
      expect(timeline).toHaveLength(4); // Created, Acknowledged, Responded, Resolved
      expect(timeline[0].type).toBe('created');
      expect(timeline[1].type).toBe('acknowledged');
      expect(timeline[2].type).toBe('responded');
      expect(timeline[3].type).toBe('resolved');
    });
    
    it('should enforce role-based permissions throughout the flow', async () => {
      // Create users
      const nurse = await createMockUser({
        email: 'nurse2@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const operator = await createMockUser({
        email: 'operator2@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      // Nurse tries to create alert (should fail)
      const nurseCtx = await createTestContext(nurse);
      const { appRouter } = await import('@/src/server/routers');
      const nurseCaller = appRouter.createCaller(nurseCtx);
      
      await expect(
        nurseCaller.healthcare.createAlert({
          roomNumber: 'B201',
          alertType: 'code_blue' as const,
          urgencyLevel: 5,
          hospitalId: 'test-hospital',
        })
      ).rejects.toThrow('Unauthorized');
      
      // Operator creates alert successfully
      const operatorCtx = await createTestContext(operator);
      const operatorCaller = appRouter.createCaller(operatorCtx);
      
      const alert = await operatorCaller.healthcare.createAlert({
        roomNumber: 'B201',
        alertType: 'code_blue' as const,
        urgencyLevel: 5,
        hospitalId: 'test-hospital',
      });
      
      expect(alert.id).toBeDefined();
      
      // Operator tries to resolve alert (should fail - only medical staff can resolve)
      await expect(
        operatorCaller.healthcare.resolveAlert({
          alertId: alert.id,
          resolution: 'Resolved by operator',
        })
      ).rejects.toThrow('Unauthorized');
    });
    
    it('should handle notification failures gracefully', async () => {
      // Mock WebSocket failure
      const { alertEvents } = await import('@/src/server/websocket');
      (alertEvents.emitAlertCreated as jest.Mock).mockRejectedValueOnce(
        new Error('WebSocket connection failed')
      );
      
      const operator = await createMockUser({
        email: 'operator3@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(operator);
      const { appRouter } = await import('@/src/server/routers');
      const caller = appRouter.createCaller(ctx);
      
      // Alert creation should succeed even if notification fails
      const alert = await caller.healthcare.createAlert({
        roomNumber: 'C101',
        alertType: 'medical_emergency' as const,
        urgencyLevel: 2,
        hospitalId: 'test-hospital',
      });
      
      expect(alert.id).toBeDefined();
      expect(alert.status).toBe('active');
      
      // Verify notification was attempted
      expect(alertEvents.emitAlertCreated).toHaveBeenCalled();
    });
  });
  
  describe('Alert Validation', () => {
    it('should validate required fields on creation', async () => {
      const operator = await createMockUser({
        email: 'operator4@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(operator);
      const { appRouter } = await import('@/src/server/routers');
      const caller = appRouter.createCaller(ctx);
      
      // Missing room number
      await expect(
        caller.healthcare.createAlert({
          roomNumber: '',
          alertType: 'medical_emergency' as const,
          urgencyLevel: 3,
          hospitalId: 'test-hospital',
        })
      ).rejects.toThrow('Room number is required');
      
      // Invalid urgency level
      await expect(
        caller.healthcare.createAlert({
          roomNumber: 'D101',
          alertType: 'medical_emergency' as const,
          urgencyLevel: 0, // Should be 1-5
          hospitalId: 'test-hospital',
        })
      ).rejects.toThrow('Invalid urgency level');
    });
    
    it('should prevent duplicate active alerts for same room', async () => {
      const operator = await createMockUser({
        email: 'operator5@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(operator);
      const { appRouter } = await import('@/src/server/routers');
      const caller = appRouter.createCaller(ctx);
      
      // Create first alert
      const alert1 = await caller.healthcare.createAlert({
        roomNumber: 'E101',
        alertType: 'fire' as const,
        urgencyLevel: 5,
        hospitalId: 'test-hospital',
      });
      
      // Try to create duplicate alert for same room
      await expect(
        caller.healthcare.createAlert({
          roomNumber: 'E101',
          alertType: 'medical_emergency' as const,
          urgencyLevel: 3,
          hospitalId: 'test-hospital',
        })
      ).rejects.toThrow('Active alert already exists for room E101');
    });
  });
  
  describe('Alert Metrics', () => {
    it('should track response times correctly', async () => {
      const operator = await createMockUser({
        email: 'operator6@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const nurse = await createMockUser({
        email: 'nurse6@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      // Create alert
      const operatorCtx = await createTestContext(operator);
      const { appRouter } = await import('@/src/server/routers');
      const operatorCaller = appRouter.createCaller(operatorCtx);
      
      const alert = await operatorCaller.healthcare.createAlert({
        roomNumber: 'F101',
        alertType: 'medical_emergency' as const,
        urgencyLevel: 4,
        hospitalId: 'test-hospital',
      });
      
      // Wait 2 seconds before acknowledging
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Acknowledge alert
      const nurseCtx = await createTestContext(nurse);
      const nurseCaller = appRouter.createCaller(nurseCtx);
      
      await nurseCaller.healthcare.acknowledgeAlert({
        alertId: alert.id,
      });
      
      // Get metrics
      const metrics = await nurseCaller.healthcare.getResponseMetrics({
        hospitalId: 'test-hospital',
        timeRange: '24h',
      });
      
      expect(metrics.averageResponseTime).toBeGreaterThan(2); // At least 2 seconds
      expect(metrics.totalAlerts).toBe(1);
      expect(metrics.acknowledgedAlerts).toBe(1);
    });
  });
});