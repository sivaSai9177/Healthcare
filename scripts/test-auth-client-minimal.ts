#!/usr/bin/env bun
/**
 * Test auth client with minimal configuration
 */

// Mock Platform
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { inferAdditionalFields } from "better-auth/client/plugins";

global.Platform = { OS: 'web' };

// Mock storage
global.webStorage = {
  getItem: async (key: string) => null,
  setItem: async (key: string, value: string) => {},
  removeItem: async (key: string) => {}
};

async function testConfigurations() {
  console.log('Testing different auth client configurations...\n');
  
  // Test 1: Minimal client (no plugins)
  console.log('1. Minimal client (no plugins):');
  try {
    const client1 = createAuthClient({
      baseURL: 'http://localhost:8081'
    });
    
    const result = await client1.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback'
    });
    console.log('   ✅ Success');
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
  }
  
  // Test 2: With inferAdditionalFields only
  console.log('\n2. With inferAdditionalFields plugin:');
  try {
    const client2 = createAuthClient({
      baseURL: 'http://localhost:8081',
      plugins: [
        inferAdditionalFields({
          user: {
            role: { type: "string", required: true, defaultValue: "user" }
          }
        })
      ]
    });
    
    const result = await client2.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback'
    });
    console.log('   ✅ Success');
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
  }
  
  // Test 3: With expoClient only
  console.log('\n3. With expoClient plugin:');
  try {
    const client3 = createAuthClient({
      baseURL: 'http://localhost:8081',
      plugins: [
        expoClient({
          scheme: "expo-starter",
          storagePrefix: "better-auth",
          storage: global.webStorage,
          disableCache: false
        })
      ]
    });
    
    const result = await client3.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback'
    });
    console.log('   ✅ Success');
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
    console.error('   Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
  }
  
  // Test 4: With both plugins (like our config)
  console.log('\n4. With both plugins:');
  try {
    const client4 = createAuthClient({
      baseURL: 'http://localhost:8081',
      plugins: [
        expoClient({
          scheme: "expo-starter",
          storagePrefix: "better-auth",
          storage: global.webStorage,
          disableCache: false
        }),
        inferAdditionalFields({
          user: {
            role: { type: "string", required: true, defaultValue: "user" }
          }
        })
      ]
    });
    
    const result = await client4.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback'
    });
    console.log('   ✅ Success');
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
  }
  
  // Test 5: With customFetch
  console.log('\n5. With customFetch:');
  try {
    const customFetch: typeof fetch = async (input, init) => {
      console.log('   customFetch called');
      console.log('   Body type:', typeof init?.body);
      console.log('   Body:', init?.body);
      return fetch(input, init);
    };
    
    const client5 = createAuthClient({
      baseURL: 'http://localhost:8081',
      customFetch
    });
    
    const result = await client5.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback'
    });
    console.log('   ✅ Success');
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
  }
}

testConfigurations().catch(console.error);