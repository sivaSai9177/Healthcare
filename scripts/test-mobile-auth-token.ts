#!/usr/bin/env bun

import { getMobileToken, ensureMobileTokenAvailable } from '../lib/auth/mobile-auth-fix';
import { mobileStorage } from '../lib/core/secure-storage';

// Mock React Native Platform
global.Platform = {
  OS: 'ios',
  select: (obj: any) => obj.ios || obj.default,
} as any;

async function testMobileAuth() {
  console.log('Testing Mobile Auth Token Management...\n');

  // Test 1: Check current token
  console.log('1. Checking current token in memory...');
  const memoryToken = getMobileToken();
  console.log('Memory token:', memoryToken ? `${memoryToken.substring(0, 20)}...` : 'None');

  // Test 2: Check storage
  console.log('\n2. Checking storage locations...');
  const keys = [
    'better-auth_session-token',
    'better-auth.session-token',
    'better-auth_cookie',
    'better-auth.cookie',
  ];

  for (const key of keys) {
    const value = mobileStorage.getItem(key);
    console.log(`${key}:`, value ? `${value.substring(0, 50)}...` : 'None');
  }

  // Test 3: Ensure token is available
  console.log('\n3. Ensuring token is available...');
  const token = await ensureMobileTokenAvailable();
  console.log('Found token:', token ? `${token.substring(0, 20)}...` : 'None');

  // Test 4: Verify token format
  if (token) {
    console.log('\n4. Token details:');
    console.log('- Length:', token.length);
    console.log('- Is JWT format:', token.split('.').length === 3);
    console.log('- Parts:', token.split('.').map(p => p.length));
  }
}

testMobileAuth().catch(console.error);