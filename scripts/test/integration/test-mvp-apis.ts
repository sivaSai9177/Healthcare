#!/usr/bin/env bun

/**
 * MVP API Testing Script
 * Tests all critical API endpoints for MVP presentation
 */

import chalk from 'chalk';

// Test configuration
const API_BASE_URL = 'http://localhost:8081';
const TEST_REPORT: any = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  results: []
};

// Test users
const TEST_USERS = {
  doctor: {
    email: 'doctor@test.com',
    password: 'Doctor123!@#',
    name: 'Dr. Test Doctor',
    role: 'doctor'
  },
  nurse: {
    email: 'nurse@test.com', 
    password: 'Nurse123!@#',
    name: 'Test Nurse',
    role: 'nurse'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!@#', 
    name: 'Test Admin',
    role: 'admin'
  }
};

// Helper to make API requests
async function apiRequest(
  method: string,
  path: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    cookies?: string;
  } = {}
) {
  const url = `${API_BASE_URL}${path}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(options.cookies ? { 'Cookie': options.cookies } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include'
  });
  
  const responseText = await response.text();
  let data;
  
  try {
    data = JSON.parse(responseText);
  } catch {
    data = responseText;
  }
  
  return {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    data,
    cookies: response.headers.get('set-cookie')
  };
}

// Test helper
async function runTest(
  name: string,
  category: string,
  testFn: () => Promise<void>
) {
  const startTime = Date.now();
  const result = {
    name,
    category,
    status: 'success',
    duration: 0,
    error: null as string | null
  };
  
  try {
    await testFn();
    result.status = 'success';
    TEST_REPORT.passed++;

  } catch (error: any) {
    result.status = 'failure';
    result.error = error.message;
    TEST_REPORT.failed++;

  }
  
  result.duration = Date.now() - startTime;
  TEST_REPORT.totalTests++;
  TEST_REPORT.results.push(result);
}

// Store auth tokens
const authTokens: Record<string, string> = {};

// Main test suite
async function runMVPTests() {

  // 1. Authentication Tests

  // Test user registration
  for (const [role, user] of Object.entries(TEST_USERS)) {
    await runTest(`Register ${role}`, 'auth', async () => {
      const response = await apiRequest('POST', '/api/auth/signup', {
        body: user
      });
      
      if (!response.ok) {
        throw new Error(`Registration failed: ${JSON.stringify(response.data)}`);
      }
    });
  }
  
  // Test user login and store sessions
  for (const [role, user] of Object.entries(TEST_USERS)) {
    await runTest(`Login ${role}`, 'auth', async () => {
      const response = await apiRequest('POST', '/api/auth/signin', {
        body: {
          email: user.email,
          password: user.password
        }
      });
      
      if (!response.ok) {
        throw new Error(`Login failed: ${JSON.stringify(response.data)}`);
      }
      
      // Store cookies for authenticated requests
      authTokens[role] = response.cookies || '';
    });
  }
  
  // Test session validation
  await runTest('Validate session', 'auth', async () => {
    const response = await apiRequest('GET', '/api/trpc/auth.getSession', {
      cookies: authTokens.doctor
    });
    
    if (!response.ok) {
      throw new Error('Session validation failed');
    }
    
    const data = response.data;
    if (!data.result?.data?.json?.user) {
      throw new Error('Invalid session data');
    }
  });
  
  // 2. Healthcare API Tests

  let testHospitalId: string | null = null;
  let testAlertId: string | null = null;
  
  // Get hospitals
  await runTest('Get hospitals', 'healthcare', async () => {
    const response = await apiRequest('GET', '/api/trpc/healthcare.getHospitals', {
      cookies: authTokens.doctor
    });
    
    if (!response.ok) {
      throw new Error('Failed to get hospitals');
    }
    
    const hospitals = response.data?.result?.data?.json;
    if (hospitals && hospitals.length > 0) {
      testHospitalId = hospitals[0].id;

    }
  });
  
  // Create alert
  await runTest('Create alert', 'healthcare', async () => {
    if (!testHospitalId) {
      throw new Error('No hospital available for alert creation');
    }
    
    const response = await apiRequest('POST', '/api/trpc/healthcare.createAlert', {
      cookies: authTokens.doctor,
      body: {
        json: {
          roomNumber: '101A',
          alertType: 'medical-emergency',
          urgencyLevel: 3,
          description: 'MVP test alert',
          hospitalId: testHospitalId
        }
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create alert: ${JSON.stringify(response.data)}`);
    }
    
    const alert = response.data?.result?.data?.json;
    if (alert) {
      testAlertId = alert.id;

    }
  });
  
  // Get active alerts
  await runTest('Get active alerts', 'healthcare', async () => {
    if (!testHospitalId) {
      throw new Error('No hospital available');
    }
    
    const response = await apiRequest('GET', `/api/trpc/healthcare.getActiveAlerts?input=${encodeURIComponent(JSON.stringify({json:{hospitalId:testHospitalId}}))}`, {
      cookies: authTokens.nurse
    });
    
    if (!response.ok) {
      throw new Error('Failed to get active alerts');
    }
    
    const data = response.data?.result?.data?.json;

  });
  
  // Acknowledge alert
  if (testAlertId) {
    await runTest('Acknowledge alert', 'healthcare', async () => {
      const response = await apiRequest('POST', '/api/trpc/healthcare.acknowledgeAlert', {
        cookies: authTokens.nurse,
        body: {
          json: {
            alertId: testAlertId,
            notes: 'Acknowledged during MVP test'
          }
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }
    });
  }
  
  // Test shift management
  await runTest('Toggle on duty', 'healthcare', async () => {
    const response = await apiRequest('POST', '/api/trpc/healthcare.toggleOnDuty', {
      cookies: authTokens.nurse,
      body: {
        json: {
          isOnDuty: true
        }
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to toggle duty status');
    }
  });
  
  await runTest('Get on duty status', 'healthcare', async () => {
    const response = await apiRequest('GET', '/api/trpc/healthcare.getOnDutyStatus', {
      cookies: authTokens.nurse
    });
    
    if (!response.ok) {
      throw new Error('Failed to get duty status');
    }
    
    const status = response.data?.result?.data?.json;

  });
  
  // 3. Organization API Tests

  let testOrgId: string | null = null;
  
  // Get user organizations
  await runTest('Get user organizations', 'organization', async () => {
    const response = await apiRequest('GET', '/api/trpc/organization.getUserOrganizations', {
      cookies: authTokens.admin
    });
    
    if (!response.ok) {
      throw new Error('Failed to get organizations');
    }
    
    const orgs = response.data?.result?.data?.json;

    if (orgs && orgs.length > 0) {
      testOrgId = orgs[0].id;
    }
  });
  
  // Create organization
  await runTest('Create organization', 'organization', async () => {
    const response = await apiRequest('POST', '/api/trpc/organization.create', {
      cookies: authTokens.admin,
      body: {
        json: {
          name: 'MVP Test Hospital',
          type: 'hospital',
          description: 'Test hospital for MVP demo'
        }
      }
    });
    
    if (!response.ok && !response.data?.message?.includes('already exists')) {
      throw new Error(`Failed to create organization: ${JSON.stringify(response.data)}`);
    }
    
    if (response.ok) {
      const org = response.data?.result?.data?.json;
      if (org) {
        testOrgId = org.id;

      }
    }
  });
  
  // 4. WebSocket Tests

  await runTest('WebSocket connection', 'websocket', async () => {
    const WebSocket = require('ws');
    
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3002');
      
      ws.on('open', () => {

        // Send subscribe message
        ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'alerts',
          hospitalId: testHospitalId || 'test'
        }));
        
        // Wait for response
        ws.on('message', (data: any) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'subscribed' || message.type === 'error') {
            ws.close();
            if (message.type === 'subscribed') {

              resolve();
            } else {
              reject(new Error('WebSocket subscription failed'));
            }
          }
        });
      });
      
      ws.on('error', (error: any) => {
        reject(new Error(`WebSocket error: ${error.message}`));
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);
    });
  });
  
  // 5. Error Handling Tests

  await runTest('Invalid credentials', 'errors', async () => {
    const response = await apiRequest('POST', '/api/auth/signin', {
      body: {
        email: 'invalid@test.com',
        password: 'wrongpassword'
      }
    });
    
    if (response.ok) {
      throw new Error('Expected login to fail with invalid credentials');
    }

  });
  
  await runTest('Unauthorized access', 'errors', async () => {
    const response = await apiRequest('GET', '/api/trpc/healthcare.getActiveAlerts', {
      // No auth cookie
    });
    
    if (response.ok) {
      throw new Error('Expected request to fail without authentication');
    }

  });
  
  // Generate final report
  generateReport();
}

