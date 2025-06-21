#!/usr/bin/env node
/**
 * Test current authentication state
 */

async function testAuth() {

  const API_URL = 'http://localhost:8081';
  
  try {
    // 1. Test if we have any existing session

    const sessionResponse = await fetch(`${API_URL}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        'Cookie': 'better-auth.session_token=test', // Dummy cookie to test
      },
    });

    const sessionData = await sessionResponse.json();

    // 2. Test login with existing test user

    const loginResponse = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'doctor.test@example.com',
        password: 'test123456',
      }),
    });

    const loginData = await loginResponse.json();

    // Extract session token from cookie header
    const cookies = loginResponse.headers.get('set-cookie');

    const sessionToken = cookies?.match(/better-auth\.session_token=([^;]+)/)?.[1];

    if (sessionToken) {
      // 3. Test authenticated endpoint

      // Test with cookie
      const authTestCookie = await fetch(`${API_URL}/api/trpc/healthcare.getOnDutyStatus?input=%7B%7D`, {
        headers: {
          'Cookie': `better-auth.session_token=${sessionToken}`,
        },
      });

      const cookieData = await authTestCookie.json();

      // Test with Bearer token
      const authTestBearer = await fetch(`${API_URL}/api/trpc/healthcare.getOnDutyStatus?input=%7B%7D`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      const bearerData = await authTestBearer.json();

    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAuth();