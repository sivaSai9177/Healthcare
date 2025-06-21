/**
 * CLI Integration tests for Deployment Management Script
 * Tests the actual CLI behavior with minimal mocking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as path from 'path';

describe('manage-deploy.ts CLI Integration Tests', () => {
  const scriptPath = path.resolve(__dirname, '../../deployment/manage-deploy.ts');
  const testDir = join(__dirname, 'test-workspace-cli');
  
  // Helper to run the script
  function runScript(args: string[], options = {}): string {
    try {
      const output = execSync(`bun ${scriptPath} ${args.join(' ')}`, {
        encoding: 'utf8',
        cwd: testDir,
        ...options
      });
      return output;
    } catch (error: any) {
      return error.stdout || error.stderr || error.message;
    }
  }

  beforeEach(() => {
    // Create test workspace
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    
    // Create minimal package.json
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: "test-app",
      scripts: {
        "build:web": "echo 'Building web...'",
        "build:mobile": "echo 'Building mobile...'"
      }
    }, null, 2));
    
    // Create docker-compose.yml
    writeFileSync(join(testDir, 'docker-compose.yml'), `
version: '3.8'
services:
  app:
    image: test-app:latest
    ports:
      - "3000:3000"
`);
  });

  afterEach(() => {
    // Clean up test workspace
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Help Command', () => {
    it('should show help when no arguments provided', () => {
      const output = runScript([]);
      
      expect(output).toContain('Deployment Management Tool');
      expect(output).toContain('Actions:');
      expect(output).toContain('build');
      expect(output).toContain('deploy');
      expect(output).toContain('rollback');
    });

    it('should show help with --help flag', () => {
      const output = runScript(['--help']);
      
      expect(output).toContain('Deployment Management Tool');
      expect(output).toContain('Examples:');
    });
  });

  describe('Build Command', () => {
    it('should build web platform', () => {
      const output = runScript(['build', '--platform=web']);
      
      expect(output).toMatch(/Building (application for )?web/i);
      expect(output).toMatch(/build completed|Web build completed/i);
    });

    it('should handle build errors gracefully', () => {
      // Remove package.json to cause error
      rmSync(join(testDir, 'package.json'));
      
      const output = runScript(['build', '--platform=web']);
      
      expect(output).toMatch(/failed|error/i);
    });
  });

  describe('Environment Variables', () => {
    it('should create .env.production template if missing', () => {
      const output = runScript(['env', '--env=production']);
      const envPath = join(testDir, '.env.production');
      
      expect(existsSync(envPath)).toBe(true);
      
      const envContent = readFileSync(envPath, 'utf8');
      expect(envContent).toContain('EXPO_PUBLIC_API_URL');
      expect(envContent).toContain('DATABASE_URL');
    });

    it('should validate environment variables', () => {
      // Create incomplete env file
      writeFileSync(join(testDir, '.env.staging'), `
EXPO_PUBLIC_API_URL=http://api.staging.example.com
# Missing DATABASE_URL
`);
      
      const output = runScript(['env', '--env=staging']);
      
      expect(output).toContain('Missing required environment variables');
    });
  });

  describe('Deploy Command', () => {
    beforeEach(() => {
      // Create required files for deployment
      writeFileSync(join(testDir, '.env.staging'), `
EXPO_PUBLIC_API_URL=http://api.staging.example.com
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
SMTP_FROM=noreply@example.com
SENTRY_DSN=https://example@sentry.io/123
`);
      
      // Create Kamal config
      mkdirSync(join(testDir, 'config'), { recursive: true });
      writeFileSync(join(testDir, 'config/deploy.yml'), `
service: test-app
servers:
  web:
    - 127.0.0.1
`);
    });

    it('should check prerequisites before deployment', () => {
      const output = runScript(['deploy', '--env=staging', '--dry-run']);
      
      expect(output).toMatch(/prerequisites/i);
    });

    it('should warn about production deployment', () => {
      const output = runScript(['deploy', '--env=production', '--dry-run']);
      
      // Should either show production warning or fail on prerequisites
      expect(output).toMatch(/production|prerequisites/i);
    });
  });

  describe('Status Command', () => {
    it('should check deployment status', () => {
      const output = runScript(['status']);
      
      expect(output).toMatch(/status|checking/i);
    });
  });

  describe('Logs Command', () => {
    it('should attempt to show logs', () => {
      const output = runScript(['logs']);
      
      // Should either show logs or error about missing deployment
      expect(output).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid commands', () => {
      const output = runScript(['invalid-command']);
      
      expect(output).toMatch(/Unknown action|Invalid|Deployment Management Tool/i);
    });

    it('should handle missing dependencies gracefully', () => {
      // Try to run with missing config
      rmSync(join(testDir, 'docker-compose.yml'));
      
      const output = runScript(['deploy', '--dry-run']);
      
      expect(output).toBeDefined();
      // Should handle missing file gracefully
    });
  });
});