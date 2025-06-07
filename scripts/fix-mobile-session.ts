#!/usr/bin/env bun

// Script to manually store session token for testing
import { mobileStorage } from '@/lib/core/secure-storage';
import { authClient } from '@/lib/auth/auth-client';

async function fixMobileSession() {
  console.log('🔧 Fixing mobile session storage...\n');
  
  try {
    // Get current session from Better Auth
    console.log('📡 Fetching session from Better Auth...');
    const session = await authClient.getSession();
    
    if (!session) {
      console.log('❌ No active session found. Please login first.');
      return;
    }
    
    console.log('✅ Session found:', {
      userId: session.user?.id,
      userEmail: session.user?.email,
      hasToken: !!session.session?.token,
      tokenPreview: session.session?.token ? session.session.token.substring(0, 20) + '...' : null,
    });
    
    if (session.session?.token) {
      // Store the token in various formats that might be expected
      const token = session.session.token;
      
      console.log('\n💾 Storing token in mobile storage...');
      
      // Store as Better Auth expects
      mobileStorage.setItem('better-auth_session-token', token);
      mobileStorage.setItem('better-auth.session-token', token);
      
      // Store as cookie format
      const cookieValue = `better-auth.session-token=${token}; Path=/; HttpOnly`;
      mobileStorage.setItem('better-auth_cookie', cookieValue);
      mobileStorage.setItem('better-auth.cookie', cookieValue);
      
      // Store session data
      mobileStorage.setItem('better-auth_session_data', JSON.stringify({
        token,
        userId: session.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      
      console.log('✅ Token stored successfully in mobile storage');
      
      // Verify storage
      console.log('\n🔍 Verifying storage...');
      const storedToken = mobileStorage.getItem('better-auth_session-token');
      const storedCookie = mobileStorage.getItem('better-auth_cookie');
      
      console.log('- Direct token:', storedToken ? '✅ Found' : '❌ Not found');
      console.log('- Cookie format:', storedCookie ? '✅ Found' : '❌ Not found');
      
    } else {
      console.log('❌ Session does not contain a token');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixMobileSession();