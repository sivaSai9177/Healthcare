#!/usr/bin/env bun
/**
 * Debug profile completion response
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function debugProfileCompletion() {
  console.log('🔍 Debug Profile Completion Response...\n');
  
  const baseURL = 'http://localhost:8081';
  const timestamp = Date.now();
  
  // Create a doctor user
  console.log('Creating doctor user...');
  const signUpResponse = await fetch(`${baseURL}/api/trpc/auth.signUp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `debug-doctor-${timestamp}@hospital.com`,
      password: 'Test123!@#$%^',
      name: 'Debug Doctor',
      role: 'doctor',
      acceptTerms: true,
      acceptPrivacy: true,
    }),
  });
  
  if (!signUpResponse.ok) {
    console.error('❌ Failed to create user');
    return;
  }
  
  const signUpData = await signUpResponse.json();
  const token = signUpData.result?.data?.token;
  console.log('✅ User created with token');
  
  // Complete profile
  console.log('\nCompleting profile...');
  const completeProfileResponse = await fetch(`${baseURL}/api/trpc/auth.completeProfile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Debug Doctor',
      role: 'doctor',
      department: 'Emergency',
      organizationName: 'Debug Hospital',
      licenseNumber: 'MD999999',
      acceptTerms: true,
      acceptPrivacy: true,
    }),
  });
  
  const rawText = await completeProfileResponse.text();
  console.log('\n📝 Raw Response:');
  console.log(rawText);
  
  try {
    const data = JSON.parse(rawText);
    console.log('\n🔍 Parsed Response Structure:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n📊 Key Values:');
    console.log('- result.data.success:', data.result?.data?.success);
    console.log('- result.data.organizationId:', data.result?.data?.organizationId);
    console.log('- result.data.hospitalId:', data.result?.data?.hospitalId);
    console.log('- result.data.user.id:', data.result?.data?.user?.id);
    console.log('- result.data.user.role:', data.result?.data?.user?.role);
    console.log('- result.data.user.organizationId:', data.result?.data?.user?.organizationId);
    console.log('- result.data.user.defaultHospitalId:', data.result?.data?.user?.defaultHospitalId);
  } catch (e) {
    console.error('Failed to parse response:', e);
  }
}

debugProfileCompletion().catch(console.error);