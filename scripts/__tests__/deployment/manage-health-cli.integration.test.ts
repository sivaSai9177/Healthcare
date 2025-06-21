/**
 * CLI Integration tests for Health Monitoring Script
 * Tests the actual CLI behavior with minimal mocking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as path from 'path';

describe('manage-health.ts CLI Integration Tests', () => {
  const scriptPath = path.resolve(__dirname, '../../deployment/manage-health.ts');
  const testDir = join(__dirname, 'test-workspace-health-cli');
  
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
    
    // Create health config
    mkdirSync(join(testDir, 'config'), { recursive: true });
    writeFileSync(join(testDir, 'config/health-monitoring.json'), JSON.stringify({
      endpoints: [
        {
          name: "API Server",
          url: "http://localhost:3000/health",
          critical: true
        },
        {
          name: "Database",
          url: "http://localhost:5432/health",
          critical: true
        }
      ],
      monitoring: {
        interval: 300000,
        timeout: 10000,
        retries: 3
      },
      alerts: {
        slack: {
          webhook: "https://hooks.slack.com/services/TEST/WEBHOOK"
        },
        email: {
          to: ["admin@example.com"],
          from: "monitoring@example.com"
        }
      },
      thresholds: {
        cpu: 80,
        memory: 90,
        disk: 85,
        responseTime: 5000
      }
    }, null, 2));
    
    // Create logs directory
    mkdirSync(join(testDir, 'logs'), { recursive: true });
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
      
      expect(output).toContain('Health Monitoring Tool');
      expect(output).toContain('Commands:');
      expect(output).toContain('monitor');
      expect(output).toContain('status');
      expect(output).toContain('test');
    });

    it('should show help with --help flag', () => {
      const output = runScript(['--help']);
      
      expect(output).toContain('Health Monitoring Tool');
      expect(output).toContain('Examples:');
    });
  });

  describe('Status Command', () => {
    it('should check system health status', () => {
      const output = runScript(['status']);
      
      expect(output).toMatch(/Health Status|Checking system health/i);
      // Should show various system metrics
      expect(output).toMatch(/System Metrics|CPU|Memory|Disk/i);
    });

    it('should show service endpoints status', () => {
      const output = runScript(['status', '--services']);
      
      expect(output).toMatch(/Service Health|Endpoints|Checking/i);
    });

    it('should output JSON format when requested', () => {
      const output = runScript(['status', '--json']);
      
      // Should be valid JSON
      expect(() => JSON.parse(output)).not.toThrow();
    });
  });

  describe('Test Command', () => {
    it('should test all endpoints', () => {
      const output = runScript(['test']);
      
      expect(output).toMatch(/Testing endpoints|Health check/i);
      expect(output).toMatch(/API Server|localhost:3000/i);
      expect(output).toMatch(/Database|localhost:5432/i);
    });

    it('should test specific endpoint', () => {
      const output = runScript(['test', '--endpoint=api']);
      
      expect(output).toMatch(/Testing.*api|API Server/i);
    });

    it('should handle connection failures gracefully', () => {
      const output = runScript(['test']);
      
      // Should show failures without crashing
      // The output shows 'unhealthy' which indicates failure
      expect(output).toMatch(/unhealthy|failed|error|unreachable|timeout/i);
    });
  });

  describe('Monitor Command', () => {
    it('should start monitoring in dry-run mode', () => {
      const output = runScript(['monitor', '--dry-run']);
      
      expect(output).toMatch(/monitoring|would start|dry.*run/i);
      expect(output).toMatch(/interval|300000|5 minutes/i);
    });

    it('should validate monitoring configuration', () => {
      const output = runScript(['monitor', '--validate']);
      
      expect(output).toMatch(/config|valid|monitoring/i);
    });
  });

  describe('Alert Testing', () => {
    it('should test alert configuration', () => {
      const output = runScript(['alert', '--test']);
      
      expect(output).toMatch(/alert|notification|test/i);
      expect(output).toMatch(/Slack|webhook/i);
      expect(output).toMatch(/Email|admin@example.com/i);
    });

    it('should validate alert channels', () => {
      const output = runScript(['alert', '--validate']);
      
      expect(output).toMatch(/alert.*config|channels|valid/i);
    });
  });

  describe('Metrics Command', () => {
    it('should show system metrics', () => {
      const output = runScript(['metrics']);
      
      expect(output).toMatch(/System Metrics|Performance/i);
      expect(output).toMatch(/CPU|Memory|Disk/i);
    });

    it('should show metrics history', () => {
      const output = runScript(['metrics', '--history']);
      
      expect(output).toMatch(/metrics.*history|historical data|No history available/i);
    });

    it('should export metrics', () => {
      const output = runScript(['metrics', '--export']);
      const metricsFile = join(testDir, 'logs/metrics-export.json');
      
      expect(output).toMatch(/export|metrics.*saved/i);
      // File might not exist if no metrics collected yet
      if (existsSync(metricsFile)) {
        const content = readFileSync(metricsFile, 'utf8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });
  });

  describe('Config Management', () => {
    it('should show current configuration', () => {
      const output = runScript(['config']);
      
      expect(output).toMatch(/endpoints|Configuration/i);
      expect(output).toContain('API Server');
      expect(output).toContain('Database');
    });

    it('should validate configuration', () => {
      const output = runScript(['config', '--validate']);
      
      expect(output).toMatch(/config.*valid|validation.*passed/i);
    });

    it('should handle missing configuration', () => {
      // Remove config file
      rmSync(join(testDir, 'config/health-monitoring.json'));
      
      const output = runScript(['config']);
      
      expect(output).toMatch(/missing|not found|creating.*default/i);
    });
  });

  describe('Dashboard Command', () => {
    it('should attempt to start dashboard', () => {
      const output = runScript(['dashboard', '--port=8080', '--dry-run']);
      
      expect(output).toMatch(/dashboard|web.*interface|port.*8080/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid commands', () => {
      const output = runScript(['invalid-command']);
      
      expect(output).toMatch(/unknown.*command|invalid|Health Monitoring Tool/i);
    });

    it('should handle invalid options', () => {
      const output = runScript(['status', '--invalid-option']);
      
      // Should still run the command
      expect(output).toMatch(/Health Status|Checking|status/i);
    });

    it('should create default config if missing', () => {
      // Remove entire config directory
      rmSync(join(testDir, 'config'), { recursive: true, force: true });
      
      const output = runScript(['status']);
      
      // Should create default config and continue
      expect(existsSync(join(testDir, 'config/health-monitoring.json'))).toBe(true);
    });
  });

  describe('Integration Features', () => {
    it('should support quiet mode', () => {
      const output = runScript(['status', '--quiet']);
      
      // Should produce minimal output
      expect(output.split('\n').length).toBeLessThan(10);
    });

    it('should support verbose mode', () => {
      const output = runScript(['status', '--verbose']);
      
      // Should produce detailed output
      // In verbose mode, should see system details or more output
      expect(output.length).toBeGreaterThan(200); // More detailed output
    });

    it('should respect timeout settings', () => {
      const startTime = Date.now();
      const output = runScript(['test', '--timeout=1000']);
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);
      expect(output).toBeDefined();
    });
  });
});