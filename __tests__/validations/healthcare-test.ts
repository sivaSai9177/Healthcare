import { describe, it, expect } from '@jest/globals';
import {
  CreateAlertSchema,
  AcknowledgeAlertSchema,
  UpdateUserRoleSchema,
  HealthcareProfileSchema,
} from '@/types/healthcare';
import {
  isValidRoomNumber,
  isValidLicenseNumber,
  isValidDepartment,
  getDefaultUrgencyForAlertType,
  canRoleAcknowledgeAlerts,
  canRoleCreateAlerts,
  isResponseTimeAcceptable,
} from '@/lib/validations/healthcare';

describe('Healthcare Validation Schemas', () => {
  describe('CreateAlertSchema', () => {
    it('should validate a valid alert', () => {
      const validAlert = {
        roomNumber: '302',
        alertType: 'cardiac_arrest',
        urgencyLevel: 1,
        description: 'Patient experiencing chest pain',
        hospitalId: '550e8400-e29b-41d4-a716-446655440000',
      };

      expect(() => CreateAlertSchema.parse(validAlert)).not.toThrow();
    });

    it('should accept complex room numbers', () => {
      const validRoomNumbers = ['ICU-1', 'ER-12', 'NICU-A3', '101', '1A'];
      
      validRoomNumbers.forEach(roomNumber => {
        const alert = {
          roomNumber,
          alertType: 'medical_emergency',
          urgencyLevel: 3,
          hospitalId: '550e8400-e29b-41d4-a716-446655440000',
        };
        
        expect(() => CreateAlertSchema.parse(alert)).not.toThrow();
      });
    });

    it('should reject invalid room numbers', () => {
      const invalidRoomNumbers = ['', 'TOOLONGROOM-123', 'room-with-spaces', '!!!'];
      
      invalidRoomNumbers.forEach(roomNumber => {
        const alert = {
          roomNumber,
          alertType: 'medical_emergency',
          urgencyLevel: 3,
          hospitalId: '550e8400-e29b-41d4-a716-446655440000',
        };
        
        expect(() => CreateAlertSchema.parse(alert)).toThrow();
      });
    });

    it('should reject missing required fields', () => {
      const invalidAlert = {
        roomNumber: '302',
        // missing alertType and urgencyLevel
        hospitalId: '550e8400-e29b-41d4-a716-446655440000',
      };

      expect(() => CreateAlertSchema.parse(invalidAlert)).toThrow();
    });

    it('should reject invalid hospital ID', () => {
      const invalidAlert = {
        roomNumber: '302',
        alertType: 'cardiac_arrest',
        urgencyLevel: 1,
        hospitalId: 'not-a-uuid',
      };

      expect(() => CreateAlertSchema.parse(invalidAlert)).toThrow();
    });

    it('should allow optional description up to 500 chars', () => {
      const longDescription = 'A'.repeat(500);
      const alert = {
        roomNumber: '302',
        alertType: 'medical_emergency',
        urgencyLevel: 3,
        description: longDescription,
        hospitalId: '550e8400-e29b-41d4-a716-446655440000',
      };

      expect(() => CreateAlertSchema.parse(alert)).not.toThrow();
    });

    it('should reject description over 500 chars', () => {
      const tooLongDescription = 'A'.repeat(501);
      const alert = {
        roomNumber: '302',
        alertType: 'medical_emergency',
        urgencyLevel: 3,
        description: tooLongDescription,
        hospitalId: '550e8400-e29b-41d4-a716-446655440000',
      };

      expect(() => CreateAlertSchema.parse(alert)).toThrow();
    });
  });

  describe('AcknowledgeAlertSchema', () => {
    it('should validate a valid acknowledgment', () => {
      const validAck = {
        alertId: '550e8400-e29b-41d4-a716-446655440000',
        urgencyAssessment: 'maintain',
        responseAction: 'responding',
        estimatedResponseTime: 5,
        notes: 'On my way',
      };

      expect(() => AcknowledgeAlertSchema.parse(validAck)).not.toThrow();
    });

    it('should require estimatedResponseTime for responding action', () => {
      const invalidAck = {
        alertId: '550e8400-e29b-41d4-a716-446655440000',
        urgencyAssessment: 'maintain',
        responseAction: 'responding',
        // missing estimatedResponseTime
      };

      expect(() => AcknowledgeAlertSchema.parse(invalidAck)).toThrow();
    });

    it('should require delegateTo for delegating action', () => {
      const invalidAck = {
        alertId: '550e8400-e29b-41d4-a716-446655440000',
        urgencyAssessment: 'maintain',
        responseAction: 'delegating',
        // missing delegateTo
      };

      expect(() => AcknowledgeAlertSchema.parse(invalidAck)).toThrow();
    });

    it('should allow monitoring without additional fields', () => {
      const validAck = {
        alertId: '550e8400-e29b-41d4-a716-446655440000',
        urgencyAssessment: 'maintain',
        responseAction: 'monitoring',
      };

      expect(() => AcknowledgeAlertSchema.parse(validAck)).not.toThrow();
    });
  });

  describe('UpdateUserRoleSchema', () => {
    it('should validate medical role with required fields', () => {
      const validUpdate = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'doctor',
        hospitalId: '550e8400-e29b-41d4-a716-446655440001',
        department: 'Emergency',
        licenseNumber: 'MD12345',
      };

      expect(() => UpdateUserRoleSchema.parse(validUpdate)).not.toThrow();
    });

    it('should require department and license for medical roles', () => {
      const invalidUpdate = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'nurse',
        hospitalId: '550e8400-e29b-41d4-a716-446655440001',
        // missing department and licenseNumber
      };

      expect(() => UpdateUserRoleSchema.parse(invalidUpdate)).toThrow();
    });

    it('should allow operator role without medical fields', () => {
      const validUpdate = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'operator',
        hospitalId: '550e8400-e29b-41d4-a716-446655440001',
      };

      expect(() => UpdateUserRoleSchema.parse(validUpdate)).not.toThrow();
    });
  });

  describe('HealthcareProfileSchema', () => {
    it('should validate a valid profile', () => {
      const validProfile = {
        hospitalId: '550e8400-e29b-41d4-a716-446655440000',
        licenseNumber: 'RN98765',
        department: 'ICU',
        specialization: 'Critical Care',
        isOnDuty: true,
      };

      expect(() => HealthcareProfileSchema.parse(validProfile)).not.toThrow();
    });

    it('should validate license number format', () => {
      const validLicenses = ['MD123', 'RN456789', 'NP1234567890'];
      
      validLicenses.forEach(licenseNumber => {
        const profile = {
          hospitalId: '550e8400-e29b-41d4-a716-446655440000',
          licenseNumber,
          department: 'Emergency',
        };
        
        expect(() => HealthcareProfileSchema.parse(profile)).not.toThrow();
      });
    });

    it('should reject invalid license numbers', () => {
      const invalidLicenses = ['123', 'MD-123-456', 'LICENSE#123', ''];
      
      invalidLicenses.forEach(licenseNumber => {
        const profile = {
          hospitalId: '550e8400-e29b-41d4-a716-446655440000',
          licenseNumber,
          department: 'Emergency',
        };
        
        expect(() => HealthcareProfileSchema.parse(profile)).toThrow();
      });
    });
  });
});

