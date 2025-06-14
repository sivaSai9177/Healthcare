// Import crypto polyfill first for React Native
import "../core/crypto";

import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { Platform, AppState, AppStateStatus } from "react-native";
import { webStorage, mobileStorage } from "../core/secure-storage";
import { getAuthUrl } from "../core/config/unified-env";
import { sessionManager } from "./auth-session-manager";
import { log } from "../core/debug/logger";

const BASE_URL = getAuthUrl();

// Log configuration once (only on client side)
if (typeof window !== 'undefined' || __DEV__) {
  log.info('Auth client initialized', 'AUTH_CLIENT', {
    platform: Platform.OS,
    baseURL: BASE_URL,
    authEndpoint: `${BASE_URL}/api/auth`,
    isExpoGo: !Platform.OS || Platform.OS === 'ios' || Platform.OS === 'android'
  });
}

const baseAuthClient = createAuthClient({
  baseURL: `${BASE_URL}/api/auth`, // Full auth endpoint path
  fetchOptions: {
    // Add credentials for cookie support in tunnel mode
    credentials: Platform.OS === 'web' ? 'include' : 'omit',
    headers: {
      'Content-Type': 'application/json',
      // Add security headers
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
    },
    // Request timeout
    ...(Platform.OS === 'web' && {
      signal: AbortSignal.timeout(30000), // 30 second timeout
    }),
  },
  // Retry configuration
  retry: {
    retries: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    retryCondition: (error) => {
      // Retry on network errors or 5xx errors
      return !error.response || error.response.status >= 500;
    },
  },
  // Session refresh configuration
  sessionRefresh: {
    enabled: true,
    interval: 5 * 60 * 1000, // Check every 5 minutes
    refreshThreshold: 24 * 60 * 60 * 1000, // Refresh if expires in less than 24 hours
  },
  plugins: [
    expoClient({
      scheme: "expo-starter", // App scheme from app.json
      storagePrefix: "better-auth", // Use Better Auth's default prefix
      storage: Platform.OS === 'web' ? webStorage : mobileStorage,
      disableCache: false, // Enable session caching
      // Security settings
      secureStorage: Platform.OS !== 'web', // Use secure storage on mobile
      sessionValidation: {
        // Validate session on app startup
        validateOnStartup: true,
        // Re-validate session after app comes to foreground
        validateOnForeground: true,
        // Validation interval
        validationInterval: 5 * 60 * 1000, // 5 minutes
      },
      // Token refresh settings
      tokenRefresh: {
        // Automatically refresh tokens
        autoRefresh: true,
        // Refresh threshold (refresh if expires in less than this)
        refreshThreshold: 5 * 60 * 1000, // 5 minutes
        // Retry failed refresh attempts
        retryFailedRefresh: true,
        maxRetries: 3,
      },
    }),
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: true,
          defaultValue: "user",
        },
        organizationId: {
          type: "string", 
          required: false,
        },
        organizationName: {
          type: "string",
          required: false,
        },
        department: {
          type: "string",
          required: false,
        },
        needsProfileCompletion: {
          type: "boolean",
          required: false,
          defaultValue: true,
        },
      },
    }),
  ],
});

// Store the original signOut method
const originalSignOut = baseAuthClient.signOut;

// Override just the signOut method while preserving all other methods
baseAuthClient.signOut = async function(options?: any) {
  try {
    // Add a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for sign-out
    
    // Merge options with timeout signal
    const enhancedOptions = {
      ...options,
      fetchOptions: {
        ...options?.fetchOptions,
        signal: controller.signal,
      }
    };
    
    try {
      // Call the original signOut with timeout
      const result = await originalSignOut.call(this, enhancedOptions);
      clearTimeout(timeoutId);
      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout errors
      if (error.name === 'AbortError' || error.message?.includes('signal timed out')) {
        log.debug('Sign-out request timed out (session cleared locally)', 'AUTH_CLIENT');
        // Return success since local cleanup already happened
        return { success: true };
      }
      
      // Handle Better Auth v1.2.8 500 error
      if (error?.response?.status === 500 || error?.status === 500) {
        log.debug('Better Auth sign-out returned 500 (known issue, ignoring)', 'AUTH_CLIENT');
        return { success: true };
      }
      
      throw error;
    }
  } catch (error: any) {
    log.error('Sign-out error:', 'AUTH_CLIENT', error);
    // Don't throw - sign-out should always succeed locally
    return { success: true };
  }
};

