import { auth } from './auth-server';
import { db } from '@/src/db';
import { session as sessionTable, user as userTable } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import type { Session, User } from 'better-auth/types';
import { logger } from '@/lib/core/debug/unified-logger';

/**
 * Enhanced session retrieval that works with mobile Bearer tokens
 * This version tries multiple approaches to find a valid session
 */
export async function getSessionWithBearer(headers: Headers): Promise<{
  session: Session;
  user: User;
} | null> {
  try {
    // Log all headers for debugging
    const authHeader = headers.get('authorization');
    const cookieHeader = headers.get('cookie');
    
    logger.auth.debug('getSessionWithBearer called', {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? authHeader.substring(0, 30) + '...' : null,
      hasCookieHeader: !!cookieHeader,
      cookieHeaderPreview: cookieHeader ? cookieHeader.substring(0, 50) + '...' : null,
      allHeaders: Array.from(headers.entries()).map(([key, value]) => ({
        key,
        valuePreview: value.substring(0, 30) + '...'
      }))
    });
    
    // First try standard Better Auth approach (cookies)
    const cookieSession = await auth.api.getSession({ headers });
    if (cookieSession) {
      logger.auth.debug('Found session via cookie');
      return cookieSession;
    }

    // Check for Bearer token in Authorization header (reuse the variable from above)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.auth.debug('No Bearer token found in Authorization header');
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    logger.auth.debug('Trying Bearer token', { 
      tokenPreview: token.substring(0, 20) + '...' 
    });
    
    // Try Better Auth with the bearer plugin
    // The bearer plugin should handle this automatically, but we'll also try cookie format
    const modifiedHeaders = new Headers(headers);
    modifiedHeaders.set('cookie', `better-auth.session-token=${token}`);
    
    const bearerSession = await auth.api.getSession({ 
      headers: modifiedHeaders 
    });
    
    if (bearerSession) {
      logger.auth.debug('Found session via Bearer token with Better Auth');
      return bearerSession;
    }

    // If Better Auth fails, query the database directly as a fallback
    logger.auth.debug('Better Auth failed to find session, querying database directly');
    
    const sessionData = await db
      .select({
        session: sessionTable,
        user: userTable,
      })
      .from(sessionTable)
      .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
      .where(eq(sessionTable.token, token))
      .limit(1);

    if (sessionData.length === 0) {
      logger.auth.debug('No session found in database for token');
      return null;
    }

    const { session, user } = sessionData[0];
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      logger.auth.info('Session expired', { 
        sessionId: session.id,
        expiresAt: session.expiresAt 
      });
      return null;
    }

    logger.auth.debug('Found valid session in database', {
      sessionId: session.id,
      userId: user.id,
    });
    
    // Return in Better Auth format
    return {
      session: {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        token: session.token,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      } as Session,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Include custom fields
        role: user.role,
        organizationId: user.organizationId,
        needsProfileCompletion: user.needsProfileCompletion,
      } as User,
    };
  } catch (error) {
    logger.auth.error('Error retrieving session with Bearer token', error);
    return null;
  }
}