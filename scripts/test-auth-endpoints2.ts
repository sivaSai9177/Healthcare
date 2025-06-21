#!/usr/bin/env bun
/**
 * Test all Better Auth endpoints
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testAuthEndpoints() {
  console.log('Testing Better Auth endpoints...\n');
  
  const baseURL = 'http://localhost:8081/api/auth';
  
  // List of Better Auth endpoints to test
  const endpoints = [
    { path: '/session', method: 'GET', description: 'Get current session' },
    { path: '/session', method: 'POST', description: 'Create session' },
    { path: '/sign-in/email', method: 'POST', description: 'Email sign-in' },
    { path: '/sign-up/email', method: 'POST', description: 'Email sign-up' },
    { path: '/sign-out', method: 'POST', description: 'Sign out' },
    { path: '/sign-in/social', method: 'POST', description: 'Social sign-in' },
    { path: '/callback/google', method: 'GET', description: 'Google OAuth callback' },
    { path: '/user', method: 'GET', description: 'Get user info' },
    { path: '/update-user', method: 'POST', description: 'Update user' },
    { path: '/verify-email', method: 'POST', description: 'Verify email' },
    { path: '/send-verification-email', method: 'POST', description: 'Send verification' },
    { path: '/reset-password', method: 'POST', description: 'Reset password' },
    { path: '/update-password', method: 'POST', description: 'Update password' },
  ];
  
  console.log('Testing endpoints:\n');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseURL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(endpoint.method === 'POST' && {
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        }),
      });
      
      const status = response.status === 404 ? '❌ 404' : 
                     response.status === 200 ? '✅ 200' :
                     response.status === 201 ? '✅ 201' :
                     response.status === 401 ? '⚠️  401' :
                     response.status === 422 ? '⚠️  422' :
                     response.status === 500 ? '❌ 500' :
                     `⚠️  ${response.status}`;
      
      console.log(`${status} ${endpoint.method.padEnd(4)} ${endpoint.path.padEnd(25)} - ${endpoint.description}`);
      
      // For non-404s, show a bit of the response
      if (response.status !== 404 && response.status !== 401) {
        const text = await response.text();
        if (text) {
          console.log(`     Response: ${text.substring(0, 80)}...`);
        }
      }
    } catch (error: any) {
      console.log(`❌ ERR ${endpoint.method.padEnd(4)} ${endpoint.path.padEnd(25)} - ${error.message}`);
    }
  }
  
  // Now test with the handler directly
  console.log('\n\nTesting auth handler directly:\n');
  
  try {
    const { auth } = await import('../lib/auth/auth-server');
    
    // Test session endpoint
    const sessionRequest = new Request('http://localhost:8081/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const response = await auth.handler(sessionRequest);
    console.log(`Direct handler test - Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`Response: ${responseText}`);
    
  } catch (error: any) {
    console.error('Handler test error:', error.message);
  }
}

testAuthEndpoints();