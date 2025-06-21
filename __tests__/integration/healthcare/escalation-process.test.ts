import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Alert, AlertType, UrgencyLevel } from '@/types/healthcare';

interface EscalationLevel {
  level: number;
  title: string;
  notifyRoles: string[];
  timeLimit: number; // milliseconds
  actions: string[];
}

// Mock escalation service
class EscalationService {
  private alerts: Map<string, Alert> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Map<string, Function[]> = new Map();
  
  private escalationLevels: EscalationLevel[] = [
    {
      level: 1,
      title: 'Initial Response',
      notifyRoles: ['nurse'],
      timeLimit: 5 * 60 * 1000, // 5 minutes
      actions: ['Notify assigned staff', 'Start response timer'],
    },
    {
      level: 2,
      title: 'Supervisor Notification',
      notifyRoles: ['nurse', 'charge_nurse'],
      timeLimit: 10 * 60 * 1000, // 10 minutes
      actions: ['Notify charge nurse', 'Review staffing', 'Consider reassignment'],
    },
    {
      level: 3,
      title: 'Management Alert',
      notifyRoles: ['nurse', 'charge_nurse', 'nurse_manager'],
      timeLimit: 15 * 60 * 1000, // 15 minutes
      actions: ['Notify nurse manager', 'Escalate to on-call team', 'Document delay'],
    },
    {
      level: 4,
      title: 'Critical Escalation',
      notifyRoles: ['nurse', 'charge_nurse', 'nurse_manager', 'medical_director'],
      timeLimit: 20 * 60 * 1000, // 20 minutes
      actions: ['Notify medical director', 'Activate rapid response', 'Prepare incident report'],
    },
  ];

  constructor() {
    // Initialize with test data
    this.createTestAlert('alert-1', {
      priority: 9,
      type: 'cardiac_arrest' as AlertType,
      urgency: 1 as UrgencyLevel,
      escalationLevel: 0,
    });
    
    this.createTestAlert('alert-2', {
      priority: 5,
      type: 'medication_due' as AlertType,
      urgency: 3 as UrgencyLevel,
      escalationLevel: 0,
    });
  }

  private createTestAlert(id: string, data: Partial<Alert>) {
    const alert: Alert = {
      id,
      patientId: `patient-${id}`,
      patientName: `Patient ${id}`,
      roomNumber: `30${id.slice(-1)}`,
      type: data.type || 'patient_request' as AlertType,
      urgency: data.urgency || 3 as UrgencyLevel,
      priority: data.priority || 5,
      message: 'Test alert requiring response',
      status: 'assigned',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      assignedTo: ['nurse-1'],
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      resolvedBy: null,
      responseTime: null,
      escalationLevel: data.escalationLevel || 0,
      escalationHistory: [],
      metadata: {},
    };
    
    this.alerts.set(id, alert);
    this.startEscalationTimer(alert);
  }

  async escalateAlert(alertId: string, reason: string): Promise<Alert> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    if (alert.status === 'resolved') {
      throw new Error('Cannot escalate resolved alerts');
    }
    
    const currentLevel = alert.escalationLevel;
    const nextLevel = currentLevel + 1;
    
    if (nextLevel > this.escalationLevels.length) {
      throw new Error('Maximum escalation level reached');
    }
    
    // Update alert
    alert.escalationLevel = nextLevel;
    alert.updatedAt = new Date();
    
    // Add to history
    alert.escalationHistory.push({
      level: nextLevel,
      timestamp: new Date(),
      reason,
      escalatedBy: 'system',
    });
    
    // Get escalation details
    const escalation = this.escalationLevels[nextLevel - 1];
    
    // Notify relevant parties
    this.notifyEscalation(alert, escalation, reason);
    
    // Reset timer for next escalation
    this.clearEscalationTimer(alertId);
    if (nextLevel < this.escalationLevels.length) {
      this.startEscalationTimer(alert);
    }
    
    this.emit('alert:escalated', {
      alert,
      escalation,
      reason,
    });
    
