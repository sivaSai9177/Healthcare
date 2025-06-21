#!/usr/bin/env bun
/**
 * Test the OAuth fix for the [object Object] issue
 */

import { authClient } from '../lib/auth/auth-client';

console.log('🔧 Testing OAuth Fix for [object Object] issue\n');

// Mock the window object for testing
if (typeof window === 'undefined') {
  (global as any).window = {
    location: {
      origin: 'http://localhost:8081',
      pathname: '/test'
    }
  };
}

async function testOAuthFix() {
  console.log('1️⃣  Testing social sign-in with proper body...\n');
  
  try {
    // This should trigger our enhanced logging
    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback',
    });
    
    console.log('✅ Social sign-in request sent successfully');
    console.log('Result:', result);
  } catch (error: any) {
    console.log('❌ Error occurred:', error.message);
    
    // Check if it's still the [object Object] error
    if (error.message?.includes('[object Object]')) {
      console.error('\n⚠️  THE FIX DID NOT WORK - Still getting [object Object] error');
    } else {
      console.log('\n✅ Different error - the [object Object] issue might be fixed');
      console.log('Error details:', error);
    }
  }
  
  console.log('\n2️⃣  Checking auth client configuration...\n');
  console.log('Base URL:', (authClient as any).options?.baseURL);
  console.log('Custom fetch:', !!(authClient as any).options?.customFetch);
  
  console.log('\n📊 Summary:');
  console.log('- Enhanced logging added for social sign-in requests');
  console.log('- Special handling for [object Object] body in social sign-in');
  console.log('- Automatic body reconstruction if malformed');
  console.log('- Proper JSON stringification for object bodies');
}

testOAuthFix().catch(console.error);