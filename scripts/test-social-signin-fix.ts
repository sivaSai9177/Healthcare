#!/usr/bin/env bun
/**
 * Test if the social sign-in fix works
 */

// Set environment
process.env.NODE_ENV = 'test';

// Track all fetch calls
const fetchCalls: any[] = [];
const originalFetch = global.fetch;

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
  
  console.log('\n=== FETCH CALLED ===');
  console.log('URL:', url);
  console.log('Method:', call.method);
  console.log('Body type:', call.bodyType);
  console.log('Body:', call.body);
  
  if (call.body === '[object Object]') {
    console.error('❌ PROBLEM: Body is "[object Object]"');
  } else if (call.bodyType === 'string' && call.body?.startsWith('{')) {
    console.log('✅ Body is proper JSON string');
  }
  
  return originalFetch(input, init);
};

// Mock dependencies
global.Platform = { OS: 'web' };
global.window = { location: { origin: 'http://localhost:8081' } } as any;

async function testFix() {
  console.log('Testing social sign-in with fix...\n');
  
  // Test 1: Direct Better Auth call
  console.log('=== Test 1: Direct Better Auth ===');
  try {
    const { createAuthClient } = await import('better-auth/react');
    const client = createAuthClient({
      baseURL: 'http://localhost:8081'
    });
    
    await client.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback'
    });
    
    console.log('✅ Direct call succeeded');
  } catch (error: any) {
    console.error('❌ Direct call failed:', error.message);
  }
  
  // Reset fetch calls
  fetchCalls.length = 0;
  
  // Test 2: Our auth client (with fix)
  console.log('\n=== Test 2: Our Auth Client ===');
  try {
    // Clear module cache to get fresh import
    delete require.cache[require.resolve('../lib/auth/auth-client')];
    
    // Mock storage
    global.webStorage = {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {}
    };
    global.mobileStorage = global.webStorage;
    
    const { authClient } = await import('../lib/auth/auth-client');
    
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback'
    });
    
    console.log('✅ Our auth client succeeded');
  } catch (error: any) {
    console.error('❌ Our auth client failed:', error.message);
    if (error.message?.includes('[object Object]')) {
      console.error('⚠️  The fix did not work - still getting "[object Object]" error');
    }
  }
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('Total fetch calls:', fetchCalls.length);
  
  const problematicCalls = fetchCalls.filter(call => call.body === '[object Object]');
  if (problematicCalls.length > 0) {
    console.error('\n❌ Found problematic calls:');
    problematicCalls.forEach((call, i) => {
      console.error(`  ${i + 1}. ${call.method} ${call.url}`);
    });
  } else {
    console.log('✅ No "[object Object]" bodies found');
  }
  
  // Check if JSON bodies are properly stringified
  const jsonCalls = fetchCalls.filter(call => 
    call.headers?.['Content-Type']?.includes('application/json') ||
    call.headers?.['content-type']?.includes('application/json')
  );
  
  console.log('\nJSON requests:', jsonCalls.length);
  jsonCalls.forEach((call, i) => {
    console.log(`  ${i + 1}. ${call.method} ${call.url}`);
    console.log(`     Body type: ${call.bodyType}`);
    console.log(`     Body: ${call.body?.substring(0, 100)}`);
  });
}

testFix().catch(console.error);