    return alert;
  }

  async autoEscalate(alertId: string): Promise<Alert> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    const timeSinceCreated = Date.now() - alert.createdAt.getTime();
    const currentLevel = alert.escalationLevel;
    
    let reason = 'No response within time limit';
    
    if (alert.status === 'assigned' && !alert.acknowledgedAt) {
      reason = 'Alert not acknowledged within time limit';
    } else if (alert.status === 'acknowledged' && !alert.resolvedAt) {
      reason = 'Alert not resolved within expected timeframe';
    }
    
    // Check if we should escalate based on priority
    if (alert.priority >= 8 && currentLevel === 0) {
      // High priority alerts escalate faster
      return this.escalateAlert(alertId, 'High priority alert requires immediate attention');
    }
    
    return this.escalateAlert(alertId, reason);
  }

  private startEscalationTimer(alert: Alert) {
    const currentLevel = alert.escalationLevel;
    if (currentLevel >= this.escalationLevels.length) {
      return; // Max level reached
    }
    
    const escalation = this.escalationLevels[currentLevel];
    const adjustedTimeLimit = this.getAdjustedTimeLimit(escalation.timeLimit, alert.priority);
    
    const timer = setTimeout(() => {
      if (alert.status !== 'resolved') {
        this.autoEscalate(alert.id).catch(error => {
          this.emit('escalation:error', { alert, error });
        });
      }
    }, adjustedTimeLimit);
    
    this.escalationTimers.set(alert.id, timer);
  }

  private clearEscalationTimer(alertId: string) {
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }
  }

  private getAdjustedTimeLimit(baseTime: number, priority: number): number {
    // High priority alerts escalate faster
    if (priority >= 9) return baseTime * 0.5; // 50% of normal time
    if (priority >= 7) return baseTime * 0.75; // 75% of normal time
    return baseTime;
  }

  private notifyEscalation(alert: Alert, escalation: EscalationLevel, reason: string) {
    const notification = {
      alertId: alert.id,
      level: escalation.level,
      title: escalation.title,
      patient: {
        id: alert.patientId,
        name: alert.patientName,
        room: alert.roomNumber,
      },
      alert: {
        type: alert.type,
        priority: alert.priority,
        message: alert.message,
        createdAt: alert.createdAt,
      },
      escalationReason: reason,
      notifyRoles: escalation.notifyRoles,
      requiredActions: escalation.actions,
      timestamp: new Date(),
    };
    
    // Send notifications to each role
    escalation.notifyRoles.forEach(role => {
      this.emit('notification:send', {
        role,
        type: 'escalation',
        priority: 'high',
        data: notification,
      });
    });
    
    // Log escalation
    this.emit('escalation:logged', notification);
  }

  deEscalateAlert(alertId: string, reason: string): Alert {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    if (alert.escalationLevel === 0) {
      throw new Error('Alert is not escalated');
    }
    
    const previousLevel = alert.escalationLevel;
    alert.escalationLevel = Math.max(0, alert.escalationLevel - 1);
    alert.updatedAt = new Date();
    
    alert.escalationHistory.push({
      level: alert.escalationLevel,
      timestamp: new Date(),
      reason: `De-escalated: ${reason}`,
      escalatedBy: 'system',
    });
    
    this.emit('alert:de-escalated', {
      alert,
      previousLevel,
      newLevel: alert.escalationLevel,
      reason,
    });
    
    // Restart timer with new level
    this.clearEscalationTimer(alertId);
    this.startEscalationTimer(alert);
    
    return alert;
  }

  getEscalationChain(alertId: string): any[] {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return [];
    }
    
    return alert.escalationHistory.map(entry => ({
      ...entry,
      levelDetails: this.escalationLevels[entry.level - 1],
    }));
  }

  getActiveEscalations(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.escalationLevel > 0 && alert.status !== 'resolved');
  }

  pauseEscalation(alertId: string, duration: number, reason: string) {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    this.clearEscalationTimer(alertId);
    
    alert.metadata.escalationPaused = {
      pausedAt: new Date(),
      duration,
      reason,
      resumeAt: new Date(Date.now() + duration),
    };
    
    // Set timer to resume
    setTimeout(() => {
      delete alert.metadata.escalationPaused;
      this.startEscalationTimer(alert);
      this.emit('escalation:resumed', { alert });
    }, duration);
    
    this.emit('escalation:paused', { alert, duration, reason });
  }

  // Helper methods
  getAlert(id: string): Alert | undefined {
    return this.alerts.get(id);
  }

  getEscalationLevel(level: number): EscalationLevel | undefined {
    return this.escalationLevels[level - 1];
  }

  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  cleanup() {
    this.escalationTimers.forEach(timer => clearTimeout(timer));
    this.escalationTimers.clear();
  }
}

