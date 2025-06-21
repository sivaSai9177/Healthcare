import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { z } from 'zod';
import { CreateAlertSchema, AcknowledgeAlertSchema, ALERT_TYPES, URGENCY_LEVELS } from '@/types/healthcare';
import type { Alert, AlertType, UrgencyLevel } from '@/types/healthcare';

describe('Alert Creation Logic', () => {
  describe('Schema Validation', () => {
    it('should validate correct alert creation data', () => {
      const validData = {
        roomNumber: 'A301',
        alertType: 'code_blue' as AlertType,
        urgencyLevel: 5 as UrgencyLevel,
        description: 'Patient cardiac arrest',
        hospitalId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = CreateAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomNumber).toBe('A301');
        expect(result.data.alertType).toBe('code_blue');
        expect(result.data.urgencyLevel).toBe(5);
      }
    });

    it('should reject invalid urgency levels', () => {
      const invalidData = {
        roomNumber: 'A301',
        alertType: 'code_blue',
        urgencyLevel: 6, // Invalid: should be 1-5
        description: 'Test alert',
        hospitalId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = CreateAlertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid alert types', () => {
      const invalidData = {
        roomNumber: 'A301',
        alertType: 'invalid_type',
        urgencyLevel: 3,
        description: 'Test alert',
        hospitalId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = CreateAlertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require room number', () => {
      const invalidData = {
        alertType: 'medical_emergency',
        urgencyLevel: 4,
        description: 'Test alert',
        hospitalId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = CreateAlertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Alert Acknowledgment', () => {
    it('should validate acknowledgment data', () => {
      const validAck = {
        alertId: '123e4567-e89b-12d3-a456-426614174000',
        urgencyAssessment: 'maintain' as const,
        responseAction: 'responding' as const,
        estimatedResponseTime: 5,
        notes: 'Responding immediately',
      };

      const result = AcknowledgeAlertSchema.safeParse(validAck);
      expect(result.success).toBe(true);
    });

    it('should allow acknowledgment without optional fields', () => {
      const minimalAck = {
        alertId: '123e4567-e89b-12d3-a456-426614174000',
        urgencyAssessment: 'maintain' as const,
        responseAction: 'monitoring' as const,
      };

      const result = AcknowledgeAlertSchema.safeParse(minimalAck);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for alertId', () => {
      const invalidAck = {
        alertId: 'not-a-uuid',
        notes: 'Test',
      };

      const result = AcknowledgeAlertSchema.safeParse(invalidAck);
      expect(result.success).toBe(false);
    });
  });

  describe('Alert Priority Calculation', () => {
    const calculatePriority = (urgencyLevel: number, timeElapsed: number): number => {
      // Priority increases with urgency and time elapsed
      const timeFactor = Math.min(timeElapsed / 10, 2); // Max 2x after 20 minutes
      return urgencyLevel * (1 + timeFactor);
    };

    it('should calculate higher priority for higher urgency', () => {
      const priority1 = calculatePriority(5, 0);
      const priority2 = calculatePriority(3, 0);
      expect(priority1).toBeGreaterThan(priority2);
    });

    it('should increase priority over time', () => {
      const priority1 = calculatePriority(4, 0);
      const priority2 = calculatePriority(4, 10);
      const priority3 = calculatePriority(4, 20);
      
      expect(priority2).toBeGreaterThan(priority1);
      expect(priority3).toBeGreaterThan(priority2);
    });

    it('should cap time factor at 2x', () => {
      const priority20min = calculatePriority(4, 20);
      const priority30min = calculatePriority(4, 30);
      
      expect(priority20min).toBe(priority30min);
    });
  });

  describe('Alert Status Transitions', () => {
    const isValidTransition = (currentStatus: string, newStatus: string): boolean => {
      const transitions: Record<string, string[]> = {
        'active': ['acknowledged', 'resolved'],
        'acknowledged': ['resolved', 'escalated'],
        'escalated': ['acknowledged', 'resolved'],
        'resolved': [], // No transitions from resolved
      };

      return transitions[currentStatus]?.includes(newStatus) || false;
    };

    it('should allow active to acknowledged transition', () => {
      expect(isValidTransition('active', 'acknowledged')).toBe(true);
    });

    it('should allow acknowledged to resolved transition', () => {
      expect(isValidTransition('acknowledged', 'resolved')).toBe(true);
    });

    it('should not allow resolved to active transition', () => {
      expect(isValidTransition('resolved', 'active')).toBe(false);
    });

    it('should not allow active to escalated without acknowledgment', () => {
      expect(isValidTransition('active', 'escalated')).toBe(false);
    });
  });
});