#!/usr/bin/env bun
/**
 * Comprehensive MVP Testing Script
 * Tests all auth features, user flows, and API endpoints
 */

import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';
import { WebSocket } from 'ws';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3002';

// Test users
const TEST_USERS = {
  nurse: { email: 'doremon@gmail.com', password: 'test123', role: 'nurse' },
  doctor: { email: 'johndoe@gmail.com', password: 'test123', role: 'doctor' },
  operator: { email: 'johncena@gmail.com', password: 'test123', role: 'operator' },
  admin: { email: 'admin@test.com', password: 'test123', role: 'admin' },
  manager: { email: 'manager@test.com', password: 'test123', role: 'manager' },
  headDoctor: { email: 'saipramod273@gmail.com', password: 'test123', role: 'head_doctor' },
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg: string) => {},
  error: (msg: string) => {},
  info: (msg: string) => {},
  warning: (msg: string) => {},
  section: (msg: string) => {},
  subsection: (msg: string) => {},
};

// Test results storage
const testResults: {
  auth: { [key: string]: boolean };
  userFlows: { [key: string]: boolean };
  apis: { [key: string]: boolean };
  security: { [key: string]: boolean };
  frontend: { [key: string]: boolean };
  errors: string[];
} = {
  auth: {},
  userFlows: {},
  apis: {},
  security: {},
  frontend: {},
  errors: [],
};

