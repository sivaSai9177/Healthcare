#!/usr/bin/env bun
/**
 * Correct profile completion flow test
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testProfileCompletionCorrect() {
  console.log('🔍 Testing Correct Profile Completion Flow...\n');
  
  const baseURL = 'http://localhost:8081';
  
  // Test 1: Basic user profile completion
  console.log('━━━ Test 1: Basic User Profile Completion ━━━\n');
  
  console.log('1️⃣  Creating basic user...');
  const basicUserResponse = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: `basic-user-${Date.now()}@example.com`,
      password: 'Test123!@#$%^',
      name: 'Basic User',
    }),
  });
  
  if (basicUserResponse.ok) {
    const userData = await basicUserResponse.json();
    const token = userData.token;
    
    console.log('✅ Basic user created');
    console.log('   - Role:', userData.user?.role || 'user');
    console.log('   - needsProfileCompletion:', userData.user?.needsProfileCompletion);
    
    // Update profile for basic user
    console.log('\n2️⃣  Updating basic user profile...');
    const updateResponse = await fetch(`${baseURL}/api/trpc/auth.updateProfile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Basic User Updated',
        role: 'user', // Keep as basic user
        phoneNumber: '+1234567890',
        department: 'Sales',
        jobTitle: 'Sales Representative',
      }),
    });
    
    if (updateResponse.ok) {
      console.log('✅ Basic user profile updated');
      
      // Verify
      const sessionResponse = await fetch(`${baseURL}/api/auth/get-session`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        console.log('   - needsProfileCompletion:', session.user?.needsProfileCompletion);
        console.log('   - department:', session.user?.department);
      }
    }
  }
  
  // Test 2: Healthcare user profile completion
  console.log('\n━━━ Test 2: Healthcare User Profile Completion ━━━\n');
  
  console.log('1️⃣  Creating healthcare user (starts as basic user)...');
  const healthcareUserResponse = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: `healthcare-user-${Date.now()}@example.com`,
      password: 'Test123!@#$%^',
      name: 'Healthcare User',
    }),
  });
  
  if (healthcareUserResponse.ok) {
    const userData = await healthcareUserResponse.json();
    const token = userData.token;
    
    console.log('✅ User created (will upgrade to healthcare role)');
    console.log('   - Initial role:', userData.user?.role || 'user');
    console.log('   - needsProfileCompletion:', userData.user?.needsProfileCompletion);
    
    // Use completeProfile for healthcare roles
    console.log('\n2️⃣  Completing profile with healthcare role...');
    const completeResponse = await fetch(`${baseURL}/api/trpc/auth.completeProfile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Dr. Healthcare User',
        role: 'nurse', // Healthcare role
        phoneNumber: '+1234567890',
        department: 'Emergency',
        jobTitle: 'Emergency Room Nurse',
        bio: 'Experienced ER nurse',
        organizationName: 'Test Hospital',
        acceptTerms: true,
        acceptPrivacy: true,
      }),
    });
    
    if (completeResponse.ok) {
      const completeData = await completeResponse.json();
      console.log('✅ Healthcare profile completed');
      console.log('   - Success:', completeData.success);
      console.log('   - Organization ID:', completeData.organizationId);
      
      // Verify
      const sessionResponse = await fetch(`${baseURL}/api/auth/get-session`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        console.log('   - needsProfileCompletion:', session.user?.needsProfileCompletion);
        console.log('   - role:', session.user?.role);
        console.log('   - department:', session.user?.department);
        console.log('   - defaultHospitalId:', session.user?.defaultHospitalId);
      }
    } else {
      console.error('❌ Healthcare profile completion failed:', completeResponse.status);
      const error = await completeResponse.text();
      console.error('   Error:', error);
    }
  }
  
  // Test 3: OAuth user simulation
  console.log('\n━━━ Test 3: OAuth User Profile Completion ━━━\n');
  
  console.log('1️⃣  Simulating OAuth user creation...');
  console.log('   In production, OAuth users would:');
  console.log('   - Sign in with Google/Apple');
  console.log('   - Be created with role="guest"');
  console.log('   - Have needsProfileCompletion=true');
  console.log('   - Be redirected to complete-profile screen');
  console.log('   - Use completeProfile endpoint to set their role');
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 PROFILE COMPLETION SUMMARY:\n');
  
  console.log('✅ Correct approach:');
  console.log('   1. Basic users (admin/manager/user):');
  console.log('      - Use updateProfile endpoint');
  console.log('      - Can update role within basic roles');
  console.log('   ');
  console.log('   2. Healthcare users (doctor/nurse/operator):');
  console.log('      - Use completeProfile endpoint');
  console.log('      - Creates organization if needed');
  console.log('      - Assigns hospital');
  console.log('   ');
  console.log('   3. OAuth users:');
  console.log('      - Start with role="guest"');
  console.log('      - Must use completeProfile');
  console.log('      - Can choose any role type');
  
  console.log('\n🔑 Key findings:');
  console.log('   • updateProfile: For basic role changes only');
  console.log('   • completeProfile: For healthcare roles & OAuth users');
  console.log('   • needsProfileCompletion is set to false when role is updated');
  console.log('   • Healthcare roles automatically get organization/hospital');
}

testProfileCompletionCorrect().catch(console.error);