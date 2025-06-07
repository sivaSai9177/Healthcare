#!/usr/bin/env bun

/**
 * Debug script to understand mobile authentication storage
 * Run this to see what's actually stored after login
 */

import { mobileStorage } from '../lib/core/secure-storage';

console.log('=== Mobile Auth Storage Debug ===\n');

// Check all possible keys
const keysToCheck = [
  'better-auth_cookie',
  'better-auth_session-token', 
  'better-auth.session-token',
  'better-auth.cookie',
  'better-auth_session_data',
  'better-auth_user_data',
  'session-token',
  'auth-token',
  'app-auth-storage', // Zustand store
];

console.log('Checking storage keys:');
for (const key of keysToCheck) {
  const value = mobileStorage.getItem(key);
  if (value) {
    console.log(`\n✅ ${key}:`);
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(value);
      console.log('  Type: JSON');
      console.log('  Keys:', Object.keys(parsed));
      
      // Show preview of values
      if (parsed.token) {
        console.log('  token:', parsed.token.substring(0, 20) + '...');
      }
      if (parsed.sessionToken) {
        console.log('  sessionToken:', parsed.sessionToken.substring(0, 20) + '...');
      }
      if (parsed['better-auth.session-token']) {
        console.log('  better-auth.session-token:', parsed['better-auth.session-token'].substring(0, 20) + '...');
      }
      if (parsed.user) {
        console.log('  user:', { id: parsed.user.id, email: parsed.user.email });
      }
      if (parsed.state?.user) {
        console.log('  state.user:', { id: parsed.state.user.id, email: parsed.state.user.email });
      }
    } catch (e) {
      // Not JSON, show as string
      console.log('  Type: String');
      if (value.length > 100) {
        console.log('  Value:', value.substring(0, 80) + '...');
      } else {
        console.log('  Value:', value);
      }
      
      // Check if it looks like a cookie
      if (value.includes('=')) {
        console.log('  Looks like a cookie format');
        const parts = value.split(';');
        parts.forEach(part => {
          const [k, v] = part.split('=');
          if (k && v) {
            console.log(`    ${k.trim()}: ${v.trim().substring(0, 20)}...`);
          }
        });
      }
    }
  } else {
    console.log(`❌ ${key}: Not found`);
  }
}

console.log('\n=== End Debug ===');