#!/usr/bin/env bun
/**
 * Test Bearer token authentication for mobile
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testBearerAuth() {
  console.log('Testing Bearer token authentication (for mobile)...\n');
  
  const baseURL = 'http://localhost:8081';
  
  // 1. Sign in to get Bearer token
  console.log('1. Sign in to get Bearer token...');
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
  const token = signInData.token;
  
  console.log('   Sign-in response:');
  console.log('   - Status:', signInResponse.status);
  console.log('   - Token:', token ? token.substring(0, 20) + '...' : 'NOT FOUND');
  console.log('   - Response structure:', Object.keys(signInData));
  
  if (!token) {
    console.error('\n❌ No token returned from sign-in!');
    return;
  }
  
  // 2. Test Bearer auth with get-session endpoint
  console.log('\n2. Testing Bearer auth with /get-session...');
  const bearerResponse = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  console.log('   Status:', bearerResponse.status);
  const sessionData = await bearerResponse.json();
  console.log('   Session data:', JSON.stringify(sessionData, null, 2));
  
  // 3. Test with tRPC getSession endpoint
  console.log('\n3. Testing Bearer auth with tRPC getSession...');
  const trpcResponse = await fetch(`${baseURL}/api/trpc/auth.getSession`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  console.log('   Status:', trpcResponse.status);
  const trpcText = await trpcResponse.text();
  try {
    const trpcData = JSON.parse(trpcText);
    console.log('   tRPC response:', JSON.stringify(trpcData, null, 2));
  } catch (e) {
    console.log('   Raw response:', trpcText);
  }
  
  // 4. Test profile completion check
  console.log('\n4. Profile completion status:');
  if (sessionData.user) {
    console.log('   - needsProfileCompletion:', sessionData.user.needsProfileCompletion);
    console.log('   - role:', sessionData.user.role);
    console.log('   - emailVerified:', sessionData.user.emailVerified);
    console.log('   - organizationId:', sessionData.user.organizationId);
  }
  
  // 5. Test Bearer auth plugin features
  console.log('\n5. Testing Bearer plugin features...');
  
  // Check if we can list sessions
  const sessionsResponse = await fetch(`${baseURL}/api/auth/list-sessions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  console.log('   List sessions status:', sessionsResponse.status);
  if (sessionsResponse.ok) {
    const sessions = await sessionsResponse.json();
    console.log('   Active sessions:', sessions.length || 0);
  }
  
  // Summary
  console.log('\n📊 Bearer Authentication Summary:');
  console.log('   - Bearer token returned on sign-in: ✅');
  console.log('   - Better Auth get-session with Bearer: ' + (bearerResponse.ok ? '✅' : '❌'));
  console.log('   - tRPC getSession with Bearer: ' + (trpcResponse.ok ? '✅' : '❌'));
  console.log('   - Profile completion fields present: ' + (sessionData.user?.needsProfileCompletion !== undefined ? '✅' : '❌'));
  
  console.log('\n💡 Mobile App Requirements:');
  console.log('   1. Store token from sign-in response');
  console.log('   2. Send as "Authorization: Bearer <token>" header');
  console.log('   3. Use /api/auth/get-session for session data');
  console.log('   4. Check needsProfileCompletion field');
}

testBearerAuth();