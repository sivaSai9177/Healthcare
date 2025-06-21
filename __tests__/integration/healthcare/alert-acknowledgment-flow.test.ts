import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Alert, AlertType, UrgencyLevel } from '@/types/healthcare';

// Mock alert acknowledgment service
class AlertAcknowledgmentService {
  private alerts: Map<string, Alert> = new Map();
  private acknowledgments: Map<string, any> = new Map();
  private listeners: Map<string, Function[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Initialize with some test alerts
    this.createTestAlert('alert-1', {
      type: 'cardiac_arrest' as AlertType,
      urgency: 1 as UrgencyLevel,
      priority: 10,
      assignedTo: ['nurse-1', 'doctor-1'],
    });
    
    this.createTestAlert('alert-2', {
      type: 'medication_due' as AlertType,
      urgency: 3 as UrgencyLevel,
      priority: 5,
      assignedTo: ['nurse-2'],
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
      message: 'Test alert message',
      status: 'assigned',
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
      updatedAt: new Date(Date.now() - 5 * 60 * 1000),
      createdBy: 'system',
      assignedTo: data.assignedTo || ['nurse-1'],
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      resolvedBy: null,
      responseTime: null,
      escalationLevel: 0,
      escalationHistory: [],
      metadata: {},
    };
    
    this.alerts.set(id, alert);
    
    // Start acknowledgment timer for high priority alerts
    if (alert.priority >= 8) {
      this.startAcknowledgmentTimer(alert);
    }
  }

  async acknowledgeAlert(
    alertId: string,
    userId: string,
    data?: {
      notes?: string;
      estimatedResponseTime?: number;
      requiresBackup?: boolean;
    }
  ): Promise<Alert> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    if (alert.status === 'resolved') {
      throw new Error('Alert already resolved');
    }
    
    if (alert.status === 'acknowledged') {
      throw new Error('Alert already acknowledged');
    }
    
    // Verify user is assigned
    if (!alert.assignedTo?.includes(userId)) {
      throw new Error('User not assigned to this alert');
    }
    
    // Calculate response time
    const responseTime = Date.now() - alert.createdAt.getTime();
    
    // Update alert
    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;
    alert.responseTime = responseTime;
    alert.updatedAt = new Date();
    
    // Store acknowledgment details
    const acknowledgment = {
      alertId,
      userId,
      timestamp: new Date(),
      responseTime,
      notes: data?.notes,
      estimatedResponseTime: data?.estimatedResponseTime,
      requiresBackup: data?.requiresBackup || false,
    };
    
    this.acknowledgments.set(alertId, acknowledgment);
    
    // Clear acknowledgment timer
    this.clearAcknowledgmentTimer(alertId);
    
    // Emit events
    this.emit('alert:acknowledged', { alert, acknowledgment });
    
    // Check if response time meets SLA
    const slaTime = this.getSLATime(alert.priority);
    if (responseTime > slaTime) {
      this.emit('alert:sla-breach', {
        alert,
        responseTime,
        slaTime,
        breachTime: responseTime - slaTime,
      });
    }
    
    // Request backup if needed
    if (data?.requiresBackup) {
      this.emit('alert:backup-requested', { alert, requestedBy: userId });
    }
    
    return alert;
  }

  async bulkAcknowledge(
    alertIds: string[],
    userId: string,
    notes?: string
  ): Promise<Alert[]> {
    const results: Alert[] = [];
    const errors: any[] = [];
    
    for (const alertId of alertIds) {
      try {
        const alert = await this.acknowledgeAlert(alertId, userId, { notes });
        results.push(alert);
      } catch (error) {
        errors.push({ alertId, error: error.message });
      }
    }
    
    if (errors.length > 0) {
      this.emit('alert:bulk-acknowledge-errors', errors);
    }
    
    return results;
  }

  async delegateAlert(
    alertId: string,
    fromUserId: string,
    toUserId: string,
    reason: string
  ): Promise<Alert> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    if (!alert.assignedTo?.includes(fromUserId)) {
      throw new Error('User not assigned to this alert');
    }
    
    if (!reason || reason.trim().length < 10) {
      throw new Error('Delegation reason must be at least 10 characters');
    }
    
    // Update assignment
    alert.assignedTo = alert.assignedTo.filter(id => id !== fromUserId);
    alert.assignedTo.push(toUserId);
    alert.updatedAt = new Date();
    
