import { authClient } from './auth-client';
import { sessionManager } from './auth-session-manager';
import { Platform } from 'react-native';

export async function testSignOut() {
  console.log('=== Testing Sign Out ===');
  
  // Get current session token
  const token = sessionManager.getSessionToken();
  console.log('Current session token:', token ? `${token.substring(0, 20)}...` : 'None');
  
  // Check auth client configuration
  console.log('Auth client config:', {
    hasSignOut: typeof authClient.signOut === 'function',
    availableMethods: Object.keys(authClient).filter(key => typeof authClient[key] === 'function'),
  });
  
  // Check if getSession exists
  if (typeof authClient.getSession === 'function') {
    try {
      // Try to get session first
      const session = await authClient.getSession();
      console.log('Current session:', {
        hasSession: !!session,
        sessionId: session?.session?.id,
        userId: session?.user?.id,
      });
    } catch (error) {
      console.log('Error getting session:', error);
    }
  } else {
    console.log('getSession method not available on authClient');
  }
  
  // Debug storage
  const debugInfo = await sessionManager.debugTokenStorage();
  console.log('Storage debug info:', debugInfo);
}