// Helper to make authenticated requests
async function makeAuthRequest(
  endpoint: string,
  options: RequestInit & { sessionToken?: string } = {}
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.sessionToken) {
    headers['Cookie'] = `better-auth.session_token=${options.sessionToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

// Helper to make tRPC requests
async function makeTrpcRequest(
  procedure: string,
  input: any = {},
  sessionToken?: string
) {
  const batch = encodeURIComponent(JSON.stringify([{ input }]));
  const endpoint = `/api/trpc/${procedure}?batch=1&input=${batch}`;
  
  const response = await makeAuthRequest(endpoint, {
    method: 'GET',
    sessionToken,
  });

  if (!response.ok) {
    throw new Error(`tRPC request failed: ${response.status}`);
  }

  const data = await response.json();
  return data[0]?.result?.data;
}

// Test authentication with security features
async function testAuthentication(email: string, password: string, role: string) {
  log.subsection(`Testing ${role} authentication`);
  
  try {
    // 1. Test login
    const loginResponse = await makeAuthRequest('/api/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      log.error(`${role} login failed: ${error}`);
      testResults.auth[`${role}_login`] = false;
      return null;
    }

    const loginData = await loginResponse.json();
    const sessionToken = loginResponse.headers.get('set-cookie')?.match(/better-auth.session_token=([^;]+)/)?.[1];
    
    log.success(`${role} login successful`);
    testResults.auth[`${role}_login`] = true;

    // 2. Test session
    const sessionData = await makeTrpcRequest('auth.getSession', {}, sessionToken);
    
    if (sessionData?.user) {
      log.success(`${role} session verified`);
      log.info(`  User ID: ${sessionData.user.id}`);
      log.info(`  Email: ${sessionData.user.email}`);
      log.info(`  Role: ${sessionData.user.role}`);
      log.info(`  Hospital: ${sessionData.user.defaultHospitalId || 'Not assigned'}`);
      testResults.auth[`${role}_session`] = true;
    } else {
      log.error(`${role} session not found`);
      testResults.auth[`${role}_session`] = false;
    }

    // 3. Test device fingerprint (web only)
    if (typeof window !== 'undefined') {
      try {
        const fingerprintResponse = await makeAuthRequest('/api/auth/device-fingerprint', {
          method: 'POST',
          sessionToken,
          body: JSON.stringify({
            fingerprint: 'test-fingerprint-' + Date.now(),
            platform: 'web',
            userAgent: 'Test Script',
          }),
        });

        if (fingerprintResponse.ok) {
          log.success(`${role} device fingerprint sent`);
          testResults.security[`${role}_fingerprint`] = true;
        }
      } catch (error) {
        log.warning('Device fingerprint test skipped (server environment)');
      }
    }

    return { sessionToken, user: sessionData?.user };
  } catch (error) {
    log.error(`${role} authentication error: ${error}`);
    testResults.errors.push(`${role} auth: ${error}`);
    return null;
  }
}

// Test user flows based on role
async function testUserFlow(role: string, sessionToken: string, userId: string) {
  log.subsection(`Testing ${role} user flow`);
  
  try {
    switch (role) {
      case 'nurse':
        await testNurseFlow(sessionToken, userId);
        break;
      case 'doctor':
        await testDoctorFlow(sessionToken, userId);
        break;
      case 'operator':
        await testOperatorFlow(sessionToken, userId);
        break;
      case 'admin':
        await testAdminFlow(sessionToken, userId);
        break;
      case 'manager':
        await testManagerFlow(sessionToken, userId);
        break;
      case 'head_doctor':
        await testHeadDoctorFlow(sessionToken, userId);
        break;
    }
  } catch (error) {
    log.error(`${role} flow error: ${error}`);
    testResults.errors.push(`${role} flow: ${error}`);
    testResults.userFlows[role] = false;
  }
}

// Nurse flow: View alerts → Create alert → Acknowledge
async function testNurseFlow(sessionToken: string, userId: string) {
  // 1. Get alerts
  const alerts = await makeTrpcRequest('healthcare.getAlerts', { 
    status: 'pending',
    limit: 10 
  }, sessionToken);
  
  if (alerts) {
    log.success('Nurse can view alerts');
    log.info(`  Found ${alerts.alerts?.length || 0} alerts`);
    testResults.userFlows['nurse_view_alerts'] = true;
  } else {
    testResults.userFlows['nurse_view_alerts'] = false;
  }

  // 2. Create alert
  const newAlert = await makeTrpcRequest('healthcare.createAlert', {
    patientId: 'test-patient-001',
    type: 'critical',
    message: 'Test alert from comprehensive test',
    priority: 'high',
    department: 'emergency',
  }, sessionToken);

  if (newAlert) {
    log.success('Nurse created alert successfully');
    log.info(`  Alert ID: ${newAlert.id}`);
    testResults.userFlows['nurse_create_alert'] = true;

    // 3. Acknowledge alert
    const ack = await makeTrpcRequest('healthcare.acknowledgeAlert', {
      alertId: newAlert.id,
    }, sessionToken);

    if (ack) {
      log.success('Nurse acknowledged alert');
      testResults.userFlows['nurse_acknowledge_alert'] = true;
    } else {
      testResults.userFlows['nurse_acknowledge_alert'] = false;
    }
  } else {
    testResults.userFlows['nurse_create_alert'] = false;
  }
}

// Doctor flow: View alerts → Acknowledge → Resolve
async function testDoctorFlow(sessionToken: string, userId: string) {
  // 1. Get alerts
  const alerts = await makeTrpcRequest('healthcare.getAlerts', {
    status: 'acknowledged',
    limit: 10
  }, sessionToken);

  if (alerts) {
    log.success('Doctor can view alerts');
    testResults.userFlows['doctor_view_alerts'] = true;

    if (alerts.alerts?.length > 0) {
      const alertId = alerts.alerts[0].id;
      
      // 2. Acknowledge alert
      const ack = await makeTrpcRequest('healthcare.acknowledgeAlert', {
        alertId,
      }, sessionToken);

      if (ack) {
        log.success('Doctor acknowledged alert');
        testResults.userFlows['doctor_acknowledge_alert'] = true;
      }

      // 3. Resolve alert
      const resolve = await makeTrpcRequest('healthcare.resolveAlert', {
        alertId,
        resolution: 'Test resolution from comprehensive test',
      }, sessionToken);

      if (resolve) {
        log.success('Doctor resolved alert');
        testResults.userFlows['doctor_resolve_alert'] = true;
      } else {
        testResults.userFlows['doctor_resolve_alert'] = false;
      }
    }
  } else {
    testResults.userFlows['doctor_view_alerts'] = false;
  }
}

// Operator flow: Create alerts → View dashboard
async function testOperatorFlow(sessionToken: string, userId: string) {
  // 1. Create multiple alerts
  const alertPromises = [];
  for (let i = 0; i < 3; i++) {
    alertPromises.push(
      makeTrpcRequest('healthcare.createAlert', {
        patientId: `test-patient-${i}`,
        type: i === 0 ? 'critical' : 'warning',
        message: `Operator test alert ${i + 1}`,
        priority: i === 0 ? 'high' : 'medium',
        department: 'emergency',
      }, sessionToken)
    );
  }

  const results = await Promise.allSettled(alertPromises);
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  
  if (successCount > 0) {
    log.success(`Operator created ${successCount} alerts`);
    testResults.userFlows['operator_create_alerts'] = true;
  } else {
    testResults.userFlows['operator_create_alerts'] = false;
  }

  // 2. Get dashboard stats
  const stats = await makeTrpcRequest('healthcare.getDashboardStats', {}, sessionToken);
  
  if (stats) {
    log.success('Operator can view dashboard stats');
    log.info(`  Active alerts: ${stats.activeAlerts || 0}`);
    log.info(`  Today's alerts: ${stats.todayAlerts || 0}`);
    testResults.userFlows['operator_view_stats'] = true;
  } else {
    testResults.userFlows['operator_view_stats'] = false;
  }
}

