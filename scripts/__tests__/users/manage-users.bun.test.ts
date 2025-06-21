/**
 * Bun-compatible tests for manage-users.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { execSync } from 'child_process';
import path from 'path';
import { testLogger } from '../../config/test-logger';

const scriptPath = path.join(__dirname, '../../users/manage-users.ts');
const testDbUrl = process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_test';

describe('manage-users.ts', () => {
  beforeEach(() => {
    // Clear test data if needed
  });

  afterEach(() => {
    // Cleanup
  });

  describe('CLI Commands', () => {
    it('should show help when no arguments provided', async () => {
      try {
        const output = execSync(`DATABASE_URL="${testDbUrl}" bun ${scriptPath} --help`, {
          encoding: 'utf8',
        });
        
        expect(output).toContain('Enhanced User Management');
        expect(output).toContain('Usage:');
        
        await testLogger.logTest('Show help', { status: 'pass' });
      } catch (error) {
        await testLogger.logTest('Show help', { status: 'fail', error });
        throw error;
      }
    });

    it('should list users', async () => {
      try {
        const output = execSync(`DATABASE_URL="${testDbUrl}" bun ${scriptPath} list`, {
          encoding: 'utf8',
        });
        
        expect(output).toContain('Listing all users');
        
        await testLogger.logTest('List users', { status: 'pass' });
      } catch (error) {
        await testLogger.logTest('List users', { status: 'fail', error });
        throw error;
      }
    });

    it('should validate email format on create', async () => {
      try {
        execSync(`DATABASE_URL="${testDbUrl}" bun ${scriptPath} create --email=invalid-email --password=Test123! --role=nurse`, {
          encoding: 'utf8',
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Invalid email');
        await testLogger.logTest('Validate email format', { status: 'pass' });
      }
    });

    it('should require password for create', async () => {
      try {
        execSync(`DATABASE_URL="${testDbUrl}" bun ${scriptPath} create --email=test@example.com --role=nurse`, {
          encoding: 'utf8',
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('password');
        await testLogger.logTest('Require password', { status: 'pass' });
      }
    });
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      
      try {
        const output = execSync(
          `DATABASE_URL="${testDbUrl}" bun ${scriptPath} create --email=${testEmail} --password=Test123! --role=nurse --name="Test User"`,
          { encoding: 'utf8' }
        );
        
        expect(output).toContain('Created user');
        expect(output).toContain(testEmail);
        
        await testLogger.logTest('Create user', { status: 'pass' });
        
        // Cleanup - delete the test user
        try {
          execSync(`DATABASE_URL="${testDbUrl}" bun ${scriptPath} delete ${testEmail} --force`, {
            encoding: 'utf8',
          });
        } catch (e) {
          // Ignore cleanup errors
        }
      } catch (error) {
        await testLogger.logTest('Create user', { status: 'fail', error });
        throw error;
      }
    });
  });

  describe('Batch Operations', () => {
    it('should run setup-demo command', async () => {
      try {
        const output = execSync(`DATABASE_URL="${testDbUrl}" bun ${scriptPath} setup-demo`, {
          encoding: 'utf8',
        });
        
        expect(output).toContain('Setting up demo users');
        
        await testLogger.logTest('Setup demo users', { status: 'pass' });
      } catch (error) {
        await testLogger.logTest('Setup demo users', { status: 'fail', error });
        throw error;
      }
    });
  });
});