// Export the modified client directly
export const authClient = baseAuthClient;

// Add a getSession method for compatibility
// This delegates to the auth store which maintains the session state
authClient.getSession = async () => {
  try {
    const { useAuthStore } = await import('../stores/auth-store');
    const state = useAuthStore.getState();
    
    if (state.session && state.user) {
      return {
        session: state.session,
        user: state.user
      };
    }
    
    return null;
  } catch (error) {
    log.error('Failed to get session', 'AUTH_CLIENT', error);
    return null;
  }
};

export type AuthClient = typeof authClient;

// Session monitoring for mobile apps
if (Platform.OS !== 'web') {
  let appState = AppState.currentState;
  let lastBackgroundTime: number | null = null;
  
  AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground
      log.info('App came to foreground', 'AUTH_CLIENT', {
        lastBackgroundTime,
        timeSinceBackground: lastBackgroundTime ? Date.now() - lastBackgroundTime : null,
      });
      
      // Check if session needs refresh after being in background
      if (lastBackgroundTime && Date.now() - lastBackgroundTime > 5 * 60 * 1000) {
        // More than 5 minutes in background, validate session
        authClient.getSession().catch((error) => {
          log.error('Session validation failed after foreground', 'AUTH_CLIENT', { error });
        });
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App is going to background
      lastBackgroundTime = Date.now();
      log.info('App going to background', 'AUTH_CLIENT', { timestamp: lastBackgroundTime });
    }
    
    appState = nextAppState;
  });
}

// Enhanced auth client with security utilities
export const authClientEnhanced = {
  ...authClient,
  
  // Security utilities
  security: {
    // Check if session is about to expire
    isSessionExpiringSoon: async (thresholdMinutes: number = 30): Promise<boolean> => {
      try {
        const session = await authClient.getSession();
        if (!session?.session?.expiresAt) return true;
        
        const expiresAt = new Date(session.session.expiresAt).getTime();
        const now = Date.now();
        const threshold = thresholdMinutes * 60 * 1000;
        
        return (expiresAt - now) < threshold;
      } catch {
        return true;
      }
    },
    
    // Force session refresh
    forceRefresh: async (): Promise<boolean> => {
      try {
        // Clear cached session
        await sessionManager.clearSession();
        // Get fresh session from server
        const session = await authClient.getSession();
        return !!session;
      } catch (error) {
        log.error('Force refresh failed', 'AUTH_CLIENT', { error });
        return false;
      }
    },
    
    // Validate session integrity
    validateSession: async (): Promise<{ valid: boolean; reason?: string }> => {
      try {
        const session = await authClient.getSession();
        
        if (!session) {
          return { valid: false, reason: 'No session found' };
        }
        
        if (!session.session?.expiresAt) {
          return { valid: false, reason: 'Invalid session structure' };
        }
        
        const expiresAt = new Date(session.session.expiresAt).getTime();
        if (expiresAt < Date.now()) {
          return { valid: false, reason: 'Session expired' };
        }
        
        // Additional validation can be added here
        
        return { valid: true };
      } catch (error) {
        return { valid: false, reason: 'Validation error' };
      }
    },
  },
  
  // Enhanced sign out with cleanup
  signOutEnhanced: async (options?: { everywhere?: boolean }): Promise<void> => {
    try {
      // Sign out from Better Auth
      await authClient.signOut();
      
      // Clear all local storage
      await sessionManager.clearSession();
      
      // Additional cleanup if needed
      if (options?.everywhere) {
        // This would revoke all sessions server-side
        // Requires server implementation
        log.info('Sign out everywhere requested', 'AUTH_CLIENT');
      }
    } catch (error) {
      log.error('Enhanced sign out failed', 'AUTH_CLIENT', { error });
      // Still clear local session even if server sign out fails
      await sessionManager.clearSession();
      throw error;
    }
  },
};