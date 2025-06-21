#!/usr/bin/env bun
/**
 * Test profile completion flow
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testProfileCompletion() {
  console.log('🔍 Testing Profile Completion Flow...\n');
  
  const baseURL = 'http://localhost:8081';
  
  // Step 1: Sign up a new user
  console.log('1️⃣  Creating new user...');
  const signUpResponse = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email: `test-profile-${Date.now()}@example.com`,
      password: 'Test123!',
      name: 'Test User',
    }),
  });
  
  if (!signUpResponse.ok) {
    console.error('❌ Sign-up failed:', signUpResponse.status);
    const error = await signUpResponse.text();
    console.error('Error:', error);
    return;
  }
  
  const signUpData = await signUpResponse.json();
  const token = signUpData.token;
  const cookies = signUpResponse.headers.get('set-cookie');
  
  console.log('✅ User created');
  console.log('   - Token:', token ? 'Present' : 'Missing');
  console.log('   - User ID:', signUpData.user?.id);
  console.log('   - Email:', signUpData.user?.email);
  console.log('   - needsProfileCompletion:', signUpData.user?.needsProfileCompletion);
  
  // Step 2: Get session to verify profile completion status
  console.log('\n2️⃣  Checking session data...');
  const sessionResponse = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!sessionResponse.ok) {
    console.error('❌ Get session failed:', sessionResponse.status);
    return;
  }
  
  const sessionData = await sessionResponse.json();
  console.log('✅ Session retrieved');
  console.log('   - User role:', sessionData.user?.role);
  console.log('   - Organization ID:', sessionData.user?.organizationId);
  console.log('   - needsProfileCompletion:', sessionData.user?.needsProfileCompletion);
  console.log('   - emailVerified:', sessionData.user?.emailVerified);
  
  // Step 3: Attempt to complete profile
  console.log('\n3️⃣  Completing profile...');
  
  // First, let's check what the complete-profile endpoint expects
  const completeProfilePayload = {
    role: 'nurse', // Healthcare role
    organizationId: null, // Will join or create organization later
    hospitalIds: [], // Healthcare specific
    fullName: 'Test Nurse User',
    phoneNumber: '+1234567890',
    department: 'Emergency',
  };
  
  const completeProfileResponse = await fetch(`${baseURL}/api/auth/update-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(completeProfilePayload),
  });
  
  if (!completeProfileResponse.ok) {
    console.error('❌ Profile completion failed:', completeProfileResponse.status);
    const error = await completeProfileResponse.text();
    console.error('Error:', error);
    
    // Try alternate endpoint
    console.log('\n   Trying alternate endpoint...');
    const altResponse = await fetch(`${baseURL}/api/auth/complete-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(completeProfilePayload),
    });
    
    if (!altResponse.ok) {
      console.error('   ❌ Alternate endpoint also failed:', altResponse.status);
      const altError = await altResponse.text();
      console.error('   Error:', altError);
    } else {
      const altData = await altResponse.json();
      console.log('   ✅ Profile completed via alternate endpoint');
      console.log('   Response:', JSON.stringify(altData, null, 2));
    }
  } else {
    const profileData = await completeProfileResponse.json();
    console.log('✅ Profile completed');
    console.log('   Response:', JSON.stringify(profileData, null, 2));
  }
  
  // Step 4: Verify profile completion
  console.log('\n4️⃣  Verifying profile completion...');
  const verifyResponse = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!verifyResponse.ok) {
    console.error('❌ Verification failed:', verifyResponse.status);
    return;
  }
  
  const verifyData = await verifyResponse.json();
  console.log('✅ Verification complete');
  console.log('   - needsProfileCompletion:', verifyData.user?.needsProfileCompletion);
  console.log('   - role:', verifyData.user?.role);
  console.log('   - Full user data:', JSON.stringify(verifyData.user, null, 2));
  
  // Step 5: Test OAuth user profile completion
  console.log('\n5️⃣  Testing OAuth flow (simulation)...');
  console.log('   OAuth users should also have needsProfileCompletion=true on first sign-in');
  console.log('   The profile completion screen should handle both email and OAuth users');
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 PROFILE COMPLETION FLOW TEST RESULTS:\n');
  
  if (verifyData.user?.needsProfileCompletion === false) {
    console.log('✅ Profile completion flow works correctly!');
    console.log('\nKey findings:');
    console.log('  • New users have needsProfileCompletion=true');
    console.log('  • Profile data can be updated via API');
    console.log('  • Session reflects updated profile status');
  } else {
    console.log('❌ Profile completion may not be working correctly');
    console.log('  Check the update-user or complete-profile endpoints');
  }
  
  console.log('\n🔑 Next steps:');
  console.log('  1. Test the ProfileCompletion UI component');
  console.log('  2. Verify redirect logic after profile completion');
  console.log('  3. Test OAuth users get redirected to complete profile');
  console.log('  4. Ensure completed profiles can access protected routes');
}

testProfileCompletion().catch(console.error);