/**
 * Session Utilities
 * Centralized session management and validation
 */

import { Platform } from 'react-native';
import type { Session, User } from 'better-auth/types';
import { authClient } from './auth-client';
import { logger } from '@/lib/core/debug/unified-logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Session cache for performance
let sessionCache: {
  session: Session | null;
  user: User | null;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get current session with caching
 */
export async function getCachedSession(): Promise<{ session: Session | null; user: User | null }> {
  // Check cache first
  if (sessionCache && Date.now() - sessionCache.timestamp < CACHE_DURATION) {
    logger.auth.debug('Returning cached session', {
      userId: sessionCache.user?.id,
      cacheAge: Date.now() - sessionCache.timestamp,
    });
    return {
      session: sessionCache.session,
      user: sessionCache.user,
    };
  }

  // Fetch fresh session
  try {
    const result = await authClient.getSession();
    
    // Update cache
    sessionCache = {
      session: result?.session || null,
      user: result?.user || null,
      timestamp: Date.now(),
    };
    
    logger.auth.debug('Session cache updated', {
      hasSession: !!result?.session,
      userId: result?.user?.id,
    });
    
    return {
      session: sessionCache.session,
      user: sessionCache.user,
    };
  } catch (error) {
    logger.auth.error('Failed to get session', error);
    return { session: null, user: null };
  }
}

/**
 * Clear session cache
 */
export function clearSessionCache(): void {
  sessionCache = null;
  logger.auth.debug('Session cache cleared');
}

/**
 * Check if session is valid and not expired
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false;
  
  // Check if session has required fields
  if (!session.id || !session.userId) return false;
  
  // Check expiration if available
  const expiresAt = (session as any).expiresAt;
  if (expiresAt) {
    const expirationTime = new Date(expiresAt).getTime();
    const isExpired = expirationTime < Date.now();
    
    if (isExpired) {
      logger.auth.debug('Session expired', {
        sessionId: session.id,
        expiresAt,
      });
      return false;
    }
  }
  
  return true;
}

/**
 * Get session expiration time
 */
export function getSessionExpiration(session: Session | null): Date | null {
  if (!session) return null;
  
  const expiresAt = (session as any).expiresAt;
  if (!expiresAt) return null;
  
  return new Date(expiresAt);
}

/**
 * Check if session is expiring soon
 */
export function isSessionExpiringSoon(session: Session | null, thresholdMinutes: number = 30): boolean {
  const expiration = getSessionExpiration(session);
  if (!expiration) return false;
  
  const threshold = thresholdMinutes * 60 * 1000;
  const timeUntilExpiration = expiration.getTime() - Date.now();
  
  return timeUntilExpiration < threshold && timeUntilExpiration > 0;
}

/**
 * Session storage key management
 */
export const SESSION_KEYS = {
  // Better Auth keys
  SESSION_TOKEN: 'better-auth.session-token',
  SESSION_TOKEN_UNDERSCORE: 'better-auth.session_token',
  SESSION_TOKEN_DASH: 'better-auth_session-token',
  REFRESH_TOKEN: 'better-auth.refresh-token',
  
  // Legacy keys
  SESSION_DATA: 'session-data',
  USER_DATA: 'user-data',
  
  // App-specific keys
  LAST_ACTIVITY: 'last-activity',
  REMEMBER_ME: 'remember-me',
  DEVICE_ID: 'device-id',
};

/**
 * Get all session-related storage keys
 */
export function getAllSessionKeys(): string[] {
  return [
    ...Object.values(SESSION_KEYS),
    // Additional variations
    'better-auth:session-token',
    'better-auth:session_token',
    'better-auth:session',
    'better_auth_session_token',
    'betterauth.session-token',
    'auth-session',
    'auth-token',
    'session',
    'token',
  ];
}

/**
 * Clear all session data from storage
 */
export async function clearAllSessionData(): Promise<void> {
  const keys = getAllSessionKeys();
  
  if (Platform.OS === 'web') {
    // Clear localStorage
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        logger.auth.debug('Failed to remove localStorage key', { key, error });
      }
    });
    
    // Clear sessionStorage
    keys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        logger.auth.debug('Failed to remove sessionStorage key', { key, error });
      }
    });
  } else {
    // Clear AsyncStorage for React Native
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      logger.auth.error('Failed to clear AsyncStorage', error);
    }
  }
  
  // Clear session cache
  clearSessionCache();
  
  logger.auth.info('All session data cleared');
}

/**
 * Session activity tracking
 */
export async function updateLastActivity(): Promise<void> {
  const timestamp = Date.now();
  
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, timestamp.toString());
    } else {
      await AsyncStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, timestamp.toString());
    }
  } catch (error) {
    logger.auth.debug('Failed to update last activity', error);
  }
}

/**
 * Get last activity timestamp
 */
export async function getLastActivity(): Promise<number | null> {
  try {
    let value: string | null;
    
    if (Platform.OS === 'web') {
      value = localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY);
    } else {
      value = await AsyncStorage.getItem(SESSION_KEYS.LAST_ACTIVITY);
    }
    
    return value ? parseInt(value, 10) : null;
  } catch (error) {
    logger.auth.debug('Failed to get last activity', error);
    return null;
  }
}

/**
 * Check if user has been inactive for too long
 */
export async function isSessionInactive(maxInactivityMinutes: number = 30): Promise<boolean> {
  const lastActivity = await getLastActivity();
  if (!lastActivity) return false;
  
  const inactivityTime = Date.now() - lastActivity;
  const maxInactivity = maxInactivityMinutes * 60 * 1000;
  
  return inactivityTime > maxInactivity;
}

/**
 * Device ID management for session security
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    let deviceId: string | null;
    
    if (Platform.OS === 'web') {
      deviceId = localStorage.getItem(SESSION_KEYS.DEVICE_ID);
    } else {
      deviceId = await AsyncStorage.getItem(SESSION_KEYS.DEVICE_ID);
    }
    
    if (!deviceId) {
      // Generate new device ID
      deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      if (Platform.OS === 'web') {
        localStorage.setItem(SESSION_KEYS.DEVICE_ID, deviceId);
      } else {
        await AsyncStorage.setItem(SESSION_KEYS.DEVICE_ID, deviceId);
      }
      
      logger.auth.info('New device ID generated', { deviceId });
    }
    
    return deviceId;
  } catch (error) {
    logger.auth.error('Failed to get/create device ID', error);
    return 'unknown-device';
  }
}

/**
 * Session refresh utilities
 */
export async function refreshSessionIfNeeded(): Promise<boolean> {
  try {
    const { session } = await getCachedSession();
    
    if (!session) {
      logger.auth.debug('No session to refresh');
      return false;
    }
    
    // Check if session needs refresh
    if (isSessionExpiringSoon(session, 60)) {
      logger.auth.info('Session expiring soon, refreshing', {
        sessionId: session.id,
        expiresAt: getSessionExpiration(session),
      });
      
      // Clear cache to force refresh
      clearSessionCache();
      
      // Get fresh session (this will trigger refresh if needed)
      const { session: newSession } = await getCachedSession();
      
      return !!newSession;
    }
    
    return true;
  } catch (error) {
    logger.auth.error('Failed to refresh session', error);
    return false;
  }
}

/**
 * Remember me functionality
 */
export async function setRememberMe(remember: boolean): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (remember) {
        localStorage.setItem(SESSION_KEYS.REMEMBER_ME, 'true');
      } else {
        localStorage.removeItem(SESSION_KEYS.REMEMBER_ME);
      }
    } else {
      if (remember) {
        await AsyncStorage.setItem(SESSION_KEYS.REMEMBER_ME, 'true');
      } else {
        await AsyncStorage.removeItem(SESSION_KEYS.REMEMBER_ME);
      }
    }
  } catch (error) {
    logger.auth.debug('Failed to set remember me', error);
  }
}

export async function getRememberMe(): Promise<boolean> {
  try {
    let value: string | null;
    
    if (Platform.OS === 'web') {
      value = localStorage.getItem(SESSION_KEYS.REMEMBER_ME);
    } else {
      value = await AsyncStorage.getItem(SESSION_KEYS.REMEMBER_ME);
    }
    
    return value === 'true';
  } catch (error) {
    logger.auth.debug('Failed to get remember me', error);
    return false;
  }
}