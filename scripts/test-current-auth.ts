#!/usr/bin/env node
/**
 * Test current authentication state
 */

async function testAuth() {
  console.log('🔍 Testing current authentication state...\n');
  
  const API_URL = 'http://localhost:8081';
  
  try {
    // 1. Test if we have any existing session
    console.log('1. Testing existing session...');
    const sessionResponse = await fetch(`${API_URL}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        'Cookie': 'better-auth.session_token=test', // Dummy cookie to test
      },
    });
    
    console.log('   Status:', sessionResponse.status);
    const sessionData = await sessionResponse.json();
    console.log('   Response:', JSON.stringify(sessionData, null, 2));
    
    // 2. Test login with existing test user
    console.log('\n2. Testing login...');
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
    
    console.log('   Status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('   Response:', JSON.stringify(loginData, null, 2));
    
    // Extract session token from cookie header
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('\n   Cookies:', cookies);
    
    const sessionToken = cookies?.match(/better-auth\.session_token=([^;]+)/)?.[1];
    console.log('   Session Token:', sessionToken ? `${sessionToken.substring(0, 20)}...` : 'None');
    
    if (sessionToken) {
      // 3. Test authenticated endpoint
      console.log('\n3. Testing authenticated endpoint...');
      
      // Test with cookie
      const authTestCookie = await fetch(`${API_URL}/api/trpc/healthcare.getOnDutyStatus?input=%7B%7D`, {
        headers: {
          'Cookie': `better-auth.session_token=${sessionToken}`,
        },
      });
      
      console.log('   With Cookie - Status:', authTestCookie.status);
      const cookieData = await authTestCookie.json();
      console.log('   Response:', JSON.stringify(cookieData, null, 2));
      
      // Test with Bearer token
      const authTestBearer = await fetch(`${API_URL}/api/trpc/healthcare.getOnDutyStatus?input=%7B%7D`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      
      console.log('\n   With Bearer - Status:', authTestBearer.status);
      const bearerData = await authTestBearer.json();
      console.log('   Response:', JSON.stringify(bearerData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAuth();