#!/usr/bin/env bun
/**
 * Verify session persistence is working correctly
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function verifySessionPersistence() {
  console.log('🔍 Verifying Session Persistence...\n');
  
  const baseURL = 'http://localhost:8081';
  let allTestsPassed = true;
  
  // Test 1: Create a new session
  console.log('1️⃣  Creating new session...');
  const signInResponse = await fetch(`${baseURL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'Test123!',
    }),
  });
  
  if (!signInResponse.ok) {
    console.error('❌ Sign-in failed:', signInResponse.status);
    allTestsPassed = false;
    return;
  }
  
  const signInData = await signInResponse.json();
  const token = signInData.token;
  const cookies = signInResponse.headers.get('set-cookie');
  
  console.log('✅ Session created');
  console.log('   - Token:', token ? 'Present' : 'Missing');
  console.log('   - Cookies:', cookies ? 'Set' : 'Not set');
  
  // Test 2: Verify cookie persistence
  console.log('\n2️⃣  Testing cookie persistence...');
  const cookieSession = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: {
      'Cookie': cookies || '',
    },
    credentials: 'include',
  });
  
  const cookieData = await cookieSession.json();
  const cookieWorks = cookieSession.ok && cookieData?.session?.token;
  console.log(cookieWorks ? '✅ Cookie session works' : '❌ Cookie session failed');
  if (!cookieWorks) allTestsPassed = false;
  
  // Test 3: Verify Bearer token persistence
  console.log('\n3️⃣  Testing Bearer token persistence...');
  const bearerSession = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const bearerData = await bearerSession.json();
  const bearerWorks = bearerSession.ok && bearerData?.session?.token;
  console.log(bearerWorks ? '✅ Bearer session works' : '❌ Bearer session failed');
  if (!bearerWorks) allTestsPassed = false;
  
  // Test 4: Test session data consistency
  console.log('\n4️⃣  Checking session data consistency...');
  if (cookieData?.session && bearerData?.session) {
    const cookieSessionId = cookieData.session.id;
    const bearerSessionId = bearerData.session.id;
    const idsMatch = cookieSessionId === bearerSessionId;
    
    console.log(`   Cookie session ID: ${cookieSessionId}`);
    console.log(`   Bearer session ID: ${bearerSessionId}`);
    console.log(idsMatch ? '✅ Session IDs match' : '❌ Session IDs differ');
    if (!idsMatch) allTestsPassed = false;
  }
  
  // Test 5: Test profile completion fields
  console.log('\n5️⃣  Checking profile completion fields...');
  const sessionUser = bearerData?.user || cookieData?.user;
  if (sessionUser) {
    console.log('   User data:');
    console.log(`     - needsProfileCompletion: ${sessionUser.needsProfileCompletion}`);
    console.log(`     - role: ${sessionUser.role}`);
    console.log(`     - organizationId: ${sessionUser.organizationId}`);
    console.log(`     - emailVerified: ${sessionUser.emailVerified}`);
    
    const hasRequiredFields = 
      sessionUser.needsProfileCompletion !== undefined &&
      sessionUser.role !== undefined;
    
    console.log(hasRequiredFields ? '✅ Required fields present' : '❌ Missing required fields');
    if (!hasRequiredFields) allTestsPassed = false;
  }
  
  // Test 6: Sign out
  console.log('\n6️⃣  Testing sign-out...');
  const signOutResponse = await fetch(`${baseURL}/api/auth/sign-out`, {
    method: 'POST',
    headers: {
      'Cookie': cookies || '',
    },
    credentials: 'include',
  });
  
  const signOutWorks = signOutResponse.ok;
  console.log(signOutWorks ? '✅ Sign-out successful' : '❌ Sign-out failed');
  if (!signOutWorks) allTestsPassed = false;
  
  // Test 7: Verify session is cleared
  console.log('\n7️⃣  Verifying session is cleared...');
  const afterSignOut = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: {
      'Cookie': cookies || '',
    },
    credentials: 'include',
  });
  
  const afterData = await afterSignOut.json();
  const sessionCleared = !afterData?.session;
  console.log(sessionCleared ? '✅ Session cleared after sign-out' : '❌ Session still exists');
  if (!sessionCleared) allTestsPassed = false;
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 SESSION PERSISTENCE VERIFICATION RESULTS:\n');
  
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED! Session persistence is working correctly.\n');
    console.log('Summary:');
    console.log('  • Web browsers use cookies automatically');
    console.log('  • Mobile apps use Bearer tokens');
    console.log('  • Profile completion fields are available');
    console.log('  • Sign-out properly clears sessions');
  } else {
    console.log('❌ Some tests failed. Session persistence needs attention.\n');
  }
  
  console.log('\n🔑 Key Points:');
  console.log('  1. Sign-in returns token at root level');
  console.log('  2. Get-session endpoint is /api/auth/get-session');
  console.log('  3. Web: cookies handled automatically');
  console.log('  4. Mobile: must store token and send as Bearer');
}

verifySessionPersistence();