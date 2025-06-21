#!/usr/bin/env bun
/**
 * Create a test user in the database
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';
import { db } from '@/src/db';
import { user } from '@/src/db/schema';
import bcrypt from 'bcryptjs';

process.env.NODE_ENV = 'production';

async function createTestUser() {
  console.log('Creating test user...\n');
  
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    
    // Create user using Better Auth API
    const response = await fetch('http://localhost:8081/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
      }),
    });
    
    console.log(`Sign-up status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ User created successfully');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('Sign-up error:', error);
      
      // If user exists, just log it
      if (error.includes('already exists')) {
        console.log('User already exists, that\'s okay');
      }
    }
    
    // Now test sign-in
    console.log('\nTesting sign-in...');
    const signInResponse = await fetch('http://localhost:8081/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!',
      }),
    });
    
    console.log(`Sign-in status: ${signInResponse.status}`);
    const signInData = await signInResponse.json();
    console.log('Sign-in response:', JSON.stringify(signInData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

createTestUser();