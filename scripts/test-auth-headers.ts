#!/usr/bin/env bun

import { log } from '@/lib/core/logger';
import { authClient } from '@/lib/auth/auth-client';
import { sessionManager } from '@/lib/auth/auth-session-manager';
import { mobileStorage } from '@/lib/core/secure-storage';

console.log('🔍 Testing Authentication Headers on Mobile...\n');

// Test 1: Check what's in storage
console.log('📦 Checking Storage Contents:');
const storageKeys = [
  'better-auth_cookie',
  'better-auth.cookie',
  'better-auth_session-token',
  'better-auth.session-token',
  'better-auth_session_data',
  'better-auth.session_data',
];

for (const key of storageKeys) {
  const value = mobileStorage.getItem(key);
  if (value) {
    console.log(`✅ Found ${key}:`, value.substring(0, 50) + '...');
  }
}

// Test 2: Try to get session token via session manager
console.log('\n🔑 Testing Session Manager:');
const token = sessionManager.getSessionToken();
console.log('Session token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');

// Test 3: Check Better Auth client session
console.log('\n🔐 Testing Better Auth Client:');
try {
  const sessionStore = authClient.$sessionStore.get();
  console.log('Session store:', {
    hasSession: !!sessionStore?.session,
    hasToken: !!sessionStore?.session?.token,
    hasUser: !!sessionStore?.user,
    userId: sessionStore?.user?.id,
  });
  
  if (sessionStore?.session?.token) {
    console.log('Token from session store:', sessionStore.session.token.substring(0, 20) + '...');
  }
} catch (error) {
  console.error('Failed to access session store:', error);
}

// Test 4: Make a test API call
console.log('\n🌐 Testing API Call with Headers:');
const apiUrl = 'http://localhost:8081/api/debug/auth-check';

// First test without any headers
fetch(apiUrl)
  .then(res => res.json())
  .then(data => {
    console.log('\nAPI Response (no headers):');
    console.log('- Headers found:', data.headers);
    console.log('- Sessions:', data.sessions);
    console.log('- Diagnostics:', data.diagnostics);
  })
  .catch(err => console.error('API call failed:', err))
  .then(async () => {
    // Now test with Bearer token if we have one
    if (token) {
      console.log('\n🔄 Testing with Bearer token...');
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      console.log('\nAPI Response (with Bearer):');
      console.log('- Bearer token recognized:', data.tokens?.bearerToken?.found);
      console.log('- Session validated:', data.sessions?.bearerValidation?.success);
      console.log('- User ID:', data.sessions?.bearerValidation?.userId);
    } else {
      console.log('\n⚠️  No token available to test Bearer authentication');
    }
  });

// Test 5: Debug token storage
console.log('\n🐛 Running detailed token storage debug:');
await sessionManager.debugTokenStorage();

console.log('\n✅ Authentication header testing complete');