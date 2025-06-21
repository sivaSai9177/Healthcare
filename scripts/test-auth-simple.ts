#!/usr/bin/env bun
/**
 * Test Better Auth initialization
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testAuth() {
  console.log('Testing Better Auth...\n');
  
  try {
    // Import auth dynamically to catch errors
    console.log('1. Importing auth module...');
    const authModule = await import('../lib/auth/auth-server');
    const { auth } = authModule;
    
    console.log('✅ Auth module imported successfully');
    console.log('   auth type:', typeof auth);
    console.log('   auth.handler type:', typeof auth?.handler);
    
    if (!auth) {
      console.error('❌ Auth object is undefined!');
      return;
    }
    
    if (typeof auth.handler !== 'function') {
      console.error('❌ auth.handler is not a function!');
      console.log('   auth object keys:', Object.keys(auth));
      return;
    }
    
    // Test a simple request
    console.log('\n2. Testing auth handler...');
    // Test multiple endpoints
    const endpoints = [
      { path: '/session', method: 'GET' },
      { path: '/sign-in/email', method: 'POST' },
      { path: '/sign-up/email', method: 'POST' },
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\nTesting ${endpoint.method} ${endpoint.path}...`);
      const testRequest = new Request(`http://localhost:8081/api/auth${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(endpoint.method === 'POST' && {
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        }),
      });
      
      const response = await auth.handler(testRequest);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status !== 404) {
        const responseText = await response.text();
        console.log(`   Response: ${responseText.substring(0, 100)}...`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAuth();