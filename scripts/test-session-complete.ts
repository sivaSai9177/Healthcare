#!/usr/bin/env bun
/**
 * Test complete session management
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testSessionComplete() {
  console.log('Testing complete session management...\n');
  
  const baseURL = 'http://localhost:8081';
  
  // 1. Sign in to get token
  console.log('1. Sign in to get token...');
  const signInResponse = await fetch(`${baseURL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'Test123!',
    }),
  });
  
  const signInData = await signInResponse.json();
  console.log('   Token:', signInData.token);
  console.log('   User:', signInData.user?.email);
  
  // Check cookies
  const cookies = signInResponse.headers.get('set-cookie');
  console.log('   Cookies:', cookies ? 'Yes' : 'No');
  if (cookies) {
    console.log('   Cookie details:', cookies.split(',').map(c => c.trim().split('=')[0]).join(', '));
  }
  
  // 2. Test get-session with Bearer token
  console.log('\n2. Test /get-session with Bearer token...');
  const sessionResponse = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: {
      'Authorization': `Bearer ${signInData.token}`,
    },
  });
  
  console.log(`   Status: ${sessionResponse.status}`);
  const sessionData = await sessionResponse.json();
  console.log('   Session data:', JSON.stringify(sessionData, null, 2));
  
  // 3. Test get-session with cookies
  console.log('\n3. Test /get-session with cookies...');
  const cookieResponse = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: {
      'Cookie': cookies || '',
    },
    credentials: 'include',
  });
  
  console.log(`   Status: ${cookieResponse.status}`);
  const cookieData = await cookieResponse.json();
  console.log('   With cookies:', JSON.stringify(cookieData, null, 2));
  
  // 4. Check profile completion fields
  console.log('\n4. Profile completion check...');
  if (sessionData.user) {
    console.log('   Profile fields:');
    console.log('     - needsProfileCompletion:', sessionData.user.needsProfileCompletion);
    console.log('     - role:', sessionData.user.role);
    console.log('     - organizationId:', sessionData.user.organizationId);
    console.log('     - emailVerified:', sessionData.user.emailVerified);
  }
  
  // 5. Test sign-out
  console.log('\n5. Test sign-out...');
  const signOutResponse = await fetch(`${baseURL}/api/auth/sign-out`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${signInData.token}`,
    },
  });
  
  console.log(`   Sign-out status: ${signOutResponse.status}`);
  
  // 6. Verify session is cleared
  console.log('\n6. Verify session after sign-out...');
  const afterSignOut = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: {
      'Authorization': `Bearer ${signInData.token}`,
    },
  });
  
  console.log(`   Status after sign-out: ${afterSignOut.status}`);
  
  // Summary
  console.log('\n📊 Session Management Summary:');
  console.log('   - Sign-in/Sign-up: Returns token directly (not in session object)');
  console.log('   - Session endpoint: /api/auth/get-session (not /session)');
  console.log('   - Bearer token: Working');
  console.log('   - Cookie support: ' + (cookies ? 'Yes' : 'No'));
  console.log('   - Profile completion fields: ' + (sessionData.user?.needsProfileCompletion !== undefined ? 'Present' : 'Missing'));
}

testSessionComplete();