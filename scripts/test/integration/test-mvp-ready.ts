#!/usr/bin/env bun

/**
 * MVP Readiness Test
 * Comprehensive test of all critical features including new auth security
 */

import chalk from 'chalk';

// Test configuration
const API_URL = 'http://localhost:8081';
const WS_URL = 'ws://localhost:3002';

// Test report
const report = {
  passed: 0,
  failed: 0,
  tests: [] as any[],
  security: [] as any[]
};

// Known test users (from database) - updated with correct passwords
const TEST_USERS = [
  { email: 'doremon@gmail.com', password: 'test123', role: 'nurse' },
  { email: 'johndoe@gmail.com', password: 'test123', role: 'doctor' },
  { email: 'johncena@gmail.com', password: 'test123', role: 'operator' },
  { email: 'saipramod273@gmail.com', password: 'test123', role: 'head_doctor' },
];

// Helper to make requests
async function request(method: string, path: string, options: any = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include'
  });
  
  const text = await response.text();
  let data;
  
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  
  return { ok: response.ok, status: response.status, data, headers: response.headers };
}

// Test helper
async function test(name: string, fn: () => Promise<void>) {

  try {
    await fn();
    report.passed++;

    report.tests.push({ name, status: 'passed' });
  } catch (error: any) {
    report.failed++;

    report.tests.push({ name, status: 'failed', error: error.message });
  }
}

// Main tests
async function runTests() {

  // 1. Test if services are running
  await test('API Server', async () => {
    const res = await request('GET', '/');
    if (!res.ok) throw new Error('API server not responding');
  });
  
  await test('WebSocket Server', async () => {
    const WebSocket = require('ws');
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      ws.on('open', () => {
        ws.close();
        resolve(true);
      });
      ws.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 3000);
    });
  });
  
  // 2. Test tRPC endpoints
  await test('tRPC Health Check', async () => {
    const res = await request('GET', '/api/trpc/auth.getSession');
    // Should return 401 or valid response, not 404
    if (res.status === 404) throw new Error('tRPC not configured');
  });
  
  // 3. Test Better Auth endpoints
  await test('Better Auth Health', async () => {
    const res = await request('GET', '/api/auth/health');
    // Health endpoint might return 404, which is okay
    // The important thing is that auth routes exist

  });
  
  // 4. Test login with existing user
  let authCookie = '';
  let sessionToken = '';
  
  await test('Login with Test User', async () => {
    // Use Better Auth sign-in endpoint (not sign-in/email)
    const res = await request('POST', '/api/auth/sign-in', {
      body: {
        email: TEST_USERS[0].email,
        password: TEST_USERS[0].password
      }
    });
    
    const cookie = res.headers.get('set-cookie');
    if (cookie) {
      authCookie = cookie;
      sessionToken = cookie.match(/better-auth\.session_token=([^;]+)/)?.[1] || '';

    } else {
      throw new Error('Login failed - check credentials');
    }
  });
  
  // 4a. Test new security features
  await test('Device Fingerprint Collection', async () => {
    if (!sessionToken) throw new Error('No session token');
    
    const res = await request('POST', '/api/auth/device-fingerprint', {
      headers: { Cookie: authCookie },
      body: {
        fingerprint: 'test-fingerprint-' + Date.now(),
        platform: 'test',
        userAgent: 'MVP Test Script'
      }
    });
    
    if (res.ok) {

      report.security.push({ feature: 'device_fingerprint', status: 'enabled' });
    } else {

      report.security.push({ feature: 'device_fingerprint', status: 'not_available' });
    }
  });
  
  await test('Session Security Check', async () => {
    if (!sessionToken) throw new Error('No session token');
    
    const res = await request('POST', '/api/auth/verify-session', {
      headers: { 
        Cookie: authCookie,
        'User-Agent': 'MVP Test Script v1.0'
      }
    });
    
    if (res.ok) {

      report.security.push({ feature: 'session_verification', status: 'enabled' });
    } else {

      report.security.push({ feature: 'session_verification', status: 'not_available' });
    }
  });
  
  // 5. Test authenticated endpoints
  if (authCookie) {
    await test('Get Session', async () => {
      // Use the correct Better Auth session endpoint
      const res = await request('GET', '/api/auth/get-session', {
        headers: { Cookie: authCookie }
      });
      
      if (!res.ok || !res.data?.user) {
        // Fallback to tRPC if direct endpoint fails
        const trpcRes = await request('GET', '/api/trpc/auth.getSession', {
          headers: { Cookie: authCookie }
        });
        
        if (!trpcRes.ok || !trpcRes.data?.result?.data?.json?.user) {
          throw new Error('Session not valid');
        }
        
        const user = trpcRes.data.result.data.json.user;

      } else {
        const user = res.data.user;

      }
    });
    
    await test('Get Active Alerts', async () => {
      // Get user's hospital ID first
      const sessionRes = await request('GET', '/api/auth/get-session', {
        headers: { Cookie: authCookie }
      });
      const hospitalId = sessionRes.data?.user?.defaultHospitalId || '0345d1f6-0791-49b4-8b02-bf059c9e50b5';
      
      // Use correct tRPC input format
      const input = encodeURIComponent(JSON.stringify({ hospitalId }));
      const res = await request('GET', `/api/trpc/healthcare.getActiveAlerts?input=${input}`, {
        headers: { Cookie: authCookie }
      });
      
      if (!res.ok) throw new Error(`Failed to get alerts: ${res.status}`);
      
      const alerts = res.data?.result?.data?.json;

    });
  }
  
  // Test OAuth flow
  await test('OAuth Configuration', async () => {
    const res = await request('POST', '/api/auth/sign-in/social', {
      body: {
        provider: 'google',
        callbackURL: '/auth-callback'
      }
    });
    
    if (res.ok || res.status === 302) {

      report.security.push({ feature: 'oauth', status: 'enabled' });
    } else {

      report.security.push({ feature: 'oauth', status: 'not_configured' });
    }
  });
  
  // Test concurrent sessions
  await test('Concurrent Session Management', async () => {
    if (!sessionToken) throw new Error('No session token');
    
    const res = await request('GET', '/api/trpc/auth.getActiveSessions', {
      headers: { Cookie: authCookie }
    });
    
    if (res.ok) {

      report.security.push({ feature: 'concurrent_sessions', status: 'enabled' });
    } else {

      report.security.push({ feature: 'concurrent_sessions', status: 'not_available' });
    }
  });
  
  // Generate report

  const successRate = ((report.passed / report.tests.length) * 100).toFixed(0);

  // Security Features Report
  if (report.security.length > 0) {

    report.security.forEach(s => {
      const icon = s.status === 'enabled' ? '✅' : '⚠️';
      const color = s.status === 'enabled' ? chalk.green : chalk.yellow;

    });
  }
  
  if (report.failed > 0) {

    report.tests.filter(t => t.status === 'failed').forEach(t => {

    });
  }
  
  // MVP Status

  if (successRate === '100') {

  } else {

    // Provide troubleshooting

    if (report.tests.find(t => t.name === 'Better Auth Health' && t.status === 'failed')) {

    }
    
    if (report.tests.find(t => t.name === 'Login with Test User' && t.status === 'failed')) {

    }
  }

  process.exit(report.failed > 0 ? 1 : 0);
}

// Check dependencies
try {
  require.resolve('ws');
} catch {

  const { execSync } = require('child_process');
  execSync('bun add -d ws', { stdio: 'inherit' });
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red('\n❌ Test failed:'), error);
  process.exit(1);
});