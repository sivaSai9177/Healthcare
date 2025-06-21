#!/usr/bin/env bun
/**
 * Debug social sign-in to see what's being sent
 */

// Mock fetch to intercept requests
// Now import Better Auth client
import { createAuthClient } from "better-auth/react";

const originalFetch = global.fetch;
global.fetch = async (input: any, init?: any) => {
  console.log('\n=== FETCH INTERCEPTED ===');
  console.log('URL:', input);
  console.log('Method:', init?.method || 'GET');
  console.log('Headers:', init?.headers);
  console.log('Body type:', typeof init?.body);
  console.log('Body value:', init?.body);
  
  if (typeof init?.body === 'string') {
    try {
      console.log('Body parsed:', JSON.parse(init.body));
    } catch (e) {
      console.log('Body is not valid JSON');
    }
  }
  
  // Check if body is literally "[object Object]"
  if (init?.body === '[object Object]') {
    console.log('⚠️  CRITICAL: Body is literally "[object Object]" string!');
  }
  
  return originalFetch(input, init);
};

const authClient = createAuthClient({
  baseURL: "http://localhost:8081"
});

async function testSocialSignIn() {
  console.log('Testing Better Auth social sign-in...\n');
  
  try {
    // This should trigger our fetch interceptor
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback',
    });
  } catch (error) {
    console.error('\nError:', error);
  }
}

testSocialSignIn();