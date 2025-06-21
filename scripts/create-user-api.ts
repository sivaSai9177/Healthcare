#!/usr/bin/env bun
/**
 * Create test user via API
 */

const API_URL = 'http://localhost:8081';

async function createUserViaAPI() {
  const email = 'demo@example.com';
  const password = 'SecurePassword123!';
  const name = 'Demo User';
  
  console.log('🔧 Creating test user via API...\n');
  console.log('Email:', email);
  console.log('Password:', password);
  
  // Try tRPC signUp
  try {
    const response = await fetch(`${API_URL}/api/trpc/auth.signUp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
        role: 'operator',
        acceptTerms: true,
        acceptPrivacy: true
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.result?.data?.success) {
      console.log('\n✅ User created successfully!');
      console.log('User:', result.result.data.user);
    } else {
      console.log('\n❌ Failed to create user:', result.error?.message || 'Unknown error');
      
      // Try to sign in if user exists
      console.log('\n🔐 Trying to sign in...');
      const signInResponse = await fetch(`${API_URL}/api/trpc/auth.signIn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      
      const signInResult = await signInResponse.json();
      
      if (signInResponse.ok && signInResult.result?.data?.success) {
        console.log('✅ Sign in successful!');
        console.log('User:', signInResult.result.data.user);
        console.log('\nYou can now use these credentials:');
        console.log('Email:', email);
        console.log('Password:', password);
      } else {
        console.log('❌ Sign in failed:', signInResult.error?.message || 'Unknown error');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createUserViaAPI();