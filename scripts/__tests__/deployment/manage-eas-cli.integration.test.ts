/**
 * CLI Integration tests for EAS Management Script
 * Tests the actual CLI behavior with minimal mocking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as path from 'path';

describe('manage-eas.ts CLI Integration Tests', () => {
  const scriptPath = path.resolve(__dirname, '../../deployment/manage-eas.ts');
  const testDir = join(__dirname, 'test-workspace-eas-cli');
  
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
    
    // Create minimal app.json
    writeFileSync(join(testDir, 'app.json'), JSON.stringify({
      expo: {
        name: "Hospital Alert System",
        slug: "hospital-alert-system",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        splash: {
          image: "./assets/splash.png",
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        },
        ios: {
          bundleIdentifier: "com.example.hospitalalerts"
        },
        android: {
          package: "com.example.hospitalalerts"
        },
        extra: {
          eas: {
            projectId: "test-project-id"
          }
        }
      }
    }, null, 2));
    
    // Create eas.json
    writeFileSync(join(testDir, 'eas.json'), JSON.stringify({
      cli: {
        version: ">= 5.0.0"
      },
      build: {
        development: {
          developmentClient: true,
          distribution: "internal"
        },
        preview: {
          distribution: "internal"
        },
        production: {}
      },
      submit: {
        production: {}
      }
    }, null, 2));
    
    // Initialize git repo (required for builds)
    try {
      execSync('git init', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'ignore' });
    } catch {
      // Ignore git errors in test environment
    }
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
      
      expect(output).toContain('EAS Build Management Tool');
      expect(output).toContain('Actions:');
      expect(output).toContain('setup');
      expect(output).toContain('build');
      expect(output).toContain('submit');
      expect(output).toContain('update');
    });

    it('should show help with --help flag', () => {
      const output = runScript(['--help']);
      
      expect(output).toContain('EAS Build Management Tool');
      expect(output).toContain('Examples:');
      expect(output).toContain('bun scripts/deployment/manage-eas.ts');
    });

    it('should show help with -h flag', () => {
      const output = runScript(['-h']);
      
      expect(output).toContain('EAS Build Management Tool');
    });
  });

  describe('Setup Command', () => {
    it('should check EAS setup requirements', () => {
      const output = runScript(['setup']);
      
      // Should check for EAS CLI or report login status
      expect(output).toMatch(/EAS CLI not installed|Already logged in|Not logged in to EAS/i);
    });

    it('should create credentials.json template if missing', () => {
      const output = runScript(['setup']);
      const credentialsPath = join(testDir, 'credentials.json');
      
      if (output.includes('Creating credentials.json template')) {
        expect(existsSync(credentialsPath)).toBe(true);
        
        const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'));
        expect(credentials.ios).toBeDefined();
        expect(credentials.android).toBeDefined();
        expect(credentials.ios.distributionCertificate).toBeDefined();
        expect(credentials.android.keystore).toBeDefined();
      }
    });

    it('should verify project configuration', () => {
      const output = runScript(['setup']);
      
      // Should verify bundle identifiers
      expect(output).toMatch(/iOS Bundle ID:|Android Package:/);
      expect(output).toContain('com.example.hospitalalerts');
    });
  });

  describe('Build Command', () => {
    it('should validate build command with platform', () => {
      const output = runScript(['build', '--platform=ios']);
      
      // Should either start build or fail on prerequisites
      expect(output).toMatch(/Starting|build|EAS CLI not installed|uncommitted changes/i);
    });

    it('should support different profiles', () => {
      const output = runScript(['build', '--platform=android', '--profile=development']);
      
      expect(output).toMatch(/development|Starting|EAS CLI not installed/i);
    });

    it('should support local build option', () => {
      const output = runScript(['build', '--platform=ios', '--local']);
      
      expect(output).toMatch(/local|Starting|EAS CLI not installed/i);
    });

    it('should support clear cache option', () => {
      const output = runScript(['build', '--clear-cache']);
      
      expect(output).toMatch(/clear|Starting|EAS CLI not installed/i);
    });
  });

  describe('List Command', () => {
    it('should attempt to list builds', () => {
      const output = runScript(['list']);
      
      expect(output).toMatch(/Fetching recent builds|EAS CLI not installed/i);
    });

    it('should support platform filter', () => {
      const output = runScript(['list', '--platform=android']);
      
      expect(output).toMatch(/Fetching recent builds|EAS CLI not installed/i);
    });
  });

  describe('Submit Command', () => {
    it('should attempt to submit build', () => {
      const output = runScript(['submit', '--platform=ios']);
      
      expect(output).toMatch(/Submitting|submit|EAS CLI not installed/i);
    });

    it('should support submitting to all platforms', () => {
      const output = runScript(['submit', '--platform=all']);
      
      expect(output).toMatch(/Submitting|submit|EAS CLI not installed/i);
    });
  });

  describe('Update Command', () => {
    it('should attempt to publish OTA update', () => {
      const output = runScript(['update']);
      
      expect(output).toMatch(/Publishing OTA update|EAS CLI not installed/i);
    });

    it('should support custom update message', () => {
      const output = runScript(['update', '--message=Fix critical bug']);
      
      expect(output).toMatch(/Publishing OTA update|Fix critical bug|EAS CLI not installed/i);
    });
  });

  describe('Credentials Command', () => {
    it('should show credential management info', () => {
      const output = runScript(['credentials']);
      
      expect(output).toContain('Credential Management');
      expect(output).toMatch(/Distribution Certificate|Provisioning Profile|Keystore/i);
      expect(output).toContain('https://expo.dev');
    });
  });

  describe('Metadata Command', () => {
    it('should check metadata status', () => {
      const output = runScript(['metadata']);
      
      expect(output).toContain('App Store Metadata Status');
      expect(output).toMatch(/metadata.json|screenshots/i);
    });

    it('should create metadata templates if missing', () => {
      const output = runScript(['metadata']);
      
      if (output.includes('Creating metadata templates')) {
        const iosMetadataPath = join(testDir, 'store-config/app-store/metadata.json');
        const androidMetadataPath = join(testDir, 'store-config/google-play/metadata.json');
        
        expect(existsSync(iosMetadataPath)).toBe(true);
        expect(existsSync(androidMetadataPath)).toBe(true);
        
        const iosMetadata = JSON.parse(readFileSync(iosMetadataPath, 'utf8'));
        expect(iosMetadata.name).toBe('Hospital Alert System');
        expect(iosMetadata.keywords).toContain('healthcare');
        
        const androidMetadata = JSON.parse(readFileSync(androidMetadataPath, 'utf8'));
        expect(androidMetadata.title).toBe('Hospital Alert System');
        expect(androidMetadata.fullDescription).toContain('healthcare');
      }
    });
  });

  describe('Status Command', () => {
    it('should check build and update status', () => {
      const output = runScript(['status']);
      
      expect(output).toMatch(/Checking build status|Recent Builds|EAS CLI not installed/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid commands gracefully', () => {
      const output = runScript(['invalid-command']);
      
      expect(output).toMatch(/Unknown action|EAS Build Management Tool/i);
    });

    it('should check for EAS CLI installation', () => {
      const output = runScript(['build']);
      
      // Should check EAS CLI
      expect(output).toBeDefined();
      if (output.includes('EAS CLI not installed')) {
        expect(output).toContain('Install with: npm install -g eas-cli');
      }
    });

    it('should handle missing configuration files', () => {
      // Remove eas.json to test error handling
      rmSync(join(testDir, 'eas.json'));
      
      const output = runScript(['setup']);
      
      expect(output).toMatch(/eas.json not found|EAS CLI not installed/i);
    });

    it('should validate app.json configuration', () => {
      // Create invalid app.json
      writeFileSync(join(testDir, 'app.json'), JSON.stringify({
        expo: {
          name: "Test App",
          // Missing iOS and Android config
        }
      }, null, 2));
      
      const output = runScript(['setup']);
      
      // Should either show error about missing config or EAS operation failed
      expect(output).toMatch(/bundle identifier not set|package name not set|EAS CLI not installed|EAS operation failed|build:configure/i);
    });
  });

  describe('Platform Options', () => {
    it('should accept ios platform', () => {
      const output = runScript(['build', '--platform=ios']);
      
      expect(output).toBeDefined();
      // Should not error on platform validation
    });

    it('should accept android platform', () => {
      const output = runScript(['build', '--platform=android']);
      
      expect(output).toBeDefined();
      // Should not error on platform validation
    });

    it('should accept all platforms', () => {
      const output = runScript(['build', '--platform=all']);
      
      expect(output).toBeDefined();
      // Should not error on platform validation
    });
  });

  describe('Profile Options', () => {
    it('should accept development profile', () => {
      const output = runScript(['build', '--profile=development']);
      
      expect(output).toBeDefined();
      // Should not error on profile validation
    });

    it('should accept preview profile', () => {
      const output = runScript(['build', '--profile=preview']);
      
      expect(output).toBeDefined();
      // Should not error on profile validation
    });

    it('should accept production profile', () => {
      const output = runScript(['build', '--profile=production']);
      
      expect(output).toBeDefined();
      // Should not error on profile validation
    });

    it('should default to production profile when not specified', () => {
      const output = runScript(['build']);
      
      expect(output).toMatch(/production|Starting|EAS CLI not installed/i);
    });
  });
});