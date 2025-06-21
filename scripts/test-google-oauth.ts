#!/usr/bin/env bun
/**
 * Test Google OAuth URL generation
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testGoogleOAuth() {
  console.log('Testing Google OAuth...\n');
  
  // Check environment variables
  console.log('1. Environment variables:');
  console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
  console.log('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('\n❌ Google OAuth credentials not set!');
    return;
  }
  
  // Test OAuth URL generation
  console.log('\n2. Testing OAuth URL generation...');
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: 'http://localhost:8081/api/auth/callback/google',
    response_type: 'code',
    scope: 'openid email profile',
    state: 'test-state',
    access_type: 'offline',
    prompt: 'consent',
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  console.log('\n✅ OAuth URL generated:');
  console.log(authUrl);
  
  // Test API endpoint
  console.log('\n3. Testing sign-in/social endpoint...');
  
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
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`   Response: ${responseText}`);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ Social sign-in response:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('   (Response is not JSON)');
      }
    }
  } catch (error) {
    console.error('❌ Error testing social sign-in:', error);
  }
}

testGoogleOAuth();