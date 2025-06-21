#!/usr/bin/env bun
/**
 * Minimal test to isolate the issue
 */

// Test 1: Direct fetch (this works)
async function testDirectFetch() {
  console.log('1. Testing direct fetch...');
  
  const body = JSON.stringify({
    provider: 'google',
    callbackURL: 'http://localhost:8081/auth-callback'
  });
  
  console.log('   Body:', body);
  console.log('   Type:', typeof body);
  
  try {
    const response = await fetch('http://localhost:8081/api/auth/sign-in/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    console.log('   Status:', response.status);
  } catch (error) {
    console.error('   Error:', error);
  }
}

// Test 2: Using Better Auth client directly
async function testBetterAuthDirect() {
  console.log('\n2. Testing Better Auth client...');
  
  try {
    const { createAuthClient } = await import('better-auth/react');
    const client = createAuthClient({
      baseURL: 'http://localhost:8081'
    });
    
    const result = await client.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback'
    });
    
    console.log('   Success:', !!result);
  } catch (error: any) {
    console.error('   Error:', error.message);
  }
}

// Test 3: Using our auth client
async function testOurAuthClient() {
  console.log('\n3. Testing our auth client...');
  
  // Mock Platform
  global.Platform = { OS: 'web' };
  
  try {
    const { authClient } = await import('../lib/auth/auth-client');
    
    // Check if signIn.social exists
    console.log('   Has signIn:', !!authClient.signIn);
    console.log('   Has signIn.social:', !!authClient.signIn?.social);
    console.log('   Type of signIn.social:', typeof authClient.signIn?.social);
    
    if (authClient.signIn?.social) {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: 'http://localhost:8081/auth-callback'
      });
      console.log('   Success:', !!result);
    }
  } catch (error: any) {
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
  }
}

// Run all tests
async function runTests() {
  await testDirectFetch();
  await testBetterAuthDirect();
  await testOurAuthClient();
}

runTests().catch(console.error);