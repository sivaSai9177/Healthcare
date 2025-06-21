import { z } from 'zod';
import {
  UserIdSchema,
  UserRoleSchema,
  UserPermissionSchema,
  UserStatusSchema,
  BaseUserSchema,
  SignInInputSchema,
  SignUpInputSchema,
  CompleteProfileInputSchema,
  PaginationSchema,
  SearchFilterSchema,
  ListUsersInputSchema,
  UpdateUserRoleInputSchema,
  AnalyticsInputSchema,
  TwoFactorCodeSchema,
  validateUserRole,
  validateEmail,
  validateUUID,
  canUserAccessRole,
  validateUserPermission,
} from '@/lib/validations/server';

describe('Server Validations', () => {
  describe('UserIdSchema', () => {
    it('validates UUID format', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      expect(() => UserIdSchema.parse(validUUID)).not.toThrow();
    });

    it('validates Better Auth nanoid format (32 chars)', () => {
      const validNanoId = 'abcdef1234567890ABCDEF1234567890';
      expect(() => UserIdSchema.parse(validNanoId)).not.toThrow();
    });

    it('rejects invalid ID formats', () => {
      expect(() => UserIdSchema.parse('invalid-id')).toThrow('Invalid ID format');
      expect(() => UserIdSchema.parse('123')).toThrow();
      expect(() => UserIdSchema.parse('')).toThrow();
    });
  });

  describe('UserRoleSchema', () => {
    it('validates all valid roles', () => {
      const validRoles = ['admin', 'manager', 'user', 'guest', 'operator', 'nurse', 'doctor', 'head_doctor'];
      validRoles.forEach(role => {
        expect(() => UserRoleSchema.parse(role)).not.toThrow();
      });
    });

    it('rejects invalid roles', () => {
      expect(() => UserRoleSchema.parse('superuser')).toThrow();
      expect(() => UserRoleSchema.parse('invalid')).toThrow();
      expect(() => UserRoleSchema.parse('')).toThrow();
    });
  });

  describe('UserPermissionSchema', () => {
    it('validates all valid permissions', () => {
      const validPermissions = [
        '*',
        'manage_users',
        'view_analytics',
        'manage_content',
        'view_content',
        'edit_profile',
        'view_team',
        'view_reports',
        'manage_approvals',
        'manage_schedule'
      ];
      validPermissions.forEach(permission => {
        expect(() => UserPermissionSchema.parse(permission)).not.toThrow();
      });
    });

    it('rejects invalid permissions', () => {
      expect(() => UserPermissionSchema.parse('delete_everything')).toThrow();
      expect(() => UserPermissionSchema.parse('')).toThrow();
    });
  });

  describe('SignInInputSchema', () => {
    it('validates valid sign-in input', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(() => SignInInputSchema.parse(validInput)).not.toThrow();
    });

    it('normalizes email to lowercase', () => {
      const input = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      };
      const result = SignInInputSchema.parse(input);
      expect(result.email).toBe('test@example.com');
    });

    it('rejects invalid emails', () => {
      const invalidInputs = [
        { email: 'notanemail', password: 'password123' },
        { email: 'test+alias@example.com', password: 'password123' }, // No aliases
        { email: 'test@', password: 'password123' }, // Invalid domain
      ];
      
      invalidInputs.forEach(input => {
        expect(() => SignInInputSchema.parse(input)).toThrow();
      });
    });

    it('validates password requirements', () => {
      expect(() => SignInInputSchema.parse({
        email: 'test@example.com',
        password: '', // Empty password
      })).toThrow('Password is required');

      expect(() => SignInInputSchema.parse({
        email: 'test@example.com',
        password: 'a'.repeat(1001), // Too long
      })).toThrow('Password too long');

      expect(() => SignInInputSchema.parse({
        email: 'test@example.com',
        password: 'pass\x00word', // Null character
      })).toThrow('Invalid characters in password');
    });

    it('validates optional device info', () => {
      const inputWithDevice = {
        email: 'test@example.com',
        password: 'password123',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
          platform: 'ios' as const,
        },
      };
      expect(() => SignInInputSchema.parse(inputWithDevice)).not.toThrow();
    });
  });

  describe('SignUpInputSchema', () => {
    it('validates valid sign-up input', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
        acceptTerms: true,
        acceptPrivacy: true,
      };
      expect(() => SignUpInputSchema.parse(validInput)).not.toThrow();
    });

    it('enforces strong password requirements', () => {
      const weakPasswords = [
        'short', // Too short
        'nouppercase123!', // No uppercase
        'NOLOWERCASE123!', // No lowercase
        'NoNumbers!', // No numbers
        'NoSpecialChar123', // No special characters
      ];

      weakPasswords.forEach(password => {
        expect(() => SignUpInputSchema.parse({
          email: 'test@example.com',
          password,
          name: 'John Doe',
          acceptTerms: true,
          acceptPrivacy: true,
        })).toThrow();
      });
    });

    it('prevents password from containing email', () => {
      expect(() => SignUpInputSchema.parse({
        email: 'test@example.com',
        password: 'Test123!test', // Contains 'test' from email
        name: 'John Doe',
        acceptTerms: true,
        acceptPrivacy: true,
      })).toThrow('Password cannot contain your email address');
    });

    it('requires organization for managers and admins', () => {
      expect(() => SignUpInputSchema.parse({
        email: 'manager@example.com',
        password: 'SecurePass123!',
        name: 'Manager User',
        role: 'manager',
        acceptTerms: true,
        acceptPrivacy: true,
      })).toThrow('Organization name is required for managers and admins');

      // Should pass with organization
      expect(() => SignUpInputSchema.parse({
        email: 'manager@example.com',
        password: 'SecurePass123!',
        name: 'Manager User',
        role: 'manager',
        organizationName: 'Test Hospital',
        acceptTerms: true,
        acceptPrivacy: true,
      })).not.toThrow();
    });

    it('validates organization code format', () => {
      expect(() => SignUpInputSchema.parse({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
        organizationCode: 'abc', // Too short
        acceptTerms: true,
        acceptPrivacy: true,
      })).toThrow();

      expect(() => SignUpInputSchema.parse({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
        organizationCode: 'TEST123', // Valid
        acceptTerms: true,
        acceptPrivacy: true,
      })).not.toThrow();
    });
  });

  describe('CompleteProfileInputSchema', () => {
    it('validates basic profile completion', () => {
      const validInput = {
        name: 'John Doe',
        role: 'user' as const,
        acceptTerms: true,
        acceptPrivacy: true,
      };
      expect(() => CompleteProfileInputSchema.parse(validInput)).not.toThrow();
    });

    it('requires hospital for healthcare roles', () => {
      const healthcareRoles = ['doctor', 'nurse', 'head_doctor', 'operator'];
      
      healthcareRoles.forEach(role => {
        expect(() => CompleteProfileInputSchema.parse({
          name: 'Healthcare Professional',
          role,
          acceptTerms: true,
          acceptPrivacy: true,
        })).toThrow('Hospital selection is required for healthcare roles');

        expect(() => CompleteProfileInputSchema.parse({
          name: 'Healthcare Professional',
          role,
          defaultHospitalId: '550e8400-e29b-41d4-a716-446655440000',
          acceptTerms: true,
          acceptPrivacy: true,
        })).not.toThrow();
      });
    });
  });

  describe('PaginationSchema', () => {
    it('validates pagination parameters', () => {
      expect(PaginationSchema.parse({})).toEqual({
        limit: 20,
        offset: 0,
      });

      expect(PaginationSchema.parse({ limit: 50, offset: 100 })).toEqual({
        limit: 50,
        offset: 100,
      });
    });

    it('enforces pagination limits', () => {
      expect(() => PaginationSchema.parse({ limit: 0 })).toThrow();
      expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
      expect(() => PaginationSchema.parse({ offset: -1 })).toThrow();
    });
  });

  describe('AnalyticsInputSchema', () => {
    it('validates analytics input', () => {
      const validInput = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        metric: 'users' as const,
        granularity: 'day' as const,
      };
      expect(() => AnalyticsInputSchema.parse(validInput)).not.toThrow();
    });

    it('ensures start date is before end date', () => {
      expect(() => AnalyticsInputSchema.parse({
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'),
      })).toThrow('Start date must be before end date');
    });
  });

  describe('TwoFactorCodeSchema', () => {
    it('validates 6-digit codes', () => {
      expect(() => TwoFactorCodeSchema.parse({ code: '123456' })).not.toThrow();
    });

    it('rejects invalid codes', () => {
      expect(() => TwoFactorCodeSchema.parse({ code: '12345' })).toThrow(); // Too short
      expect(() => TwoFactorCodeSchema.parse({ code: '1234567' })).toThrow(); // Too long
      expect(() => TwoFactorCodeSchema.parse({ code: 'abcdef' })).toThrow(); // Not numeric
      expect(() => TwoFactorCodeSchema.parse({ code: '12 456' })).toThrow(); // Contains space
    });
  });

  describe('Validation Utilities', () => {
    describe('validateUserRole', () => {
      it('validates and returns user role', () => {
        expect(validateUserRole('admin')).toBe('admin');
        expect(validateUserRole('nurse')).toBe('nurse');
        expect(() => validateUserRole('invalid')).toThrow();
      });
    });

    describe('validateEmail', () => {
      it('validates and returns email', () => {
        expect(validateEmail('test@example.com')).toBe('test@example.com');
        expect(() => validateEmail('invalid-email')).toThrow();
      });
    });

    describe('validateUUID', () => {
      it('validates and returns UUID', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        expect(validateUUID(uuid)).toBe(uuid);
        expect(() => validateUUID('not-a-uuid')).toThrow();
      });
    });

    describe('canUserAccessRole', () => {
      it('checks role hierarchy correctly', () => {
        // Admin can access all roles
        expect(canUserAccessRole('admin', 'manager')).toBe(true);
        expect(canUserAccessRole('admin', 'nurse')).toBe(true);
        
        // Manager can't access healthcare roles
        expect(canUserAccessRole('manager', 'doctor')).toBe(false);
        
        // Head doctor can access medical staff
        expect(canUserAccessRole('head_doctor', 'doctor')).toBe(true);
        expect(canUserAccessRole('head_doctor', 'nurse')).toBe(true);
        
        // Doctor can't access head doctor
        expect(canUserAccessRole('doctor', 'head_doctor')).toBe(false);
      });
    });

    describe('validateUserPermission', () => {
      it('validates permissions for roles', () => {
        // Admin has all permissions
        expect(validateUserPermission('admin', 'manage_users')).toBe(true);
        expect(validateUserPermission('admin', 'view_analytics')).toBe(true);
        
        // User has limited permissions
        expect(validateUserPermission('user', 'view_content')).toBe(true);
        expect(validateUserPermission('user', 'manage_users')).toBe(false);
        
        // Healthcare roles
        expect(validateUserPermission('head_doctor', 'manage_schedule')).toBe(true);
        expect(validateUserPermission('nurse', 'manage_users')).toBe(false);
      });
    });
  });
});