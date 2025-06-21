#!/usr/bin/env tsx
/**
 * Script to test the getSession endpoint and debug 500 errors
 */

import 'dotenv/config';

const API_URL = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:8081/api';

async function testSession() {

  // Test the debug endpoint first

  try {
    const debugResponse = await fetch(`${API_URL}/debug/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const debugData = await debugResponse.json();

  } catch (error) {
    console.error('Debug endpoint error:', error);
  }

  try {
    const trpcResponse = await fetch(`${API_URL.replace('/api', '')}/api/trpc/auth.getSession`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const responseText = await trpcResponse.text();

    try {
      const trpcData = JSON.parse(responseText);

    } catch (e) {

    }
  } catch (error) {
    console.error('TRPC endpoint error:', error);
  }
  
  // Check environment variables

}

// Run the test
testSession().catch(console.error);