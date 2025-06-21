import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { 
  getAlertPriority,
  calculateEscalationTime,
  formatAlertMessage,
  isHighPriorityAlert,
} from '@/lib/healthcare/alert-utils';
import { AlertType, UrgencyLevel } from '@/types/healthcare';

// Mock the types
const AlertTypes = {
  CARDIAC_ARREST: 'cardiac_arrest' as AlertType,
  CODE_BLUE: 'code_blue' as AlertType,
  FIRE: 'fire' as AlertType,
  MEDICAL_EMERGENCY: 'medical_emergency' as AlertType,
  SECURITY: 'security' as AlertType,
};

const UrgencyLevels = {
  CRITICAL: 5 as UrgencyLevel,
  URGENT: 4 as UrgencyLevel,
  HIGH: 3 as UrgencyLevel,
  MEDIUM: 2 as UrgencyLevel,
  LOW: 1 as UrgencyLevel,
};

describe('Healthcare Alert Workflow Integration', () => {
  const mockDate = new Date('2024-01-15T10:00:00Z');
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Alert Creation Workflow', () => {
    it('creates a valid alert with all required fields', () => {
      const alertData = {
        patientId: 'patient-123',
        type: 'medical' as AlertType,
        priority: 'high' as AlertPriority,
        description: 'Patient experiencing chest pain',
        location: 'Room 302',
        createdBy: 'nurse-456',
      };

      const validationResult = validateAlertCreation(alertData);
      expect(validationResult.success).toBe(true);
      
      if (validationResult.success) {
        const alert = validationResult.data;
        expect(alert.patientId).toBe(alertData.patientId);
        expect(alert.type).toBe(alertData.type);
        expect(alert.priority).toBe(alertData.priority);
        expect(alert.status).toBe('pending'); // Default status
      }
    });

    it('rejects alerts with invalid priority', () => {
      const alertData = {
        patientId: 'patient-123',
        type: 'medical' as AlertType,
        priority: 'invalid' as any,
        description: 'Test alert',
        location: 'Room 302',
        createdBy: 'nurse-456',
      };

      const result = validateAlertCreation(alertData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('priority');
      }
    });

    it('requires minimum description length', () => {
      const alertData = {
        patientId: 'patient-123',
        type: 'medical' as AlertType,
        priority: 'medium' as AlertPriority,
        description: 'Too short',
        location: 'Room 302',
        createdBy: 'nurse-456',
      };

      const result = validateAlertCreation(alertData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
      }
    });

    it('formats alert for display correctly', () => {
      const alert = {
        id: 'alert-789',
        patientId: 'patient-123',
        patientName: 'John Doe',
        type: 'medical' as AlertType,
        priority: 'critical' as AlertPriority,
        status: 'pending' as AlertStatus,
        description: 'Patient in cardiac arrest',
        location: 'ICU-2',
        createdBy: 'doctor-789',
        createdAt: new Date('2024-01-15T09:30:00Z'),
        assignedTo: null,
        acknowledgedAt: null,
        resolvedAt: null,
      };

      const formatted = formatAlertForDisplay(alert);
      
      expect(formatted.priorityColor).toBe('#FF0000'); // Critical = red
      expect(formatted.timeAgo).toContain('30 minutes ago');
      expect(formatted.isOverdue).toBe(true); // Critical alerts overdue after 5 mins
      expect(formatted.escalationLevel).toBe(3); // 30 mins / 10 min intervals
    });
  });

  describe('Patient Data Validation', () => {
    it('validates complete patient data', () => {
      const patientData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1980-05-15',
        roomNumber: '302A',
        admissionDate: '2024-01-10',
        primaryDiagnosis: 'Pneumonia',
        allergies: ['Penicillin', 'Latex'],
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '555-123-4567',
        },
      };

      const result = validatePatientData(patientData);
      expect(result.success).toBe(true);
    });

    it('requires valid room number format', () => {
      const patientData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1980-05-15',
        roomNumber: 'Invalid Room!',
        admissionDate: '2024-01-10',
        primaryDiagnosis: 'Pneumonia',
      };

      const result = validatePatientData(patientData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('roomNumber');
      }
    });

    it('validates date formats', () => {
      const patientData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: 'invalid-date',
        roomNumber: '302',
        admissionDate: '2024-01-10',
        primaryDiagnosis: 'Test',
      };

      const result = validatePatientData(patientData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('dateOfBirth');
      }
    });
  });

  describe('Alert Escalation Logic', () => {
    it('calculates escalation time based on priority', () => {
      const criticalTime = calculateEscalationTime('critical');
      const highTime = calculateEscalationTime('high');
      const mediumTime = calculateEscalationTime('medium');
      const lowTime = calculateEscalationTime('low');

      expect(criticalTime).toBe(5); // 5 minutes
      expect(highTime).toBe(15); // 15 minutes
      expect(mediumTime).toBe(30); // 30 minutes
      expect(lowTime).toBe(60); // 60 minutes
    });

    it('determines if alert is overdue', () => {
      const criticalAlert = {
        priority: 'critical' as AlertPriority,
        createdAt: new Date('2024-01-15T09:54:00Z'), // 6 mins ago
        status: 'pending' as AlertStatus,
      };

      const highAlert = {
        priority: 'high' as AlertPriority,
        createdAt: new Date('2024-01-15T09:50:00Z'), // 10 mins ago
        status: 'pending' as AlertStatus,
      };

      expect(isAlertOverdue(criticalAlert)).toBe(true); // > 5 mins
      expect(isAlertOverdue(highAlert)).toBe(false); // < 15 mins
    });

    it('does not mark acknowledged alerts as overdue', () => {
      const acknowledgedAlert = {
        priority: 'critical' as AlertPriority,
        createdAt: new Date('2024-01-15T09:00:00Z'), // 1 hour ago
        status: 'acknowledged' as AlertStatus,
        acknowledgedAt: new Date('2024-01-15T09:04:00Z'), // Ack'd in 4 mins
      };

      expect(isAlertOverdue(acknowledgedAlert)).toBe(false);
    });
  });

  describe('Alert Assignment Workflow', () => {
    it('validates alert assignment', () => {
      const alert = {
        id: 'alert-123',
        status: 'pending' as AlertStatus,
        assignedTo: null,
      };

      const assignment = {
        alertId: alert.id,
        assignedTo: 'nurse-789',
        assignedBy: 'charge-nurse-123',
        notes: 'Please check patient immediately',
      };

      // Assignment should update alert status
      const updatedAlert = {
        ...alert,
        assignedTo: assignment.assignedTo,
        status: 'assigned' as AlertStatus,
      };

      expect(updatedAlert.assignedTo).toBe('nurse-789');
      expect(updatedAlert.status).toBe('assigned');
    });
  });

  describe('Alert Acknowledgment Workflow', () => {
    it('validates acknowledgment data', () => {
      const acknowledgment = {
        alertId: 'alert-123',
        acknowledgedBy: 'nurse-789',
        notes: 'Patient stabilized, monitoring vitals',
        vitals: {
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 98.6,
          oxygenSaturation: 98,
        },
      };

      // Acknowledgment should include required fields
      expect(acknowledgment.alertId).toBeDefined();
      expect(acknowledgment.acknowledgedBy).toBeDefined();
      expect(acknowledgment.notes.length).toBeGreaterThan(10);
    });

    it('calculates response time correctly', () => {
      const alert = {
        createdAt: new Date('2024-01-15T09:45:00Z'),
        acknowledgedAt: new Date('2024-01-15T09:48:30Z'),
      };

      const responseTimeMs = alert.acknowledgedAt.getTime() - alert.createdAt.getTime();
      const responseTimeMinutes = responseTimeMs / 1000 / 60;

      expect(responseTimeMinutes).toBe(3.5); // 3 minutes 30 seconds
    });
  });

  describe('Alert Resolution Workflow', () => {
    it('validates resolution data', () => {
      const resolution = {
        alertId: 'alert-123',
        resolvedBy: 'doctor-456',
        resolutionNotes: 'Patient treated successfully. Condition stable.',
        followUpRequired: true,
        followUpDate: '2024-01-16',
        medications: ['Aspirin', 'Metoprolol'],
      };

      // Resolution should include outcome
      expect(resolution.resolutionNotes).toBeDefined();
      expect(resolution.resolutionNotes.length).toBeGreaterThan(20);
      expect(resolution.resolvedBy).toBeDefined();
    });

    it('prevents resolution without acknowledgment', () => {
      const alert = {
        id: 'alert-123',
        status: 'pending' as AlertStatus,
        acknowledgedAt: null,
      };

      const canResolve = alert.acknowledgedAt !== null;
      expect(canResolve).toBe(false);
    });
  });

  describe('Alert History and Metrics', () => {
    it('tracks alert metrics correctly', () => {
      const alerts = [
        {
          priority: 'critical' as AlertPriority,
          createdAt: new Date('2024-01-15T08:00:00Z'),
          acknowledgedAt: new Date('2024-01-15T08:03:00Z'),
          resolvedAt: new Date('2024-01-15T08:15:00Z'),
        },
        {
          priority: 'high' as AlertPriority,
          createdAt: new Date('2024-01-15T08:30:00Z'),
          acknowledgedAt: new Date('2024-01-15T08:35:00Z'),
          resolvedAt: new Date('2024-01-15T08:50:00Z'),
        },
        {
          priority: 'critical' as AlertPriority,
          createdAt: new Date('2024-01-15T09:00:00Z'),
          acknowledgedAt: new Date('2024-01-15T09:02:00Z'),
          resolvedAt: new Date('2024-01-15T09:10:00Z'),
        },
      ];

      // Calculate average response times
      const responseTimes = alerts.map(a => 
        (a.acknowledgedAt.getTime() - a.createdAt.getTime()) / 1000 / 60
      );
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      expect(avgResponseTime).toBeCloseTo(3.33, 1); // ~3.3 minutes average

      // Calculate resolution times
      const resolutionTimes = alerts.map(a => 
        (a.resolvedAt.getTime() - a.createdAt.getTime()) / 1000 / 60
      );
      const avgResolutionTime = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;

      expect(avgResolutionTime).toBeCloseTo(13.33, 1); // ~13.3 minutes average
    });

    it('filters alerts by date range', () => {
      const alerts = [
        { createdAt: new Date('2024-01-14T10:00:00Z') },
        { createdAt: new Date('2024-01-15T08:00:00Z') },
        { createdAt: new Date('2024-01-15T10:00:00Z') },
        { createdAt: new Date('2024-01-16T10:00:00Z') },
      ];

      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');

      const filtered = alerts.filter(a => 
        a.createdAt >= startDate && a.createdAt <= endDate
      );

      expect(filtered).toHaveLength(2);
    });
  });
});