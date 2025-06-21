#!/usr/bin/env bun

/**
 * Comprehensive API Testing Script
 * Tests all API endpoints with proper logging and validation
 * Generates a detailed report for MVP presentation
 */

import { createClient } from '@/lib/api/trpc';
import { logger } from '@/lib/core/debug/unified-logger';
import { db } from '@/src/db';
import chalk from 'chalk';
import { WebSocket } from 'ws';

// Test report interface
interface TestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'failure' | 'skipped';
  responseTime: number;
  error?: string;
  data?: any;
}

interface TestReport {
  timestamp: string;
  environment: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  summary: {
    auth: { total: number; passed: number; failed: number };
    healthcare: { total: number; passed: number; failed: number };
    organization: { total: number; passed: number; failed: number };
    websocket: { total: number; passed: number; failed: number };
  };
}

// Initialize test report
const report: TestReport = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  totalTests: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0,
  results: [],
  summary: {
    auth: { total: 0, passed: 0, failed: 0 },
    healthcare: { total: 0, passed: 0, failed: 0 },
    organization: { total: 0, passed: 0, failed: 0 },
    websocket: { total: 0, passed: 0, failed: 0 }
  }
};

// Test credentials
const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!@#',
    role: 'admin'
  },
  doctor: {
    email: 'doctor@test.com',
    password: 'Doctor123!@#',
    role: 'doctor'
  },
  nurse: {
    email: 'nurse@test.com',
    password: 'Nurse123!@#',
    role: 'nurse'
  },
  operator: {
    email: 'operator@test.com',
    password: 'Operator123!@#',
    role: 'operator'
  }
};

// Helper to log test results
function logTestResult(result: TestResult) {
  const icon = result.status === 'success' ? '✅' : result.status === 'failure' ? '❌' : '⏭️';
  const color = result.status === 'success' ? chalk.green : result.status === 'failure' ? chalk.red : chalk.yellow;

  if (result.error) {

  }
  
  logger.info('API Test Result', 'TEST', {
    endpoint: result.endpoint,
    status: result.status,
    responseTime: result.responseTime,
    error: result.error
  });
}

// Helper to test an endpoint
async function testEndpoint(
  name: string,
  category: 'auth' | 'healthcare' | 'organization' | 'websocket',
  method: string,
  testFn: () => Promise<any>
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    endpoint: name,
    method,
    status: 'success',
    responseTime: 0
  };
  
  try {
    const data = await testFn();
    result.responseTime = Date.now() - startTime;
    result.data = data;
    result.status = 'success';
    report.passed++;
    report.summary[category].passed++;
  } catch (error: any) {
    result.responseTime = Date.now() - startTime;
    result.status = 'failure';
    result.error = error.message || 'Unknown error';
    report.failed++;
    report.summary[category].failed++;
  }
  
  report.totalTests++;
  report.summary[category].total++;
  report.results.push(result);
  logTestResult(result);
  
  return result;
}