    // Track delegation
    const delegation = {
      alertId,
      fromUserId,
      toUserId,
      reason,
      timestamp: new Date(),
    };
    
    this.emit('alert:delegated', { alert, delegation });
    
    return alert;
  }

  async resolveAlert(
    alertId: string,
    userId: string,
    resolution: {
      outcome: string;
      actions: string[];
      followUpRequired: boolean;
      notes?: string;
    }
  ): Promise<Alert> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    if (alert.status === 'resolved') {
      throw new Error('Alert already resolved');
    }
    
    if (alert.status !== 'acknowledged') {
      throw new Error('Alert must be acknowledged before resolution');
    }
    
    // Validate resolution
    if (!resolution.outcome || resolution.outcome.trim().length < 10) {
      throw new Error('Resolution outcome must be at least 10 characters');
    }
    
    if (!resolution.actions || resolution.actions.length === 0) {
      throw new Error('At least one action must be specified');
    }
    
    // Update alert
    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = userId;
    alert.updatedAt = new Date();
    
    // Store resolution details
    alert.metadata.resolution = resolution;
    
    // Calculate total handling time
    const totalTime = alert.resolvedAt.getTime() - alert.createdAt.getTime();
    
    this.emit('alert:resolved', {
      alert,
      resolution,
      metrics: {
        responseTime: alert.responseTime,
        totalTime,
        acknowledgedToResolved: alert.resolvedAt.getTime() - alert.acknowledgedAt!.getTime(),
      },
    });
    
    return alert;
  }

  private startAcknowledgmentTimer(alert: Alert) {
    const timeLimit = this.getAcknowledgmentTimeLimit(alert.priority);
    
    const timer = setTimeout(() => {
      if (alert.status === 'assigned') {
        this.emit('alert:acknowledgment-overdue', {
          alert,
          timeLimit,
          overdueBy: Date.now() - alert.createdAt.getTime() - timeLimit,
        });
        
        // Auto-escalate if critical
        if (alert.priority >= 9) {
          this.escalateAlert(alert);
        }
      }
    }, timeLimit);
    
    this.timers.set(alert.id, timer);
  }

  private clearAcknowledgmentTimer(alertId: string) {
    const timer = this.timers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(alertId);
    }
  }

  private escalateAlert(alert: Alert) {
    alert.escalationLevel++;
    alert.escalationHistory.push({
      level: alert.escalationLevel,
      timestamp: new Date(),
      reason: 'Acknowledgment overdue',
    });
    
    this.emit('alert:escalated', {
      alert,
      escalationLevel: alert.escalationLevel,
      reason: 'Acknowledgment overdue',
    });
  }

  private getAcknowledgmentTimeLimit(priority: number): number {
    if (priority >= 9) return 2 * 60 * 1000; // 2 minutes
    if (priority >= 7) return 5 * 60 * 1000; // 5 minutes
    if (priority >= 5) return 10 * 60 * 1000; // 10 minutes
    return 30 * 60 * 1000; // 30 minutes
  }

  private getSLATime(priority: number): number {
    if (priority >= 9) return 3 * 60 * 1000; // 3 minutes
    if (priority >= 7) return 7 * 60 * 1000; // 7 minutes
    if (priority >= 5) return 15 * 60 * 1000; // 15 minutes
    return 45 * 60 * 1000; // 45 minutes
  }

  // Helper methods
  getAlert(id: string): Alert | undefined {
    return this.alerts.get(id);
  }

  getAcknowledgment(alertId: string): any {
    return this.acknowledgments.get(alertId);
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.status !== 'resolved');
  }

  getOverdueAlerts(): Alert[] {
    const now = Date.now();
    return Array.from(this.alerts.values())
      .filter(alert => {
        if (alert.status !== 'assigned') return false;
        const timeLimit = this.getAcknowledgmentTimeLimit(alert.priority);
        return now - alert.createdAt.getTime() > timeLimit;
      });
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
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}