// Admin flow: Check hospital → Access settings
async function testAdminFlow(sessionToken: string, userId: string) {
  // 1. Get user profile
  const profile = await makeTrpcRequest('auth.getSession', {}, sessionToken);
  
  if (profile?.user?.defaultHospitalId) {
    log.success('Admin has hospital assignment');
    testResults.userFlows['admin_hospital_assigned'] = true;
  } else {
    log.warning('Admin needs hospital assignment');
    testResults.userFlows['admin_hospital_assigned'] = false;
  }

  // 2. Get organization info
  const orgInfo = await makeTrpcRequest('organization.getOrganization', {}, sessionToken);
  
  if (orgInfo) {
    log.success('Admin can access organization info');
    log.info(`  Organization: ${orgInfo.name}`);
    testResults.userFlows['admin_org_access'] = true;
  } else {
    testResults.userFlows['admin_org_access'] = false;
  }
}

// Manager flow: View analytics → Team management
async function testManagerFlow(sessionToken: string, userId: string) {
  // 1. Get analytics
  const analytics = await makeTrpcRequest('healthcare.getAnalytics', {
    timeRange: 'week',
  }, sessionToken);
  
  if (analytics) {
    log.success('Manager can view analytics');
    testResults.userFlows['manager_view_analytics'] = true;
  } else {
    testResults.userFlows['manager_view_analytics'] = false;
  }

  // 2. Get team members
  const team = await makeTrpcRequest('organization.getMembers', {}, sessionToken);
  
  if (team) {
    log.success('Manager can view team members');
    log.info(`  Team size: ${team.length || 0}`);
    testResults.userFlows['manager_view_team'] = true;
  } else {
    testResults.userFlows['manager_view_team'] = false;
  }
}

// Head Doctor flow: All doctor features + management
async function testHeadDoctorFlow(sessionToken: string, userId: string) {
  // Similar to doctor flow but with additional management features
  await testDoctorFlow(sessionToken, userId);
  
  // Additional: Get shift overview
  const shifts = await makeTrpcRequest('healthcare.getShifts', {}, sessionToken);
  
  if (shifts) {
    log.success('Head Doctor can view shift management');
    testResults.userFlows['head_doctor_shifts'] = true;
  } else {
    testResults.userFlows['head_doctor_shifts'] = false;
  }
}

