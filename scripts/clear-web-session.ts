#!/usr/bin/env bun
/**
 * Clear web session to test fresh OAuth login
 */

async function clearSession() {
  console.log('Clearing web session...\n');
  
  try {
    // Call sign-out endpoint
    const response = await fetch('http://localhost:8081/api/auth/sign-out', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Sign out response:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('✅ Session cleared successfully');
      console.log('\nYou can now test OAuth login from scratch');
      console.log('Navigate to: http://localhost:8081');
    } else {
      console.log('❌ Failed to clear session');
      const text = await response.text();
      console.log('Response:', text);
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

clearSession();