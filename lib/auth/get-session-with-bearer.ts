import { auth } from './auth';
import type { Session, User } from 'better-auth/types';

/**
 * Enhanced session retrieval that checks both cookies and Authorization header
 * This is necessary because Better Auth's getSession doesn't automatically check Bearer tokens
 */
export async function getSessionWithBearer(headers: Headers): Promise<{
  session: Session;
  user: User;
} | null> {
  try {
// TODO: Replace with structured logging - console.log('[SESSION] getSessionWithBearer called with headers:', {
      authorization: headers.get('authorization'),
      cookie: headers.get('cookie')?.substring(0, 50) + '...',
    });
    
    // First try standard cookie-based auth
    const cookieSession = await auth.api.getSession({ headers });
    if (cookieSession) {
// TODO: Replace with structured logging - console.log('[SESSION] Found session via cookie');
      return cookieSession;
    }

    // If no cookie session, check for Bearer token
    const authHeader = headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
// TODO: Replace with structured logging - console.log('[SESSION] No Bearer token found');
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
// TODO: Replace with structured logging - console.log('[SESSION] Trying Bearer token:', token.substring(0, 20) + '...');
    
    // Better Auth expects the token in a cookie format
    // Create a new headers object with the token as a cookie
    const modifiedHeaders = new Headers(headers);
    modifiedHeaders.set('cookie', `better-auth.session-token=${token}`);
    
    // Try to get session with the modified headers
    const bearerSession = await auth.api.getSession({ 
      headers: modifiedHeaders 
    });
    
    if (bearerSession) {
// TODO: Replace with structured logging - console.log('[SESSION] Found session via Bearer token');
    } else {
// TODO: Replace with structured logging - console.log('[SESSION] No session found with Bearer token');
    }
    
    return bearerSession;
  } catch (error) {
    console.error('[SESSION] Error retrieving session:', error);
    return null;
  }
}