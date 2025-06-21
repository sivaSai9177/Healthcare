#!/usr/bin/env bun
/**
 * Create a test user with known credentials
 */

import { auth } from "@/lib/auth/auth-server";

async function createTestUser() {
  console.log('🔧 Creating test user...\n');
  
  const email = 'test@example.com';
  const password = 'TestPassword123!'; // Meets requirements: uppercase, lowercase, number, special char, 12+ chars
  const name = 'Test User';
  
  try {
    // Create user using Better Auth API
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      }
    });
    
    console.log('✅ User created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', result.user.id);
    console.log('Name:', result.user.name);
    
    // Test sign in immediately
    console.log('\n🔐 Testing sign in...');
    const signInResult = await auth.api.signInEmail({
      body: {
        email,
        password,
      }
    });
    
    if (signInResult) {
      console.log('✅ Sign in successful!');
      console.log('Session:', signInResult.session);
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
    
    // If user already exists, try to sign in
    if (error.message?.includes('already exists') || error.code === 'USER_ALREADY_EXISTS') {
      console.log('\n🔐 User already exists, trying to sign in...');
      try {
        const signInResult = await auth.api.signInEmail({
          body: {
            email,
            password,
          }
        });
        
        if (signInResult) {
          console.log('✅ Sign in successful!');
          console.log('User:', signInResult.user);
        }
      } catch (signInError) {
        console.error('❌ Sign in also failed:', signInError.message);
      }
    }
  }
  
  process.exit(0);
}

createTestUser().catch(console.error);