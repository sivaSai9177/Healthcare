#!/usr/bin/env bun
/**
 * Test social sign-in in web context (simulating browser environment)
 */

// Simulate web environment
import 'dotenv/config';

global.window = {
  location: {
    origin: 'http://localhost:8081',
    href: 'http://localhost:8081',
    protocol: 'http:',
    host: 'localhost:8081',
    hostname: 'localhost',
    port: '8081',
    pathname: '/',
    search: '',
    hash: ''
  },
  navigator: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  },
  open: (url: string) => {
    console.log('Window.open called with:', url);
    return null;
  }
} as any;

// Mock document
global.document = {
  createElement: (tag: string) => {
    return {
      href: '',
      click: function() {
        console.log('Link clicked:', this.href);
      }
    };
  }
} as any;

// Set NODE_ENV
process.env.NODE_ENV = 'production';

// Track all operations
const operations: any[] = [];

// Mock fetch with detailed tracking
const originalFetch = global.fetch;
global.fetch = async (input: any, init?: any) => {
  const url = typeof input === 'string' ? input : input.url || input.href;
  
  const operation = {
    type: 'fetch',
    url,
    method: init?.method || 'GET',
    headers: init?.headers,
    body: init?.body,
    bodyType: typeof init?.body,
    timestamp: new Date().toISOString()
  };
  
  operations.push(operation);
  
  console.log('\n=== FETCH ===');
  console.log('URL:', url);
  console.log('Body:', init?.body);
  
  if (init?.body === '[object Object]') {
    console.error('⚠️  FOUND ISSUE: Body is "[object Object]"');
    
    // Try to fix it
    init = { ...init, body: '{}' };
    console.log('Fixed body to: {}');
  }
  
  return originalFetch(input, init);
};

async function test() {
  console.log('Testing social sign-in in web context...\n');
  
  try {
    // Import auth client
    const { createAuthClient } = await import('better-auth/react');
    
    // Create client with minimal config
    const client = createAuthClient({
      baseURL: 'http://localhost:8081'
    });
    
    console.log('Client created, calling signIn.social...');
    
    // This is what happens in the browser
    const result = await client.signIn.social({
      provider: 'google',
      callbackURL: 'http://localhost:8081/auth-callback'
    });
    
    console.log('Result:', result);
  } catch (error: any) {
    console.error('\nError:', error.message);
    console.error('Error type:', error.constructor.name);
    console.error('Stack:', error.stack?.split('\n').slice(0, 5).join('\n'));
  }
  
  // Check what happened
  console.log('\n=== OPERATIONS SUMMARY ===');
  operations.forEach((op, i) => {
    console.log(`\n${i + 1}. ${op.type.toUpperCase()}`);
    console.log('   URL:', op.url);
    if (op.body) {
      console.log('   Body type:', op.bodyType);
      console.log('   Body:', op.body);
    }
  });
  
  // Check if window.open or location change was attempted
  const nonFetchOps = operations.filter(op => op.type !== 'fetch');
  if (nonFetchOps.length > 0) {
    console.log('\n=== NON-FETCH OPERATIONS ===');
    nonFetchOps.forEach(op => console.log(op));
  }
}

test().catch(console.error);