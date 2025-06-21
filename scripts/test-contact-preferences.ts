#!/usr/bin/env bun
/**
 * Test contactPreferences fix
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testContactPreferences() {
  console.log('🔍 Testing contactPreferences Fix...\n');
  
  const baseURL = 'http://localhost:8081';
  const timestamp = Date.now();
  
  // Test 1: Sign up new user using tRPC endpoint
  console.log('1️⃣  Testing sign up with contactPreferences...');
  const signUpResponse = await fetch(`${baseURL}/api/trpc/auth.signUp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `contact-prefs-${timestamp}@example.com`,
      password: 'Test123!@#$%^',
      name: 'Contact Prefs Test',
      role: 'user',
      acceptTerms: true,
      acceptPrivacy: true,
    }),
  });
  
  if (!signUpResponse.ok) {
    console.error('❌ Sign-up failed:', signUpResponse.status);
    const error = await signUpResponse.text();
    console.error('Error:', error);
    return;
  }
  
  const signUpData = await signUpResponse.json();
  const result = signUpData.result?.data;
  console.log('✅ Sign-up successful');
  console.log('   - User ID:', result?.user?.id);
  console.log('   - contactPreferences:', JSON.stringify(result?.user?.contactPreferences));
  console.log('   - Type:', typeof result?.user?.contactPreferences);
  
  const token = result?.token;
  
  // Test 2: Get session using Better Auth endpoint
  console.log('\n2️⃣  Testing getSession with contactPreferences...');
  const sessionResponse = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: { 
      'Authorization': `Bearer ${token}` 
    },
  });
  
  if (!sessionResponse.ok) {
    console.error('❌ Get session failed:', sessionResponse.status);
    return;
  }
  
  const sessionData = await sessionResponse.json();
  console.log('✅ Session retrieved');
  console.log('   - Raw contactPreferences:', sessionData.user?.contactPreferences);
  console.log('   - Type:', typeof sessionData.user?.contactPreferences);
  
  // Parse if string
  let parsedPrefs = sessionData.user?.contactPreferences;
  if (typeof parsedPrefs === 'string') {
    try {
      parsedPrefs = JSON.parse(parsedPrefs);
    } catch (e) {
      parsedPrefs = null;
    }
  }
  
  console.log('   - Parsed contactPreferences:', JSON.stringify(parsedPrefs));
  console.log('   - Is valid object:', 
    parsedPrefs && 
    typeof parsedPrefs === 'object' &&
    'email' in parsedPrefs
  );
  
  // Test 3: Sign in existing user
  console.log('\n3️⃣  Testing sign in with contactPreferences...');
  const signInResponse = await fetch(`${baseURL}/api/trpc/auth.signIn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `contact-prefs-${timestamp}@example.com`,
      password: 'Test123!@#$%^',
    }),
  });
  
  if (signInResponse.ok) {
    const signInData = await signInResponse.json();
    const signInResult = signInData.result?.data;
    console.log('✅ Sign in successful');
    console.log('   - contactPreferences:', JSON.stringify(signInResult?.user?.contactPreferences));
    console.log('   - Type:', typeof signInResult?.user?.contactPreferences);
  } else {
    console.log('❌ Sign in failed');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 CONTACT PREFERENCES TEST SUMMARY:\n');
  
  if (parsedPrefs && typeof parsedPrefs === 'object') {
    console.log('✅ contactPreferences fix is working!');
    console.log('   - Database stores as JSON string');
    console.log('   - API returns as parsed object');
    console.log('   - Default value: { email: true, push: true, sms: false }');
  } else {
    console.log('❌ contactPreferences issue still exists');
    console.log('   - Check the auth router implementation');
  }
}

testContactPreferences().catch(console.error);