describe('Escalation Process', () => {
  let service: EscalationService;
  
  beforeEach(() => {
    service = new EscalationService();
  });
  
  afterEach(() => {
    service.cleanup();
  });

  describe('Manual Escalation', () => {
    it('escalates alert to next level', async () => {
      const escalatedListener = jest.fn();
      service.on('alert:escalated', escalatedListener);
      
      const alert = await service.escalateAlert('alert-1', 'No response from assigned staff');
      
      expect(alert.escalationLevel).toBe(1);
      expect(alert.escalationHistory).toHaveLength(1);
      expect(alert.escalationHistory[0].reason).toContain('No response');
      
      expect(escalatedListener).toHaveBeenCalledWith({
        alert,
        escalation: expect.objectContaining({
          level: 1,
          title: 'Initial Response',
        }),
        reason: 'No response from assigned staff',
      });
    });

    it('prevents escalating resolved alerts', async () => {
      const alert = service.getAlert('alert-1')!;
      alert.status = 'resolved';
      
      await expect(
        service.escalateAlert('alert-1', 'Test')
      ).rejects.toThrow('Cannot escalate resolved alerts');
    });

    it('enforces maximum escalation level', async () => {
      const alert = service.getAlert('alert-1')!;
      alert.escalationLevel = 4; // Max level
      
      await expect(
        service.escalateAlert('alert-1', 'Test')
      ).rejects.toThrow('Maximum escalation level reached');
    });
  });

  describe('Automatic Escalation', () => {
    it('auto-escalates unacknowledged alerts', async () => {
      const alert = await service.autoEscalate('alert-1');
      
      expect(alert.escalationLevel).toBe(1);
      expect(alert.escalationHistory[0].reason).toContain('not acknowledged');
    });

    it('escalates high-priority alerts immediately', async () => {
      const alert = service.getAlert('alert-1')!; // Priority 9
      expect(alert.priority).toBeGreaterThanOrEqual(8);
      
      const escalated = await service.autoEscalate('alert-1');
      
      expect(escalated.escalationHistory[0].reason).toContain('High priority');
    });

    it('adjusts time limits based on priority', () => {
      const baseTime = 10 * 60 * 1000; // 10 minutes
      
      // High priority (9+) gets 50% of time
      expect(service['getAdjustedTimeLimit'](baseTime, 9)).toBe(baseTime * 0.5);
      
      // Medium-high priority (7-8) gets 75% of time
      expect(service['getAdjustedTimeLimit'](baseTime, 7)).toBe(baseTime * 0.75);
      
      // Normal priority gets full time
      expect(service['getAdjustedTimeLimit'](baseTime, 5)).toBe(baseTime);
    });
  });

  describe('Notifications', () => {
    it('notifies appropriate roles at each level', async () => {
      const notificationListener = jest.fn();
      service.on('notification:send', notificationListener);
      
      // Escalate through multiple levels
      await service.escalateAlert('alert-2', 'Level 1 escalation');
      expect(notificationListener).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'nurse',
          type: 'escalation',
        })
      );
      
      notificationListener.mockClear();
      
      await service.escalateAlert('alert-2', 'Level 2 escalation');
      expect(notificationListener).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'charge_nurse',
          type: 'escalation',
        })
      );
    });

    it('includes required actions in notifications', async () => {
      const notificationListener = jest.fn();
      service.on('notification:send', notificationListener);
      
      await service.escalateAlert('alert-1', 'Test escalation');
      
      const notification = notificationListener.mock.calls[0][0];
      expect(notification.data.requiredActions).toContain('Notify assigned staff');
      expect(notification.data.requiredActions).toContain('Start response timer');
    });
  });

  describe('De-escalation', () => {
    it('reduces escalation level', async () => {
      // First escalate
      await service.escalateAlert('alert-1', 'Initial escalation');
      expect(service.getAlert('alert-1')!.escalationLevel).toBe(1);
      
      // Then de-escalate
      const alert = service.deEscalateAlert('alert-1', 'Staff responded');
      
      expect(alert.escalationLevel).toBe(0);
      expect(alert.escalationHistory).toHaveLength(2);
      expect(alert.escalationHistory[1].reason).toContain('De-escalated');
    });

    it('prevents de-escalating non-escalated alerts', () => {
      const alert = service.getAlert('alert-2')!;
      alert.escalationLevel = 0;
      
      expect(() => {
        service.deEscalateAlert('alert-2', 'Test');
      }).toThrow('Alert is not escalated');
    });
  });

  describe('Escalation Chain', () => {
    it('tracks complete escalation history', async () => {
      await service.escalateAlert('alert-1', 'First escalation');
      await service.escalateAlert('alert-1', 'Second escalation');
      service.deEscalateAlert('alert-1', 'Situation improving');
      
      const chain = service.getEscalationChain('alert-1');
      
      expect(chain).toHaveLength(3);
      expect(chain[0].level).toBe(1);
      expect(chain[1].level).toBe(2);
      expect(chain[2].reason).toContain('De-escalated');
      
      // Each entry should have level details
      expect(chain[0].levelDetails.title).toBe('Initial Response');
      expect(chain[1].levelDetails.title).toBe('Supervisor Notification');
    });
  });

  describe('Escalation Pause', () => {
    it('pauses escalation temporarily', () => {
      const pauseListener = jest.fn();
      const resumeListener = jest.fn();
      
      service.on('escalation:paused', pauseListener);
      service.on('escalation:resumed', resumeListener);
      
      service.pauseEscalation(
        'alert-1',
        1000, // 1 second for testing
        'Staff member on the way'
      );
      
      const alert = service.getAlert('alert-1')!;
      expect(alert.metadata.escalationPaused).toBeDefined();
      expect(alert.metadata.escalationPaused.reason).toContain('Staff member');
      
      expect(pauseListener).toHaveBeenCalled();
    });
  });

  describe('Query Methods', () => {
    it('retrieves active escalations', async () => {
      await service.escalateAlert('alert-1', 'Test');
      await service.escalateAlert('alert-2', 'Test');
      
      // Resolve one alert
      const alert2 = service.getAlert('alert-2')!;
      alert2.status = 'resolved';
      
      const activeEscalations = service.getActiveEscalations();
      
      expect(activeEscalations).toHaveLength(1);
      expect(activeEscalations[0].id).toBe('alert-1');
    });

    it('retrieves escalation level details', () => {
      const level1 = service.getEscalationLevel(1);
      expect(level1).toBeDefined();
      expect(level1!.title).toBe('Initial Response');
      expect(level1!.notifyRoles).toContain('nurse');
      
      const level4 = service.getEscalationLevel(4);
      expect(level4!.title).toBe('Critical Escalation');
      expect(level4!.notifyRoles).toContain('medical_director');
    });
  });

  describe('Complex Scenarios', () => {
    it('handles multiple escalations with acknowledgment', async () => {
      const events: string[] = [];
      
      ['alert:escalated', 'notification:send', 'escalation:logged'].forEach(event => {
        service.on(event, () => events.push(event));
      });
      
      // Escalate multiple times
      await service.escalateAlert('alert-1', 'No initial response');
      
      // Simulate acknowledgment
      const alert = service.getAlert('alert-1')!;
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = 'nurse-1';
      alert.status = 'acknowledged';
      
      // Continue escalating due to no resolution
      await service.escalateAlert('alert-1', 'Not resolved in time');
      
      expect(alert.escalationLevel).toBe(2);
      expect(events).toContain('alert:escalated');
      expect(events).toContain('notification:send');
      expect(events).toContain('escalation:logged');
    });
  });
});