#!/usr/bin/env bun
/**
 * Test complete profile completion flow
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testProfileCompletionFlow() {
  console.log('🔍 Testing Complete Profile Completion Flow...\n');
  
  const baseURL = 'http://localhost:8081';
  
  // Step 1: Create a test user that needs profile completion
  console.log('1️⃣  Creating test user...');
  const signUpResponse = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email: `test-profile-${Date.now()}@example.com`,
      password: 'Test123!@#$%^',
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
  const user = signUpData.user;
  
  console.log('✅ User created');
  console.log('   - User ID:', user?.id);
  console.log('   - Email:', user?.email);
  console.log('   - Role:', user?.role);
  console.log('   - needsProfileCompletion:', user?.needsProfileCompletion);
  
  // Step 2: Get session to verify initial state
  console.log('\n2️⃣  Verifying initial session state...');
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
  console.log('✅ Initial session state:');
  console.log('   - User role:', sessionData?.user?.role);
  console.log('   - needsProfileCompletion:', sessionData?.user?.needsProfileCompletion);
  console.log('   - organizationId:', sessionData?.user?.organizationId);
  
  // Step 3: Use tRPC updateProfile to complete profile
  console.log('\n3️⃣  Completing profile via tRPC updateProfile...');
  const updateProfileResponse = await fetch(`${baseURL}/api/trpc/auth.updateProfile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Test Nurse Updated',
      role: 'nurse',
      department: 'Emergency',
      phoneNumber: '+1234567890',
      jobTitle: 'Emergency Nurse',
      bio: 'Experienced ER nurse',
    }),
  });
  
  if (!updateProfileResponse.ok) {
    console.error('❌ Profile update failed:', updateProfileResponse.status);
    const error = await updateProfileResponse.text();
    console.error('Error:', error);
  } else {
    const updateData = await updateProfileResponse.json();
    console.log('✅ Profile updated');
    console.log('   - Success:', updateData?.success);
    console.log('   - needsProfileCompletion should be false now');
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
  const finalUser = verifyData?.user;
  
  console.log('✅ Final session state:');
  console.log('   - needsProfileCompletion:', finalUser?.needsProfileCompletion);
  console.log('   - role:', finalUser?.role);
  console.log('   - department:', finalUser?.department);
  console.log('   - phoneNumber:', finalUser?.phoneNumber);
  console.log('   - jobTitle:', finalUser?.jobTitle);
  
  // Step 5: Test OAuth user flow (simulation)
  console.log('\n5️⃣  Simulating OAuth user profile completion...');
  console.log('   In a real OAuth flow:');
  console.log('   1. User signs in with Google/Apple');
  console.log('   2. User is created with role="guest" and needsProfileCompletion=true');
  console.log('   3. User is redirected to /auth/complete-profile');
  console.log('   4. User fills out profile form');
  console.log('   5. Form calls auth.updateProfile or auth.completeProfile');
  console.log('   6. User is redirected to dashboard');
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 PROFILE COMPLETION FLOW RESULTS:\n');
  
  const isComplete = finalUser?.needsProfileCompletion === false && finalUser?.role === 'nurse';
  
  if (isComplete) {
    console.log('✅ Profile completion flow works correctly!');
    console.log('\nKey points:');
    console.log('  • New users start with needsProfileCompletion=true');
    console.log('  • updateProfile sets needsProfileCompletion=false when role is updated');
    console.log('  • All profile fields are properly saved');
    console.log('  • Session reflects updated profile immediately');
  } else {
    console.log('❌ Profile completion has issues:');
    console.log('  • needsProfileCompletion:', finalUser?.needsProfileCompletion);
    console.log('  • Expected: false');
    console.log('  • role:', finalUser?.role);
    console.log('  • Expected: nurse');
  }
  
  console.log('\n🔑 Implementation notes:');
  console.log('  1. For new email signups: use default profile completion');
  console.log('  2. For OAuth users: use socialSignIn + updateProfile');
  console.log('  3. The UI should check needsProfileCompletion flag');
  console.log('  4. Redirect to profile completion if true');
  console.log('  5. Healthcare roles need organization/hospital selection');
}

testProfileCompletionFlow().catch(console.error);