// @ts-nocheck
// Unit tests for healthcare alert utilities

import {
  getAlertPriority,
  calculateEscalationTime,
  formatAlertMessage,
  isHighPriorityAlert,
  getResponseTimeTarget,
  getTimeToEscalation,
  getAlertSeverity,
  validateAlertInput,
} from '@/lib/healthcare/alert-utils';

// Mock healthcare types
jest.mock('@/types/healthcare', () => ({
  ALERT_TYPE_CONFIG: {
    cardiac_arrest: { label: 'Cardiac Arrest', icon: 'heart' },
    code_blue: { label: 'Code Blue', icon: 'alert' },
    fire: { label: 'Fire', icon: 'flame' },
    medical_emergency: { label: 'Medical Emergency', icon: 'medical' },
    security: { label: 'Security', icon: 'shield' },
  },
  URGENCY_LEVEL_CONFIG: {
    1: { label: 'Low', color: 'green', escalationMinutes: 30 },
    2: { label: 'Medium-Low', color: 'yellow', escalationMinutes: 20 },
    3: { label: 'Moderate', color: 'orange', escalationMinutes: 15 },
    4: { label: 'High', color: 'red', escalationMinutes: 10 },
    5: { label: 'Critical', color: 'purple', escalationMinutes: 5 },
  },
}));

