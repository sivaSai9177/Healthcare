/**
 * Integration tests for Deployment Management Script
 * Tests actual functionality with minimal mocking for critical external dependencies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as path from 'path';
// @ts-ignore
import fetch from 'node-fetch';

// Mock only external dependencies
vi.mock('child_process', () => ({
  execSync: vi.fn(),
  spawn: vi.fn(() => ({
    kill: vi.fn(),
    on: vi.fn(),
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() }
  })),
  exec: vi.fn((_cmd: string, cb: Function) => cb(null, { stdout: '', stderr: '' }))
}));

vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

// Import after mocks
const scriptPath = path.resolve(__dirname, '../../deployment/manage-deploy.ts');

describe('manage-deploy.ts Integration Tests', () => {
  const originalEnv = process.env;
  const testDir = join(__dirname, 'test-workspace');
  const originalCwd = process.cwd();
  
  beforeEach(() => {
    // Create test workspace
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    process.chdir(testDir);
    
    // Reset environment
    process.env = { ...originalEnv };
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Setup default mock responses
    (execSync as any).mockImplementation((cmd: string) => {
      if (cmd.includes('docker --version')) {
        return 'Docker version 24.0.6';
      }
      if (cmd.includes('kamal version')) {
        return 'Kamal 1.3.0';
      }
      if (cmd.includes('eas --version')) {
        return 'eas-cli/5.9.1';
      }
      if (cmd.includes('expo --version')) {
        return '49.0.0';
      }
      if (cmd.includes('git status')) {
        return '';
      }
      if (cmd.includes('kamal app details')) {
        return 'App: healthcare-app\nService: web\nVersion: latest';
      }
      return '';
    });
    
    // Mock fetch responses
    (fetch as any).mockImplementation(async (url: string) => {
      if (url.includes('/api/health')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok', timestamp: Date.now() })
        };
      }
      return {
        ok: true,
        status: 200,
        text: async () => '<html>Healthcare App</html>'
      };
    });
  });
  
  afterEach(() => {
    // Restore original directory
    process.chdir(originalCwd);
    
    // Clean up test workspace
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    
    // Restore environment
    process.env = originalEnv;
  });
  
  describe('CLI Argument Parsing', () => {
    it('should show help when no arguments provided', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      try {
        await runScript([]);
      } catch (e: any) {
        expect(e.code).toBe(0);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Deployment Management Tool')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage:')
      );
    });
    
    it('should parse all command options correctly', async () => {
      const result = parseScriptArgs([
        'deploy',
        '--env=production',
        '--platform=web',
        '--force',
        '--follow'
      ]);
      
      expect(result).toEqual({
        action: 'deploy',
        environment: 'production',
        platform: 'web',
        force: true,
        follow: true
      });
    });
    
    it('should use default values for optional parameters', async () => {
      const result = parseScriptArgs(['build']);
      
      expect(result).toEqual({
        action: 'build',
        environment: 'staging',
        platform: 'all',
        force: false,
        follow: false
      });
    });
  });
  
  describe('Prerequisites Check', () => {
    it('should check all required tools', async () => {
      await runScript(['deploy']);
      
      expect(execSync).toHaveBeenCalledWith('docker --version', { stdio: 'ignore' });
      expect(execSync).toHaveBeenCalledWith('kamal version', { stdio: 'ignore' });
      expect(execSync).toHaveBeenCalledWith('eas --version', { stdio: 'ignore' });
      expect(execSync).toHaveBeenCalledWith('expo --version', { stdio: 'ignore' });
    });
    
    it('should warn about missing prerequisites', async () => {
      (execSync as any).mockImplementation((cmd: string) => {
        if (cmd.includes('kamal')) {
          throw new Error('Command not found');
        }
        return '';
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      try {
        await runScript(['deploy']);
      } catch (e: any) {
        expect(e.code).toBe(1);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing prerequisites')
      );
    });
    
    it('should allow skipping prerequisites with --force', async () => {
      (execSync as any).mockImplementation((cmd: string) => {
        if (cmd.includes('kamal version')) {
          throw new Error('Command not found');
        }
        // Return success for other commands to continue execution
        return '';
      });
      
      await runScript(['status', '--force']);
      
      // Should continue execution despite missing prerequisites
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('kamal app'),
        expect.any(Object)
      );
    });
  });
  
  describe('Build Action', () => {
    it('should build web platform', async () => {
      await runScript(['build', '--platform=web']);
      
      expect(execSync).toHaveBeenCalledWith(
        'npm run build:web',
        expect.objectContaining({ stdio: 'inherit' })
      );
      expect(execSync).toHaveBeenCalledWith(
        'docker build -t healthcare-app:latest -f Dockerfile.production .',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should build iOS platform with EAS', async () => {
      await runScript(['build', '--platform=ios']);
      
      expect(execSync).toHaveBeenCalledWith(
        'eas build --platform ios --profile production',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should build Android platform with EAS', async () => {
      await runScript(['build', '--platform=android']);
      
      expect(execSync).toHaveBeenCalledWith(
        'eas build --platform android --profile production',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should build all platforms when platform=all', async () => {
      await runScript(['build', '--platform=all']);
      
      expect(execSync).toHaveBeenCalledWith(
        'npm run build:web',
        expect.objectContaining({ stdio: 'inherit' })
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('eas build --platform ios'),
        expect.objectContaining({ stdio: 'inherit' })
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('eas build --platform android'),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
  });
  
  describe('Deploy Action', () => {
    beforeEach(() => {
      // Create test environment files
      writeFileSync('.env.staging', `
DATABASE_URL=postgres://test:test@localhost:5432/test_staging
REDIS_URL=redis://localhost:6379
BETTER_AUTH_SECRET=test-secret
      `);
      
      mkdirSync('.kamal', { recursive: true });
      writeFileSync('.kamal/secrets', 'export KAMAL_REGISTRY_PASSWORD=test');
    });
    
    it('should warn before production deployment', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const timeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return {} as any;
      });
      
      await runScript(['deploy', '--env=production']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: Deploying to PRODUCTION!')
      );
      expect(timeoutSpy).toHaveBeenCalled();
    });
    
    it('should skip production warning with --force', async () => {
      const timeoutSpy = vi.spyOn(global, 'setTimeout');
      
      await runScript(['deploy', '--env=production', '--force']);
      
      expect(timeoutSpy).not.toHaveBeenCalled();
    });
    
    it('should load staging environment correctly', async () => {
      await runScript(['deploy', '--env=staging']);
      
      expect(process.env.DATABASE_URL).toBe('postgres://test:test@localhost:5432/test_staging');
      expect(process.env.REDIS_URL).toBe('redis://localhost:6379');
      expect(process.env.BETTER_AUTH_SECRET).toBe('test-secret');
    });
    
    it('should run pre-deploy checks', async () => {
      await runScript(['deploy', '--env=staging']);
      
      expect(execSync).toHaveBeenCalledWith(
        'bun scripts/monitoring/manage-health.ts check',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should build and deploy Docker image', async () => {
      await runScript(['deploy', '--env=staging']);
      
      expect(execSync).toHaveBeenCalledWith(
        'docker build -t healthcare-alerts/app:staging -f Dockerfile.production .',
        expect.objectContaining({ stdio: 'inherit' })
      );
      expect(execSync).toHaveBeenCalledWith(
        'kamal deploy -d staging',
        expect.objectContaining({ stdio: 'inherit', shell: '/bin/bash' })
      );
    });
    
    it('should verify deployment after completion', async () => {
      await runScript(['deploy', '--env=staging']);
      
      expect(fetch).toHaveBeenCalledWith('https://staging.healthcare-app.com/api/health');
      expect(fetch).toHaveBeenCalledWith('https://staging.healthcare-app.com');
    });
    
    it('should create Kamal config if missing', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['deploy', '--env=development']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Kamal config not found')
      );
      expect(existsSync('config/deploy.development.yml')).toBe(true);
    });
  });
  
  describe('Rollback Action', () => {
    it('should execute Kamal rollback', async () => {
      await runScript(['rollback', '--env=production']);
      
      expect(execSync).toHaveBeenCalledWith(
        'kamal rollback -c config/deploy.production.yml',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should handle rollback errors', async () => {
      (execSync as any).mockImplementation((cmd: string) => {
        if (cmd.includes('kamal rollback')) {
          throw new Error('Rollback failed');
        }
        return '';
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      try {
        await runScript(['rollback', '--env=staging']);
      } catch (e: any) {
        expect(e.code).toBe(1);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rollback failed')
      );
    });
  });
  
  describe('Status Action', () => {
    it('should check Kamal and container status', async () => {
      await runScript(['status']);
      
      expect(execSync).toHaveBeenCalledWith(
        'kamal app details',
        expect.objectContaining({ stdio: 'inherit' })
      );
      expect(execSync).toHaveBeenCalledWith(
        'kamal app containers',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should check all environment health', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['status']);
      
      expect(fetch).toHaveBeenCalledWith('https://healthcare-app.com/api/health');
      expect(fetch).toHaveBeenCalledWith('https://staging.healthcare-app.com/api/health');
      expect(fetch).toHaveBeenCalledWith('https://dev.healthcare-app.com/api/health');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Healthy')
      );
    });
    
    it('should handle unhealthy environments', async () => {
      (fetch as any).mockImplementation(async (url: string) => {
        if (url.includes('staging')) {
          throw new Error('Connection refused');
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok' })
        };
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['status']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Unhealthy')
      );
    });
  });
  
  describe('Logs Action', () => {
    it('should show recent logs', async () => {
      await runScript(['logs']);
      
      expect(execSync).toHaveBeenCalledWith(
        'kamal app logs --lines 100',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should follow logs with --follow flag', async () => {
      const spawnMock = spawn as any;
      
      await runScript(['logs', '--follow']);
      
      expect(spawnMock).toHaveBeenCalledWith(
        'kamal',
        ['app', 'logs', '-f'],
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should handle SIGINT when following logs', async () => {
      const killMock = vi.fn();
      const onMock = vi.fn((event, handler) => {
        if (event === 'SIGINT') {
          handler(); // Simulate SIGINT
        }
      });
      
      (spawn as any).mockReturnValue({
        kill: killMock,
        on: vi.fn(),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() }
      });
      
      const processOnSpy = vi.spyOn(process, 'on').mockImplementation(onMock as any);
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exit');
      });
      
      try {
        await runScript(['logs', '--follow']);
      } catch (e: any) {
        expect(e.message).toBe('Process exit');
      }
      
      expect(killMock).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
      
      processOnSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
  
  describe('Environment Variables Management', () => {
    it('should create environment template if missing', async () => {
      await runScript(['env', '--env=production']);
      
      expect(existsSync('.env.production')).toBe(true);
      
      const envContent = readFileSync('.env.production', 'utf8');
      expect(envContent).toContain('DATABASE_URL=');
      expect(envContent).toContain('REDIS_URL=');
      expect(envContent).toContain('BETTER_AUTH_SECRET=');
      expect(envContent).toContain('EXPO_PUBLIC_API_URL=');
    });
    
    it('should validate required environment variables', async () => {
      writeFileSync('.env.staging', `
DATABASE_URL=postgres://test:test@localhost:5432/test
REDIS_URL=
BETTER_AUTH_SECRET=secret
EXPO_PUBLIC_API_URL=https://staging.healthcare-app.com
      `);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['env', '--env=staging']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing required environment variables: REDIS_URL')
      );
    });
    
    it('should push valid environment variables to Kamal', async () => {
      writeFileSync('.env.development', `
DATABASE_URL=postgres://test:test@localhost:5432/test
REDIS_URL=redis://localhost:6379
BETTER_AUTH_SECRET=secret
EXPO_PUBLIC_API_URL=https://dev.healthcare-app.com
      `);
      
      await runScript(['env', '--env=development']);
      
      expect(execSync).toHaveBeenCalledWith(
        'kamal env push -c config/deploy.development.yml',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
  });
  
  describe('EAS Integration', () => {
    it('should delegate to manage-eas.ts script', async () => {
      await runScript(['eas', '--platform=ios']);
      
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('manage-eas.ts status'),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should display EAS build options', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['eas']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('EAS Build Options:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Start new build:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Submit to stores:')
      );
    });
  });
  
  describe('Preview Deployment', () => {
    it('should build and submit preview', async () => {
      await runScript(['preview']);
      
      expect(execSync).toHaveBeenCalledWith(
        'eas build --profile preview --platform all',
        expect.objectContaining({ stdio: 'inherit' })
      );
      expect(execSync).toHaveBeenCalledWith(
        'eas build:wait',
        expect.objectContaining({ stdio: 'inherit' })
      );
      expect(execSync).toHaveBeenCalledWith(
        'eas submit --profile preview',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should display preview URLs', async () => {
      await runScript(['preview']);
      
      expect(execSync).toHaveBeenCalledWith(
        'eas build:list --platform all --limit 1',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
  });
  
  describe('Error Handling', () => {
    it('should offer rollback on deployment failure', async () => {
      const readlineMock = {
        question: vi.fn((_prompt: string, cb: Function) => cb('y')),
        close: vi.fn()
      };
      
      vi.doMock('readline', () => ({
        createInterface: () => readlineMock
      }));
      
      (execSync as any).mockImplementation((cmd: string) => {
        if (cmd.includes('kamal deploy')) {
          throw new Error('Deployment failed');
        }
        if (cmd.includes('kamal rollback')) {
          return 'Rollback successful';
        }
        return '';
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['deploy', '--env=staging']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Would you like to rollback?')
      );
      expect(readlineMock.question).toHaveBeenCalled();
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('kamal rollback'),
        expect.any(Object)
      );
    });
    
    it('should handle network errors during verification', async () => {
      (fetch as any).mockImplementation(async () => {
        throw new Error('Network error');
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['deploy', '--env=staging']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Deployment verification failed')
      );
    });
    
    it('should handle invalid actions', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      try {
        await runScript(['invalid-action']);
      } catch (e: any) {
        expect(e.code).toBe(1);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown action: invalid-action')
      );
    });
  });
  
  describe('Complex Scenarios', () => {
    it('should handle full deployment workflow', async () => {
      // Build
      await runScript(['build', '--platform=web']);
      
      // Deploy
      await runScript(['deploy', '--env=staging', '--force']);
      
      // Verify
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('npm run build:web'),
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('docker build'),
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('kamal deploy'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('staging.healthcare-app.com')
      );
    });
    
    it('should handle multi-environment status check', async () => {
      // Mock different responses for each environment
      (fetch as any).mockImplementation(async (url: string) => {
        if (url.includes('production')) {
          return { ok: true, status: 200, json: async () => ({ status: 'ok' }) };
        }
        if (url.includes('staging')) {
          return { ok: false, status: 500, json: async () => ({ error: 'Server error' }) };
        }
        if (url.includes('dev')) {
          throw new Error('Connection timeout');
        }
        return { ok: true, status: 200 };
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['status']);
      
      // Check that each environment was tested
      expect(fetch).toHaveBeenCalledTimes(6); // 3 environments x 2 endpoints each
      
      // Verify mixed health statuses
      const logCalls = consoleSpy.mock.calls.map(call => call[0]);
      const healthyCount = logCalls.filter(log => log.includes('✅ Healthy')).length;
      const unhealthyCount = logCalls.filter(log => log.includes('❌ Unhealthy')).length;
      
      expect(healthyCount).toBeGreaterThan(0);
      expect(unhealthyCount).toBeGreaterThan(0);
    });
  });
});

// Helper functions to simulate script execution
async function runScript(args: string[]) {
  const originalArgv = process.argv;
  
  try {
    process.argv = ['node', scriptPath, ...args];
    delete require.cache[scriptPath];
    await import(scriptPath);
  } finally {
    process.argv = originalArgv;
  }
}

function parseScriptArgs(args: string[]) {
  const action = args[0];
  const envIndex = args.findIndex(arg => arg.startsWith('--env='));
  const environment = envIndex !== -1 ? args[envIndex].split('=')[1] : 'staging';
  const platformIndex = args.findIndex(arg => arg.startsWith('--platform='));
  const platform = platformIndex !== -1 ? args[platformIndex].split('=')[1] : 'all';
  const force = args.includes('--force') || args.includes('-f');
  const follow = args.includes('--follow');
  
  return { action, environment, platform, force, follow };
}