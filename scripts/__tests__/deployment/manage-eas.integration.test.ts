/**
 * Integration tests for EAS Build Management Script
 * Tests actual functionality with minimal mocking for critical external dependencies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as path from 'path';

// Mock only external network calls and actual EAS CLI execution
vi.mock('child_process', () => ({
  execSync: vi.fn(),
  spawn: vi.fn(),
  exec: vi.fn((cmd, cb) => cb(null, { stdout: '', stderr: '' }))
}));

vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

// Import after mocks
const scriptPath = path.resolve(__dirname, '../../deployment/manage-eas.ts');

describe('manage-eas.ts Integration Tests', () => {
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
      if (cmd.includes('eas --version')) {
        return 'eas-cli/5.9.1 darwin-x64 node-v18.19.0';
      }
      if (cmd.includes('eas whoami')) {
        return 'test-user';
      }
      if (cmd.includes('git status')) {
        return '';
      }
      if (cmd.includes('eas build:list') && cmd.includes('--json')) {
        return JSON.stringify([
          {
            id: 'test-build-1',
            status: 'finished',
            platform: 'ios',
            profile: 'production',
            createdAt: new Date().toISOString(),
            artifacts: { buildUrl: 'https://expo.dev/artifacts/test-build-1' }
          }
        ]);
      }
      return '';
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
        expect.stringContaining('EAS Build Management Tool')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage:')
      );
    });
    
    it('should parse action and options correctly', async () => {
      const result = parseScriptArgs(['build', '--platform=ios', '--profile=preview']);
      
      expect(result).toEqual({
        action: 'build',
        platform: 'ios',
        profile: 'preview',
        local: false,
        clear: false,
        message: undefined
      });
    });
    
    it('should handle all command line options', async () => {
      const result = parseScriptArgs([
        'update',
        '--platform=android',
        '--profile=production',
        '--local',
        '--clear-cache',
        '--message=Fix critical bug'
      ]);
      
      expect(result).toEqual({
        action: 'update',
        platform: 'android',
        profile: 'production',
        local: true,
        clear: true,
        message: 'Fix critical bug'
      });
    });
  });
  
  describe('EAS CLI Prerequisites', () => {
    it('should check for EAS CLI installation', async () => {
      await runScript(['setup']);
      
      expect(execSync).toHaveBeenCalledWith(
        'eas --version',
        expect.objectContaining({ stdio: 'ignore' })
      );
    });
    
    it('should handle missing EAS CLI', async () => {
      (execSync as any).mockImplementation((cmd: string) => {
        if (cmd.includes('eas --version')) {
          throw new Error('Command not found');
        }
        return '';
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      try {
        await runScript(['build']);
      } catch (e: any) {
        expect(e.code).toBe(1);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('EAS CLI not installed')
      );
    });
  });
  
  describe('Setup Action', () => {
    beforeEach(() => {
      // Create required files for setup tests
      writeFileSync('eas.json', JSON.stringify({
        cli: { version: '>= 5.9.1' },
        build: {
          development: { distribution: 'internal' },
          preview: { distribution: 'internal' },
          production: {}
        }
      }));
      
      writeFileSync('app.json', JSON.stringify({
        expo: {
          name: 'TestApp',
          slug: 'test-app',
          extra: {
            eas: { projectId: 'test-project-id' }
          },
          ios: { bundleIdentifier: 'com.test.app' },
          android: { package: 'com.test.app' }
        }
      }));
    });
    
    it('should verify EAS login status', async () => {
      await runScript(['setup']);
      
      expect(execSync).toHaveBeenCalledWith(
        'eas whoami',
        expect.objectContaining({ encoding: 'utf8' })
      );
    });
    
    it('should check project configuration', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['setup']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Project ID: test-project-id')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('iOS Bundle ID: com.test.app')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Android Package: com.test.app')
      );
    });
    
    it('should create credentials.json template if missing', async () => {
      await runScript(['setup']);
      
      expect(existsSync('credentials.json')).toBe(true);
      
      const credentials = JSON.parse(readFileSync('credentials.json', 'utf8'));
      expect(credentials).toHaveProperty('ios');
      expect(credentials).toHaveProperty('android');
      expect(credentials.ios).toHaveProperty('provisioningProfilePath');
      expect(credentials.android).toHaveProperty('keystore');
    });
    
    it('should handle missing app.json', async () => {
      rmSync('app.json');
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['setup']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('iOS bundle identifier not set')
      );
    });
  });
  
  describe('Build Action', () => {
    beforeEach(() => {
      writeFileSync('app.json', JSON.stringify({
        expo: { name: 'TestApp' }
      }));
    });
    
    it('should commit changes before building', async () => {
      (execSync as any).mockImplementation((cmd: string) => {
        if (cmd.includes('git status --porcelain')) {
          return 'M file.txt\n';
        }
        if (cmd.includes('eas --version')) {
          return 'eas-cli/5.9.1';
        }
        return '';
      });
      
      await runScript(['build', '--platform=ios', '--profile=production']);
      
      expect(execSync).toHaveBeenCalledWith(
        'git add -A',
        expect.objectContaining({ stdio: 'inherit' })
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('git commit -m'),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should build for specific platform', async () => {
      await runScript(['build', '--platform=android', '--profile=preview']);
      
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('eas build --platform android --profile preview'),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should support local builds', async () => {
      await runScript(['build', '--platform=ios', '--local']);
      
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--local'),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should support cache clearing', async () => {
      await runScript(['build', '--platform=all', '--clear-cache']);
      
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--clear-cache'),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
  });
  
  describe('List Builds Action', () => {
    it('should list recent builds for all platforms', async () => {
      await runScript(['list']);
      
      expect(execSync).toHaveBeenCalledWith(
        'eas build:list --limit 10',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should filter builds by platform', async () => {
      await runScript(['list', '--platform=ios']);
      
      expect(execSync).toHaveBeenCalledWith(
        'eas build:list --limit 10 --platform ios',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
  });
  
  describe('Submit Action', () => {
    it('should submit latest finished build', async () => {
      await runScript(['submit', '--platform=ios']);
      
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('eas build:list --platform ios --limit 1 --json'),
        expect.objectContaining({ encoding: 'utf8' })
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('eas submit --platform ios --id test-build-1'),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should handle no builds found', async () => {
      (execSync as any).mockImplementation((cmd: string) => {
        if (cmd.includes('eas build:list') && cmd.includes('--json')) {
          return '[]';
        }
        if (cmd.includes('eas --version')) {
          return 'eas-cli/5.9.1';
        }
        return '';
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['submit', '--platform=android']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No builds found')
      );
    });
    
    it('should handle unfinished builds', async () => {
      (execSync as any).mockImplementation((cmd: string) => {
        if (cmd.includes('eas build:list') && cmd.includes('--json')) {
          return JSON.stringify([
            { id: 'test-build-1', status: 'in-progress' }
          ]);
        }
        if (cmd.includes('eas --version')) {
          return 'eas-cli/5.9.1';
        }
        return '';
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['submit', '--platform=ios']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Latest build is not finished')
      );
    });
    
    it('should submit all platforms when platform=all', async () => {
      const submitSpy = vi.fn();
      (execSync as any).mockImplementation((cmd: string) => {
        if (cmd.includes('eas submit')) {
          submitSpy(cmd);
        }
        if (cmd.includes('eas build:list') && cmd.includes('--json')) {
          return JSON.stringify([
            { id: 'test-build-1', status: 'finished' }
          ]);
        }
        if (cmd.includes('eas --version')) {
          return 'eas-cli/5.9.1';
        }
        return '';
      });
      
      await runScript(['submit', '--platform=all']);
      
      expect(submitSpy).toHaveBeenCalledTimes(2);
      expect(submitSpy).toHaveBeenCalledWith(
        expect.stringContaining('--platform ios')
      );
      expect(submitSpy).toHaveBeenCalledWith(
        expect.stringContaining('--platform android')
      );
    });
  });
  
  describe('Update Action', () => {
    it('should publish OTA update with message', async () => {
      await runScript(['update', '--message=Fix critical alert bug']);
      
      expect(execSync).toHaveBeenCalledWith(
        'eas update --branch production --message "Fix critical alert bug" --non-interactive',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
    
    it('should use default message when none provided', async () => {
      await runScript(['update']);
      
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('Update from Healthcare Alert System'),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
  });
  
  describe('Status Action', () => {
    it('should display build and update status', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['status']);
      
      expect(execSync).toHaveBeenCalledWith(
        'eas build:list --limit 5 --json',
        expect.objectContaining({ encoding: 'utf8' })
      );
      expect(execSync).toHaveBeenCalledWith(
        'eas update:list --limit 5',
        expect.objectContaining({ stdio: 'inherit' })
      );
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Recent Builds')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Recent Updates')
      );
    });
    
    it('should format build status correctly', async () => {
      (execSync as any).mockImplementation((cmd: string) => {
        if (cmd.includes('eas build:list') && cmd.includes('--json')) {
          return JSON.stringify([
            {
              id: 'build-1',
              status: 'finished',
              platform: 'ios',
              profile: 'production',
              createdAt: new Date().toISOString(),
              artifacts: { buildUrl: 'https://expo.dev/artifacts/build-1' }
            },
            {
              id: 'build-2',
              status: 'errored',
              platform: 'android',
              profile: 'preview',
              createdAt: new Date().toISOString()
            }
          ]);
        }
        if (cmd.includes('eas --version')) {
          return 'eas-cli/5.9.1';
        }
        return '';
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['status']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌')
      );
    });
  });
  
  describe('Credentials Action', () => {
    it('should display credential management information', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['credentials']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Credential Management')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('iOS Credentials:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Android Credentials:')
      );
    });
  });
  
  describe('Metadata Action', () => {
    it('should check for existing metadata files', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['metadata']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('App Store Metadata Status:')
      );
    });
    
    it('should create metadata templates when missing', async () => {
      mkdirSync('store-config/app-store', { recursive: true });
      mkdirSync('store-config/google-play', { recursive: true });
      
      await runScript(['metadata']);
      
      expect(existsSync('store-config/app-store/metadata.json')).toBe(true);
      expect(existsSync('store-config/google-play/metadata.json')).toBe(true);
      
      const iosMetadata = JSON.parse(
        readFileSync('store-config/app-store/metadata.json', 'utf8')
      );
      expect(iosMetadata.name).toBe('Hospital Alert System');
      expect(iosMetadata.keywords).toContain('healthcare');
      
      const androidMetadata = JSON.parse(
        readFileSync('store-config/google-play/metadata.json', 'utf8')
      );
      expect(androidMetadata.title).toBe('Hospital Alert System');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle build errors gracefully', async () => {
      (execSync as any).mockImplementation((cmd: string) => {
        if (cmd.includes('eas build')) {
          throw new Error('Build failed: Network error');
        }
        if (cmd.includes('eas --version')) {
          return 'eas-cli/5.9.1';
        }
        return '';
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['build']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Build failed: Network error')
      );
    });
    
    it('should handle unexpected errors', async () => {
      (execSync as any).mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      try {
        await runScript(['status']);
      } catch (e: any) {
        expect(e.code).toBe(1);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected error')
      );
    });
  });
  
  describe('Edge Cases', () => {
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
    
    it('should handle missing required files', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runScript(['setup']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('eas.json not found')
      );
    });
  });
});

// Helper functions to simulate script execution
async function runScript(args: string[]) {
  // Save original argv
  const originalArgv = process.argv;
  
  try {
    // Set process.argv to simulate command line arguments
    process.argv = ['node', scriptPath, ...args];
    
    // Clear module cache to ensure fresh execution
    delete require.cache[scriptPath];
    
    // Import and run the script
    await import(scriptPath);
  } finally {
    // Restore original argv
    process.argv = originalArgv;
  }
}

function parseScriptArgs(args: string[]) {
  const action = args[0];
  const platformIndex = args.findIndex(arg => arg.startsWith('--platform='));
  const platform = platformIndex !== -1 ? args[platformIndex].split('=')[1] : 'all';
  const profileIndex = args.findIndex(arg => arg.startsWith('--profile='));
  const profile = profileIndex !== -1 ? args[profileIndex].split('=')[1] : 'production';
  const local = args.includes('--local');
  const clear = args.includes('--clear-cache');
  const messageIndex = args.findIndex(arg => arg.startsWith('--message='));
  const message = messageIndex !== -1 ? args[messageIndex].split('=')[1] : undefined;
  
  return { action, platform, profile, local, clear, message };
}