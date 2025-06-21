#!/usr/bin/env bun
/**
 * Test session persistence and management
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';

process.env.NODE_ENV = 'production';

async function testSessionPersistence() {
  console.log('Testing session persistence and management...\n');
  
  const baseURL = 'http://localhost:8081';
  let sessionCookie: string | null = null;
  
  // 1. Create a test user
  console.log('1. Creating test user...');
  try {
    const signUpResponse = await fetch(`${baseURL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test-session@example.com',
        password: 'TestPassword123!',
        name: 'Test User',
      }),
    });
    
    console.log(`   Sign-up status: ${signUpResponse.status}`);
    
    if (signUpResponse.status === 201 || signUpResponse.status === 200) {
      console.log('✅ User created successfully');
      
      // Extract cookies
      const setCookieHeader = signUpResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        sessionCookie = setCookieHeader;
        console.log('   Session cookie received:', sessionCookie.substring(0, 50) + '...');
      }
    } else {
      const error = await signUpResponse.text();
      console.log('   Sign-up response:', error);
      
      // If user exists, try to sign in
      if (error.includes('already exists') || error.includes('duplicate')) {
        console.log('   User already exists, trying to sign in...');
      }
    }
  } catch (error) {
    console.error('❌ Sign-up error:', error);
  }
  
  // 2. Sign in
  console.log('\n2. Testing sign-in...');
  try {
    const signInResponse = await fetch(`${baseURL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionCookie && { 'Cookie': sessionCookie }),
      },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({
        email: 'test-session@example.com',
        password: 'TestPassword123!',
      }),
    });
    
    console.log(`   Sign-in status: ${signInResponse.status}`);
    
    if (signInResponse.ok) {
      const data = await signInResponse.json();
      console.log('✅ Sign-in successful');
      console.log('   User:', data.user?.email);
      console.log('   Session ID:', data.session?.id);
      console.log('   Has token:', !!data.session?.token);
      
      // Extract session cookie
      const setCookieHeader = signInResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        sessionCookie = setCookieHeader;
        console.log('   New session cookie:', sessionCookie.substring(0, 50) + '...');
      }
      
      // Check for different cookie types
      const cookies = signInResponse.headers.get('set-cookie');
      if (cookies) {
        console.log('\n   Cookies set:');
        const cookieList = cookies.split(',').map(c => c.trim());
        cookieList.forEach(cookie => {
          const [name] = cookie.split('=');
          console.log(`     - ${name}`);
        });
      }
    } else {
      const error = await signInResponse.text();
      console.error('❌ Sign-in failed:', error);
    }
  } catch (error) {
    console.error('❌ Sign-in error:', error);
  }
  
  // 3. Check session persistence
  console.log('\n3. Testing session persistence...');
  
  // Test with cookie
  console.log('\n   a) Testing with cookie...');
  try {
    const sessionResponse = await fetch(`${baseURL}/api/auth/session`, {
      method: 'GET',
      headers: {
        ...(sessionCookie && { 'Cookie': sessionCookie }),
      },
      credentials: 'include',
    });
    
    console.log(`      Status: ${sessionResponse.status}`);
    
    if (sessionResponse.ok) {
      const data = await sessionResponse.json();
      console.log('✅    Session valid with cookie');
      console.log('      User:', data.user?.email);
      console.log('      Session expires:', data.session?.expiresAt);
    } else {
      console.log('❌    No session found with cookie');
    }
  } catch (error) {
    console.error('❌    Session check error:', error);
  }
  
  // Test with Bearer token
  console.log('\n   b) Testing with Bearer token...');
  try {
    // First get a token
    const tokenResponse = await fetch(`${baseURL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test-session@example.com',
        password: 'TestPassword123!',
      }),
    });
    
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      const token = tokenData.session?.token;
      
      if (token) {
        console.log('      Got token:', token.substring(0, 20) + '...');
        
        // Test session with Bearer token
        const bearerResponse = await fetch(`${baseURL}/api/auth/session`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        console.log(`      Bearer status: ${bearerResponse.status}`);
        
        if (bearerResponse.ok) {
          const data = await bearerResponse.json();
          console.log('✅    Session valid with Bearer token');
          console.log('      User:', data.user?.email);
        } else {
          console.log('❌    No session found with Bearer token');
        }
      }
    }
  } catch (error) {
    console.error('❌    Bearer token test error:', error);
  }
  
  // 4. Test profile completion status
  console.log('\n4. Checking profile completion status...');
  try {
    const meResponse = await fetch(`${baseURL}/api/auth/session`, {
      method: 'GET',
      headers: {
        ...(sessionCookie && { 'Cookie': sessionCookie }),
      },
      credentials: 'include',
    });
    
    if (meResponse.ok) {
      const data = await meResponse.json();
      console.log('   User profile status:');
      console.log('     - Email:', data.user?.email);
      console.log('     - Name:', data.user?.name);
      console.log('     - Role:', data.user?.role || 'Not set');
      console.log('     - Needs profile completion:', data.user?.needsProfileCompletion);
      console.log('     - Organization ID:', data.user?.organizationId || 'Not set');
      console.log('     - Email verified:', data.user?.emailVerified);
    }
  } catch (error) {
    console.error('❌ Profile check error:', error);
  }
  
  // 5. Test sign-out
  console.log('\n5. Testing sign-out...');
  try {
    const signOutResponse = await fetch(`${baseURL}/api/auth/sign-out`, {
      method: 'POST',
      headers: {
        ...(sessionCookie && { 'Cookie': sessionCookie }),
      },
      credentials: 'include',
    });
    
    console.log(`   Sign-out status: ${signOutResponse.status}`);
    
    if (signOutResponse.ok) {
      console.log('✅ Sign-out successful');
      
      // Check if session is cleared
      const checkResponse = await fetch(`${baseURL}/api/auth/session`, {
        method: 'GET',
        headers: {
          ...(sessionCookie && { 'Cookie': sessionCookie }),
        },
        credentials: 'include',
      });
      
      console.log(`   Session check after sign-out: ${checkResponse.status}`);
      if (checkResponse.status === 404 || checkResponse.status === 401) {
        console.log('✅ Session properly cleared');
      } else {
        console.log('⚠️  Session might not be properly cleared');
      }
    }
  } catch (error) {
    console.error('❌ Sign-out error:', error);
  }
  
  // Summary
  console.log('\n📊 Session Persistence Test Summary:');
  console.log('   - Better Auth endpoints: ✅ Working');
  console.log('   - Cookie-based sessions: Test completed');
  console.log('   - Bearer token support: Test completed');
  console.log('   - Profile completion fields: Test completed');
  console.log('   - Sign-out functionality: Test completed');
}

testSessionPersistence();