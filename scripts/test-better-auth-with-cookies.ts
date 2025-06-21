#!/usr/bin/env bun
/**
 * Test Better Auth flow with cookies
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
let sessionCookie = '';

async function testBetterAuthFlow() {
  console.log('Testing Better Auth flow with cookies...\n');
  
  // Step 1: Sign in
  console.log('1. Sign in');
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
    
    // Extract cookies
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      console.log(`   Cookies: ${setCookie}`);
      // Extract session token cookie
      const match = setCookie.match(/better-auth\.session-token=([^;]+)/);
      if (match) {
        sessionCookie = `better-auth.session-token=${match[1]}`;
        console.log(`   Session cookie: ${sessionCookie}`);
      }
    } else {
      console.log('   No cookies set!');
    }
    
    const data = await response.json();
    console.log(`   User: ${data.user?.email}`);
    console.log(`   Token: ${data.token}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }
  
  // Step 2: Check session with cookie
  console.log('\n2. Check session with cookie');
  try {
    const response = await fetch(`${API_URL}/api/auth/session`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': sessionCookie
      },
    });
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Response: ${text || '(empty)'}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }
  
  // Step 3: Check session with Bearer token
  console.log('\n3. Check session with Bearer token');
  try {
    const signInResponse = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@example.com',
        password: 'SecurePassword123!'
      }),
    });
    const signInData = await signInResponse.json();
    const token = signInData.token;
    
    if (token) {
      const response = await fetch(`${API_URL}/api/auth/session`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      console.log(`   Status: ${response.status}`);
      const text = await response.text();
      console.log(`   Response: ${text || '(empty)'}`);
    }
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }
  
  // Step 4: Sign out
  console.log('\n4. Sign out');
  try {
    const response = await fetch(`${API_URL}/api/auth/sign-out`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Cookie': sessionCookie
      },
    });
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Response: ${text || '(empty)'}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }
}

testBetterAuthFlow();