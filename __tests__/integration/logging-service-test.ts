/**
 * Integration tests for the logging service
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { spawn, type ChildProcess } from 'child_process';
import { waitFor } from '@testing-library/react-native';

describe('Logging Service Integration', () => {
  let loggingProcess: ChildProcess;
  const serviceUrl = 'http://localhost:3003';
  
  beforeAll(async () => {
    // Start the logging service
    loggingProcess = spawn('bun', ['run', 'src/server/logging/start-standalone.ts'], {
      env: {
        ...process.env,
        LOGGING_SERVICE_PORT: '3003',
        LOGGING_ALLOWED_ORIGINS: 'http://localhost:8081,http://localhost:3000',
        LOGGING_MAX_SIZE: '1000',
        LOGGING_RETENTION_MS: '3600000', // 1 hour for tests
      },
      detached: false,
    });

    // Wait for service to start
    await waitFor(async () => {
      try {
        const response = await fetch(`${serviceUrl}/health`);
        expect(response.ok).toBe(true);
      } catch {
        throw new Error('Service not ready');
      }
    }, { timeout: 10000 });
  });

  afterAll(() => {
    // Stop the logging service
    if (loggingProcess) {
      loggingProcess.kill();
    }
  });

  beforeEach(async () => {
    // Clear logs before each test by rotating
    // This is a workaround since we don't have a clear endpoint
    await fetch(`${serviceUrl}/stats`);
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await fetch(`${serviceUrl}/health`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.service).toBe('logging');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Single Log Endpoint', () => {
    it('should accept single log entry', async () => {
      const logEntry = {
        type: 'test',
        message: 'Test log entry',
        level: 'info',
        timestamp: new Date().toISOString(),
        metadata: { testId: 'test-123' },
      };

      const response = await fetch(`${serviceUrl}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle invalid log entry', async () => {
      const response = await fetch(`${serviceUrl}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      expect(response.status).toBe(500);
    });
  });

  describe('Batch Log Endpoint', () => {
    it('should accept batch of logs', async () => {
      const events = [
        {
          type: 'auth',
          message: 'User login',
          timestamp: new Date().toISOString(),
        },
        {
          type: 'api',
          message: 'API request',
          timestamp: new Date().toISOString(),
        },
        {
          type: 'healthcare',
          message: 'Alert created',
          timestamp: new Date().toISOString(),
        },
      ];

      const response = await fetch(`${serviceUrl}/log/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Batch-ID': 'test-batch-123',
          'X-Retry-Count': '0',
        },
        body: JSON.stringify({ events }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(3);
      expect(data.batchId).toBe('test-batch-123');
      expect(data.stats).toBeDefined();
    });

    it('should reject non-array events', async () => {
      const response = await fetch(`${serviceUrl}/log/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: 'not an array' }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Events must be an array');
    });
  });

  describe('Stats Endpoint', () => {
    it('should return logging statistics', async () => {
      // First, add some logs
      await fetch(`${serviceUrl}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          category: 'TEST',
          message: 'Test for stats',
          timestamp: new Date().toISOString(),
        }),
      });

      const response = await fetch(`${serviceUrl}/stats`);
      const stats = await response.json();
      
      expect(response.status).toBe(200);
      expect(stats.totalLogs).toBeGreaterThanOrEqual(1);
      expect(stats.categories).toBeDefined();
    });
  });

  describe('Query Logs Endpoint', () => {
    beforeEach(async () => {
      // Add test logs
      const categories = ['AUTH', 'API', 'HEALTHCARE'];
      for (const category of categories) {
        await fetch(`${serviceUrl}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'test',
            category,
            message: `Test log for ${category}`,
            timestamp: new Date().toISOString(),
          }),
        });
      }
    });

    it('should query all logs', async () => {
      const response = await fetch(`${serviceUrl}/logs?category=all&limit=10`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.logs).toBeDefined();
      expect(Array.isArray(data.logs)).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(3);
      expect(data.category).toBe('all');
    });

    it('should query logs by category', async () => {
      const response = await fetch(`${serviceUrl}/logs?category=AUTH&limit=10`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.logs).toBeDefined();
      expect(data.category).toBe('AUTH');
      
      // All logs should be from AUTH category
      for (const log of data.logs) {
        expect(log.category).toBe('AUTH');
      }
    });

    it('should respect limit parameter', async () => {
      const response = await fetch(`${serviceUrl}/logs?category=all&limit=2`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.logs.length).toBeLessThanOrEqual(2);
    });
  });

  describe('CORS Headers', () => {
    it('should handle preflight OPTIONS request', async () => {
      const response = await fetch(`${serviceUrl}/log`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:8081',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });
      
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:8081');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });

    it('should include CORS headers in responses', async () => {
      const response = await fetch(`${serviceUrl}/health`, {
        headers: {
          'Origin': 'http://localhost:3000',
        },
      });
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    });

    it('should reject disallowed origins', async () => {
      const response = await fetch(`${serviceUrl}/health`, {
        headers: {
          'Origin': 'http://evil.com',
        },
      });
      
      // Should use first allowed origin instead
      expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('http://evil.com');
    });
  });

  describe('Error Handling', () => {
    it('should handle large payloads gracefully', async () => {
      const largeEvents = Array(100).fill(null).map((_, i) => ({
        type: 'stress-test',
        message: 'x'.repeat(1000), // 1KB per message
        index: i,
        timestamp: new Date().toISOString(),
      }));

      const response = await fetch(`${serviceUrl}/log/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: largeEvents }),
      });

      expect(response.status).toBe(200);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(10).fill(null).map((_, i) => 
        fetch(`${serviceUrl}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'concurrent-test',
            message: `Concurrent request ${i}`,
            timestamp: new Date().toISOString(),
          }),
        })
      );

      const responses = await Promise.all(promises);
      
      expect(responses.every(r => r.status === 200)).toBe(true);
    });
  });

  describe('Log Rotation', () => {
    it('should track log statistics correctly', async () => {
      // Add logs with different timestamps
      const now = Date.now();
      const events = [
        {
          type: 'rotation-test',
          category: 'TEST',
          message: 'Old log',
          timestamp: new Date(now - 3700000).toISOString(), // Over 1 hour old
        },
        {
          type: 'rotation-test',
          category: 'TEST',
          message: 'Recent log',
          timestamp: new Date(now - 1000).toISOString(), // 1 second old
        },
      ];

      for (const event of events) {
        await fetch(`${serviceUrl}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      }

      const statsResponse = await fetch(`${serviceUrl}/stats`);
      const stats = await statsResponse.json();
      
      expect(stats.totalLogs).toBeGreaterThan(0);
      expect(stats.categories.TEST).toBeDefined();
    });
  });
});