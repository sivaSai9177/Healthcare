/**
 * Test Better Auth directly
 */

import { auth } from '../lib/auth/auth-server';

async function testBetterAuth() {
  console.log('\n🔍 Testing Better Auth directly...\n');

  try {
    // Test if auth is properly initialized
    console.log('Auth object keys:', Object.keys(auth));
    console.log('Auth handler type:', typeof auth.handler);
    console.log('Auth api type:', typeof auth.api);
    
    // Try to create a test request for session
    const testRequest = new Request('http://localhost:8081/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('\nCalling auth.handler with session request...');
    
    if (auth.handler) {
      const response = await auth.handler(testRequest);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('Response body:', text);
    } else {
      console.log('❌ auth.handler is not defined!');
    }

    // Check auth configuration
    console.log('\n📋 Auth Configuration:');
    console.log('Base URL:', 'http://localhost:8081');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBetterAuth().catch(console.error);