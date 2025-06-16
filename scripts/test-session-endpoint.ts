#!/usr/bin/env tsx
/**
 * Script to test the getSession endpoint and debug 500 errors
 */

import 'dotenv/config';

const API_URL = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:8081/api';

async function testSession() {
  console.log('Testing session endpoints...\n');
  
  // Test the debug endpoint first
  console.log('1. Testing debug session endpoint:');
  try {
    const debugResponse = await fetch(`${API_URL}/debug/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const debugData = await debugResponse.json();
    console.log('Debug endpoint status:', debugResponse.status);
    console.log('Debug response:', JSON.stringify(debugData, null, 2));
  } catch (error) {
    console.error('Debug endpoint error:', error);
  }
  
  console.log('\n2. Testing TRPC getSession endpoint:');
  try {
    const trpcResponse = await fetch(`${API_URL.replace('/api', '')}/api/trpc/auth.getSession`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const responseText = await trpcResponse.text();
    console.log('TRPC endpoint status:', trpcResponse.status);
    console.log('Raw response:', responseText);
    
    try {
      const trpcData = JSON.parse(responseText);
      console.log('Parsed response:', JSON.stringify(trpcData, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON');
    }
  } catch (error) {
    console.error('TRPC endpoint error:', error);
  }
  
  // Check environment variables
  console.log('\n3. Environment check:');
  console.log('BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? 'SET' : 'NOT SET');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('BETTER_AUTH_BASE_URL:', process.env.BETTER_AUTH_BASE_URL || 'NOT SET');
  console.log('NODE_ENV:', process.env.NODE_ENV);
}

// Run the test
testSession().catch(console.error);