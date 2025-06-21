import { logger } from '@/lib/core/debug/server-logger';

// Simple in-memory cache for session lookups
const sessionCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache
const MAX_CACHE_SIZE = 1000; // Maximum number of cached sessions

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of sessionCache.entries()) {
    if (value.expires < now) {
      sessionCache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.auth.debug('Session cache cleanup', {
      cleaned,
      remaining: sessionCache.size
    });
  }
}, 60 * 1000); // Clean up every minute

export function getCachedSession(token: string): any | null {
  const cached = sessionCache.get(token);
  
  if (cached && cached.expires > Date.now()) {
    logger.auth.debug('Session cache hit', { token: token.substring(0, 10) + '...' });
    return cached.data;
  }
  
  // Remove expired entry
  if (cached) {
    sessionCache.delete(token);
  }
  
  return null;
}

export function setCachedSession(token: string, data: any): void {
  // Enforce cache size limit
  if (sessionCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entries (simple FIFO)
    const keysToRemove = Array.from(sessionCache.keys()).slice(0, 100);
    keysToRemove.forEach(key => sessionCache.delete(key));
    
    logger.auth.debug('Session cache size limit reached, removed old entries', {
      removed: keysToRemove.length
    });
  }
  
  sessionCache.set(token, {
    data,
    expires: Date.now() + CACHE_TTL
  });
  
  logger.auth.debug('Session cached', { 
    token: token.substring(0, 10) + '...',
    cacheSize: sessionCache.size
  });
}

export function clearCachedSession(token: string): void {
  if (sessionCache.delete(token)) {
    logger.auth.debug('Session removed from cache', { 
      token: token.substring(0, 10) + '...' 
    });
  }
}

export function clearAllCachedSessions(): void {
  const size = sessionCache.size;
  sessionCache.clear();
  logger.auth.info('All sessions cleared from cache', { clearedCount: size });
}

export function getCacheStats() {
  return {
    size: sessionCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttl: CACHE_TTL
  };
}