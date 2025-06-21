#!/usr/bin/env bun
/**
 * Debug auth flow issues
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';

console.log('🔍 Debugging Auth Flow');
console.log('API URL:', API_URL);
console.log('---\n');

// Test credentials
const testEmail = 'operator@test.com';
const testPassword = 'Operator123\!';

async function testEndpoint(name: string, path: string, options?: RequestInit) {
  console.log(`📡 ${name}`);
  console.log(`   URL: ${API_URL}${path}`);
  
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries([...response.headers.entries()].filter(([k]) => k.toLowerCase().includes('cookie') || k.toLowerCase().includes('auth'))));
    
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      console.log(`   Response:`, JSON.stringify(json, null, 2));
      return { response, data: json };
    } catch {
      console.log(`   Response (text):`, text.substring(0, 100) + '...');
      return { response, data: text };
    }
  } catch (error: any) {
    console.error(`   ❌ Error:`, error.message);
    return null;
  }
}

async function debugAuthFlow() {
  // 1. Check current session via Better Auth
  console.log('\n1️⃣ Checking current session...');
  const sessionResult = await testEndpoint('Get Session (Better Auth)', '/api/auth/session');
  
  // Also check via tRPC
  const trpcSessionResult = await testEndpoint('Get Session (tRPC)', '/api/trpc/auth.getSession');
  
  // 2. Try to sign in via Better Auth
  console.log('\n2️⃣ Attempting sign-in...');
  const signInResult = await testEndpoint('Sign In (Better Auth)', '/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    }),
    credentials: 'include'
  });
  
  // Extract cookies if any
  if (signInResult?.response) {
    const setCookies = signInResult.response.headers.get('set-cookie');
    console.log('   Set-Cookie:', setCookies);
  }
  
  // 3. Check session after sign-in
  console.log('\n3️⃣ Checking session after sign-in...');
  
  // Use the cookies from sign-in if available
  const cookies = signInResult?.response?.headers.get('set-cookie') || '';
  await testEndpoint('Get Session (After Sign-In)', '/api/auth/session', {
    headers: {
      'Cookie': cookies
    }
  });
  
  // 4. Test protected endpoint
  console.log('\n4️⃣ Testing protected endpoint...');
  await testEndpoint('Test Auth', '/api/auth/test', {
    headers: {
      'Cookie': cookies
    }
  });
  
  // 5. Check available Better Auth endpoints
  console.log('\n5️⃣ Checking Better Auth endpoints...');
  const betterAuthEndpoints = [
    '/api/auth/sign-up/email',
    '/api/auth/sign-in/email',
    '/api/auth/sign-out',
    '/api/auth/session',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email'
  ];
  
  for (const endpoint of betterAuthEndpoints) {
    const result = await testEndpoint(`Better Auth: ${endpoint}`, endpoint, {
      method: endpoint.includes('sign-out') ? 'POST' : 'GET'
    });
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 6. Check if this is a CORS issue
  console.log('\n6️⃣ Checking CORS configuration...');
  await testEndpoint('CORS Test', '/api/auth/session', {
    headers: {
      'Origin': 'http://localhost:8081',
      'Referer': 'http://localhost:8081/'
    }
  });
  
  // 7. Test with different Accept headers
  console.log('\n7️⃣ Testing with different Accept headers...');
  await testEndpoint('JSON Accept', '/api/auth/session', {
    headers: {
      'Accept': 'application/json'
    }
  });
  
  // 8. Test tRPC auth endpoints
  console.log('\n8️⃣ Testing tRPC auth endpoints...');
  await testEndpoint('tRPC Sign In', '/api/trpc/auth.signIn', {
    method: 'POST',
    body: JSON.stringify({
      json: {
        email: testEmail,
        password: testPassword
      }
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Run the debug flow
debugAuthFlow().catch(console.error);