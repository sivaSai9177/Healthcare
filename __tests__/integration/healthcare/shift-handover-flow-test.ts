/**
 * Integration test for shift handover flow
 * Tests: Current shift summary → Handover notes → Shift transition → New shift starts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createTestContext, createMockUser, cleanupDatabase } from '../../helpers/test-utils';
import type { AppRouter } from '@/src/server/routers';

// Mock WebSocket
jest.mock('@/src/server/websocket', () => ({
  shiftEvents: {
    emitShiftStarted: jest.fn(),
    emitShiftEnded: jest.fn(),
    emitHandoverRequest: jest.fn(),
    emitHandoverCompleted: jest.fn(),
  },
}));

// Mock notification service
jest.mock('@/src/server/services/notifications', () => ({
  notificationService: {
    sendShiftStartNotification: jest.fn(),
    sendHandoverRequestNotification: jest.fn(),
    sendShiftEndNotification: jest.fn(),
  },
}));

describe('Shift Handover Flow Integration', () => {
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
  
  describe('Complete Shift Lifecycle', () => {
    it('should handle full shift flow from start to handover', async () => {
      // Setup nurses for shift transition
      const outgoingNurse = await createMockUser({
        email: 'nurse-outgoing@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const incomingNurse = await createMockUser({
        email: 'nurse-incoming@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const operator = await createMockUser({
        email: 'operator@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      // Step 1: Outgoing nurse starts shift
      const outgoingCtx = await createTestContext(outgoingNurse);
      const outgoingCaller = appRouter.createCaller(outgoingCtx);
      
      const startShiftResult = await outgoingCaller.healthcare.toggleOnDuty({
        status: true,
      });
      
      expect(startShiftResult.isOnDuty).toBe(true);
      expect(startShiftResult.shiftStartedAt).toBeDefined();
      
      // Verify WebSocket notification
      const { shiftEvents } = await import('@/src/server/websocket');
      expect(shiftEvents.emitShiftStarted).toHaveBeenCalledWith(
        'test-hospital',
        expect.objectContaining({
          userId: outgoingNurse.id,
          startedAt: expect.any(Date),
        })
      );
      
      // Step 2: Create some alerts during the shift
      const operatorCtx = await createTestContext(operator);
      const operatorCaller = appRouter.createCaller(operatorCtx);
      
      // Create active alert
      const activeAlert = await operatorCaller.healthcare.createAlert({
        roomNumber: 'A201',
        alertType: 'medical_emergency' as const,
        urgencyLevel: 3,
        hospitalId: 'test-hospital',
        description: 'Patient needs attention',
      });
      
      // Nurse acknowledges the alert
      await outgoingCaller.healthcare.acknowledgeAlert({
        alertId: activeAlert.id,
        notes: 'Checking on patient',
      });
      
      // Create another alert that remains active
      const pendingAlert = await operatorCaller.healthcare.createAlert({
        roomNumber: 'B302',
        alertType: 'nurse_assistance' as const,
        urgencyLevel: 2,
        hospitalId: 'test-hospital',
      });
      
      // Step 3: Get shift summary before handover
      const shiftSummary = await outgoingCaller.healthcare.getShiftSummary();
      
      expect(shiftSummary).toMatchObject({
        shiftDuration: expect.any(Number),
        alertsHandled: 1,
        activeAlerts: 1,
        alertsByType: {
          medical_emergency: 1,
          nurse_assistance: 1,
        },
        alertsByUrgency: {
          '2': 1,
          '3': 1,
        },
      });
      
      // Step 4: Initiate handover
      const handoverNotes = {
        notes: 'Patient in A201 stable but needs hourly checks. New admission in B302 needs initial assessment.',
        criticalAlerts: [pendingAlert.id],
        followUpRequired: ['A201 medication due at 2pm', 'B302 lab results pending'],
      };
      
      // End shift with handover
      const handoverResult = await outgoingCaller.healthcare.endShift({
        handoverNotes: handoverNotes.notes,
        criticalAlerts: handoverNotes.criticalAlerts,
        followUpRequired: handoverNotes.followUpRequired,
      });
      
      expect(handoverResult.success).toBe(true);
      expect(handoverResult.handoverId).toBeDefined();
      
      // Verify handover notification sent
      const { notificationService } = await import('@/src/server/services/notifications');
      expect(notificationService.sendHandoverRequestNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          fromNurse: outgoingNurse.id,
          hospitalId: 'test-hospital',
          handoverNotes: handoverNotes.notes,
        })
      );
      
      // Step 5: Incoming nurse reviews and accepts handover
      const incomingCtx = await createTestContext(incomingNurse);
      const incomingCaller = appRouter.createCaller(incomingCtx);
      
      // Get pending handovers
      const pendingHandovers = await incomingCaller.healthcare.getPendingHandovers();
      
      expect(pendingHandovers).toHaveLength(1);
      expect(pendingHandovers[0]).toMatchObject({
        id: handoverResult.handoverId,
        fromUserId: outgoingNurse.id,
        notes: handoverNotes.notes,
        criticalAlerts: [pendingAlert.id],
        status: 'pending',
      });
      
      // Accept handover and start new shift
      const acceptResult = await incomingCaller.healthcare.acceptHandover({
        handoverId: handoverResult.handoverId,
        acknowledgment: 'Reviewed all notes. Starting rounds now.',
      });
      
      expect(acceptResult.success).toBe(true);
      expect(acceptResult.shiftStarted).toBe(true);
      
      // Verify incoming nurse is now on duty
      const incomingStatus = await incomingCaller.healthcare.getOnDutyStatus();
      expect(incomingStatus.isOnDuty).toBe(true);
      
      // Verify outgoing nurse is off duty
      const outgoingStatus = await outgoingCaller.healthcare.getOnDutyStatus();
      expect(outgoingStatus.isOnDuty).toBe(false);
      
      // Verify handover completion notification
      expect(shiftEvents.emitHandoverCompleted).toHaveBeenCalledWith(
        'test-hospital',
        expect.objectContaining({
          handoverId: handoverResult.handoverId,
          fromUserId: outgoingNurse.id,
          toUserId: incomingNurse.id,
        })
      );
    });
    
    it('should prevent ending shift with unresolved critical alerts', async () => {
      const nurse = await createMockUser({
        email: 'nurse-critical@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const operator = await createMockUser({
        email: 'operator-critical@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      // Start shift
      const nurseCtx = await createTestContext(nurse);
      const nurseCaller = appRouter.createCaller(nurseCtx);
      
      await nurseCaller.healthcare.toggleOnDuty({ status: true });
      
      // Create critical alert
      const operatorCtx = await createTestContext(operator);
      const operatorCaller = appRouter.createCaller(operatorCtx);
      
      const criticalAlert = await operatorCaller.healthcare.createAlert({
        roomNumber: 'ICU-01',
        alertType: 'code_blue' as const,
        urgencyLevel: 5,
        hospitalId: 'test-hospital',
      });
      
      // Try to end shift without resolving critical alert
      await expect(
        nurseCaller.healthcare.endShift({
          handoverNotes: 'Ending shift',
        })
      ).rejects.toThrow('Cannot end shift with unresolved critical alerts');
      
      // Acknowledge the alert
      await nurseCaller.healthcare.acknowledgeAlert({
        alertId: criticalAlert.id,
        notes: 'Responding to code blue',
      });
      
      // Now should be able to end shift
      const endResult = await nurseCaller.healthcare.endShift({
        handoverNotes: 'Code blue in ICU-01 acknowledged, team responding',
        criticalAlerts: [criticalAlert.id],
      });
      
      expect(endResult.success).toBe(true);
    });
    
    it('should track handover metrics', async () => {
      const nurse1 = await createMockUser({
        email: 'nurse1@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const nurse2 = await createMockUser({
        email: 'nurse2@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      // Complete a handover
      const ctx1 = await createTestContext(nurse1);
      const caller1 = appRouter.createCaller(ctx1);
      
      await caller1.healthcare.toggleOnDuty({ status: true });
      
      const handover = await caller1.healthcare.endShift({
        handoverNotes: 'Test handover',
      });
      
      const ctx2 = await createTestContext(nurse2);
      const caller2 = appRouter.createCaller(ctx2);
      
      await caller2.healthcare.acceptHandover({
        handoverId: handover.handoverId,
      });
      
      // Get handover metrics
      const metrics = await caller2.healthcare.getHandoverMetrics({
        hospitalId: 'test-hospital',
        timeRange: '24h',
      });
      
      expect(metrics).toMatchObject({
        totalHandovers: 1,
        averageHandoverTime: expect.any(Number),
        handoversByShift: expect.any(Object),
        criticalAlertsTransferred: 0,
      });
    });
  });
  
  describe('Handover Validation', () => {
    it('should require handover notes when ending shift', async () => {
      const nurse = await createMockUser({
        email: 'nurse-validation@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(nurse);
      const caller = appRouter.createCaller(ctx);
      
      await caller.healthcare.toggleOnDuty({ status: true });
      
      // Try to end shift without notes
      await expect(
        caller.healthcare.endShift({
          handoverNotes: '',
        })
      ).rejects.toThrow('Handover notes are required');
    });
    
    it('should validate minimum shift duration', async () => {
      const nurse = await createMockUser({
        email: 'nurse-duration@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(nurse);
      const caller = appRouter.createCaller(ctx);
      
      await caller.healthcare.toggleOnDuty({ status: true });
      
      // Try to end shift immediately (less than minimum duration)
      await expect(
        caller.healthcare.endShift({
          handoverNotes: 'Ending too soon',
        })
      ).rejects.toThrow('Minimum shift duration not met');
    });
  });
  
  describe('Multi-Hospital Handover', () => {
    it('should handle handovers within same hospital only', async () => {
      const nurse1 = await createMockUser({
        email: 'nurse-hospital1@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'hospital-1',
      });
      
      const nurse2 = await createMockUser({
        email: 'nurse-hospital2@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'hospital-2',
      });
      
      // Nurse 1 starts shift and creates handover
      const ctx1 = await createTestContext(nurse1);
      const caller1 = appRouter.createCaller(ctx1);
      
      await caller1.healthcare.toggleOnDuty({ status: true });
      const handover = await caller1.healthcare.endShift({
        handoverNotes: 'Cross-hospital test',
      });
      
      // Nurse 2 from different hospital should not see the handover
      const ctx2 = await createTestContext(nurse2);
      const caller2 = appRouter.createCaller(ctx2);
      
      const pendingHandovers = await caller2.healthcare.getPendingHandovers();
      expect(pendingHandovers).toHaveLength(0);
    });
  });
});