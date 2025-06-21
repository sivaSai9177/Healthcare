#!/usr/bin/env bun
/**
 * Check web session from browser
 */

import 'dotenv/config';

async function checkSession() {
  console.log('Checking web session...\n');
  
  try {
    // Get session from the API
    const response = await fetch('http://localhost:8081/api/auth/get-session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any cookies from your browser here
        'Cookie': 'better-auth.session_token=<YOUR_SESSION_TOKEN_HERE>'
      },
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Session data:', JSON.stringify(data, null, 2));
    
    // Also check the tRPC endpoint
    console.log('\nChecking tRPC session...');
    const trpcResponse = await fetch('http://localhost:8081/api/trpc/auth.getSession', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'better-auth.session_token=<YOUR_SESSION_TOKEN_HERE>'
      },
    });
    
    console.log('tRPC Response status:', trpcResponse.status);
    const trpcData = await trpcResponse.json();
    console.log('tRPC Session data:', JSON.stringify(trpcData, null, 2));
    
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkSession();