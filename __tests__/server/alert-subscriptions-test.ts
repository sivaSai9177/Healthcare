import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { 
  alertEventHelpers,
  trackedHospitalAlerts,
  subscribeToHospitalAlerts
} from '@/src/server/services/alert-subscriptions';
import { EventEmitter } from 'events';

describe('Alert Subscription System Tests', () => {
  const mockHospitalId = 'hospital-123';
  const mockAlertId = 'alert-456';
  const mockUserId = 'user-789';

  let eventEmitter: EventEmitter;
  let originalEmitter: EventEmitter;

  beforeEach(() => {
    // Clear tracked alerts
    trackedHospitalAlerts.clear();
    
    // Create new event emitter for testing
    eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(100); // Prevent memory leak warnings in tests
    
    // Mock the event emitter in the service
    originalEmitter = (alertEventHelpers as any).emitter;
    (alertEventHelpers as any).emitter = eventEmitter;
  });

  afterEach(() => {
    // Restore original emitter
    (alertEventHelpers as any).emitter = originalEmitter;
    eventEmitter.removeAllListeners();
  });

  describe('Alert Event Emission', () => {
    it('should emit alert created event', (done) => {
      const mockAlert = {
        id: mockAlertId,
        hospitalId: mockHospitalId,
        roomNumber: '302',
        alertType: 'cardiac_arrest',
        urgencyLevel: 1,
        status: 'active',
        createdBy: mockUserId,
        createdAt: new Date()
      };

      eventEmitter.once(`alert:created:${mockHospitalId}`, (data) => {
        expect(data.alert).toEqual(mockAlert);
        expect(data.type).toBe('created');
        done();
      });

      alertEventHelpers.emitAlertCreated(mockAlert);
    });

    it('should emit alert acknowledged event', (done) => {
      const mockAcknowledgment = {
        alertId: mockAlertId,
        acknowledgedBy: mockUserId,
        responseAction: 'responding',
        estimatedResponseTime: 5
      };

      eventEmitter.once(`alert:acknowledged:${mockHospitalId}`, (data) => {
        expect(data.acknowledgment).toEqual(mockAcknowledgment);
        expect(data.type).toBe('acknowledged');
        done();
      });

      alertEventHelpers.emitAlertAcknowledged(
        mockHospitalId,
        mockAlertId,
        mockAcknowledgment
      );
    });

    it('should emit alert escalated event', (done) => {
      const mockEscalation = {
        alertId: mockAlertId,
        fromTier: 1,
        toTier: 2,
        reason: 'No response within 5 minutes'
      };

      eventEmitter.once(`alert:escalated:${mockHospitalId}`, (data) => {
        expect(data.escalation).toEqual(mockEscalation);
        expect(data.type).toBe('escalated');
        done();
      });

      alertEventHelpers.emitAlertEscalated(
        mockHospitalId,
        mockAlertId,
        mockEscalation
      );
    });

    it('should emit alert resolved event', (done) => {
      const mockResolution = {
        alertId: mockAlertId,
        resolvedBy: mockUserId,
        resolutionNotes: 'Patient stabilized'
      };

      eventEmitter.once(`alert:resolved:${mockHospitalId}`, (data) => {
        expect(data.resolution).toEqual(mockResolution);
        expect(data.type).toBe('resolved');
        done();
      });

      alertEventHelpers.emitAlertResolved(
        mockHospitalId,
        mockAlertId,
        mockResolution
      );
    });
  });

  describe('Hospital Alert Tracking', () => {
    it('should track alerts by hospital', () => {
      const alert1 = { id: 'alert-1', hospitalId: mockHospitalId };
      const alert2 = { id: 'alert-2', hospitalId: mockHospitalId };
      const alert3 = { id: 'alert-3', hospitalId: 'other-hospital' };

      alertEventHelpers.emitAlertCreated(alert1 as any);
      alertEventHelpers.emitAlertCreated(alert2 as any);
      alertEventHelpers.emitAlertCreated(alert3 as any);

      expect(trackedHospitalAlerts.get(mockHospitalId)).toContain('alert-1');
      expect(trackedHospitalAlerts.get(mockHospitalId)).toContain('alert-2');
      expect(trackedHospitalAlerts.get('other-hospital')).toContain('alert-3');
    });

    it('should remove alerts when resolved', () => {
      const alert = { id: mockAlertId, hospitalId: mockHospitalId };
      
      alertEventHelpers.emitAlertCreated(alert as any);
      expect(trackedHospitalAlerts.get(mockHospitalId)).toContain(mockAlertId);

      alertEventHelpers.emitAlertResolved(mockHospitalId, mockAlertId, {
        alertId: mockAlertId,
        resolvedBy: mockUserId
      });
      
      expect(trackedHospitalAlerts.get(mockHospitalId)).not.toContain(mockAlertId);
    });
  });

  describe('Subscription Management', () => {
    it('should handle multiple subscribers to same hospital', () => {
      const receivedEvents: any[] = [];
      
      const unsubscribe1 = subscribeToHospitalAlerts(mockHospitalId, (event) => {
        receivedEvents.push({ subscriber: 1, event });
      });

      const unsubscribe2 = subscribeToHospitalAlerts(mockHospitalId, (event) => {
        receivedEvents.push({ subscriber: 2, event });
      });

      const mockAlert = {
        id: mockAlertId,
        hospitalId: mockHospitalId,
        roomNumber: '302'
      };

      alertEventHelpers.emitAlertCreated(mockAlert as any);

      expect(receivedEvents).toHaveLength(2);
      expect(receivedEvents[0].subscriber).toBe(1);
      expect(receivedEvents[1].subscriber).toBe(2);

      unsubscribe1();
      unsubscribe2();
    });

    it('should properly unsubscribe listeners', () => {
      let eventCount = 0;
      
      const unsubscribe = subscribeToHospitalAlerts(mockHospitalId, () => {
        eventCount++;
      });

      alertEventHelpers.emitAlertCreated({
        id: 'alert-1',
        hospitalId: mockHospitalId
      } as any);

      expect(eventCount).toBe(1);

      unsubscribe();

      alertEventHelpers.emitAlertCreated({
        id: 'alert-2',
        hospitalId: mockHospitalId
      } as any);

      expect(eventCount).toBe(1); // Should not increase
    });

    it('should not receive events from other hospitals', () => {
      let receivedEvents = 0;
      
      const unsubscribe = subscribeToHospitalAlerts(mockHospitalId, () => {
        receivedEvents++;
      });

      alertEventHelpers.emitAlertCreated({
        id: mockAlertId,
        hospitalId: 'different-hospital'
      } as any);

      expect(receivedEvents).toBe(0);

      unsubscribe();
    });
  });

  describe('Event Order and Timing', () => {
    it('should maintain event order', (done) => {
      const events: string[] = [];
      
      const unsubscribe = subscribeToHospitalAlerts(mockHospitalId, (event) => {
        events.push(event.type);
        
        if (events.length === 4) {
          expect(events).toEqual(['created', 'acknowledged', 'escalated', 'resolved']);
          unsubscribe();
          done();
        }
      });

      // Emit events in order
      alertEventHelpers.emitAlertCreated({
        id: mockAlertId,
        hospitalId: mockHospitalId
      } as any);

      alertEventHelpers.emitAlertAcknowledged(mockHospitalId, mockAlertId, {
        alertId: mockAlertId,
        acknowledgedBy: mockUserId
      });

      alertEventHelpers.emitAlertEscalated(mockHospitalId, mockAlertId, {
        alertId: mockAlertId,
        fromTier: 1,
        toTier: 2
      });

      alertEventHelpers.emitAlertResolved(mockHospitalId, mockAlertId, {
        alertId: mockAlertId,
        resolvedBy: mockUserId
      });
    });

    it('should handle rapid event emission', () => {
      const events: any[] = [];
      
      const unsubscribe = subscribeToHospitalAlerts(mockHospitalId, (event) => {
        events.push(event);
      });

      // Emit 100 events rapidly
      for (let i = 0; i < 100; i++) {
        alertEventHelpers.emitAlertCreated({
          id: `alert-${i}`,
          hospitalId: mockHospitalId
        } as any);
      }

      expect(events).toHaveLength(100);
      expect(trackedHospitalAlerts.get(mockHospitalId)?.size).toBe(100);

      unsubscribe();
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with many subscriptions', () => {
      const unsubscribers: (() => void)[] = [];
      
      // Create 1000 subscriptions
      for (let i = 0; i < 1000; i++) {
        const unsubscribe = subscribeToHospitalAlerts(`hospital-${i}`, () => {});
        unsubscribers.push(unsubscribe);
      }

      // Check listener count doesn't exceed expected
      const listenerCount = eventEmitter.listenerCount('alert:created:hospital-0');
      expect(listenerCount).toBeLessThanOrEqual(1);

      // Clean up
      unsubscribers.forEach(unsub => unsub());
    });

    it('should clean up tracked alerts to prevent memory leak', () => {
      // Create many alerts
      for (let i = 0; i < 1000; i++) {
        alertEventHelpers.emitAlertCreated({
          id: `alert-${i}`,
          hospitalId: mockHospitalId
        } as any);
      }

      expect(trackedHospitalAlerts.get(mockHospitalId)?.size).toBe(1000);

      // Resolve all alerts
      for (let i = 0; i < 1000; i++) {
        alertEventHelpers.emitAlertResolved(mockHospitalId, `alert-${i}`, {
          alertId: `alert-${i}`,
          resolvedBy: mockUserId
        });
      }

      // Should be cleaned up
      expect(trackedHospitalAlerts.get(mockHospitalId)?.size || 0).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in event handlers gracefully', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });

      const unsubscribe = subscribeToHospitalAlerts(mockHospitalId, errorHandler);

      // Should not throw when emitting event
      expect(() => {
        alertEventHelpers.emitAlertCreated({
          id: mockAlertId,
          hospitalId: mockHospitalId
        } as any);
      }).not.toThrow();

      expect(errorHandler).toHaveBeenCalled();
      unsubscribe();
    });

    it('should continue emitting to other handlers if one fails', () => {
      const handler1 = vi.fn(() => {
        throw new Error('Handler 1 error');
      });
      const handler2 = vi.fn();

      const unsub1 = subscribeToHospitalAlerts(mockHospitalId, handler1);
      const unsub2 = subscribeToHospitalAlerts(mockHospitalId, handler2);

      alertEventHelpers.emitAlertCreated({
        id: mockAlertId,
        hospitalId: mockHospitalId
      } as any);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();

      unsub1();
      unsub2();
    });
  });
});