describe('Healthcare Validation Utilities', () => {
  describe('isValidRoomNumber', () => {
    it('should validate correct room numbers', () => {
      expect(isValidRoomNumber('302')).toBe(true);
      expect(isValidRoomNumber('ICU-1')).toBe(true);
      expect(isValidRoomNumber('ER-12')).toBe(true);
      expect(isValidRoomNumber('NICU-A3')).toBe(true);
    });

    it('should reject invalid room numbers', () => {
      expect(isValidRoomNumber('')).toBe(false);
      expect(isValidRoomNumber('room 302')).toBe(false);
      expect(isValidRoomNumber('TOO-LONG-ROOM')).toBe(false);
    });
  });

  describe('isValidLicenseNumber', () => {
    it('should validate correct license numbers', () => {
      expect(isValidLicenseNumber('MD12345')).toBe(true);
      expect(isValidLicenseNumber('RN-98765')).toBe(true);
      expect(isValidLicenseNumber('NP 123 456')).toBe(true);
    });

    it('should reject invalid license numbers', () => {
      expect(isValidLicenseNumber('123')).toBe(false);
      expect(isValidLicenseNumber('')).toBe(false);
      expect(isValidLicenseNumber('TOOLONGLICENSENUMBER12345')).toBe(false);
    });
  });

  describe('getDefaultUrgencyForAlertType', () => {
    it('should return correct default urgency levels', () => {
      expect(getDefaultUrgencyForAlertType('cardiac_arrest')).toBe(1);
      expect(getDefaultUrgencyForAlertType('code_blue')).toBe(1);
      expect(getDefaultUrgencyForAlertType('fire')).toBe(1);
      expect(getDefaultUrgencyForAlertType('security')).toBe(2);
      expect(getDefaultUrgencyForAlertType('medical_emergency')).toBe(3);
    });
  });

  describe('canRoleAcknowledgeAlerts', () => {
    it('should correctly identify roles that can acknowledge', () => {
      expect(canRoleAcknowledgeAlerts('doctor')).toBe(true);
      expect(canRoleAcknowledgeAlerts('nurse')).toBe(true);
      expect(canRoleAcknowledgeAlerts('head_doctor')).toBe(true);
      expect(canRoleAcknowledgeAlerts('admin')).toBe(true);
      expect(canRoleAcknowledgeAlerts('operator')).toBe(false);
    });
  });

  describe('canRoleCreateAlerts', () => {
    it('should correctly identify roles that can create alerts', () => {
      expect(canRoleCreateAlerts('operator')).toBe(true);
      expect(canRoleCreateAlerts('nurse')).toBe(true);
      expect(canRoleCreateAlerts('admin')).toBe(true);
      expect(canRoleCreateAlerts('doctor')).toBe(false);
      expect(canRoleCreateAlerts('head_doctor')).toBe(false);
    });
  });

  describe('isResponseTimeAcceptable', () => {
    it('should validate response times based on urgency', () => {
      // Critical (5 min max)
      expect(isResponseTimeAcceptable(3, 1)).toBe(true);
      expect(isResponseTimeAcceptable(6, 1)).toBe(false);
      
      // High (10 min max)
      expect(isResponseTimeAcceptable(8, 2)).toBe(true);
      expect(isResponseTimeAcceptable(12, 2)).toBe(false);
      
      // Medium (20 min max)
      expect(isResponseTimeAcceptable(15, 3)).toBe(true);
      expect(isResponseTimeAcceptable(25, 3)).toBe(false);
    });
  });
});