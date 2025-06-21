import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import {
  validateOptional,
  validateArray,
  validateEnum,
  trimAndLowercase,
  trimAndUppercase,
  trimAndTitleCase,
  startOfDay,
  endOfDay,
  emailSchema,
  phoneSchema,
  uuidSchema,
  dateStringSchema,
  paginationSchema,
} from '../../lib/validations/common';

describe('Validation Utilities', () => {
  describe('validateOptional', () => {
    it('should make schema optional with transform', () => {
      const schema = validateOptional(z.string());
      
      expect(schema.parse('')).toBeUndefined();
      expect(schema.parse('value')).toBe('value');
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse(null)).toBeUndefined();
    });

    it('should work with number schemas', () => {
      const schema = validateOptional(z.number());
      
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse(123)).toBe(123);
      expect(schema.parse(null)).toBeUndefined();
    });

    it('should maintain original validation', () => {
      const schema = validateOptional(z.string().email());
      
      expect(() => schema.parse('invalid-email')).toThrow();
      expect(schema.parse('test@example.com')).toBe('test@example.com');
    });
  });

  describe('validateArray', () => {
    it('should validate array of strings', () => {
      const schema = validateArray(z.string());
      
      expect(schema.parse(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
      expect(schema.parse([])).toEqual([]);
    });

    it('should validate array with complex schemas', () => {
      const schema = validateArray(z.object({
        id: z.number(),
        name: z.string(),
      }));
      
      const input = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      
      expect(schema.parse(input)).toEqual(input);
    });

    it('should reject invalid array items', () => {
      const schema = validateArray(z.number());
      
      expect(() => schema.parse(['not', 'numbers'])).toThrow();
      expect(() => schema.parse([1, 'two', 3])).toThrow();
    });

    it('should handle empty arrays', () => {
      const schema = validateArray(z.string()).min(1);
      
      expect(() => schema.parse([])).toThrow();
      expect(schema.parse(['item'])).toEqual(['item']);
    });
  });

  describe('validateEnum', () => {
    it('should validate enum values', () => {
      const StatusEnum = ['active', 'inactive', 'pending'] as const;
      const schema = validateEnum(StatusEnum);
      
      expect(schema.parse('active')).toBe('active');
      expect(schema.parse('inactive')).toBe('inactive');
      expect(schema.parse('pending')).toBe('pending');
    });

    it('should reject invalid enum values', () => {
      const StatusEnum = ['active', 'inactive'] as const;
      const schema = validateEnum(StatusEnum);
      
      expect(() => schema.parse('unknown')).toThrow();
      expect(() => schema.parse('')).toThrow();
      expect(() => schema.parse(null)).toThrow();
    });

    it('should work with numeric enums', () => {
      const PriorityEnum = [1, 2, 3] as const;
      const schema = validateEnum(PriorityEnum);
      
      expect(schema.parse(1)).toBe(1);
      expect(schema.parse(2)).toBe(2);
      expect(() => schema.parse(4)).toThrow();
    });
  });

  describe('String Transformers', () => {
    describe('trimAndLowercase', () => {
      it('should trim and lowercase strings', () => {
        expect(trimAndLowercase.parse('  HELLO WORLD  ')).toBe('hello world');
        expect(trimAndLowercase.parse('Test@Example.COM')).toBe('test@example.com');
        expect(trimAndLowercase.parse('   ')).toBe('');
      });

      it('should handle edge cases', () => {
        expect(trimAndLowercase.parse('')).toBe('');
        expect(trimAndLowercase.parse('already lowercase')).toBe('already lowercase');
        expect(trimAndLowercase.parse('MiXeD cAsE')).toBe('mixed case');
      });
    });

    describe('trimAndUppercase', () => {
      it('should trim and uppercase strings', () => {
        expect(trimAndUppercase.parse('  hello world  ')).toBe('HELLO WORLD');
        expect(trimAndUppercase.parse('Test123')).toBe('TEST123');
        expect(trimAndUppercase.parse('   ')).toBe('');
      });
    });

    describe('trimAndTitleCase', () => {
      it('should trim and convert to title case', () => {
        expect(trimAndTitleCase.parse('  hello world  ')).toBe('Hello World');
        expect(trimAndTitleCase.parse('the quick brown fox')).toBe('The Quick Brown Fox');
        expect(trimAndTitleCase.parse('   ')).toBe('');
      });

      it('should handle special cases', () => {
        expect(trimAndTitleCase.parse('firstName')).toBe('Firstname');
        expect(trimAndTitleCase.parse('TEST STRING')).toBe('Test String');
        expect(trimAndTitleCase.parse('a b c')).toBe('A B C');
      });

      it('should handle punctuation', () => {
        expect(trimAndTitleCase.parse("it's a test")).toBe("It's A Test");
        expect(trimAndTitleCase.parse('hello-world')).toBe('Hello-world');
      });
    });
  });

  describe('Date Utilities', () => {
    describe('startOfDay', () => {
      it('should return start of day', () => {
        const date = new Date('2024-12-19T15:30:45.123Z');
        const start = startOfDay(date);
        
        expect(start.getHours()).toBe(0);
        expect(start.getMinutes()).toBe(0);
        expect(start.getSeconds()).toBe(0);
        expect(start.getMilliseconds()).toBe(0);
        expect(start.toDateString()).toBe(date.toDateString());
      });

      it('should handle timezone correctly', () => {
        const date = new Date('2024-12-19T23:59:59.999Z');
        const start = startOfDay(date);
        
        expect(start.getHours()).toBe(0);
        expect(start.getMinutes()).toBe(0);
      });

      it('should create new date instance', () => {
        const original = new Date('2024-12-19T15:30:00Z');
        const start = startOfDay(original);
        
        expect(start).not.toBe(original);
        expect(original.getHours()).not.toBe(0);
      });
    });

    describe('endOfDay', () => {
      it('should return end of day', () => {
        const date = new Date('2024-12-19T15:30:45.123Z');
        const end = endOfDay(date);
        
        expect(end.getHours()).toBe(23);
        expect(end.getMinutes()).toBe(59);
        expect(end.getSeconds()).toBe(59);
        expect(end.getMilliseconds()).toBe(999);
        expect(end.toDateString()).toBe(date.toDateString());
      });

      it('should handle edge cases', () => {
        const date = new Date('2024-12-19T00:00:00.000Z');
        const end = endOfDay(date);
        
        expect(end.getHours()).toBe(23);
        expect(end.getMinutes()).toBe(59);
      });
    });
  });

  describe('Common Schemas', () => {
    describe('emailSchema', () => {
      it('should validate valid emails', () => {
        expect(emailSchema.parse('test@example.com')).toBe('test@example.com');
        expect(emailSchema.parse('user.name+tag@domain.co.uk')).toBe('user.name+tag@domain.co.uk');
        expect(emailSchema.parse('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      });

      it('should reject invalid emails', () => {
        expect(() => emailSchema.parse('invalid')).toThrow();
        expect(() => emailSchema.parse('@example.com')).toThrow();
        expect(() => emailSchema.parse('test@')).toThrow();
        expect(() => emailSchema.parse('test @example.com')).toThrow();
      });

      it('should transform to lowercase', () => {
        expect(emailSchema.parse('Test@Example.COM')).toBe('test@example.com');
        expect(emailSchema.parse('ADMIN@HOSPITAL.ORG')).toBe('admin@hospital.org');
      });
    });

    describe('phoneSchema', () => {
      it('should validate phone numbers', () => {
        expect(() => phoneSchema.parse('1234567890')).not.toThrow();
        expect(() => phoneSchema.parse('+1-555-123-4567')).not.toThrow();
        expect(() => phoneSchema.parse('(555) 123-4567')).not.toThrow();
      });

      it('should reject short numbers', () => {
        expect(() => phoneSchema.parse('123')).toThrow();
        expect(() => phoneSchema.parse('12345')).toThrow();
      });
    });

    describe('uuidSchema', () => {
      it('should validate valid UUIDs', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        expect(uuidSchema.parse(validUuid)).toBe(validUuid);
        
        const upperUuid = '123E4567-E89B-12D3-A456-426614174000';
        expect(uuidSchema.parse(upperUuid)).toBe(upperUuid.toLowerCase());
      });

      it('should reject invalid UUIDs', () => {
        expect(() => uuidSchema.parse('invalid-uuid')).toThrow();
        expect(() => uuidSchema.parse('123e4567-e89b-12d3-a456')).toThrow();
        expect(() => uuidSchema.parse('not-a-uuid-at-all')).toThrow();
      });
    });

    describe('dateStringSchema', () => {
      it('should validate ISO date strings', () => {
        expect(() => dateStringSchema.parse('2024-12-19')).not.toThrow();
        expect(() => dateStringSchema.parse('2024-12-19T15:30:00Z')).not.toThrow();
        expect(() => dateStringSchema.parse('2024-12-19T15:30:00.123Z')).not.toThrow();
      });

      it('should convert to Date object', () => {
        const result = dateStringSchema.parse('2024-12-19T15:30:00Z');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2024);
      });

      it('should reject invalid dates', () => {
        expect(() => dateStringSchema.parse('invalid-date')).toThrow();
        expect(() => dateStringSchema.parse('2024-13-01')).toThrow();
        expect(() => dateStringSchema.parse('2024-12-32')).toThrow();
      });
    });

    describe('paginationSchema', () => {
      it('should validate pagination params', () => {
        const result = paginationSchema.parse({ page: 2, limit: 20 });
        expect(result).toEqual({ page: 2, limit: 20 });
      });

      it('should use defaults', () => {
        const result = paginationSchema.parse({});
        expect(result).toEqual({ page: 1, limit: 10 });
      });

      it('should enforce minimum values', () => {
        const result = paginationSchema.parse({ page: 0, limit: -5 });
        expect(result.page).toBe(1);
        expect(result.limit).toBe(1);
      });

      it('should enforce maximum limit', () => {
        const result = paginationSchema.parse({ limit: 200 });
        expect(result.limit).toBe(100);
      });

      it('should handle string inputs', () => {
        const result = paginationSchema.parse({ page: '3', limit: '25' });
        expect(result).toEqual({ page: 3, limit: 25 });
      });
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should compose multiple validators', () => {
      const schema = z.object({
        email: emailSchema,
        phone: validateOptional(phoneSchema),
        status: validateEnum(['active', 'inactive'] as const),
        tags: validateArray(trimAndLowercase),
      });

      const result = schema.parse({
        email: '  TEST@EXAMPLE.COM  ',
        phone: '',
        status: 'active',
        tags: ['  TAG1  ', '  TAG2  '],
      });

      expect(result).toEqual({
        email: 'test@example.com',
        phone: undefined,
        status: 'active',
        tags: ['tag1', 'tag2'],
      });
    });

    it('should handle nested validations', () => {
      const userSchema = z.object({
        name: trimAndTitleCase,
        email: emailSchema,
        preferences: z.object({
          notifications: validateEnum(['email', 'sms', 'push'] as const),
          frequency: validateEnum(['immediate', 'daily', 'weekly'] as const),
        }),
      });

      const result = userSchema.parse({
        name: '  john doe  ',
        email: 'JOHN@EXAMPLE.COM',
        preferences: {
          notifications: 'email',
          frequency: 'daily',
        },
      });

      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });
  });
});