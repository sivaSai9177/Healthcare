#!/usr/bin/env bun

/**
 * Test script to verify getSession endpoint is working
 */

const API_URL = 'http://localhost:8081/api/trpc';

async function testGetSession() {

  try {
    const response = await fetch(`${API_URL}/auth.getSession?batch=1&input=%7B%7D`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();

    if (response.status === 200) {
      try {
        const json = JSON.parse(data);

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