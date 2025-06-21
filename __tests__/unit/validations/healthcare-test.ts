import { z } from 'zod';
import {
  VALIDATION_MESSAGES,
  ROOM_NUMBER_PATTERNS,
  LICENSE_PATTERNS,
  validators,
  zodRefinements,
  permissionValidators,
  formValidation,
  alertValidation,
  enhancedSchemas,
  createFormValidator,
} from '@/lib/validations/healthcare';

describe('Healthcare Validations', () => {
  describe('Room Number Validation', () => {
    it('validates standard room numbers', () => {
      const validRooms = ['101', '205A', 'ICU1', 'A1', '9999'];
      validRooms.forEach(room => {
        expect(validators.isValidRoomNumber(room)).toBe(true);
      });
    });

    it('validates floor-based room numbers', () => {
      const validRooms = ['2-101', '3-ICU', '1-205A', '10-999'];
      validRooms.forEach(room => {
        expect(validators.isValidRoomNumber(room)).toBe(true);
      });
    });

    it('validates emergency room numbers', () => {
      const validRooms = ['ER-1', 'ED-99', 'ICU2', 'CCU-15', 'NICU-3', 'OR-7'];
      validRooms.forEach(room => {
        expect(validators.isValidRoomNumber(room)).toBe(true);
      });
    });

    it('rejects invalid room numbers', () => {
      const invalidRooms = ['', 'ABCDEF', '12345', 'Room 101', '1-2-3'];
      invalidRooms.forEach(room => {
        expect(validators.isValidRoomNumber(room)).toBe(false);
      });
    });
  });

  describe('License Number Validation', () => {
    it('validates medical license numbers', () => {
      expect(validators.isValidLicenseNumber('CA-123456', 'medical')).toBe(true);
      expect(validators.isValidLicenseNumber('NY-12345678', 'medical')).toBe(true);
      expect(validators.isValidLicenseNumber('TX-1234567', 'medical')).toBe(true);
    });

    it('validates nursing license numbers', () => {
      expect(validators.isValidLicenseNumber('RN-123456', 'nursing')).toBe(true);
      expect(validators.isValidLicenseNumber('RN-12345678', 'nursing')).toBe(true);
    });

    it('validates general license numbers', () => {
      expect(validators.isValidLicenseNumber('ABC123456', 'general')).toBe(true);
      expect(validators.isValidLicenseNumber('123456ABCD', 'general')).toBe(true);
    });

    it('rejects invalid license numbers', () => {
      expect(validators.isValidLicenseNumber('CA123456', 'medical')).toBe(false); // Missing dash
      expect(validators.isValidLicenseNumber('RN123456', 'nursing')).toBe(false); // Missing dash
      expect(validators.isValidLicenseNumber('12345', 'general')).toBe(false); // Too short
    });
  });

  describe('Department Validation', () => {
    it('validates valid departments', () => {
      const validDepartments = [
        'emergency',
        'cardiology',
        'orthopedics',
        'pediatrics',
        'obstetrics',
        'neurology',
        'oncology',
        'radiology',
        'pathology',
        'psychiatry',
        'general',
      ];
      
      validDepartments.forEach(dept => {
        expect(validators.isValidDepartment(dept)).toBe(true);
        expect(validators.isValidDepartment(dept.toUpperCase())).toBe(true); // Case insensitive
      });
    });

    it('rejects invalid departments', () => {
      expect(validators.isValidDepartment('surgery')).toBe(false);
      expect(validators.isValidDepartment('invalid')).toBe(false);
      expect(validators.isValidDepartment('')).toBe(false);
    });
  });

  describe('Shift Time Validation', () => {
    it('validates valid shift times', () => {
      expect(validators.isValidShiftTime(0, 0)).toBe(true);
      expect(validators.isValidShiftTime(12, 30)).toBe(true);
      expect(validators.isValidShiftTime(23, 59)).toBe(true);
    });

    it('rejects invalid shift times', () => {
      expect(validators.isValidShiftTime(24, 0)).toBe(false); // Invalid hour
      expect(validators.isValidShiftTime(12, 60)).toBe(false); // Invalid minute
      expect(validators.isValidShiftTime(-1, 30)).toBe(false); // Negative hour
      expect(validators.isValidShiftTime(12, -1)).toBe(false); // Negative minute
    });
  });

  describe('Response Time Validation', () => {
    it('validates response times based on urgency level', () => {
      // Critical (level 1): max 5 minutes
      expect(validators.isValidResponseTime(3, 1)).toBe(true);
      expect(validators.isValidResponseTime(5, 1)).toBe(true);
      expect(validators.isValidResponseTime(6, 1)).toBe(false);

      // High (level 2): max 10 minutes
      expect(validators.isValidResponseTime(10, 2)).toBe(true);
      expect(validators.isValidResponseTime(11, 2)).toBe(false);

      // Medium (level 3): max 20 minutes
      expect(validators.isValidResponseTime(20, 3)).toBe(true);
      expect(validators.isValidResponseTime(21, 3)).toBe(false);

      // Low (level 4): max 30 minutes
      expect(validators.isValidResponseTime(30, 4)).toBe(true);
      expect(validators.isValidResponseTime(31, 4)).toBe(false);

      // Minimal (level 5): max 60 minutes
      expect(validators.isValidResponseTime(60, 5)).toBe(true);
      expect(validators.isValidResponseTime(61, 5)).toBe(false);
    });

    it('rejects zero or negative response times', () => {
      expect(validators.isValidResponseTime(0, 1)).toBe(false);
      expect(validators.isValidResponseTime(-5, 1)).toBe(false);
    });
  });

  describe('Zod Refinements', () => {
    it('validates room numbers with Zod', () => {
      expect(() => zodRefinements.roomNumber.parse('101')).not.toThrow();
      expect(() => zodRefinements.roomNumber.parse('ER-1')).not.toThrow();
      expect(() => zodRefinements.roomNumber.parse('')).toThrow(VALIDATION_MESSAGES.required('Room number'));
      expect(() => zodRefinements.roomNumber.parse('InvalidRoom')).toThrow();
    });

    it('validates license numbers with Zod', () => {
      expect(() => zodRefinements.licenseNumber.parse('CA-123456')).not.toThrow();
      expect(() => zodRefinements.licenseNumber.parse('12345')).toThrow(VALIDATION_MESSAGES.minLength('License number', 6));
      expect(() => zodRefinements.licenseNumber.parse('invalid-license')).toThrow();
    });

    it('validates departments with Zod', () => {
      expect(() => zodRefinements.department.parse('emergency')).not.toThrow();
      expect(() => zodRefinements.department.parse('')).toThrow(VALIDATION_MESSAGES.required('Department'));
      expect(() => zodRefinements.department.parse('invalid')).toThrow(VALIDATION_MESSAGES.invalid('department'));
    });

    it('validates shift times with Zod', () => {
      expect(() => zodRefinements.shiftTime.parse({ hours: 12, minutes: 30 })).not.toThrow();
      expect(() => zodRefinements.shiftTime.parse({ hours: 24, minutes: 0 })).toThrow();
      expect(() => zodRefinements.shiftTime.parse({ hours: 12, minutes: 60 })).toThrow();
    });
  });

  describe('Permission Validators', () => {
    it('validates role assignment permissions', () => {
      // Admin can assign any role
      expect(permissionValidators.canAssignRole('admin', 'nurse')).toBe(true);
      expect(permissionValidators.canAssignRole('admin', 'manager')).toBe(true);

      // Head doctor can assign healthcare roles
      expect(permissionValidators.canAssignRole('head_doctor', 'nurse')).toBe(true);
      expect(permissionValidators.canAssignRole('head_doctor', 'doctor')).toBe(true);
      expect(permissionValidators.canAssignRole('head_doctor', 'manager')).toBe(false);

      // Others can't assign roles
      expect(permissionValidators.canAssignRole('nurse', 'doctor')).toBe(false);
      expect(permissionValidators.canAssignRole('user', 'admin')).toBe(false);
    });

    it('validates alert permissions', () => {
      // Create alert
      expect(permissionValidators.canCreateAlert('nurse')).toBe(true);
      expect(permissionValidators.canCreateAlert('doctor')).toBe(true);
      expect(permissionValidators.canCreateAlert('user')).toBe(false);

      // Acknowledge alert
      expect(permissionValidators.canAcknowledgeAlert('doctor')).toBe(true);
      expect(permissionValidators.canAcknowledgeAlert('head_doctor')).toBe(true);
      expect(permissionValidators.canAcknowledgeAlert('nurse')).toBe(false);

      // Resolve alert
      expect(permissionValidators.canResolveAlert('doctor')).toBe(true);
      expect(permissionValidators.canResolveAlert('nurse')).toBe(false);

      // Escalate alert
      expect(permissionValidators.canEscalateAlert('nurse')).toBe(true);
      expect(permissionValidators.canEscalateAlert('user')).toBe(false);
    });

    it('validates patient data access', () => {
      expect(permissionValidators.canViewPatientData('doctor')).toBe(true);
      expect(permissionValidators.canViewPatientData('nurse')).toBe(true);
      expect(permissionValidators.canViewPatientData('user')).toBe(false);
    });

    it('validates shift management', () => {
      expect(permissionValidators.canManageShifts('head_doctor')).toBe(true);
      expect(permissionValidators.canManageShifts('admin')).toBe(true);
      expect(permissionValidators.canManageShifts('doctor')).toBe(false);
    });
  });

  describe('Form Validation Helpers', () => {
    it('extracts field errors from ZodError', () => {
      try {
        z.object({
          name: z.string().min(1),
          age: z.number().positive(),
        }).parse({ name: '', age: -1 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          expect(formValidation.getFieldError(error, 'name')).toContain('at least 1 character');
          expect(formValidation.getFieldError(error, 'age')).toBeTruthy();
          expect(formValidation.getFieldError(error, 'missing')).toBeNull();
        }
      }
    });

    it('checks if field has error', () => {
      try {
        z.object({
          email: z.string().email(),
        }).parse({ email: 'invalid' });
      } catch (error) {
        if (error instanceof z.ZodError) {
          expect(formValidation.hasFieldError(error, 'email')).toBe(true);
          expect(formValidation.hasFieldError(error, 'name')).toBe(false);
        }
      }
    });

    it('formats errors to record', () => {
      try {
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          age: z.number().positive(),
        }).parse({ name: '', email: 'invalid', age: -1 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formatted = formValidation.formatErrors(error);
          expect(formatted).toHaveProperty('name');
          expect(formatted).toHaveProperty('email');
          expect(formatted).toHaveProperty('age');
        }
      }
    });
  });

  describe('Alert Validation Helpers', () => {
    it('validates alert types', () => {
      expect(alertValidation.isValidAlertType('code_blue')).toBe(true);
      expect(alertValidation.isValidAlertType('medical_emergency')).toBe(true);
      expect(alertValidation.isValidAlertType('invalid_type')).toBe(false);
    });

    it('validates urgency levels', () => {
      expect(alertValidation.isValidUrgencyLevel(1)).toBe(true);
      expect(alertValidation.isValidUrgencyLevel(5)).toBe(true);
      expect(alertValidation.isValidUrgencyLevel(0)).toBe(false);
      expect(alertValidation.isValidUrgencyLevel(6)).toBe(false);
    });

    it('returns default urgency for alert types', () => {
      expect(alertValidation.getDefaultUrgencyForType('code_blue')).toBe(1);
      expect(alertValidation.getDefaultUrgencyForType('medical_emergency')).toBe(1);
      expect(alertValidation.getDefaultUrgencyForType('fall_risk')).toBe(3);
      expect(alertValidation.getDefaultUrgencyForType('general_request')).toBe(5);
      expect(alertValidation.getDefaultUrgencyForType('unknown_type')).toBe(3); // Default
    });

    it('returns response time limits', () => {
      expect(alertValidation.getResponseTimeLimit(1)).toBe(5);
      expect(alertValidation.getResponseTimeLimit(2)).toBe(10);
      expect(alertValidation.getResponseTimeLimit(3)).toBe(20);
      expect(alertValidation.getResponseTimeLimit(4)).toBe(30);
      expect(alertValidation.getResponseTimeLimit(5)).toBe(60);
      expect(alertValidation.getResponseTimeLimit(99)).toBe(30); // Default
    });
  });

  describe('Enhanced Schemas', () => {
    it('validates alert creation', () => {
      const validAlert = {
        roomNumber: '101',
        alertType: 'medical_emergency' as const,
        urgencyLevel: 1,
        hospitalId: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => enhancedSchemas.createAlert.parse(validAlert)).not.toThrow();
    });

    it('validates alert acknowledgment with conditional logic', () => {
      // Valid: responding with estimated time
      expect(() => enhancedSchemas.acknowledgeAlert.parse({
        alertId: '550e8400-e29b-41d4-a716-446655440000',
        urgencyAssessment: 'maintain',
        responseAction: 'responding',
        estimatedResponseTime: 5,
      })).not.toThrow();

      // Invalid: delegating without delegateTo
      expect(() => enhancedSchemas.acknowledgeAlert.parse({
        alertId: '550e8400-e29b-41d4-a716-446655440000',
        urgencyAssessment: 'maintain',
        responseAction: 'delegating',
      })).toThrow('Missing required fields for selected response action');

      // Valid: delegating with delegateTo
      expect(() => enhancedSchemas.acknowledgeAlert.parse({
        alertId: '550e8400-e29b-41d4-a716-446655440000',
        urgencyAssessment: 'maintain',
        responseAction: 'delegating',
        delegateTo: '550e8400-e29b-41d4-a716-446655440001',
      })).not.toThrow();
    });
  });

  describe('Form Validator Factory', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().positive(),
      email: z.string().email(),
    });

    const validator = createFormValidator(testSchema);

    it('validates complete data', () => {
      const result = validator.validate({
        name: 'John',
        age: 25,
        email: 'john@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        name: 'John',
        age: 25,
        email: 'john@example.com',
      });
    });

    it('returns formatted errors on validation failure', () => {
      const result = validator.validate({
        name: '',
        age: -1,
        email: 'invalid',
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveProperty('name');
      expect(result.errors).toHaveProperty('age');
      expect(result.errors).toHaveProperty('email');
    });

    it('validates individual fields', () => {
      expect(validator.validateField('name', 'John')).toBeNull();
      expect(validator.validateField('name', '')).toContain('at least 1 character');
      expect(validator.validateField('email', 'john@example.com')).toBeNull();
      expect(validator.validateField('email', 'invalid')).toContain('Invalid');
    });
  });
});