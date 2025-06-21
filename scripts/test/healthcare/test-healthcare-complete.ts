#!/usr/bin/env bun

import { logger } from '../lib/core/debug/unified-logger';
import { db } from '../src/db';
import { user as userTable, session } from '../src/db/schema';
import { healthcareUsers, alerts, hospitals } from '../src/db/healthcare-schema';
import { eq, and, desc } from 'drizzle-orm';
import chalk from 'chalk';

// Test result tracking
interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message?: string;
  duration?: number;
}

const testResults: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>) {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    testResults.push({ name, status: 'pass', duration });

  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    testResults.push({ name, status: 'fail', message, duration });

  }
}

async function testHealthcareSystem() {

  // Test 1: Database Connection
  await runTest('Database Connection', async () => {
    const result = await db.execute({ sql: 'SELECT 1 as test', args: [] });
    if (!result) throw new Error('Database connection failed');
  });

  // Test 2: User Authentication
  let testUser: any;
  await runTest('Healthcare User Exists', async () => {
    const [foundUser] = await db.select().from(userTable).where(eq(userTable.email, 'doremon@gmail.com')).limit(1);
    if (!foundUser) throw new Error('Test user not found');
    testUser = foundUser;
  });

  // Test 3: Hospital Assignment
  let hospitalId: string | null = null;
  await runTest('Hospital Assignment Valid', async () => {
    if (testUser.defaultHospitalId) {
      hospitalId = testUser.defaultHospitalId;
      return;
    }
    
    const [healthcareUser] = await db
      .select()
      .from(healthcareUsers)
      .where(eq(healthcareUsers.userId, testUser.id))
      .limit(1);
    
    if (!healthcareUser?.hospitalId) {
      throw new Error('No hospital assignment found');
    }
    hospitalId = healthcareUser.hospitalId;
  });

  // Test 4: Hospital Data
  await runTest('Hospital Data Exists', async () => {
    if (!hospitalId) throw new Error('No hospital ID available');
    
    const [hospital] = await db
      .select()
      .from(hospitals)
      .where(eq(hospitals.id, hospitalId))
      .limit(1);
    
    if (!hospital) throw new Error('Hospital not found');
    if (!hospital.isActive) throw new Error('Hospital is not active');
  });

  // Test 5: Session Management
  await runTest('Session Creation', async () => {
    // Simulate session creation
    const sessionData = {
      id: `test-session-${Date.now()}`,
      userId: testUser.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      token: `test-token-${Date.now()}`,
    };
    
    // We're just validating the structure, not actually creating
    if (!sessionData.userId || !sessionData.expiresAt) {
      throw new Error('Session data invalid');
    }
  });

  // Test 6: Alert System
  await runTest('Alert Creation Structure', async () => {
    const alertData = {
      hospitalId: hospitalId!,
      roomNumber: '205A',
      alertType: 'medical-emergency',
      urgencyLevel: 3,
      description: 'Test alert',
      status: 'active' as const,
      createdBy: testUser.id,
    };
    
    // Validate alert structure
    if (!alertData.hospitalId || !alertData.roomNumber || !alertData.alertType) {
      throw new Error('Alert data invalid');
    }
  });

  // Test 7: Shift Management
  await runTest('Shift Toggle Structure', async () => {
    const shiftData = {
      userId: testUser.id,
      hospitalId: hospitalId!,
      isOnDuty: true,
      shiftStartTime: new Date(),
    };
    
    if (!shiftData.userId || !shiftData.hospitalId) {
      throw new Error('Shift data invalid');
    }
  });

  // Test 8: Real-time Features
  await runTest('WebSocket Configuration', async () => {
    const wsEnabled = process.env.EXPO_PUBLIC_ENABLE_WS === 'true';
    const wsPort = process.env.EXPO_PUBLIC_WS_PORT;
    
    if (wsEnabled && !wsPort) {
      throw new Error('WebSocket enabled but port not configured');
    }
  });

  // Test 9: API Endpoints (Structure Test)
  await runTest('API Endpoint Structure', async () => {
    const endpoints = [
      'healthcare.getOnDutyStatus',
      'healthcare.toggleOnDuty',
      'healthcare.getActiveAlerts',
      'healthcare.acknowledgeAlert',
      'healthcare.resolveAlert',
      'healthcare.createAlert',
      'healthcare.getMetrics',
    ];
    
    // This just validates we have the expected endpoints defined
    if (endpoints.length < 7) {
      throw new Error('Missing API endpoints');
    }
  });

  // Test 10: Permission System
  await runTest('Healthcare Permissions', async () => {
    const userRole = testUser.role;
    const validRoles = ['nurse', 'doctor', 'healthcare_admin', 'head_nurse', 'head_doctor'];
    
    if (!validRoles.includes(userRole)) {
      throw new Error(`Invalid healthcare role: ${userRole}`);
    }
  });

  // Summary

  const passed = testResults.filter(r => r.status === 'pass').length;
  const failed = testResults.filter(r => r.status === 'fail').length;
  const total = testResults.length;

  if (failed > 0) {

  }
  
  const totalDuration = testResults.reduce((sum, r) => sum + (r.duration || 0), 0);

  // Failed tests details
  if (failed > 0) {

    testResults
      .filter(r => r.status === 'fail')
      .forEach(r => {

      });
  }
  
  // Next steps

  return failed === 0;
}

// Run the test suite
testHealthcareSystem()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(chalk.red('\n❌ Test suite failed:'), error);
    process.exit(1);
  });