#!/usr/bin/env bun
/**
 * Test Better Auth endpoints directly
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';

async function testBetterAuthEndpoints() {
  console.log('Testing Better Auth endpoints...\n');
  
  // Test 1: Session endpoint
  console.log('1. Testing GET /api/auth/session');
  try {
    const response = await fetch(`${API_URL}/api/auth/session`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Response: ${text || '(empty)'}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }
  
  // Test 2: Sign-in endpoint
  console.log('\n2. Testing POST /api/auth/sign-in/email');
  try {
    const response = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@example.com',
        password: 'SecurePassword123!'
      }),
    });
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Response: ${text || '(empty)'}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }
  
  // Test 3: List auth routes
  console.log('\n3. Testing GET /api/auth');
  try {
    const response = await fetch(`${API_URL}/api/auth`);
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Response: ${text || '(empty)'}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }
  
  // Test 4: Test auth endpoint
  console.log('\n4. Testing GET /api/auth/test');
  try {
    const response = await fetch(`${API_URL}/api/auth/test`);
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Response: ${text}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }
}

testBetterAuthEndpoints();