// Main test function
async function runComprehensiveTests() {
  const startTime = Date.now();

  logger.info('Starting comprehensive API tests', 'TEST');
  
  // Auth endpoints are handled by Better Auth directly
  
  // Test Authentication Endpoints

  // Test user registration
  for (const [role, creds] of Object.entries(TEST_USERS)) {
    await testEndpoint(
      `/api/auth/register`,
      'auth',
      'POST',
      async () => {
        const response = await fetch('http://localhost:8081/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: creds.email,
            password: creds.password,
            name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            role: creds.role
          })
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Registration failed: ${error}`);
        }
        
        return await response.json();
      }
    );
  }
  
  // Test user login and create TRPC clients for each role
  const clients: Record<string, any> = {};
  const sessions: Record<string, any> = {};
  
  for (const [role, creds] of Object.entries(TEST_USERS)) {
    const loginResult = await testEndpoint(
      `/api/auth/login`,
      'auth',
      'POST',
      async () => {
        const response = await fetch('http://localhost:8081/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: creds.email,
            password: creds.password
          })
        });
        
        if (!response.ok) {
          throw new Error('Login failed');
        }
        
        const cookies = response.headers.get('set-cookie');
        const data = await response.json();
        
        // Create TRPC client with auth cookie
        clients[role] = createClient({
          headers: {
            cookie: cookies || ''
          }
        });
        
        sessions[role] = data;
        return data;
      }
    );
  }
  
  // Test session endpoints
  await testEndpoint(
    `/api/auth/getSession`,
    'auth',
    'GET',
    async () => {
      return await clients.admin.auth.getSession.query();
    }
  );
  
  // Test Healthcare Endpoints

  // Get test hospital ID
  let testHospitalId: string | null = null;
  
  await testEndpoint(
    `/api/healthcare/getHospitals`,
    'healthcare',
    'GET',
    async () => {
      const hospitals = await clients.doctor.healthcare.getHospitals.query();
      if (hospitals.length > 0) {
        testHospitalId = hospitals[0].id;
      }
      return hospitals;
    }
  );
  
  // Test alert creation (doctor/nurse only)
  let testAlertId: string | null = null;
  
  await testEndpoint(
    `/api/healthcare/createAlert`,
    'healthcare',
    'POST',
    async () => {
      if (!testHospitalId) throw new Error('No hospital available');
      
      const alert = await clients.doctor.healthcare.createAlert.mutate({
        roomNumber: '101A',
        alertType: 'medical-emergency',
        urgencyLevel: 3,
        description: 'Test alert from API test',
        hospitalId: testHospitalId
      });
      
      testAlertId = alert.id;
      return alert;
    }
  );
  
  // Test get active alerts
  await testEndpoint(
    `/api/healthcare/getActiveAlerts`,
    'healthcare',
    'GET',
    async () => {
      if (!testHospitalId) throw new Error('No hospital available');
      
      return await clients.nurse.healthcare.getActiveAlerts.query({
        hospitalId: testHospitalId
      });
    }
  );
  
  // Test acknowledge alert
  if (testAlertId) {
    await testEndpoint(
      `/api/healthcare/acknowledgeAlert`,
      'healthcare',
      'POST',
      async () => {
        return await clients.nurse.healthcare.acknowledgeAlert.mutate({
          alertId: testAlertId!,
          notes: 'Acknowledged via API test'
        });
      }
    );
  }
  
  // Test shift management
  await testEndpoint(
    `/api/healthcare/toggleOnDuty`,
    'healthcare',
    'POST',
    async () => {
      return await clients.nurse.healthcare.toggleOnDuty.mutate({
        isOnDuty: true
      });
    }
  );
  
  await testEndpoint(
    `/api/healthcare/getOnDutyStatus`,
    'healthcare',
    'GET',
    async () => {
      return await clients.nurse.healthcare.getOnDutyStatus.query();
    }
  );
  
  await testEndpoint(
    `/api/healthcare/getOnDutyStaff`,
    'healthcare',
    'GET',
    async () => {
      if (!testHospitalId) throw new Error('No hospital available');
      
      return await clients.doctor.healthcare.getOnDutyStaff.query({
        hospitalId: testHospitalId
      });
    }
  );
  
  // Test patient management
  await testEndpoint(
    `/api/patient/getPatients`,
    'healthcare',
    'GET',
    async () => {
      return await clients.doctor.patient.getPatients.query({
        status: 'active'
      });
    }
  );
  
  // Test Organization Endpoints

  // Get user's organizations
  await testEndpoint(
    `/api/organization/getUserOrganizations`,
    'organization',
    'GET',
    async () => {
      return await clients.admin.organization.getUserOrganizations.query();
    }
  );
  
  // Test organization creation (admin only)
  let testOrgId: string | null = null;
  
  await testEndpoint(
    `/api/organization/create`,
    'organization',
    'POST',
    async () => {
      const org = await clients.admin.organization.create.mutate({
        name: 'Test Hospital Organization',
        type: 'hospital',
        description: 'Test organization created via API test'
      });
      
      testOrgId = org.id;
      return org;
    }
  );
  
  // Test member management
  if (testOrgId) {
    await testEndpoint(
      `/api/organization/getMembers`,
      'organization',
      'GET',
      async () => {
        return await clients.admin.organization.getMembers.query({
          organizationId: testOrgId!
        });
      }
    );
    
    await testEndpoint(
      `/api/organization/inviteMember`,
      'organization',
      'POST',
      async () => {
        return await clients.admin.organization.inviteMember.mutate({
          organizationId: testOrgId!,
          email: 'newdoctor@test.com',
          role: 'member',
          customMessage: 'Join our test organization'
        });
      }
    );
  }
  
  // Test WebSocket Connections

  await testEndpoint(
    'WebSocket Alert Subscription',
    'websocket',
    'CONNECT',
    async () => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:3002');
        
        ws.on('open', () => {
          // Subscribe to alerts
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'alerts',
            hospitalId: testHospitalId
          }));
          
          // Wait for subscription confirmation
          ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === 'subscribed') {
              ws.close();
              resolve(message);
            }
          });
        });
        
        ws.on('error', reject);
        
        setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, 5000);
      });
    }
  );
  
  // Test logout
  await testEndpoint(
    `/api/auth/signout`,
    'auth',
    'POST',
    async () => {
      return await clients.admin.auth.signOut.mutate();
    }
  );
  
  // Calculate final duration
  report.duration = Date.now() - startTime;
  
  // Generate final report
  generateFinalReport();
}

// Generate and display final report
function generateFinalReport() {

  const successRate = ((report.passed / report.totalTests) * 100).toFixed(2);

  for (const [category, stats] of Object.entries(report.summary)) {
    const categorySuccessRate = stats.total > 0 
      ? ((stats.passed / stats.total) * 100).toFixed(2)
      : '0.00';

  }
  
  // Show failed tests
  const failedTests = report.results.filter(r => r.status === 'failure');
  if (failedTests.length > 0) {

    failedTests.forEach(test => {

    });
  }
  
  // Save detailed report to file
  const reportPath = `/Users/sirigiri/Documents/coding-projects/my-expo/API_TEST_REPORT_${new Date().toISOString().split('T')[0]}.json`;
  Bun.write(reportPath, JSON.stringify(report, null, 2));

  // Log final summary
  logger.info('API Test Suite Completed', 'TEST', {
    totalTests: report.totalTests,
    passed: report.passed,
    failed: report.failed,
    duration: report.duration,
    successRate
  });
  
  // Exit with appropriate code
  process.exit(report.failed > 0 ? 1 : 0);
}

// Run tests
runComprehensiveTests().catch(error => {
  console.error(chalk.red('\n❌ Test suite failed:'), error);
  logger.error('Test suite failed', 'TEST', { error: error.message });
  process.exit(1);
});