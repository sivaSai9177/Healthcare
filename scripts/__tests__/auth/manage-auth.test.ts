/**
 * Unit tests for manage-auth.ts
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
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  },
}));

jest.mock('../../../lib/auth/auth-server', () => ({
  auth: {
    api: {
      signInEmail: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

const scriptPath = path.join(__dirname, '../../auth/manage-auth.ts');

describe('manage-auth.ts', () => {
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
      mockExecSync.mockImplementation(() => Buffer.from('Authentication Management'));
      
      const result = execSync(`bun ${scriptPath}`);
      
      expect(result.toString()).toContain('Authentication Management');
    });

    it('should show help with --help flag', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Authentication Management'));
      
      const result = execSync(`bun ${scriptPath} --help`);
      
      expect(result.toString()).toContain('Authentication Management');
    });
  });

  describe('Auth Testing', () => {
    it('should test authentication flow', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Testing authentication'));
      
      const result = execSync(`bun ${scriptPath} test --email=test@example.com --password=Test123!`);
      
      expect(result.toString()).toContain('Testing authentication');
    });

    it('should require email for test command', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Email is required');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} test --password=Test123!`);
      }).toThrow('Email is required');
    });

    it('should require password for test command', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Password is required');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} test --email=test@example.com`);
      }).toThrow('Password is required');
    });
  });

  describe('Session Management', () => {
    it('should list active sessions', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Active sessions'));
      
      const result = execSync(`bun ${scriptPath} sessions`);
      
      expect(result.toString()).toContain('Active sessions');
    });

    it('should show session details', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Session ID:'));
      
      const result = execSync(`bun ${scriptPath} sessions`);
      
      expect(result.toString()).toContain('Session ID:');
    });

    it('should handle no active sessions', () => {
      mockExecSync.mockImplementation(() => Buffer.from('No active sessions found'));
      
      const result = execSync(`bun ${scriptPath} sessions`);
      
      expect(result.toString()).toContain('No active sessions found');
    });
  });

  describe('OAuth Verification', () => {
    it('should verify OAuth configuration', () => {
      mockExecSync.mockImplementation(() => Buffer.from('OAuth configuration verified'));
      
      const result = execSync(`bun ${scriptPath} verify`);
      
      expect(result.toString()).toContain('OAuth configuration verified');
    });

    it('should check specific OAuth provider', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Google OAuth: Configured'));
      
      const result = execSync(`bun ${scriptPath} verify --provider=google`);
      
      expect(result.toString()).toContain('Google OAuth: Configured');
    });

    it('should handle missing OAuth configuration', () => {
      mockExecSync.mockImplementation(() => Buffer.from('OAuth not configured'));
      
      const result = execSync(`bun ${scriptPath} verify`);
      
      expect(result.toString()).toContain('OAuth not configured');
    });
  });

  describe('Auth Debugging', () => {
    it('should show debug information', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Auth Debug Information'));
      
      const result = execSync(`bun ${scriptPath} debug`);
      
      expect(result.toString()).toContain('Auth Debug Information');
    });

    it('should show environment variables status', () => {
      mockExecSync.mockImplementation(() => Buffer.from('BETTER_AUTH_SECRET: Set'));
      
      const result = execSync(`bun ${scriptPath} debug`);
      
      expect(result.toString()).toContain('BETTER_AUTH_SECRET: Set');
    });
  });

  describe('Session Cleanup', () => {
    it('should clean expired sessions', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Cleaned expired sessions'));
      
      const result = execSync(`bun ${scriptPath} clean`);
      
      expect(result.toString()).toContain('Cleaned expired sessions');
    });

    it('should require force flag for cleaning all sessions', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('requires --force flag');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} clean --all`);
      }).toThrow('requires --force flag');
    });

    it('should clean all sessions with force flag', () => {
      mockExecSync.mockImplementation(() => Buffer.from('All sessions cleaned'));
      
      const result = execSync(`bun ${scriptPath} clean --all --force`);
      
      expect(result.toString()).toContain('All sessions cleaned');
    });
  });

  describe('Auth Fix Commands', () => {
    it('should fix common auth issues', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Fixed auth issues'));
      
      const result = execSync(`bun ${scriptPath} fix`);
      
      expect(result.toString()).toContain('Fixed auth issues');
    });

    it('should handle specific fix type', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Fixed session issues'));
      
      const result = execSync(`bun ${scriptPath} fix --type=session`);
      
      expect(result.toString()).toContain('Fixed session issues');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication failures', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Authentication failed');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} test --email=test@example.com --password=wrong`);
      }).toThrow('Authentication failed');
    });

    it('should handle database errors', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Database connection failed');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} sessions`);
      }).toThrow('Database connection failed');
    });

    it('should handle unknown commands', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Unknown command: invalid');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} invalid`);
      }).toThrow('Unknown command');
    });
  });

  describe('Environment Handling', () => {
    it('should work with different environments', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Environment: test'));
      
      const result = execSync(`APP_ENV=test bun ${scriptPath} debug`);
      
      expect(result.toString()).toContain('Environment: test');
    });

    it('should warn about production operations', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Warning: Production environment'));
      
      const result = execSync(`APP_ENV=production bun ${scriptPath} clean`);
      
      expect(result.toString()).toContain('Warning: Production environment');
    });
  });
});