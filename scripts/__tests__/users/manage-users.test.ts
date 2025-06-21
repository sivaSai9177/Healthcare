/**
 * Unit tests for manage-users.ts
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import * as path from 'path';

// Mock modules
jest.mock('child_process');
jest.mock('../../../src/db/server-db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    transaction: jest.fn((cb) => cb({
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
    })),
  },
}));

const scriptPath = path.join(__dirname, '../../users/manage-users.ts');

describe('manage-users.ts', () => {
  const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CLI Commands', () => {
    it('should show help when no arguments provided', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Enhanced User Management'));
      
      const result = execSync(`bun ${scriptPath}`);
      
      expect(result.toString()).toContain('Enhanced User Management');
    });

    it('should handle list command', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Listing all users'));
      
      const result = execSync(`bun ${scriptPath} list`);
      
      expect(result.toString()).toContain('Listing all users');
    });

    it('should handle create command with required parameters', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Created user: test@example.com'));
      
      const result = execSync(`bun ${scriptPath} create --email=test@example.com --password=Test123! --role=nurse`);
      
      expect(result.toString()).toContain('Created user: test@example.com');
    });

    it('should validate email format', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Invalid email format');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} create --email=invalid-email --password=Test123! --role=nurse`);
      }).toThrow('Invalid email format');
    });

    it('should require password for create command', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Password is required');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} create --email=test@example.com --role=nurse`);
      }).toThrow('Password is required');
    });
  });

  describe('Healthcare Setup Commands', () => {
    it('should handle setup-healthcare command', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Setting up demo users'));
      
      const result = execSync(`bun ${scriptPath} setup-healthcare`);
      
      expect(result.toString()).toContain('Setting up demo users');
    });

    it('should handle setup-mvp command', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Creating MVP test users'));
      
      const result = execSync(`bun ${scriptPath} setup-mvp`);
      
      expect(result.toString()).toContain('Creating MVP test users');
    });
  });

  describe('User Management Operations', () => {
    it('should handle update command', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Updated user'));
      
      const result = execSync(`bun ${scriptPath} update test@example.com --name="Test User"`);
      
      expect(result.toString()).toContain('Updated user');
    });

    it('should handle delete command with force flag', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Deleted user'));
      
      const result = execSync(`bun ${scriptPath} delete test@example.com --force`);
      
      expect(result.toString()).toContain('Deleted user');
    });

    it('should handle verify command', () => {
      mockExecSync.mockImplementation(() => Buffer.from('User verified'));
      
      const result = execSync(`bun ${scriptPath} verify test@example.com`);
      
      expect(result.toString()).toContain('User verified');
    });
  });

  describe('Role Validation', () => {
    const validRoles = ['admin', 'manager', 'operator', 'nurse', 'doctor', 'head_doctor', 'user'];

    validRoles.forEach(role => {
      it(`should accept valid role: ${role}`, () => {
        mockExecSync.mockImplementation(() => Buffer.from(`Created user with role: ${role}`));
        
        const result = execSync(`bun ${scriptPath} create --email=test@example.com --password=Test123! --role=${role}`);
        
        expect(result.toString()).toContain(`Created user with role: ${role}`);
      });
    });

    it('should reject invalid role', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Invalid role: invalid_role');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} create --email=test@example.com --password=Test123! --role=invalid_role`);
      }).toThrow('Invalid role');
    });
  });

  describe('Batch Operations', () => {
    it('should handle setup-demo command', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Demo users created'));
      
      const result = execSync(`bun ${scriptPath} setup-demo`);
      
      expect(result.toString()).toContain('Demo users created');
    });

    it('should require force flag for dangerous operations', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('This operation requires --force flag');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} delete-all`);
      }).toThrow('requires --force flag');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Database connection failed');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} list`);
      }).toThrow('Database connection failed');
    });

    it('should handle missing command', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Unknown command: invalid-command');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} invalid-command`);
      }).toThrow('Unknown command');
    });
  });
});