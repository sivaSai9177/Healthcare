#!/usr/bin/env bun
/**
 * Test auth client with minimal configuration
 */

// Set NODE_ENV before any imports
// Now import after mocks are set up
import { createAuthClient } from "better-auth/react";

process.env.NODE_ENV = 'production';

// Mock React Native Platform before imports
global.Platform = { OS: 'web' };

// Mock storage
global.webStorage = {
  getItem: async (key: string) => null,
  setItem: async (key: string, value: string) => {},
  removeItem: async (key: string) => {}
};

global.mobileStorage = global.webStorage;

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  AppState: { 
    currentState: 'active',
    addEventListener: () => () => {}
  }
}), { virtual: true });

async function testOurAuthClient() {
  console.log('Testing our auth client configuration...\n');
  
  try {
    // Import our auth client
    const authClientModule = await import('../lib/auth/auth-client');
    const { authClient } = authClientModule;
    
    console.log('Auth client imported successfully');
    console.log('Has signIn:', !!authClient.signIn);
    console.log('Has signIn.social:', !!authClient.signIn?.social);
    
    // Try to call social sign-in
    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback'
    });
    
    console.log('✅ Success:', result);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack?.split('\n').slice(0, 5).join('\n'));
    
    // Check if it's the "[object Object]" error
    if (error.message?.includes('[object Object]')) {
      console.error('\n⚠️  FOUND THE ISSUE: "[object Object]" error detected!');
    }
  }
}

testOurAuthClient().catch(console.error);