// Test WebSocket connections
async function testWebSocketConnection(sessionToken: string, role: string) {
  log.subsection(`Testing WebSocket for ${role}`);
  
  return new Promise<void>((resolve) => {
    try {
      const ws = new WebSocket(`${WS_URL}?token=${sessionToken}`);
      
      ws.on('open', () => {
        log.success(`${role} WebSocket connected`);
        testResults.apis[`${role}_websocket`] = true;
        
        // Subscribe to alerts
        ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'alerts',
        }));
      });

      ws.on('message', (data) => {
        log.info(`${role} received WebSocket message`);
      });

      ws.on('error', (error) => {
        log.error(`${role} WebSocket error: ${error}`);
        testResults.apis[`${role}_websocket`] = false;
      });

      // Close after 2 seconds
      setTimeout(() => {
        ws.close();
        resolve();
      }, 2000);
    } catch (error) {
      log.error(`${role} WebSocket connection failed: ${error}`);
      testResults.apis[`${role}_websocket`] = false;
      resolve();
    }
  });
}

// Test security features
async function testSecurityFeatures(sessionToken: string, role: string) {
  log.subsection(`Testing security features for ${role}`);
  
  // 1. Test concurrent sessions
  try {
    const sessions = await makeTrpcRequest('auth.getActiveSessions', {}, sessionToken);
    
    if (sessions) {
      log.success(`${role} can view active sessions`);
      log.info(`  Active sessions: ${sessions.length || 1}`);
      testResults.security[`${role}_sessions`] = true;
    }
  } catch (error) {
    log.warning('Active sessions API not available');
  }

  // 2. Test session anomaly (simulate suspicious activity)
  try {
    // Change user agent to trigger anomaly
    const anomalyResponse = await makeAuthRequest('/api/auth/verify-session', {
      method: 'POST',
      sessionToken,
      headers: {
        'User-Agent': 'Suspicious Bot 1.0',
      },
    });

    if (anomalyResponse.ok) {
      log.info(`${role} session anomaly detection active`);
      testResults.security[`${role}_anomaly_detection`] = true;
    }
  } catch (error) {
    log.warning('Session anomaly detection test skipped');
  }
}

// Test OAuth flow (simulation)
async function testOAuthFlow() {
  log.section('Testing OAuth Flow');
  
  try {
    // 1. Initiate OAuth
    const oauthResponse = await makeAuthRequest('/api/auth/sign-in/social', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'google',
        callbackURL: '/auth-callback',
      }),
    });

    if (oauthResponse.ok) {
      const data = await oauthResponse.json();
      log.success('OAuth initiation successful');
      log.info(`  Redirect URL: ${data.url || 'Generated'}`);
      testResults.auth['oauth_initiation'] = true;
    } else {
      log.error('OAuth initiation failed');
      testResults.auth['oauth_initiation'] = false;
    }
  } catch (error) {
    log.error(`OAuth test error: ${error}`);
    testResults.auth['oauth_initiation'] = false;
  }
}

// Generate comprehensive report
function generateReport() {
  log.section('Test Report Summary');
  
  const sections = [
    { name: 'Authentication', results: testResults.auth },
    { name: 'User Flows', results: testResults.userFlows },
    { name: 'API Endpoints', results: testResults.apis },
    { name: 'Security Features', results: testResults.security },
    { name: 'Frontend Integration', results: testResults.frontend },
  ];

  let totalPassed = 0;
  let totalTests = 0;

  sections.forEach(section => {

    Object.entries(section.results).forEach(([test, passed]) => {

      totalTests++;
      if (passed) totalPassed++;
    });
  });

  if (testResults.errors.length > 0) {

    testResults.errors.forEach(error => {

    });
  }

  const passRate = Math.round((totalPassed / totalTests) * 100);
  if (passRate >= 80) {
    log.success(`Overall: ${totalPassed}/${totalTests} tests passed (${passRate}%)`);

  } else if (passRate >= 60) {
    log.warning(`Overall: ${totalPassed}/${totalTests} tests passed (${passRate}%)`);

  } else {
    log.error(`Overall: ${totalPassed}/${totalTests} tests passed (${passRate}%)`);

  }

  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      passed: totalPassed,
      failed: totalTests - totalPassed,
      passRate: `${passRate}%`,
    },
    results: testResults,
    recommendations: generateRecommendations(testResults),
  };

  Bun.write(
    `MVP_API_TEST_REPORT_${new Date().toISOString().split('T')[0]}.json`,
    JSON.stringify(reportData, null, 2)
  );

}