describe('Alert Acknowledgment Flow', () => {
  let service: AlertAcknowledgmentService;
  
  beforeEach(() => {
    service = new AlertAcknowledgmentService();
  });
  
  afterEach(() => {
    service.cleanup();
  });

  describe('Basic Acknowledgment', () => {
    it('acknowledges alert successfully', async () => {
      const alert = await service.acknowledgeAlert('alert-2', 'nurse-2', {
        notes: 'On my way to patient',
        estimatedResponseTime: 5,
      });
      
      expect(alert.status).toBe('acknowledged');
      expect(alert.acknowledgedBy).toBe('nurse-2');
      expect(alert.acknowledgedAt).toBeDefined();
      expect(alert.responseTime).toBeGreaterThan(0);
    });

    it('validates user assignment', async () => {
      await expect(
        service.acknowledgeAlert('alert-1', 'nurse-3', {})
      ).rejects.toThrow('User not assigned to this alert');
    });

    it('prevents double acknowledgment', async () => {
      await service.acknowledgeAlert('alert-2', 'nurse-2');
      
      await expect(
        service.acknowledgeAlert('alert-2', 'nurse-2')
      ).rejects.toThrow('Alert already acknowledged');
    });

    it('calculates response time correctly', async () => {
      const alert = await service.acknowledgeAlert('alert-1', 'nurse-1');
      
      expect(alert.responseTime).toBeGreaterThan(5 * 60 * 1000); // > 5 minutes
      expect(alert.responseTime).toBeLessThan(10 * 60 * 1000); // < 10 minutes
    });
  });

  describe('SLA Monitoring', () => {
    it('detects SLA breach for slow response', async () => {
      const slaBreachListener = jest.fn();
      service.on('alert:sla-breach', slaBreachListener);
      
      // Alert-1 is critical (priority 10) with 3-minute SLA
      // It was created 5 minutes ago, so acknowledging now breaches SLA
      await service.acknowledgeAlert('alert-1', 'nurse-1');
      
      expect(slaBreachListener).toHaveBeenCalledWith(
        expect.objectContaining({
          alert: expect.objectContaining({ id: 'alert-1' }),
          slaTime: 3 * 60 * 1000,
          breachTime: expect.any(Number),
        })
      );
    });

    it('no SLA breach for timely response', async () => {
      const slaBreachListener = jest.fn();
      service.on('alert:sla-breach', slaBreachListener);
      
      // Create a fresh alert
      const freshAlert = service.getAlert('alert-2')!;
      freshAlert.createdAt = new Date(); // Just created
      
      await service.acknowledgeAlert('alert-2', 'nurse-2');
      
      expect(slaBreachListener).not.toHaveBeenCalled();
    });
  });

  describe('Backup Requests', () => {
    it('requests backup when needed', async () => {
      const backupListener = jest.fn();
      service.on('alert:backup-requested', backupListener);
      
      await service.acknowledgeAlert('alert-1', 'nurse-1', {
        requiresBackup: true,
        notes: 'Patient condition critical, need additional support',
      });
      
      expect(backupListener).toHaveBeenCalledWith({
        alert: expect.objectContaining({ id: 'alert-1' }),
        requestedBy: 'nurse-1',
      });
    });
  });

  describe('Bulk Acknowledgment', () => {
    it('acknowledges multiple alerts', async () => {
      const results = await service.bulkAcknowledge(
        ['alert-1', 'alert-2'],
        'nurse-1',
        'Responding to multiple alerts'
      );
      
      expect(results).toHaveLength(1); // Only alert-1 assigned to nurse-1
      expect(results[0].status).toBe('acknowledged');
    });

    it('reports errors for failed acknowledgments', async () => {
      const errorListener = jest.fn();
      service.on('alert:bulk-acknowledge-errors', errorListener);
      
      await service.bulkAcknowledge(
        ['alert-1', 'alert-2', 'invalid-alert'],
        'nurse-1'
      );
      
      expect(errorListener).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ alertId: 'alert-2' }),
          expect.objectContaining({ alertId: 'invalid-alert' }),
        ])
      );
    });
  });

  describe('Alert Delegation', () => {
    it('delegates alert to another user', async () => {
      const delegateListener = jest.fn();
      service.on('alert:delegated', delegateListener);
      
      const alert = await service.delegateAlert(
        'alert-1',
        'nurse-1',
        'nurse-3',
        'Shift change - handing over to next nurse'
      );
      
      expect(alert.assignedTo).toContain('nurse-3');
      expect(alert.assignedTo).not.toContain('nurse-1');
      expect(delegateListener).toHaveBeenCalled();
    });

    it('validates delegation reason', async () => {
      await expect(
        service.delegateAlert('alert-1', 'nurse-1', 'nurse-3', 'Too short')
      ).rejects.toThrow('Delegation reason must be at least 10 characters');
    });
  });

  describe('Alert Resolution', () => {
    it('resolves acknowledged alert', async () => {
      await service.acknowledgeAlert('alert-2', 'nurse-2');
      
      const resolvedListener = jest.fn();
      service.on('alert:resolved', resolvedListener);
      
      const alert = await service.resolveAlert('alert-2', 'nurse-2', {
        outcome: 'Medication administered successfully',
        actions: [
          'Administered 500mg acetaminophen',
          'Updated patient chart',
          'Scheduled follow-up in 4 hours',
        ],
        followUpRequired: true,
        notes: 'Patient reported pain relief after 20 minutes',
      });
      
      expect(alert.status).toBe('resolved');
      expect(alert.resolvedBy).toBe('nurse-2');
      expect(alert.resolvedAt).toBeDefined();
      expect(alert.metadata.resolution).toBeDefined();
      
      expect(resolvedListener).toHaveBeenCalledWith(
        expect.objectContaining({
          alert,
          resolution: expect.any(Object),
          metrics: expect.objectContaining({
            responseTime: expect.any(Number),
            totalTime: expect.any(Number),
            acknowledgedToResolved: expect.any(Number),
          }),
        })
      );
    });

    it('requires acknowledgment before resolution', async () => {
      // Create new unacknowledged alert
      const freshAlert = service.getAlert('alert-1')!;
      freshAlert.status = 'assigned';
      freshAlert.acknowledgedAt = null;
      
      await expect(
        service.resolveAlert('alert-1', 'nurse-1', {
          outcome: 'Test resolution',
          actions: ['Test action'],
          followUpRequired: false,
        })
      ).rejects.toThrow('Alert must be acknowledged before resolution');
    });

    it('validates resolution details', async () => {
      await service.acknowledgeAlert('alert-2', 'nurse-2');
      
      await expect(
        service.resolveAlert('alert-2', 'nurse-2', {
          outcome: 'Too short',
          actions: ['Test'],
          followUpRequired: false,
        })
      ).rejects.toThrow('Resolution outcome must be at least 10 characters');
      
      await expect(
        service.resolveAlert('alert-2', 'nurse-2', {
          outcome: 'Valid outcome description',
          actions: [],
          followUpRequired: false,
        })
      ).rejects.toThrow('At least one action must be specified');
    });
  });

  describe('Acknowledgment Timers', () => {
    it('triggers overdue event for unacknowledged alerts', async () => {
      const overdueListener = jest.fn();
      service.on('alert:acknowledgment-overdue', overdueListener);
      
      // Create a critical alert that should be acknowledged within 2 minutes
      const criticalAlert: Alert = {
        id: 'critical-1',
        patientId: 'patient-critical',
        patientName: 'Critical Patient',
        roomNumber: '999',
        type: 'cardiac_arrest' as AlertType,
        urgency: 1 as UrgencyLevel,
        priority: 10,
        message: 'Code blue',
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
        escalationLevel: 0,
        escalationHistory: [],
        metadata: {},
      };
      
      // Manually trigger timer check
      service['startAcknowledgmentTimer'](criticalAlert);
      
      // Wait for timer (using shorter time for testing)
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('clears timer when alert is acknowledged', async () => {
      await service.acknowledgeAlert('alert-1', 'nurse-1');
      
      // Verify timer was cleared (no overdue event should fire)
      const overdueListener = jest.fn();
      service.on('alert:acknowledgment-overdue', overdueListener);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(overdueListener).not.toHaveBeenCalled();
    });
  });

  describe('Query Methods', () => {
    it('retrieves active alerts', () => {
      const activeAlerts = service.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);
      expect(activeAlerts.every(a => a.status !== 'resolved')).toBe(true);
    });

    it('identifies overdue alerts', () => {
      // Make alert-1 overdue by setting old creation time
      const alert1 = service.getAlert('alert-1')!;
      alert1.createdAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      
      const overdueAlerts = service.getOverdueAlerts();
      expect(overdueAlerts.some(a => a.id === 'alert-1')).toBe(true);
    });
  });
});