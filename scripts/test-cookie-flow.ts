#!/usr/bin/env bun
/**
 * Test cookie and session management
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';

async function testCookieFlow() {
  console.log('🍪 Testing Cookie and Session Flow\n');
  
  // Test 1: Check if cookies are enabled
  console.log('1️⃣ Testing cookie support...');
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      credentials: 'include'
    });
    console.log('CORS credentials:', response.headers.get('access-control-allow-credentials'));
    console.log('');
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
  
  // Test 2: Sign in via tRPC and check headers
  console.log('2️⃣ Sign in via tRPC...');
  const signInResponse = await fetch(`${API_URL}/api/trpc/auth.signIn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'demo@example.com',
      password: 'SecurePassword123!'
    }),
    credentials: 'include'
  });
  
  console.log('Status:', signInResponse.status);
  console.log('Headers:');
  signInResponse.headers.forEach((value, key) => {
    if (key.toLowerCase().includes('cookie') || key.toLowerCase() === 'set-cookie') {
      console.log(`  ${key}: ${value}`);
    }
  });
  
  const signInData = await signInResponse.json();
  if (signInData.result?.data?.success) {
    console.log('✅ Sign in successful');
    console.log('Token provided:', signInData.result.data.token ? 'Yes' : 'No');
    
    // Test 3: Try to use the token directly
    if (signInData.result.data.token) {
      console.log('\n3️⃣ Testing with Bearer token...');
      const sessionResponse = await fetch(`${API_URL}/api/trpc/auth.getSession`, {
        headers: {
          'Authorization': `Bearer ${signInData.result.data.token}`
        }
      });
      
      const sessionData = await sessionResponse.json();
      console.log('Session with Bearer token:', sessionData.result?.data ? 'Found' : 'Not found');
    }
    
    // Test 4: Check session without any auth
    console.log('\n4️⃣ Testing session without auth...');
    const bareSessionResponse = await fetch(`${API_URL}/api/trpc/auth.getSession`);
    const bareSessionData = await bareSessionResponse.json();
    console.log('Session without auth:', bareSessionData.result?.data ? 'Found' : 'Not found');
  } else {
    console.log('❌ Sign in failed:', signInData.error?.message);
  }
  
  // Test 5: Try Better Auth endpoints directly
  console.log('\n5️⃣ Testing Better Auth session endpoint...');
  try {
    const betterAuthResponse = await fetch(`${API_URL}/api/auth/session`, {
      credentials: 'include'
    });
    console.log('Better Auth session status:', betterAuthResponse.status);
    const text = await betterAuthResponse.text();
    console.log('Response:', text.substring(0, 100) + '...');
  } catch (error) {
    console.error('Better Auth test failed:', error.message);
  }
}

testCookieFlow().catch(console.error);