#!/usr/bin/env node
/**
 * Simple API test for shift management
 */

async function testShiftAPI() {
  console.log('🏥 Testing Shift Management API...\n');
  
  const API_URL = 'http://localhost:8081';
  const testEmail = 'doctor.test@example.com';
  const testPassword = 'test123456';
  
  try {
    // First login to get session token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    
    if (!loginResponse.ok) {
      console.log('Login failed, trying to create account...');
      
      // Try to sign up
      const signupResponse = await fetch(`${API_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Dr. Test User',
        }),
      });
      
      if (!signupResponse.ok) {
        throw new Error(`Signup failed: ${await signupResponse.text()}`);
      }
      
      console.log('✅ Account created');
      // Login again
      const retryLogin = await fetch(`${API_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });
      
      if (!retryLogin.ok) {
        throw new Error(`Login failed after signup: ${await retryLogin.text()}`);
      }
      
      const loginData = await retryLogin.json();
      const sessionToken = retryLogin.headers.get('set-cookie')?.match(/better-auth.session_token=([^;]+)/)?.[1];
      
      if (!sessionToken) {
        throw new Error('No session token received');
      }
      
      console.log('✅ Logged in successfully');
      console.log(`   User: ${loginData.user?.name} (${loginData.user?.email})`);
      
      // Test shift status endpoint
      console.log('\n2. Testing getOnDutyStatus...');
      const statusResponse = await fetch(`${API_URL}/api/trpc/healthcare.getOnDutyStatus?input=%7B%7D`, {
        headers: {
          'Cookie': `better-auth.session_token=${sessionToken}`,
        },
      });
      
      const statusData = await statusResponse.json();
      console.log('Response:', JSON.stringify(statusData, null, 2));
      
    } else {
      const loginData = await loginResponse.json();
      const sessionToken = loginResponse.headers.get('set-cookie')?.match(/better-auth.session_token=([^;]+)/)?.[1];
      
      if (!sessionToken) {
        throw new Error('No session token received');
      }
      
      console.log('✅ Logged in successfully');
      console.log(`   User: ${loginData.user?.name} (${loginData.user?.email})`);
      
      // Test shift status endpoint
      console.log('\n2. Testing getOnDutyStatus...');
      const statusResponse = await fetch(`${API_URL}/api/trpc/healthcare.getOnDutyStatus?input=%7B%7D`, {
        headers: {
          'Cookie': `better-auth.session_token=${sessionToken}`,
        },
      });
      
      const statusData = await statusResponse.json();
      console.log('Response:', JSON.stringify(statusData, null, 2));
      
      // Test toggle shift
      console.log('\n3. Testing toggleOnDuty...');
      const toggleResponse = await fetch(`${API_URL}/api/trpc/healthcare.toggleOnDuty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `better-auth.session_token=${sessionToken}`,
        },
        body: JSON.stringify({
          json: {
            isOnDuty: true,
            handoverNotes: 'Starting shift - test',
          },
        }),
      });
      
      const toggleData = await toggleResponse.json();
      console.log('Toggle Response:', JSON.stringify(toggleData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testShiftAPI();