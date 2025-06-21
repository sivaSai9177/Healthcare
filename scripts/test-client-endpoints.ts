#!/usr/bin/env bun
/**
 * Test what endpoints the Better Auth client uses
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testClientEndpoints() {
  console.log('Testing Better Auth client endpoints...\n');
  
  // Intercept fetch to log requests
  const originalFetch = global.fetch;
  const requests: string[] = [];
  
  global.fetch = async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method || 'GET';
    console.log(`[FETCH] ${method} ${url}`);
    requests.push(`${method} ${url}`);
    return originalFetch(input, init);
  };
  
  try {
    // Import and use the auth client
    const { authClient } = await import('../lib/auth/auth-client');
    
    console.log('\n1. Testing getSession...');
    try {
      await authClient.getSession();
    } catch (e) {
      console.log('   Error:', (e as Error).message);
    }
    
    console.log('\n2. Testing sign-in...');
    try {
      await authClient.signIn.email({
        email: 'test@example.com',
        password: 'Test123!',
      });
    } catch (e) {
      console.log('   Error:', (e as Error).message);
    }
    
    // Restore original fetch
    global.fetch = originalFetch;
    
    console.log('\n\nEndpoints used by Better Auth client:');
    const uniqueEndpoints = [...new Set(requests)];
    uniqueEndpoints.forEach(endpoint => {
      console.log(`   ${endpoint}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testClientEndpoints();