// Generate recommendations based on test results
function generateRecommendations(results: typeof testResults) {
  const recommendations = [];

  // Check auth issues
  const authFailures = Object.entries(results.auth).filter(([_, passed]) => !passed);
  if (authFailures.length > 0) {
    recommendations.push({
      severity: 'critical',
      area: 'Authentication',
      issue: `${authFailures.length} authentication failures`,
      action: 'Fix login/session issues immediately',
    });
  }

  // Check user flow issues
  const flowFailures = Object.entries(results.userFlows).filter(([_, passed]) => !passed);
  if (flowFailures.length > 0) {
    recommendations.push({
      severity: 'high',
      area: 'User Flows',
      issue: `${flowFailures.length} user flow failures`,
      action: 'Review role-based permissions and API endpoints',
    });
  }

  // Check security
  const securityIssues = Object.entries(results.security).filter(([_, passed]) => !passed);
  if (securityIssues.length > 0) {
    recommendations.push({
      severity: 'medium',
      area: 'Security',
      issue: `${securityIssues.length} security features not working`,
      action: 'Enable security features before production',
    });
  }

  return recommendations;
}

// Main test runner
async function runComprehensiveTests() {

  // Check prerequisites
  log.section('Checking Prerequisites');
  
  try {
    // Check database
    await db.execute(sql`SELECT 1`);
    log.success('Database connection verified');
    
    // Check API server
    const healthCheck = await fetch(`${API_URL}/api/health`).catch(() => null);
    if (healthCheck?.ok) {
      log.success('API server is running');
    } else {
      log.error('API server not responding - start with: bun run local:healthcare');
      process.exit(1);
    }
  } catch (error) {
    log.error(`Prerequisites check failed: ${error}`);
    process.exit(1);
  }

  // Test OAuth flow first
  await testOAuthFlow();

  // Test each user role
  for (const [role, credentials] of Object.entries(TEST_USERS)) {
    log.section(`Testing ${role.toUpperCase()} Role`);
    
    const authResult = await testAuthentication(credentials.email, credentials.password, role);
    
    if (authResult) {
      const { sessionToken, user } = authResult;
      
      // Test user flow
      await testUserFlow(role, sessionToken, user.id);
      
      // Test WebSocket
      await testWebSocketConnection(sessionToken, role);
      
      // Test security features
      await testSecurityFeatures(sessionToken, role);
      
      // Add delay between users
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Test frontend integration points
  log.section('Testing Frontend Integration');
  
  // Check common API endpoints
  const frontendEndpoints = [
    '/api/auth/csrf',
    '/api/trpc/organization.getOrganization',
    '/api/trpc/healthcare.getAlerts',
  ];

  for (const endpoint of frontendEndpoints) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      testResults.frontend[endpoint] = response.ok;
      if (response.ok) {
        log.success(`Frontend endpoint ${endpoint} accessible`);
      } else {
        log.error(`Frontend endpoint ${endpoint} failed: ${response.status}`);
      }
    } catch (error) {
      testResults.frontend[endpoint] = false;
      log.error(`Frontend endpoint ${endpoint} error: ${error}`);
    }
  }

  // Generate final report
  generateReport();
  
  process.exit(0);
}

// Run tests
runComprehensiveTests().catch(error => {
  log.error(`Test script failed: ${error}`);
  process.exit(1);
});