// Generate final report
function generateReport() {
  const duration = TEST_REPORT.results.reduce((sum: number, r: any) => sum + r.duration, 0);
  const successRate = ((TEST_REPORT.passed / TEST_REPORT.totalTests) * 100).toFixed(2);

  // Group by category
  const categories = [...new Set(TEST_REPORT.results.map((r: any) => r.category))];

  categories.forEach(category => {
    const categoryTests = TEST_REPORT.results.filter((r: any) => r.category === category);
    const passed = categoryTests.filter((t: any) => t.status === 'success').length;
    const failed = categoryTests.length - passed;

  });
  
  // Show failures
  const failures = TEST_REPORT.results.filter((r: any) => r.status === 'failure');
  if (failures.length > 0) {

    failures.forEach((test: any) => {

    });
  }
  
  // MVP Status

  if (successRate === '100.00') {

  } else {

  }
  
  // Save detailed report
  const reportPath = `/Users/sirigiri/Documents/coding-projects/my-expo/MVP_API_TEST_REPORT_${new Date().toISOString().split('T')[0]}.json`;
  Bun.write(reportPath, JSON.stringify(TEST_REPORT, null, 2));

  // Exit with appropriate code
  process.exit(TEST_REPORT.failed > 0 ? 1 : 0);
}

// Check if WebSocket is available
try {
  require.resolve('ws');
} catch {

  const { execSync } = require('child_process');
  execSync('bun add -d ws', { stdio: 'inherit' });
}

// Run tests
runMVPTests().catch(error => {
  console.error(chalk.red('\n❌ Test suite failed:'), error);
  process.exit(1);
});