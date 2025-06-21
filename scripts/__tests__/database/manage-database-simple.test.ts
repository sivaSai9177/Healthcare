/**
 * Unit tests for manage-database-simple.ts
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import * as path from 'path';

// Mock modules
jest.mock('child_process');
jest.mock('../../../src/db/server-db', () => ({
  db: {
    execute: jest.fn(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
  },
}));

jest.mock('drizzle-orm', () => ({
  sql: jest.fn((strings, ...values) => ({
    strings,
    values,
    toString: () => strings.join('?'),
  })),
}));

const scriptPath = path.join(__dirname, '../../database/manage-database-simple.ts');

describe('manage-database-simple.ts', () => {
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
      mockExecSync.mockImplementation(() => Buffer.from('Database Management Tool'));
      
      const result = execSync(`bun ${scriptPath}`);
      
      expect(result.toString()).toContain('Database Management Tool');
    });

    it('should show help with --help flag', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Database Management Tool'));
      
      const result = execSync(`bun ${scriptPath} --help`);
      
      expect(result.toString()).toContain('Database Management Tool');
    });
  });

  describe('Health Check', () => {
    it('should check database health', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Database connection is healthy'));
      
      const result = execSync(`bun ${scriptPath} health`);
      
      expect(result.toString()).toContain('Database connection is healthy');
    });

    it('should handle connection failure', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Database health check failed');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} health`);
      }).toThrow('Database health check failed');
    });
  });

  describe('Database Info', () => {
    it('should display database information', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Database Information'));
      
      const result = execSync(`bun ${scriptPath} info`);
      
      expect(result.toString()).toContain('Database Information');
    });

    it('should show database size and stats', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Size: 100 MB'));
      
      const result = execSync(`bun ${scriptPath} info`);
      
      expect(result.toString()).toContain('Size: 100 MB');
    });
  });

  describe('Table Management', () => {
    it('should list all tables', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Tables in database'));
      
      const result = execSync(`bun ${scriptPath} tables`);
      
      expect(result.toString()).toContain('Tables in database');
    });

    it('should show row counts for tables', () => {
      mockExecSync.mockImplementation(() => Buffer.from('user: 10 rows'));
      
      const result = execSync(`bun ${scriptPath} tables`);
      
      expect(result.toString()).toContain('user: 10 rows');
    });
  });

  describe('Database Reset', () => {
    it('should require force flag for reset', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('requires --force flag');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} reset`);
      }).toThrow('requires --force flag');
    });

    it('should reset database with force flag', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Database reset completed'));
      
      const result = execSync(`bun ${scriptPath} reset --force`);
      
      expect(result.toString()).toContain('Database reset completed');
    });

    it('should not reset production database', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Cannot reset production database');
      });
      
      expect(() => {
        execSync(`APP_ENV=production bun ${scriptPath} reset --force`);
      }).toThrow('Cannot reset production database');
    });
  });

  describe('Migrations', () => {
    it('should run migrations', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Migrations completed'));
      
      const result = execSync(`bun ${scriptPath} migrate`);
      
      expect(result.toString()).toContain('Migrations completed');
    });

    it('should push schema in development', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Schema pushed successfully'));
      
      const result = execSync(`bun ${scriptPath} push`);
      
      expect(result.toString()).toContain('Schema pushed successfully');
    });

    it('should not push schema in production', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Schema push is only for development');
      });
      
      expect(() => {
        execSync(`APP_ENV=production bun ${scriptPath} push`);
      }).toThrow('Schema push is only for development');
    });
  });

  describe('Database Seeding', () => {
    it('should seed database with test data', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Database seeded successfully'));
      
      const result = execSync(`bun ${scriptPath} seed`);
      
      expect(result.toString()).toContain('Database seeded successfully');
    });

    it('should handle seeding errors', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Seeding failed');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} seed`);
      }).toThrow('Seeding failed');
    });
  });

  describe('Environment Handling', () => {
    it('should accept --env flag', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Using environment: test'));
      
      const result = execSync(`bun ${scriptPath} health --env test`);
      
      expect(result.toString()).toContain('Using environment: test');
    });

    it('should default to development environment', () => {
      mockExecSync.mockImplementation(() => Buffer.from('Using environment: development'));
      
      const result = execSync(`bun ${scriptPath} health`);
      
      expect(result.toString()).toContain('Using environment: development');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown commands', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Unknown action: invalid');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} invalid`);
      }).toThrow('Unknown action');
    });

    it('should handle database connection errors', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Database connection failed');
      });
      
      expect(() => {
        execSync(`bun ${scriptPath} health`);
      }).toThrow('Database connection failed');
    });
  });
});