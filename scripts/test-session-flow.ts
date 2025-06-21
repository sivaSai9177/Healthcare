#!/usr/bin/env bun
/**
 * Test complete session flow
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testSessionFlow() {
  console.log('Testing complete session flow...\n');
  
  const baseURL = 'http://localhost:8081';
  
  // Test 1: Sign in and get session details
  console.log('1. Testing sign-in with demo user...');
  
  const signInResponse = await fetch(`${baseURL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'demo@example.com',
      password: 'Demo123!',
    }),
  });
  
  console.log(`   Status: ${signInResponse.status}`);
  console.log('\n   Headers:');
  signInResponse.headers.forEach((value, key) => {
    if (key.toLowerCase().includes('cookie') || key.toLowerCase().includes('auth')) {
      console.log(`     ${key}: ${value}`);
    }
  });
  
  const signInData = await signInResponse.json();
  console.log('\n   Response data:', JSON.stringify(signInData, null, 2));
  
  // Extract cookies
  const cookies = signInResponse.headers.get('set-cookie') || '';
  console.log('\n   Cookies set:', cookies ? 'Yes' : 'No');
  
  // Test 2: Check available endpoints
  console.log('\n2. Checking Better Auth routes...');
  
  // Import auth to check available routes
  const { auth } = await import('../lib/auth/auth-server');
  
  // Create a test request for different paths
  const testPaths = [
    '/api/auth/session',
    '/api/auth/get-session', 
    '/api/auth/sessions',
    '/api/auth/me',
    '/api/auth',
  ];
  
  for (const path of testPaths) {
    const request = new Request(`${baseURL}${path}`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
    });
    
    const response = await auth.handler(request);
    console.log(`   ${path}: ${response.status}`);
  }
  
  // Test 3: Check Bearer token
  console.log('\n3. Testing Bearer token...');
  
  if (signInData.session?.token) {
    console.log('   Token found:', signInData.session.token.substring(0, 20) + '...');
    
    const bearerResponse = await fetch(`${baseURL}/api/auth/session`, {
      headers: {
        'Authorization': `Bearer ${signInData.session.token}`,
      },
    });
    
    console.log(`   Bearer auth status: ${bearerResponse.status}`);
  } else {
    console.log('   No token in sign-in response');
    console.log('   Session object:', signInData.session);
  }
  
  // Test 4: List all properties in the response
  console.log('\n4. Analyzing sign-in response structure:');
  
  function analyzeObject(obj: any, prefix = '   ') {
    for (const [key, value] of Object.entries(obj || {})) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        console.log(`${prefix}${key}:`);
        analyzeObject(value, prefix + '  ');
      } else {
        console.log(`${prefix}${key}: ${typeof value} = ${JSON.stringify(value)?.substring(0, 50)}...`);
      }
    }
  }
  
  analyzeObject(signInData);
}

testSessionFlow();