import { signInSchema, signUpSchema, organizationSchema, userUpdateSchema } from '@/lib/validations/server';
import { z } from 'zod';

describe('Auth Validation Flow Integration', () => {
  describe('Sign In Validation', () => {
    it('validates correct sign in data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      
      const result = signInSchema.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
        'double@@email.com',
      ];
      
      invalidEmails.forEach(email => {
        const result = signInSchema.safeParse({
          email,
          password: 'Password123!',
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('email');
      });
    });

    it('rejects empty password', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('password');
    });

    it('handles missing fields gracefully', () => {
      const result = signInSchema.safeParse({});
      
      expect(result.success).toBe(false);
      expect(result.error?.issues).toHaveLength(2); // email and password
    });
  });

  describe('Sign Up Validation', () => {
    it('validates correct sign up data', () => {
      const validData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
      };
      
      const result = signUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('enforces password strength requirements', () => {
      const weakPasswords = [
        { password: 'short', issue: 'too short' },
        { password: 'nouppercase123!', issue: 'no uppercase' },
        { password: 'NOLOWERCASE123!', issue: 'no lowercase' },
        { password: 'NoNumbers!', issue: 'no numbers' },
        { password: 'NoSpecialChars123', issue: 'no special chars' },
      ];
      
      weakPasswords.forEach(({ password, issue }) => {
        const result = signUpSchema.safeParse({
          email: 'test@example.com',
          password,
          name: 'Test User',
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('password');
      });
    });

    it('validates name requirements', () => {
      const invalidNames = [
        '', // empty
        'a', // too short
        'a'.repeat(101), // too long
        '123', // numbers only
        'Name@123', // special chars
      ];
      
      invalidNames.forEach(name => {
        const result = signUpSchema.safeParse({
          email: 'test@example.com',
          password: 'Password123!',
          name,
        });
        expect(result.success).toBe(false);
        if (name !== '') {
          expect(result.error?.issues[0].path).toContain('name');
        }
      });
    });

    it('accepts valid names with spaces', () => {
      const validNames = [
        'John Doe',
        'Mary Jane Smith',
        'Jean-Pierre',
        "O'Connor",
      ];
      
      validNames.forEach(name => {
        const result = signUpSchema.safeParse({
          email: 'test@example.com',
          password: 'Password123!',
          name,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Organization Validation', () => {
    it('validates correct organization data', () => {
      const validData = {
        name: 'Test Hospital',
        type: 'hospital' as const,
        address: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-123-4567',
        email: 'contact@hospital.com',
      };
      
      const result = organizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('validates organization types', () => {
      const validTypes = ['hospital', 'clinic', 'nursing_home', 'other'];
      
      validTypes.forEach(type => {
        const result = organizationSchema.safeParse({
          name: 'Test Org',
          type,
          address: '123 Main St',
          city: 'City',
          state: 'CA',
          zipCode: '12345',
          phone: '555-123-4567',
          email: 'test@org.com',
        });
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid organization types', () => {
      const result = organizationSchema.safeParse({
        name: 'Test Org',
        type: 'invalid_type',
        address: '123 Main St',
        city: 'City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-123-4567',
        email: 'test@org.com',
      });
      
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('type');
    });

    it('validates phone number formats', () => {
      const validPhones = [
        '555-123-4567',
        '(555) 123-4567',
        '5551234567',
        '+1-555-123-4567',
        '555.123.4567',
      ];
      
      validPhones.forEach(phone => {
        const result = organizationSchema.safeParse({
          name: 'Test Org',
          type: 'hospital',
          address: '123 Main St',
          city: 'City',
          state: 'CA',
          zipCode: '12345',
          phone,
          email: 'test@org.com',
        });
        expect(result.success).toBe(true);
      });
    });

    it('validates zip code formats', () => {
      const validZipCodes = ['12345', '12345-6789'];
      
      validZipCodes.forEach(zipCode => {
        const result = organizationSchema.safeParse({
          name: 'Test Org',
          type: 'hospital',
          address: '123 Main St',
          city: 'City',
          state: 'CA',
          zipCode,
          phone: '555-123-4567',
          email: 'test@org.com',
        });
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid zip codes', () => {
      const invalidZipCodes = ['1234', '123456', 'abcde', '12345-', '12345-67'];
      
      invalidZipCodes.forEach(zipCode => {
        const result = organizationSchema.safeParse({
          name: 'Test Org',
          type: 'hospital',
          address: '123 Main St',
          city: 'City',
          state: 'CA',
          zipCode,
          phone: '555-123-4567',
          email: 'test@org.com',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('User Update Validation', () => {
    it('validates partial user updates', () => {
      const updates = [
        { name: 'New Name' },
        { email: 'newemail@example.com' },
        { role: 'nurse' as const },
        { organizationId: 'org-123' },
        { name: 'New Name', role: 'doctor' as const },
      ];
      
      updates.forEach(update => {
        const result = userUpdateSchema.safeParse(update);
        expect(result.success).toBe(true);
      });
    });

    it('allows empty update object', () => {
      const result = userUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('validates role values', () => {
      const validRoles = ['admin', 'manager', 'operator', 'user', 'nurse', 'doctor', 'technician'];
      
      validRoles.forEach(role => {
        const result = userUpdateSchema.safeParse({ role });
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid roles', () => {
      const result = userUpdateSchema.safeParse({ role: 'invalid_role' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('role');
    });

    it('validates email in updates', () => {
      const result = userUpdateSchema.safeParse({ email: 'invalid-email' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('email');
    });

    it('validates UUID format for organizationId', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];
      
      validUUIDs.forEach(id => {
        const result = userUpdateSchema.safeParse({ organizationId: id });
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid UUID formats', () => {
      const invalidUUIDs = [
        '123',
        'not-a-uuid',
        '550e8400-e29b-41d4-a716-44665544000', // too short
        '550e8400-e29b-41d4-a716-4466554400000', // too long
        'g50e8400-e29b-41d4-a716-446655440000', // invalid character
      ];
      
      invalidUUIDs.forEach(id => {
        const result = userUpdateSchema.safeParse({ organizationId: id });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('handles internationalized email addresses', () => {
      const internationalEmails = [
        'user@example.co.uk',
        'user@subdomain.example.com',
        'user+tag@example.com',
        'user.name@example.com',
      ];
      
      internationalEmails.forEach(email => {
        const result = signInSchema.safeParse({
          email,
          password: 'Password123!',
        });
        expect(result.success).toBe(true);
      });
    });

    it('validates complex passwords', () => {
      const complexPasswords = [
        'P@ssw0rd!',
        'MySuper$ecure123',
        'Test!ng123456',
        'C0mpl3x!Pass#',
      ];
      
      complexPasswords.forEach(password => {
        const result = signUpSchema.safeParse({
          email: 'test@example.com',
          password,
          name: 'Test User',
        });
        expect(result.success).toBe(true);
      });
    });

    it('provides helpful error messages', () => {
      const result = signUpSchema.safeParse({
        email: 'invalid-email',
        password: 'weak',
        name: 'A',
      });
      
      expect(result.success).toBe(false);
      expect(result.error?.issues).toHaveLength(3);
      
      const issues = result.error?.issues || [];
      expect(issues.some(i => i.path.includes('email'))).toBe(true);
      expect(issues.some(i => i.path.includes('password'))).toBe(true);
      expect(issues.some(i => i.path.includes('name'))).toBe(true);
    });

    it('strips whitespace from inputs', () => {
      const result = signInSchema.safeParse({
        email: '  test@example.com  ',
        password: 'Password123!',
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
    });
  });
});