describe('Alert Utils', () => {
  describe('getAlertPriority', () => {
    it('should calculate priority correctly for each alert type', () => {
      expect(getAlertPriority('cardiac_arrest', 5)).toBe(50); // 10 * 5
      expect(getAlertPriority('code_blue', 5)).toBe(45); // 9 * 5
      expect(getAlertPriority('fire', 4)).toBe(32); // 8 * 4
      expect(getAlertPriority('medical_emergency', 3)).toBe(21); // 7 * 3
      expect(getAlertPriority('security', 2)).toBe(12); // 6 * 2
    });

    it('should handle unknown alert types with default weight', () => {
      expect(getAlertPriority('unknown_type', 3)).toBe(3); // 1 * 3
    });

    it('should scale with urgency level', () => {
      const alertType = 'cardiac_arrest';
      expect(getAlertPriority(alertType, 1)).toBe(10);
      expect(getAlertPriority(alertType, 2)).toBe(20);
      expect(getAlertPriority(alertType, 3)).toBe(30);
      expect(getAlertPriority(alertType, 4)).toBe(40);
      expect(getAlertPriority(alertType, 5)).toBe(50);
    });
  });

  describe('calculateEscalationTime', () => {
    it('should return correct escalation times for each urgency level', () => {
      expect(calculateEscalationTime(1)).toBe(30);
      expect(calculateEscalationTime(2)).toBe(20);
      expect(calculateEscalationTime(3)).toBe(15);
      expect(calculateEscalationTime(4)).toBe(10);
      expect(calculateEscalationTime(5)).toBe(5);
    });

    it('should return default 15 minutes for invalid urgency level', () => {
      expect(calculateEscalationTime(0)).toBe(15);
      expect(calculateEscalationTime(6)).toBe(15);
      expect(calculateEscalationTime(999)).toBe(15);
    });
  });

  describe('formatAlertMessage', () => {
    it('should format alert message correctly', () => {
      const alert = {
        alertType: 'cardiac_arrest',
        roomNumber: '101',
        urgencyLevel: 5,
      };
      expect(formatAlertMessage(alert)).toBe('CARDIAC ARREST - Room 101 (Critical)');
    });

    it('should handle different alert types', () => {
      expect(formatAlertMessage({
        alertType: 'code_blue',
        roomNumber: '205',
        urgencyLevel: 4,
      })).toBe('CODE BLUE - Room 205 (High)');

      expect(formatAlertMessage({
        alertType: 'medical_emergency',
        roomNumber: 'ICU-3',
        urgencyLevel: 3,
      })).toBe('MEDICAL EMERGENCY - Room ICU-3 (Moderate)');
    });

    it('should handle unknown urgency levels', () => {
      expect(formatAlertMessage({
        alertType: 'fire',
        roomNumber: '301',
        urgencyLevel: 99,
      })).toBe('FIRE - Room 301 (Unknown)');
    });

    it('should format alert types with underscores correctly', () => {
      expect(formatAlertMessage({
        alertType: 'medical_emergency',
        roomNumber: '102',
        urgencyLevel: 2,
      })).toBe('MEDICAL EMERGENCY - Room 102 (Medium-Low)');
    });
  });

  describe('isHighPriorityAlert', () => {
    it('should identify high priority alerts with default threshold', () => {
      // Default threshold is 25
      expect(isHighPriorityAlert('cardiac_arrest', 3)).toBe(true); // 30 > 25
      expect(isHighPriorityAlert('code_blue', 3)).toBe(true); // 27 > 25
      expect(isHighPriorityAlert('security', 3)).toBe(false); // 18 < 25
    });

    it('should respect custom threshold', () => {
      expect(isHighPriorityAlert('medical_emergency', 3, 20)).toBe(true); // 21 > 20
      expect(isHighPriorityAlert('medical_emergency', 3, 22)).toBe(false); // 21 < 22
    });

    it('should handle edge cases', () => {
      expect(isHighPriorityAlert('cardiac_arrest', 1, 10)).toBe(false); // 10 = 10
      expect(isHighPriorityAlert('cardiac_arrest', 5, 0)).toBe(true); // Always true with 0 threshold
    });
  });

  describe('getResponseTimeTarget', () => {
    it('should return correct response time targets', () => {
      expect(getResponseTimeTarget(1)).toBe(30); // Low
      expect(getResponseTimeTarget(2)).toBe(20); // Medium-Low
      expect(getResponseTimeTarget(3)).toBe(10); // Moderate
      expect(getResponseTimeTarget(4)).toBe(5);  // High
      expect(getResponseTimeTarget(5)).toBe(2);  // Critical
    });

    it('should return default 10 minutes for invalid urgency', () => {
      expect(getResponseTimeTarget(0)).toBe(10);
      expect(getResponseTimeTarget(6)).toBe(10);
      expect(getResponseTimeTarget(-1)).toBe(10);
    });
  });

  describe('getTimeToEscalation', () => {
    it('should calculate time remaining correctly', () => {
      const createdAt = new Date('2024-01-01T10:00:00');
      const currentTime = new Date('2024-01-01T10:05:00'); // 5 minutes later
      
      const result = getTimeToEscalation(createdAt, 3, currentTime); // 15 min escalation
      
      expect(result.minutes).toBe(10); // 15 - 5 = 10 minutes remaining
      expect(result.isOverdue).toBe(false);
      expect(result.percentage).toBeCloseTo(33.33, 1); // 5/15 * 100
    });

    it('should handle overdue escalations', () => {
      const createdAt = new Date('2024-01-01T10:00:00');
      const currentTime = new Date('2024-01-01T10:20:00'); // 20 minutes later
      
      const result = getTimeToEscalation(createdAt, 3, currentTime); // 15 min escalation
      
      expect(result.minutes).toBe(0); // No negative minutes
      expect(result.isOverdue).toBe(true);
      expect(result.percentage).toBe(100); // Capped at 100%
    });

    it('should use current time if not provided', () => {
      const createdAt = new Date();
      const result = getTimeToEscalation(createdAt, 5);
      
      expect(result.minutes).toBeLessThanOrEqual(5);
      expect(result.isOverdue).toBe(false);
      expect(result.percentage).toBeGreaterThanOrEqual(0);
    });

    it('should handle different urgency levels', () => {
      const createdAt = new Date('2024-01-01T10:00:00');
      const currentTime = new Date('2024-01-01T10:03:00'); // 3 minutes later
      
      // Critical (5 min escalation)
      const critical = getTimeToEscalation(createdAt, 5, currentTime);
      expect(critical.minutes).toBe(2);
      expect(critical.percentage).toBe(60);
      
      // Low (30 min escalation)
      const low = getTimeToEscalation(createdAt, 1, currentTime);
      expect(low.minutes).toBe(27);
      expect(low.percentage).toBe(10);
    });
  });

  describe('getAlertSeverity', () => {
    it('should return correct severity levels', () => {
      expect(getAlertSeverity(1)).toBe('low');
      expect(getAlertSeverity(2)).toBe('medium');
      expect(getAlertSeverity(3)).toBe('high');
      expect(getAlertSeverity(4)).toBe('high');
      expect(getAlertSeverity(5)).toBe('critical');
    });

    it('should handle edge cases', () => {
      expect(getAlertSeverity(0)).toBe('low');
      expect(getAlertSeverity(-1)).toBe('low');
      expect(getAlertSeverity(6)).toBe('critical');
      expect(getAlertSeverity(100)).toBe('critical');
    });
  });

  describe('validateAlertInput', () => {
    it('should validate valid input', () => {
      const input = {
        roomNumber: '101',
        alertType: 'cardiac_arrest',
        urgencyLevel: 5,
      };
      
      const result = validateAlertInput(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing room number', () => {
      const result = validateAlertInput({
        alertType: 'fire',
        urgencyLevel: 3,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Room number is required');
    });

    it('should detect empty room number', () => {
      const result = validateAlertInput({
        roomNumber: '  ',
        alertType: 'fire',
        urgencyLevel: 3,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Room number is required');
    });

    it('should detect invalid alert type', () => {
      const result = validateAlertInput({
        roomNumber: '101',
        alertType: 'invalid_type',
        urgencyLevel: 3,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid alert type is required');
    });

    it('should detect missing alert type', () => {
      const result = validateAlertInput({
        roomNumber: '101',
        urgencyLevel: 3,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid alert type is required');
    });

    it('should detect invalid urgency levels', () => {
      const testCases = [
        { urgencyLevel: 0, shouldBeInvalid: true },
        { urgencyLevel: 6, shouldBeInvalid: true },
        { urgencyLevel: -1, shouldBeInvalid: true },
        { urgencyLevel: 1.5, shouldBeInvalid: false }, // Decimals between 1-5 are valid
        { urgencyLevel: null, shouldBeInvalid: true },
        { urgencyLevel: undefined, shouldBeInvalid: true },
      ];
      
      testCases.forEach(({ urgencyLevel, shouldBeInvalid }) => {
        const result = validateAlertInput({
          roomNumber: '101',
          alertType: 'fire',
          urgencyLevel,
        });
        
        expect(result.isValid).toBe(!shouldBeInvalid);
        if (shouldBeInvalid) {
          expect(result.errors).toContain('Urgency level must be between 1 and 5');
        }
      });
    });

    it('should detect multiple errors', () => {
      const result = validateAlertInput({
        roomNumber: '',
        alertType: 'invalid',
        urgencyLevel: 10,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Room number is required');
      expect(result.errors).toContain('Valid alert type is required');
      expect(result.errors).toContain('Urgency level must be between 1 and 5');
    });

    it('should handle all valid urgency levels', () => {
      [1, 2, 3, 4, 5].forEach(urgencyLevel => {
        const result = validateAlertInput({
          roomNumber: '101',
          alertType: 'fire',
          urgencyLevel,
        });
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });
  });
});