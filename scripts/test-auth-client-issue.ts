#!/usr/bin/env bun
/**
 * Test to find the auth client issue
 */

// Set environment
process.env.NODE_ENV = 'test';

// Create a custom fetch wrapper to track what's being sent
const originalFetch = global.fetch;
const fetchCalls: any[] = [];

global.fetch = async function(input: any, init?: any) {
  const url = typeof input === 'string' ? input : input.url || input.href;
  const call = {
    url,
    method: init?.method || 'GET',
    body: init?.body,
    bodyType: typeof init?.body,
    headers: init?.headers
  };
  
  fetchCalls.push(call);
  
  console.log('\n=== FETCH INTERCEPTED ===');
  console.log('URL:', url);
  console.log('Body type:', call.bodyType);
  console.log('Body value:', call.body);
  
  // Check for the specific issue
  if (call.body === '[object Object]') {
    console.error('\n⚠️  FOUND THE ISSUE!');
    console.error('Body is literally "[object Object]" - this happens when:');
    console.error('1. An object is converted to string with toString()');
    console.error('2. String() is called on an object');
    console.error('3. Template literal with an object: `${object}`');
    console.error('4. Concatenation with string: object + ""');
    
    // Try to trace where this came from
    console.error('\nStack trace:');
    console.error(new Error().stack);
  }
  
  return originalFetch(input, init);
};

// Now test the actual flow from the component
async function testGoogleSignInFlow() {
  console.log('Testing Google Sign-In flow...\n');
  
  // Mock dependencies
  global.Platform = { OS: 'web' };
  global.Constants = { sessionId: 'test-session' };
  global.window = { location: { origin: 'http://localhost:8081' } } as any;
  
  // Mock storage
  const mockStorage = {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {}
  };
  
  global.webStorage = mockStorage;
  global.mobileStorage = mockStorage;
  
  try {
    // Import the hook
    const { useGoogleSignIn } = await import('../components/blocks/auth/GoogleSignIn/useGoogleSignIn');
    
    // The hook uses authClient internally
    // Let's simulate what happens when the button is clicked
    const { authClient } = await import('../lib/auth/auth-client');
    
    console.log('Calling authClient.signIn.social...');
    
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback'
    });
    
    console.log('\n✅ No error - request succeeded');
  } catch (error: any) {
    console.error('\n❌ Error occurred:', error.message);
    
    if (error.message?.includes('[object Object]')) {
      console.error('\n🔍 DIAGNOSIS: The "[object Object]" error is confirmed');
      console.error('This is happening in the Better Auth request');
    }
  }
  
  // Check what was sent
  console.log('\n=== FETCH CALLS SUMMARY ===');
  fetchCalls.forEach((call, i) => {
    console.log(`\nCall ${i + 1}:`);
    console.log('  URL:', call.url);
    console.log('  Method:', call.method);
    console.log('  Body type:', call.bodyType);
    if (call.body === '[object Object]') {
      console.log('  ⚠️  Body is "[object Object]"!');
    }
  });
}

testGoogleSignInFlow().catch(console.error);