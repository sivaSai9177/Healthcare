/**
 * Integration test for alert escalation flow
 * Tests: Alert created → No response → Auto-escalate to doctor → No response → Escalate to head doctor
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createTestContext, createMockUser, cleanupDatabase } from '../../helpers/test-utils';
import { escalationService } from '@/src/server/services/escalation-timer';

// Mock timers for testing
jest.useFakeTimers();

// Mock WebSocket
jest.mock('@/src/server/websocket', () => ({
  alertEvents: {
    emitAlertCreated: jest.fn(),
    emitAlertEscalated: jest.fn(),
    emitEscalationWarning: jest.fn(),
  },
}));

// Mock notification service
jest.mock('@/src/server/services/notifications', () => ({
  notificationService: {
    sendAlertNotification: jest.fn(),
    sendEscalationNotification: jest.fn(),
  },
}));

describe('Alert Escalation Flow Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanupDatabase();
    // Clear any existing timers
    escalationService.clearAllTimers();
  });
  
  afterEach(() => {
    jest.clearAllTimers();
    escalationService.clearAllTimers();
  });
  
  describe('Automatic Escalation', () => {
    it('should escalate alert through tiers when not acknowledged', async () => {
      // Setup users for each escalation tier
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
        isOnDuty: true,
      });
      
      const doctor = await createMockUser({
        email: 'doctor@test.com',
        role: 'doctor',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
        isOnDuty: true,
      });
      
      const headDoctor = await createMockUser({
        email: 'headdoctor@test.com',
        role: 'head_doctor',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
        isOnDuty: true,
      });
      
      // Create high urgency alert
      const ctx = await createTestContext(operator);
      const { appRouter } = await import('@/src/server/routers');
      const caller = appRouter.createCaller(ctx);
      
      const alert = await caller.healthcare.createAlert({
        roomNumber: 'ICU-01',
        alertType: 'cardiac_arrest' as const,
        urgencyLevel: 5, // Highest urgency
        hospitalId: 'test-hospital',
        description: 'Patient in cardiac arrest',
      });
      
      expect(alert.status).toBe('active');
      expect(alert.currentEscalationTier).toBe(1);
      
      // Verify initial notification sent to nurses
      const { notificationService } = await import('@/src/server/services/notifications');
      expect(notificationService.sendAlertNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: expect.arrayContaining([nurse.id]),
          alert: expect.objectContaining({ id: alert.id }),
        })
      );
      
      // Fast-forward to tier 2 escalation (5 minutes for urgency 5)
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      // Check escalation to doctors
      const escalatedAlert1 = await caller.healthcare.getAlertById({ 
        alertId: alert.id 
      });
      
      expect(escalatedAlert1.currentEscalationTier).toBe(2);
      expect(notificationService.sendEscalationNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: expect.arrayContaining([doctor.id]),
          alert: expect.objectContaining({ 
            id: alert.id,
            currentEscalationTier: 2,
          }),
        })
      );
      
      // Fast-forward to tier 3 escalation (another 5 minutes)
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      // Check escalation to head doctor
      const escalatedAlert2 = await caller.healthcare.getAlertById({ 
        alertId: alert.id 
      });
      
      expect(escalatedAlert2.currentEscalationTier).toBe(3);
      expect(notificationService.sendEscalationNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: expect.arrayContaining([headDoctor.id]),
          alert: expect.objectContaining({ 
            id: alert.id,
            currentEscalationTier: 3,
          }),
        })
      );
      
      // Verify WebSocket notifications
      const { alertEvents } = await import('@/src/server/websocket');
      expect(alertEvents.emitAlertEscalated).toHaveBeenCalledTimes(2);
    });
    
    it('should stop escalation when alert is acknowledged', async () => {
      const operator = await createMockUser({
        email: 'operator2@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const nurse = await createMockUser({
        email: 'nurse2@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
        isOnDuty: true,
      });
      
      // Create alert
      const operatorCtx = await createTestContext(operator);
      const { appRouter } = await import('@/src/server/routers');
      const operatorCaller = appRouter.createCaller(operatorCtx);
      
      const alert = await operatorCaller.healthcare.createAlert({
        roomNumber: 'B202',
        alertType: 'medical_emergency' as const,
        urgencyLevel: 4,
        hospitalId: 'test-hospital',
      });
      
      // Fast-forward 3 minutes
      jest.advanceTimersByTime(3 * 60 * 1000);
      
      // Nurse acknowledges alert
      const nurseCtx = await createTestContext(nurse);
      const nurseCaller = appRouter.createCaller(nurseCtx);
      
      await nurseCaller.healthcare.acknowledgeAlert({
        alertId: alert.id,
        notes: 'Responding to emergency',
      });
      
      // Fast-forward past escalation time
      jest.advanceTimersByTime(10 * 60 * 1000);
      
      // Verify no escalation occurred
      const checkAlert = await nurseCaller.healthcare.getAlertById({ 
        alertId: alert.id 
      });
      
      expect(checkAlert.currentEscalationTier).toBe(1); // Still tier 1
      expect(checkAlert.status).toBe('acknowledged');
      
      // Verify no escalation notifications sent
      const { notificationService } = await import('@/src/server/services/notifications');
      expect(notificationService.sendEscalationNotification).not.toHaveBeenCalled();
    });
    
    it('should send warning notifications before escalation', async () => {
      const operator = await createMockUser({
        email: 'operator3@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const nurse = await createMockUser({
        email: 'nurse3@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
        isOnDuty: true,
      });
      
      // Create medium urgency alert
      const ctx = await createTestContext(operator);
      const { appRouter } = await import('@/src/server/routers');
      const caller = appRouter.createCaller(ctx);
      
      const alert = await caller.healthcare.createAlert({
        roomNumber: 'C303',
        alertType: 'medical_emergency' as const,
        urgencyLevel: 3, // 15 minute escalation
        hospitalId: 'test-hospital',
      });
      
      // Fast-forward to warning time (2 minutes before escalation)
      jest.advanceTimersByTime(13 * 60 * 1000);
      
      // Verify warning notification sent
      const { alertEvents } = await import('@/src/server/websocket');
      expect(alertEvents.emitEscalationWarning).toHaveBeenCalledWith(
        'test-hospital',
        expect.objectContaining({
          alertId: alert.id,
          timeRemaining: 2 * 60, // 2 minutes in seconds
        })
      );
    });
  });
  
  describe('Escalation Rules', () => {
    it('should follow different timing rules based on urgency', async () => {
      const operator = await createMockUser({
        email: 'operator4@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(operator);
      const { appRouter } = await import('@/src/server/routers');
      const caller = appRouter.createCaller(ctx);
      
      // Test different urgency levels
      const urgencyTimings = [
        { urgency: 5, escalationTime: 5 },  // 5 minutes
        { urgency: 4, escalationTime: 10 }, // 10 minutes
        { urgency: 3, escalationTime: 15 }, // 15 minutes
        { urgency: 2, escalationTime: 30 }, // 30 minutes
        { urgency: 1, escalationTime: 60 }, // 60 minutes
      ];
      
      for (const { urgency, escalationTime } of urgencyTimings) {
        const alert = await caller.healthcare.createAlert({
          roomNumber: `TEST-${urgency}`,
          alertType: 'medical_emergency' as const,
          urgencyLevel: urgency,
          hospitalId: 'test-hospital',
        });
        
        // Verify escalation timer was set with correct duration
        const timer = escalationService.getTimer(alert.id);
        expect(timer).toBeDefined();
        expect(timer?.duration).toBe(escalationTime * 60 * 1000);
        
        // Clean up for next test
        escalationService.stopTimer(alert.id);
      }
    });
    
    it('should escalate to appropriate roles based on tier', async () => {
      // Create users for testing role-based escalation
      const users = {
        operator: await createMockUser({
          email: 'op@test.com',
          role: 'operator',
          organizationId: 'test-org',
          defaultHospitalId: 'test-hospital',
        }),
        nurses: await Promise.all([
          createMockUser({
            email: 'n1@test.com',
            role: 'nurse',
            organizationId: 'test-org',
            defaultHospitalId: 'test-hospital',
            isOnDuty: true,
          }),
          createMockUser({
            email: 'n2@test.com',
            role: 'nurse',
            organizationId: 'test-org',
            defaultHospitalId: 'test-hospital',
            isOnDuty: false, // Off duty - should not receive
          }),
        ]),
        doctors: await Promise.all([
          createMockUser({
            email: 'd1@test.com',
            role: 'doctor',
            organizationId: 'test-org',
            defaultHospitalId: 'test-hospital',
            isOnDuty: true,
          }),
          createMockUser({
            email: 'd2@test.com',
            role: 'doctor',
            organizationId: 'test-org',
            defaultHospitalId: 'test-hospital',
            isOnDuty: true,
          }),
        ]),
        headDoctor: await createMockUser({
          email: 'hd@test.com',
          role: 'head_doctor',
          organizationId: 'test-org',
          defaultHospitalId: 'test-hospital',
          isOnDuty: true,
        }),
      };
      
      // Create alert and verify tier-based notifications
      const ctx = await createTestContext(users.operator);
      const { appRouter } = await import('@/src/server/routers');
      const caller = appRouter.createCaller(ctx);
      
      const alert = await caller.healthcare.createAlert({
        roomNumber: 'TIER-TEST',
        alertType: 'code_blue' as const,
        urgencyLevel: 5,
        hospitalId: 'test-hospital',
      });
      
      // Get escalation chain
      const chain = await caller.healthcare.getEscalationChain({
        alertId: alert.id,
      });
      
      expect(chain).toMatchObject({
        tier1: {
          roles: ['nurse'],
          users: expect.arrayContaining([users.nurses[0].id]),
        },
        tier2: {
          roles: ['doctor'],
          users: expect.arrayContaining([
            users.doctors[0].id,
            users.doctors[1].id,
          ]),
        },
        tier3: {
          roles: ['head_doctor'],
          users: expect.arrayContaining([users.headDoctor.id]),
        },
      });
      
      // Verify off-duty nurse not included
      expect(chain.tier1.users).not.toContain(users.nurses[1].id);
    });
  });
  
  describe('Escalation History', () => {
    it('should track escalation events in alert timeline', async () => {
      const operator = await createMockUser({
        email: 'op-timeline@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(operator);
      const { appRouter } = await import('@/src/server/routers');
      const caller = appRouter.createCaller(ctx);
      
      // Create and let alert escalate
      const alert = await caller.healthcare.createAlert({
        roomNumber: 'TIMELINE-01',
        alertType: 'medical_emergency' as const,
        urgencyLevel: 5,
        hospitalId: 'test-hospital',
      });
      
      // Fast-forward through escalations
      jest.advanceTimersByTime(5 * 60 * 1000); // Tier 2
      jest.advanceTimersByTime(5 * 60 * 1000); // Tier 3
      
      // Get timeline
      const timeline = await caller.healthcare.getAlertTimeline({
        alertId: alert.id,
      });
      
      // Verify escalation events
      const escalationEvents = timeline.filter(e => e.type === 'escalated');
      expect(escalationEvents).toHaveLength(2);
      
      expect(escalationEvents[0]).toMatchObject({
        type: 'escalated',
        metadata: {
          fromTier: 1,
          toTier: 2,
          reason: 'No response within 5 minutes',
        },
      });
      
      expect(escalationEvents[1]).toMatchObject({
        type: 'escalated',
        metadata: {
          fromTier: 2,
          toTier: 3,
          reason: 'No response within 5 minutes',
        },
      });
    });
  });
});