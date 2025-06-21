#!/usr/bin/env bun

/**
 * Test Session and OAuth Authentication
 */

import chalk from 'chalk';

const API_URL = 'http://localhost:8081';

// Test users
const TEST_USER = { 
  email: 'nurse@mvp.test', 
  password: 'Nurse123!@#' 
};

async function testAuth() {

  try {
    // 1. Test login

    const loginRes = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER),
      credentials: 'include'
    });
    
    const loginData = await loginRes.json();

    const cookies = loginRes.headers.get('set-cookie');

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    
    // 2. Test session retrieval

    const sessionRes = await fetch(`${API_URL}/api/auth/session`, {
      method: 'GET',
      headers: { 
        'Cookie': cookies || '',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const sessionData = await sessionRes.json();

    if (!sessionRes.ok || !sessionData.user) {

    } else {

    }
    
    // 3. Test tRPC session endpoint

    const trpcRes = await fetch(`${API_URL}/api/trpc/auth.getSession`, {
      method: 'GET',
      headers: { 
        'Cookie': cookies || '',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const trpcData = await trpcRes.json();

    // 4. Test OAuth endpoints

    const oauthRes = await fetch(`${API_URL}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        callbackURL: `${API_URL}/auth-callback`
      })
    });
    
    const oauthData = await oauthRes.json();

    if (oauthData.url) {

    } else {

    }
    
    // 5. Test sign out

    const signOutRes = await fetch(`${API_URL}/api/auth/sign-out`, {
      method: 'POST',
      headers: { 
        'Cookie': cookies || '',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (signOutRes.ok) {

    } else {
      const signOutData = await signOutRes.text();

    }
    
  } catch (error: any) {
    console.error(chalk.red('\n❌ Test failed:'), error.message);
  }
}

// Run test
testAuth().then(() => {

});