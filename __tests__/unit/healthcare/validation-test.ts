import {
  CreateAlertSchema,
  AcknowledgeAlertSchema,
  UpdateUserRoleSchema,
  HealthcareProfileSchema,
} from '@/types/healthcare';

describe('Healthcare Validation Schemas', () => {
  describe('CreateAlertSchema', () => {
    it('should validate correct alert input', () => {
      const validInput = {
        roomNumber: '301',
        alertType: 'cardiac_arrest',
        urgencyLevel: 1,
        hospitalId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Patient collapsed, no pulse detected',
      };

      const result = CreateAlertSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate room number formats', () => {
      const validRooms = ['301', 'ICU-1', 'ER-12', 'A123', '1A'];
      validRooms.forEach(room => {
        const result = CreateAlertSchema.safeParse({
          roomNumber: room,
          alertType: 'medical_emergency',
          urgencyLevel: 3,
          hospitalId: '123e4567-e89b-12d3-a456-426614174000',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid room numbers', () => {
      const invalidRooms = ['', 'TOOLONGROOM', '!!!', 'Room-123-456'];
      invalidRooms.forEach(room => {
        const result = CreateAlertSchema.safeParse({
          roomNumber: room,
          alertType: 'medical_emergency',
          urgencyLevel: 3,
          hospitalId: '123e4567-e89b-12d3-a456-426614174000',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid alert types', () => {
      const result = CreateAlertSchema.safeParse({
        roomNumber: '301',
        alertType: 'invalid_type',
        urgencyLevel: 3,
        hospitalId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid urgency levels', () => {
      const invalidLevels = [0, 6, -1, 1.5];
      invalidLevels.forEach(level => {
        const result = CreateAlertSchema.safeParse({
          roomNumber: '301',
          alertType: 'medical_emergency',
          urgencyLevel: level,
          hospitalId: '123e4567-e89b-12d3-a456-426614174000',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject description over 500 characters', () => {
      const result = CreateAlertSchema.safeParse({
        roomNumber: '301',
        alertType: 'medical_emergency',
        urgencyLevel: 3,
        hospitalId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid hospital ID', () => {
      const result = CreateAlertSchema.safeParse({
        roomNumber: '301',
        alertType: 'medical_emergency',
        urgencyLevel: 3,
        hospitalId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AcknowledgeAlertSchema', () => {
    it('should validate correct acknowledgment for responding', () => {
      const result = AcknowledgeAlertSchema.safeParse({
        alertId: '123e4567-e89b-12d3-a456-426614174000',
        urgencyAssessment: 'maintain',
        responseAction: 'responding',
        estimatedResponseTime: 5,
        notes: 'On my way to room 301',
      });
      expect(result.success).toBe(true);
    });

    it('should require estimatedResponseTime for responding action', () => {
      const result = AcknowledgeAlertSchema.safeParse({
        alertId: '123e4567-e89b-12d3-a456-426614174000',
        urgencyAssessment: 'maintain',
        responseAction: 'responding',
        // Missing estimatedResponseTime
      });
      expect(result.success).toBe(false);
    });

    it('should require delegateTo for delegating action', () => {
      const result = AcknowledgeAlertSchema.safeParse({
        alertId: '123e4567-e89b-12d3-a456-426614174000',
        urgencyAssessment: 'increase',
        responseAction: 'delegating',
        // Missing delegateTo
      });
      expect(result.success).toBe(false);
    });

    it('should validate correct delegation', () => {
      const result = AcknowledgeAlertSchema.safeParse({
        alertId: '123e4567-e89b-12d3-a456-426614174000',
        urgencyAssessment: 'increase',
        responseAction: 'delegating',
        delegateTo: '987e4567-e89b-12d3-a456-426614174000',
        notes: 'Delegating to Dr. Smith',
      });
      expect(result.success).toBe(true);
    });

    it('should validate monitoring action without extra fields', () => {
      const result = AcknowledgeAlertSchema.safeParse({
        alertId: '123e4567-e89b-12d3-a456-426614174000',
        urgencyAssessment: 'decrease',
        responseAction: 'monitoring',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid response times', () => {
      const invalidTimes = [0, -5, 1000, 0.5];
      invalidTimes.forEach(time => {
        const result = AcknowledgeAlertSchema.safeParse({
          alertId: '123e4567-e89b-12d3-a456-426614174000',
          urgencyAssessment: 'maintain',
          responseAction: 'responding',
          estimatedResponseTime: time,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('UpdateUserRoleSchema', () => {
    it('should validate medical role with required fields', () => {
      const result = UpdateUserRoleSchema.safeParse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'doctor',
        hospitalId: '987e4567-e89b-12d3-a456-426614174000',
        department: 'Emergency',
        licenseNumber: 'MD12345',
      });
      expect(result.success).toBe(true);
    });

    it('should validate non-medical role without license', () => {
      const result = UpdateUserRoleSchema.safeParse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'operator',
        hospitalId: '987e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject medical role without license', () => {
      const medicalRoles = ['doctor', 'nurse', 'head_doctor'];
      medicalRoles.forEach(role => {
        const result = UpdateUserRoleSchema.safeParse({
          userId: '123e4567-e89b-12d3-a456-426614174000',
          role,
          hospitalId: '987e4567-e89b-12d3-a456-426614174000',
          department: 'Emergency',
          // Missing licenseNumber
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject medical role without department', () => {
      const result = UpdateUserRoleSchema.safeParse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'nurse',
        hospitalId: '987e4567-e89b-12d3-a456-426614174000',
        licenseNumber: 'RN12345',
        // Missing department
      });
      expect(result.success).toBe(false);
    });

    it('should validate license number length', () => {
      const result = UpdateUserRoleSchema.safeParse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'doctor',
        hospitalId: '987e4567-e89b-12d3-a456-426614174000',
        department: 'ICU',
        licenseNumber: '123', // Too short
      });
      expect(result.success).toBe(false);
    });
  });

  describe('HealthcareProfileSchema', () => {
    it('should validate complete profile', () => {
      const result = HealthcareProfileSchema.safeParse({
        hospitalId: '123e4567-e89b-12d3-a456-426614174000',
        licenseNumber: 'MD12345',
        department: 'Emergency',
        specialization: 'Trauma Surgery',
        isOnDuty: true,
      });
      expect(result.success).toBe(true);
    });

    it('should validate profile without optional fields', () => {
      const result = HealthcareProfileSchema.safeParse({
        hospitalId: '123e4567-e89b-12d3-a456-426614174000',
        licenseNumber: 'RN98765',
        department: 'ICU',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isOnDuty).toBe(false); // Default value
      }
    });

    it('should validate license number format', () => {
      const validLicenses = ['MD12345', 'RN98765', 'NP2468', '12345ABC'];
      validLicenses.forEach(license => {
        const result = HealthcareProfileSchema.safeParse({
          hospitalId: '123e4567-e89b-12d3-a456-426614174000',
          licenseNumber: license,
          department: 'Emergency',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid license formats', () => {
      const invalidLicenses = ['MD-12345', 'RN 98765', 'license!', ''];
      invalidLicenses.forEach(license => {
        const result = HealthcareProfileSchema.safeParse({
          hospitalId: '123e4567-e89b-12d3-a456-426614174000',
          licenseNumber: license,
          department: 'Emergency',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject department names that are too short', () => {
      const result = HealthcareProfileSchema.safeParse({
        hospitalId: '123e4567-e89b-12d3-a456-426614174000',
        licenseNumber: 'MD12345',
        department: 'A', // Too short
      });
      expect(result.success).toBe(false);
    });

    it('should reject specialization that is too long', () => {
      const result = HealthcareProfileSchema.safeParse({
        hospitalId: '123e4567-e89b-12d3-a456-426614174000',
        licenseNumber: 'MD12345',
        department: 'Surgery',
        specialization: 'S'.repeat(101), // Too long
      });
      expect(result.success).toBe(false);
    });
  });
});