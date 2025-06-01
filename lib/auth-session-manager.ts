import { Platform } from 'react-native';
import { webStorage, mobileStorage } from './secure-storage';

const SESSION_TOKEN_KEY = 'better-auth.session-token';
const SESSION_DATA_KEY = 'better-auth.session_data';

export const sessionManager = {
  // Store session after successful login
  async storeSession(sessionData: any) {
    const storage = Platform.OS === 'web' ? webStorage : mobileStorage;
    
    try {
      // Store the session token if available
      if (sessionData.token) {
        storage.setItem(SESSION_TOKEN_KEY, sessionData.token);
      }
      
      // Store the full session data
      if (sessionData.session || sessionData.user) {
        const dataToStore = {
          user: sessionData.user,
          session: sessionData.session,
          token: sessionData.token,
          expiresAt: sessionData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        storage.setItem(SESSION_DATA_KEY, JSON.stringify(dataToStore));
      }
      
      return true;
    } catch (error) {
      console.error('[SESSION MANAGER] Failed to store session:', error);
      return false;
    }
  },
  
  // Get stored session
  async getSession() {
    const storage = Platform.OS === 'web' ? webStorage : mobileStorage;
    
    try {
      const sessionDataStr = storage.getItem(SESSION_DATA_KEY);
      if (!sessionDataStr) {
        return null;
      }
      
      const sessionData = JSON.parse(sessionDataStr);
      
      // Check if session is expired
      if (sessionData.expiresAt && new Date(sessionData.expiresAt) < new Date()) {
        this.clearSession();
        return null;
      }
      
      return sessionData;
    } catch (error) {
      console.error('[SESSION MANAGER] Failed to get session:', error);
      return null;
    }
  },
  
  // Get session token for API requests
  getSessionToken() {
    const storage = Platform.OS === 'web' ? webStorage : mobileStorage;
    return storage.getItem(SESSION_TOKEN_KEY);
  },
  
  // Clear session
  async clearSession() {
    const storage = Platform.OS === 'web' ? webStorage : mobileStorage;
    
    try {
      storage.removeItem(SESSION_TOKEN_KEY);
      storage.removeItem(SESSION_DATA_KEY);
      return true;
    } catch (error) {
      console.error('[SESSION MANAGER] Failed to clear session:', error);
      return false;
    }
  },
  
  // Add session token to request headers
  addAuthHeaders(headers: Record<string, string> = {}) {
    const token = this.getSessionToken();
    
    if (token) {
      return {
        ...headers,
        'Authorization': `Bearer ${token}`,
      };
    }
    
    return headers;
  }
};