#!/usr/bin/env bun
/**
 * Simple test for profile completion flow
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testProfileCompletionSimple() {
  console.log('🔍 Testing Profile Completion Flow (Simple)...\n');
  
  const baseURL = 'http://localhost:8081';
  
  // Step 1: Sign in with existing demo user
  console.log('1️⃣  Signing in with demo user...');
  const signInResponse = await fetch(`${baseURL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email: 'demo@example.com',
      password: 'Demo123!@#$%^',
    }),
  });
  
  if (!signInResponse.ok) {
    console.error('❌ Sign-in failed:', signInResponse.status);
    const error = await signInResponse.text();
    console.error('Error:', error);
    return;
  }
  
  const signInData = await signInResponse.json();
  const token = signInData.token;
  
  console.log('✅ Signed in successfully');
  console.log('   - Token:', token ? 'Present' : 'Missing');
  console.log('   - User ID:', signInData.user?.id);
  console.log('   - needsProfileCompletion:', signInData.user?.needsProfileCompletion);
  
  // Step 2: Get session to check current state
  console.log('\n2️⃣  Getting current session...');
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
  console.log('   - User role:', sessionData?.user?.role);
  console.log('   - needsProfileCompletion:', sessionData?.user?.needsProfileCompletion);
  console.log('   - organizationId:', sessionData?.user?.organizationId);
  
  // Step 3: Test Better Auth update-user endpoint
  console.log('\n3️⃣  Testing Better Auth update-user endpoint...');
  const updateResponse = await fetch(`${baseURL}/api/auth/update-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      needsProfileCompletion: false,
      role: 'nurse',
      department: 'Emergency Room',
      phoneNumber: '+1234567890',
    }),
  });
  
  console.log('   Update response status:', updateResponse.status);
  const updateData = await updateResponse.json();
  console.log('   Update response:', JSON.stringify(updateData, null, 2));
  
  // Step 4: Check available Better Auth endpoints
  console.log('\n4️⃣  Checking available Better Auth endpoints...');
  const endpoints = [
    '/api/auth/update-profile',
    '/api/auth/update',
    '/api/auth/user/update',
  ];
  
  for (const endpoint of endpoints) {
    const testResponse = await fetch(`${baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ test: true }),
    });
    console.log(`   ${endpoint}: ${testResponse.status}`);
  }
  
  // Step 5: Test tRPC updateProfile endpoint
  console.log('\n5️⃣  Testing tRPC updateProfile endpoint...');
  const updateProfileResponse = await fetch(`${baseURL}/api/trpc/auth.updateProfile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Demo Nurse Updated',
      role: 'nurse',
      department: 'ICU',
      phoneNumber: '+9876543210',
    }),
  });
  
  if (updateProfileResponse.ok) {
    const updateProfileData = await updateProfileResponse.json();
    console.log('✅ Profile updated via tRPC');
    console.log('   Response:', JSON.stringify(updateProfileData, null, 2));
  } else {
    console.error('❌ tRPC updateProfile failed:', updateProfileResponse.status);
    const error = await updateProfileResponse.text();
    console.error('   Error:', error);
  }
  
  // Step 6: Verify changes
  console.log('\n6️⃣  Verifying profile changes...');
  const verifyResponse = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (verifyResponse.ok) {
    const verifyData = await verifyResponse.json();
    console.log('✅ Final session state:');
    console.log('   - needsProfileCompletion:', verifyData?.user?.needsProfileCompletion);
    console.log('   - role:', verifyData?.user?.role);
    console.log('   - department:', verifyData?.user?.department);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 PROFILE COMPLETION TEST SUMMARY:\n');
  console.log('Key findings:');
  console.log('  • Better Auth update-user endpoint exists but has limited functionality');
  console.log('  • tRPC updateProfile endpoint should be used for profile updates');
  console.log('  • needsProfileCompletion flag needs to be manually set to false');
  console.log('  • Use tRPC completeProfile for new users/OAuth users');
  console.log('  • Use tRPC updateProfile for existing users');
}

testProfileCompletionSimple().catch(console.error);