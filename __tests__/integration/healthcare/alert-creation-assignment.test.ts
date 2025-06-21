import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { AlertType, UrgencyLevel, Alert } from '@/types/healthcare';

// Mock healthcare service
class HealthcareService {
  private alerts: Map<string, Alert> = new Map();
  private assignments: Map<string, string[]> = new Map(); // alertId -> userIds
  private users: Map<string, any> = new Map();
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    // Initialize mock users
    this.users.set('nurse-1', {
      id: 'nurse-1',
      name: 'Jane Doe',
      role: 'nurse',
      shiftStart: new Date().setHours(7, 0, 0, 0),
      shiftEnd: new Date().setHours(19, 0, 0, 0),
      available: true,
      currentLoad: 0,
    });
    
    this.users.set('nurse-2', {
      id: 'nurse-2',
      name: 'John Smith',
      role: 'nurse',
      shiftStart: new Date().setHours(7, 0, 0, 0),
      shiftEnd: new Date().setHours(19, 0, 0, 0),
      available: true,
      currentLoad: 2,
    });
    
    this.users.set('doctor-1', {
      id: 'doctor-1',
      name: 'Dr. Wilson',
      role: 'doctor',
      shiftStart: new Date().setHours(8, 0, 0, 0),
      shiftEnd: new Date().setHours(20, 0, 0, 0),
      available: true,
      currentLoad: 1,
    });
  }

  async createAlert(data: {
    patientId: string;
    patientName: string;
    roomNumber: string;
    type: AlertType;
    urgency: UrgencyLevel;
    message: string;
    notes?: string;
  }): Promise<Alert> {
    // Validate required fields
    if (!data.patientId || !data.patientName || !data.roomNumber) {
      throw new Error('Patient information is required');
    }
    
    if (!data.type || !data.urgency) {
      throw new Error('Alert type and urgency are required');
    }
    
    if (!data.message || data.message.trim().length < 10) {
      throw new Error('Message must be at least 10 characters long');
    }
    
    // Calculate priority
    const priority = this.calculatePriority(data.type, data.urgency);
    
    // Create alert
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random()}`,
      ...data,
      priority,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user',
      assignedTo: null,
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      resolvedBy: null,
      responseTime: null,
      escalationLevel: 0,
      escalationHistory: [],
      metadata: {},
    };
    
    this.alerts.set(alert.id, alert);
    this.emit('alert:created', alert);
    
    // Auto-assign if critical
    if (priority >= 8) {
      await this.autoAssign(alert);
    }
    
    return alert;
  }

  async assignAlert(alertId: string, userIds: string[]): Promise<Alert> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    if (alert.status !== 'pending') {
      throw new Error('Can only assign pending alerts');
    }
    
    // Validate users
    const validUsers = userIds.filter(id => {
      const user = this.users.get(id);
      return user && user.available && this.isUserOnShift(user);
    });
    
    if (validUsers.length === 0) {
      throw new Error('No valid users available for assignment');
    }
    
    // Update alert
    alert.assignedTo = validUsers;
    alert.status = 'assigned';
    alert.updatedAt = new Date();
    
    // Update assignments
    this.assignments.set(alertId, validUsers);
    
    // Update user loads
    validUsers.forEach(userId => {
      const user = this.users.get(userId);
      if (user) {
        user.currentLoad++;
      }
    });
    
    this.emit('alert:assigned', { alert, assignedTo: validUsers });
    
    return alert;
  }

  async autoAssign(alert: Alert): Promise<Alert> {
    // Find available users based on priority
    const availableUsers = Array.from(this.users.values())
      .filter(user => {
        // Check if user is available and on shift
        if (!user.available || !this.isUserOnShift(user)) {
          return false;
        }
        
        // For critical alerts, include doctors
        if (alert.priority >= 9 && user.role === 'doctor') {
          return true;
        }
        
        // For all alerts, include nurses
        return user.role === 'nurse';
      })
      .sort((a, b) => a.currentLoad - b.currentLoad); // Sort by load
    
    if (availableUsers.length === 0) {
      this.emit('alert:assignment-failed', { 
        alert, 
        reason: 'No available staff' 
      });
      return alert;
    }
    
    // Assign to user with lowest load
    const assignedUsers = alert.priority >= 9 
      ? availableUsers.slice(0, 2) // Assign 2 people for critical
      : [availableUsers[0]]; // Assign 1 person for non-critical
    
    return this.assignAlert(alert.id, assignedUsers.map(u => u.id));
  }

  async reassignAlert(alertId: string, newUserIds: string[]): Promise<Alert> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    if (alert.status === 'resolved') {
      throw new Error('Cannot reassign resolved alerts');
    }
    
    // Remove load from previous assignees
    const previousAssignees = this.assignments.get(alertId) || [];
    previousAssignees.forEach(userId => {
      const user = this.users.get(userId);
      if (user) {
        user.currentLoad = Math.max(0, user.currentLoad - 1);
      }
    });
    
    // Assign to new users
    alert.assignedTo = null;
    alert.status = 'pending';
    
    const updated = await this.assignAlert(alertId, newUserIds);
    
    this.emit('alert:reassigned', { 
      alert: updated, 
      previousAssignees, 
      newAssignees: newUserIds 
    });
    
    return updated;
  }

  private calculatePriority(type: AlertType, urgency: UrgencyLevel): number {
    const typeWeights: Record<AlertType, number> = {
      cardiac_arrest: 10,
      respiratory_distress: 9,
      stroke_alert: 9,
      sepsis_alert: 8,
      fall_risk: 6,
      medication_due: 5,
      abnormal_vitals: 7,
      patient_request: 4,
      equipment_alarm: 6,
      code_blue: 10,
      rapid_response: 9,
      security_alert: 8,
      fire_alarm: 10,
    };
    
    const weight = typeWeights[type] || 5;
    const urgencyMultiplier = 6 - urgency; // 1 (critical) = 5, 5 (low) = 1
    
    return Math.min(10, weight * (urgencyMultiplier / 5));
  }

  private isUserOnShift(user: any): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const shiftStartHour = new Date(user.shiftStart).getHours();
    const shiftEndHour = new Date(user.shiftEnd).getHours();
    
    return currentHour >= shiftStartHour && currentHour < shiftEndHour;
  }

  // Helper methods
  getAlert(id: string): Alert | undefined {
    return this.alerts.get(id);
  }

  getAssignments(alertId: string): string[] {
    return this.assignments.get(alertId) || [];
  }

  getUser(id: string): any {
    return this.users.get(id);
  }

  getUserLoad(userId: string): number {
    const user = this.users.get(userId);
    return user ? user.currentLoad : 0;
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
}

describe('Alert Creation and Assignment', () => {
  let service: HealthcareService;
  
  beforeEach(() => {
    service = new HealthcareService();
  });

  describe('Alert Creation', () => {
    it('creates alert with all required fields', async () => {
      const alertData = {
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'medical_emergency' as AlertType,
        urgency: 3 as UrgencyLevel,
        message: 'Patient experiencing chest pain and shortness of breath',
        notes: 'BP: 160/95, HR: 110',
      };
      
      const alert = await service.createAlert(alertData);
      
      expect(alert.id).toBeDefined();
      expect(alert.patientId).toBe('patient-123');
      expect(alert.type).toBe('medical_emergency');
      expect(alert.urgency).toBe(3);
      expect(alert.status).toBe('pending');
      expect(alert.priority).toBeGreaterThan(0);
    });

    it('validates required fields', async () => {
      await expect(service.createAlert({
        patientId: '',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'medical_emergency' as AlertType,
        urgency: 3 as UrgencyLevel,
        message: 'Test message',
      })).rejects.toThrow('Patient information is required');
      
      await expect(service.createAlert({
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: null as any,
        urgency: 3 as UrgencyLevel,
        message: 'Test message',
      })).rejects.toThrow('Alert type and urgency are required');
      
      await expect(service.createAlert({
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'medical_emergency' as AlertType,
        urgency: 3 as UrgencyLevel,
        message: 'Short',
      })).rejects.toThrow('Message must be at least 10 characters long');
    });

    it('calculates priority based on type and urgency', async () => {
      const criticalCardiac = await service.createAlert({
        patientId: 'patient-1',
        patientName: 'Patient 1',
        roomNumber: '101',
        type: 'cardiac_arrest' as AlertType,
        urgency: 1 as UrgencyLevel,
        message: 'Cardiac arrest in progress',
      });
      
      expect(criticalCardiac.priority).toBe(10);
      
      const lowPriorityRequest = await service.createAlert({
        patientId: 'patient-2',
        patientName: 'Patient 2',
        roomNumber: '102',
        type: 'patient_request' as AlertType,
        urgency: 5 as UrgencyLevel,
        message: 'Patient requesting water',
      });
      
      expect(lowPriorityRequest.priority).toBeLessThan(5);
    });

    it('auto-assigns critical alerts', async () => {
      const assignedListener = jest.fn();
      service.on('alert:assigned', assignedListener);
      
      const alert = await service.createAlert({
        patientId: 'patient-123',
        patientName: 'Critical Patient',
        roomNumber: '911',
        type: 'cardiac_arrest' as AlertType,
        urgency: 1 as UrgencyLevel,
        message: 'Code blue - cardiac arrest',
      });
      
      expect(alert.status).toBe('assigned');
      expect(alert.assignedTo).toBeDefined();
      expect(alert.assignedTo!.length).toBeGreaterThan(0);
      expect(assignedListener).toHaveBeenCalled();
    });
  });

  describe('Manual Assignment', () => {
    it('assigns alert to available users', async () => {
      const alert = await service.createAlert({
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'medication_due' as AlertType,
        urgency: 3 as UrgencyLevel,
        message: 'Medication due in 30 minutes',
      });
      
      const assigned = await service.assignAlert(alert.id, ['nurse-1']);
      
      expect(assigned.status).toBe('assigned');
      expect(assigned.assignedTo).toEqual(['nurse-1']);
      expect(service.getUserLoad('nurse-1')).toBe(1);
    });

    it('validates user availability', async () => {
      const alert = await service.createAlert({
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'patient_request' as AlertType,
        urgency: 4 as UrgencyLevel,
        message: 'Patient needs assistance',
      });
      
      await expect(
        service.assignAlert(alert.id, ['invalid-user'])
      ).rejects.toThrow('No valid users available');
    });

    it('prevents assigning non-pending alerts', async () => {
      const alert = await service.createAlert({
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'fall_risk' as AlertType,
        urgency: 2 as UrgencyLevel,
        message: 'Patient at high risk of falling',
      });
      
      await service.assignAlert(alert.id, ['nurse-1']);
      
      await expect(
        service.assignAlert(alert.id, ['nurse-2'])
      ).rejects.toThrow('Can only assign pending alerts');
    });

    it('assigns to multiple users for team response', async () => {
      const alert = await service.createAlert({
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'rapid_response' as AlertType,
        urgency: 1 as UrgencyLevel,
        message: 'Rapid response team needed',
      });
      
      const assigned = await service.assignAlert(alert.id, ['nurse-1', 'doctor-1']);
      
      expect(assigned.assignedTo).toHaveLength(2);
      expect(assigned.assignedTo).toContain('nurse-1');
      expect(assigned.assignedTo).toContain('doctor-1');
    });
  });

  describe('Auto-Assignment Logic', () => {
    it('assigns to user with lowest load', async () => {
      // nurse-1 has load 0, nurse-2 has load 2
      const alert = await service.createAlert({
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'abnormal_vitals' as AlertType,
        urgency: 2 as UrgencyLevel,
        message: 'Abnormal vital signs detected',
      });
      
      await service.autoAssign(alert);
      
      expect(alert.assignedTo).toEqual(['nurse-1']);
      expect(service.getUserLoad('nurse-1')).toBe(1);
    });

    it('includes doctors for critical alerts', async () => {
      const alert = await service.createAlert({
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'stroke_alert' as AlertType,
        urgency: 1 as UrgencyLevel,
        message: 'Stroke symptoms detected - immediate response needed',
      });
      
      expect(alert.priority).toBeGreaterThanOrEqual(9);
      expect(alert.assignedTo).toBeDefined();
      
      const hasDoctor = alert.assignedTo!.some(id => {
        const user = service.getUser(id);
        return user && user.role === 'doctor';
      });
      
      expect(hasDoctor).toBe(true);
    });

    it('emits failure event when no staff available', async () => {
      // Make all users unavailable
      ['nurse-1', 'nurse-2', 'doctor-1'].forEach(id => {
        const user = service.getUser(id);
        if (user) user.available = false;
      });
      
      const failureListener = jest.fn();
      service.on('alert:assignment-failed', failureListener);
      
      const alert = await service.createAlert({
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'medical_emergency' as AlertType,
        urgency: 3 as UrgencyLevel,
        message: 'Medical emergency - no staff available',
      });
      
      await service.autoAssign(alert);
      
      expect(alert.status).toBe('pending');
      expect(alert.assignedTo).toBeNull();
      expect(failureListener).toHaveBeenCalledWith({
        alert,
        reason: 'No available staff',
      });
    });
  });

  describe('Reassignment', () => {
    it('reassigns alert to new users', async () => {
      const alert = await service.createAlert({
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'patient_request' as AlertType,
        urgency: 4 as UrgencyLevel,
        message: 'Patient needs assistance',
      });
      
      await service.assignAlert(alert.id, ['nurse-2']);
      expect(service.getUserLoad('nurse-2')).toBe(3);
      
      const reassignedListener = jest.fn();
      service.on('alert:reassigned', reassignedListener);
      
      const reassigned = await service.reassignAlert(alert.id, ['nurse-1']);
      
      expect(reassigned.assignedTo).toEqual(['nurse-1']);
      expect(service.getUserLoad('nurse-1')).toBe(1);
      expect(service.getUserLoad('nurse-2')).toBe(2); // Load decreased
      
      expect(reassignedListener).toHaveBeenCalledWith({
        alert: reassigned,
        previousAssignees: ['nurse-2'],
        newAssignees: ['nurse-1'],
      });
    });

    it('prevents reassigning resolved alerts', async () => {
      const alert = await service.createAlert({
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'patient_request' as AlertType,
        urgency: 4 as UrgencyLevel,
        message: 'Patient needs assistance',
      });
      
      // Manually set to resolved
      alert.status = 'resolved';
      
      await expect(
        service.reassignAlert(alert.id, ['nurse-1'])
      ).rejects.toThrow('Cannot reassign resolved alerts');
    });
  });

  describe('Event Notifications', () => {
    it('emits events for alert lifecycle', async () => {
      const events: string[] = [];
      
      ['alert:created', 'alert:assigned', 'alert:reassigned'].forEach(event => {
        service.on(event, () => events.push(event));
      });
      
      const alert = await service.createAlert({
        patientId: 'patient-123',
        patientName: 'John Doe',
        roomNumber: '302',
        type: 'medication_due' as AlertType,
        urgency: 3 as UrgencyLevel,
        message: 'Medication due in 15 minutes',
      });
      
      expect(events).toContain('alert:created');
      
      await service.assignAlert(alert.id, ['nurse-1']);
      expect(events).toContain('alert:assigned');
      
      await service.reassignAlert(alert.id, ['nurse-2']);
      expect(events).toContain('alert:reassigned');
    });
  });
});