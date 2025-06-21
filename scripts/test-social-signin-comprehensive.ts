#!/usr/bin/env bun
/**
 * Comprehensive test of social sign-in
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

// Mock console to capture logs
const logs: string[] = [];
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
};

console.log = (...args) => {
  logs.push(`LOG: ${args.join(' ')}`);
  originalConsole.log(...args);
};
console.error = (...args) => {
  logs.push(`ERROR: ${args.join(' ')}`);
  originalConsole.error(...args);
};
console.warn = (...args) => {
  logs.push(`WARN: ${args.join(' ')}`);
  originalConsole.warn(...args);
};
console.debug = (...args) => {
  logs.push(`DEBUG: ${args.join(' ')}`);
  originalConsole.debug(...args);
};

// Mock fetch to see what's happening
const originalFetch = global.fetch;
let fetchCalls: any[] = [];

global.fetch = async (input: any, init?: any) => {
  const call = {
    url: typeof input === 'string' ? input : input.url || input.href,
    method: init?.method || 'GET',
    headers: init?.headers,
    body: init?.body,
    bodyType: typeof init?.body,
  };
  
  fetchCalls.push(call);
  
  console.log('\n=== FETCH CALL ===');
  console.log('URL:', call.url);
  console.log('Method:', call.method);
  console.log('Body type:', call.bodyType);
  console.log('Body:', call.body);
  
  // Check for the specific error
  if (call.body === '[object Object]') {
    console.error('⚠️  FOUND THE ISSUE: Body is literally "[object Object]"');
    console.error('This happens when toString() is called on an object');
  }
  
  try {
    const response = await originalFetch(input, init);
    const clonedResponse = response.clone();
    const responseText = await clonedResponse.text();
    
    console.log('Response status:', response.status);
    console.log('Response preview:', responseText.substring(0, 200));
    
    return response;
  } catch (error: any) {
    console.error('Fetch error:', error.message);
    throw error;
  }
};

async function test() {
  console.log('Starting comprehensive social sign-in test...\n');
  
  // Test 1: Direct API call (this works)
  console.log('=== TEST 1: Direct API Call ===');
  try {
    const response = await fetch('http://localhost:8081/api/auth/sign-in/social', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'google',
        callbackURL: 'http://localhost:8081/auth-callback',
      }),
    });
    console.log('Direct call success:', response.ok);
  } catch (error: any) {
    console.error('Direct call failed:', error.message);
  }
  
  // Test 2: Import and use auth client
  console.log('\n=== TEST 2: Auth Client ===');
  try {
    // Import after setting up mocks
    const { authClient } = await import('../lib/auth/auth-client');
    console.log('Auth client imported');
    
    // Try to call signIn.social
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback',
    });
  } catch (error: any) {
    console.error('Auth client error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  }
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('Total fetch calls:', fetchCalls.length);
  fetchCalls.forEach((call, i) => {
    console.log(`\nCall ${i + 1}:`);
    console.log('  URL:', call.url);
    console.log('  Body type:', call.bodyType);
    console.log('  Body:', call.body);
    if (call.body === '[object Object]') {
      console.log('  ⚠️  PROBLEM: Body is "[object Object]"');
    }
  });
  
  // Check logs for clues
  const problemLogs = logs.filter(log => 
    log.includes('[object Object]') || 
    log.includes('toString') ||
    log.includes('stringify')
  );
  
  if (problemLogs.length > 0) {
    console.log('\n=== PROBLEM LOGS ===');
    problemLogs.forEach(log => console.log(log));
  }
}

test().catch(console.error);