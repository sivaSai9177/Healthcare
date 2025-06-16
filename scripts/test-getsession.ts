#!/usr/bin/env bun

/**
 * Test script to verify getSession endpoint is working
 */

const API_URL = 'http://localhost:8081/api/trpc';

async function testGetSession() {
  console.log('Testing getSession endpoint...\n');
  
  try {
    const response = await fetch(`${API_URL}/auth.getSession?batch=1&input=%7B%7D`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('\nRaw response:', data);
    
    if (response.status === 200) {
      try {
        const json = JSON.parse(data);
        console.log('\nParsed response:', JSON.stringify(json, null, 2));
        console.log('\n✅ getSession endpoint is working!');
      } catch (e) {
        console.error('\n❌ Failed to parse JSON response:', e);
      }
    } else {
      console.error('\n❌ getSession endpoint returned error status:', response.status);
    }
  } catch (error) {
    console.error('\n❌ Failed to call getSession:', error);
  }
}

// Run the test
testGetSession();