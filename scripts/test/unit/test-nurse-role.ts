#!/usr/bin/env bun
import { createTRPCMsw } from 'msw-trpc';
import { type AppRouter } from '@/src/server/routers';

// Force local database connection
process.env.APP_ENV = 'local';
process.env.DATABASE_URL = 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';

const API_URL = 'http://localhost:8081';
const TEST_USER = {
  email: 'doremon@gmail.com',
  name: 'Nurse Doremon',
  role: 'nurse',
};

async function testNurseRole() {

  try {
    // 1. Test Authentication

    const signInResponse = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: 'any-password', // Using dummy password
      }),
    });
    
    const authData = await signInResponse.json();
    
    if (!signInResponse.ok) {

      // Try to create the user first
      const signUpResponse = await fetch(`${API_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: 'password123',
          name: TEST_USER.name,
        }),
      });
      
      if (!signUpResponse.ok) {
        console.error('   ❌ Failed to create user:', await signUpResponse.text());
        return;
      }

    } else {

    }
    
    // Get session cookie
    const cookies = signInResponse.headers.get('set-cookie') || '';
    const sessionCookie = cookies.split(';')[0];
    
    // 2. Test Healthcare Dashboard Access

    const dashboardResponse = await fetch(`${API_URL}/api/trpc/healthcare.getDashboardData`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
    });
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();

    } else {

    }
    
    // 3. Test Alert Management

    // Get active alerts
    const alertsResponse = await fetch(`${API_URL}/api/trpc/healthcare.getActiveAlerts?input={}`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
    });
    
    if (alertsResponse.ok) {
      const alertsData = await alertsResponse.json();
      const alerts = alertsData.result?.data || [];

      if (alerts.length > 0) {

        alerts.slice(0, 3).forEach((alert: any, i: number) => {

        });
      }
    } else {

    }
    
    // 4. Test Shift Management

    // Check current shift status
    const shiftStatusResponse = await fetch(`${API_URL}/api/trpc/healthcare.getShiftStatus`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
    });
    
    if (shiftStatusResponse.ok) {
      const shiftData = await shiftStatusResponse.json();
      const isOnDuty = shiftData.result?.data?.isOnDuty || false;

      if (shiftData.result?.data?.shiftStart) {

      }
    } else {

    }
    
    // 5. Test Alert Creation (if on duty)

    const createAlertResponse = await fetch(`${API_URL}/api/trpc/healthcare.createAlert`, {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          roomNumber: '204',
          alertType: 'medical_emergency',
          urgencyLevel: 3,
          description: 'Test alert from nurse role test',
        },
      }),
    });
    
    if (createAlertResponse.ok) {
      const alertData = await createAlertResponse.json();

    } else {
      const errorText = await createAlertResponse.text();

    }
    
    // 6. Test Permission Restrictions

    // Try to access admin-only endpoint
    const adminResponse = await fetch(`${API_URL}/api/trpc/admin.getUsers`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
    });
    
    if (adminResponse.ok) {

    } else {

    }
    
    // Summary

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Run the test
testNurseRole();