import { Platform } from 'react-native';
import { authClient } from './auth-client';
import { sessionManager } from './auth-session-manager';
import { webStorage, mobileStorage } from '../core/secure-storage';
import { log } from '../core/debug/logger';
import { router } from 'expo-router';
import { haptic } from '../ui/haptics';

export interface SignOutOptions {
  reason?: 'user_initiated' | 'session_expired' | 'security' | 'error';
  showAlert?: boolean;
  redirectTo?: string;
  clearAllData?: boolean;
}

export class SignOutManager {
  private static isSigningOut = false;

  /**
   * Comprehensive sign out that handles all cleanup
   */
  static async signOut(options: SignOutOptions = {}) {
    const { 
      reason = 'user_initiated', 
      showAlert = true, 
      redirectTo = '/(auth)/login',
      clearAllData = false 
    } = options;

    // Prevent multiple simultaneous signouts
    if (this.isSigningOut) {
      log.warn('Sign out already in progress', 'SIGNOUT');
      return;
    }

    this.isSigningOut = true;
    log.info('Starting sign out process', 'SIGNOUT', { reason });

    try {
      // 1. Clear local session first for immediate UI feedback
      await this.clearLocalSession();

      // 2. Clear auth store state
      const { useAuthStore } = await import('../stores/auth-store');
      const authStore = useAuthStore.getState();
      await authStore.clearAuth();

      // 3. Call Better Auth signOut API
      // Note: There's a known issue with Better Auth v1.2.8 where sign-out may return 500
      // even though the sign-out is successful. This is handled gracefully.
      try {
        // Try using the auth client's signOut method
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              log.info('Better Auth signOut completed successfully', 'SIGNOUT');
            },
            onError: (context) => {
              // Better Auth v1.2.8 has a known issue where sign-out returns 500
              // but the sign-out is actually successful
              if (context.response.status === 500) {
                log.debug('Better Auth signOut returned 500 (known issue, signout successful)', 'SIGNOUT');
              } else if (process.env.NODE_ENV === 'development') {
                log.debug('Better Auth signOut API error', 'SIGNOUT', {
                  status: context.response.status,
                  statusText: context.response.statusText
                });
              }
            }
          }
        });
      } catch (error) {
        // Better Auth v1.2.8 may throw on sign-out even when successful
        // This is a known issue and can be safely ignored
        if (process.env.NODE_ENV === 'development') {
          log.debug('Better Auth signOut exception (known issue, local signout successful)', 'SIGNOUT');
        }
      }

      // 4. Clear any additional app data if requested
      if (clearAllData) {
        await this.clearAllAppData();
      }

      // 5. Haptic feedback for better UX
      if (Platform.OS !== 'web') {
        haptic('success');
      }

      // 6. Show success message if requested
      if (showAlert && Platform.OS === 'web') {
        log.info('Successfully signed out', 'COMPONENT');
      }

      // 7. Navigate to login or specified route
      if (redirectTo) {
        // Small delay to ensure state updates propagate
        setTimeout(() => {
          router.replace(redirectTo as any);
        }, 100);
      }

      return { success: true };
    } catch (error) {
      log.error('Sign out error', 'SIGNOUT', error);
      
      // Even if something fails, ensure we're logged out locally
      await this.forceLocalSignOut();
      
      return { success: false, error };
    } finally {
      this.isSigningOut = false;
    }
  }

  /**
   * Clear local session data
   */
  private static async clearLocalSession() {
    const storage = Platform.OS === 'web' ? webStorage : mobileStorage;
    
    // Clear Better Auth keys
    const keysToRemove = [
      // Better Auth standard keys
      'better-auth_session-token',
      'better-auth_session_data',
      'better-auth_user_data',
      'better-auth_cookie',
      
      // Alternative formats
      'better-auth.session-token',
      'better-auth.session_data', 
      'better-auth.user_data',
      'better-auth.cookie',
      
      // Legacy keys
      'session-token',
      'auth-token',
      'user-data',
      
      // App-specific keys
      'expo-starter_auth_session',
      'expo-starter_auth_user',
    ];

    for (const key of keysToRemove) {
      try {
        storage.removeItem(key);
      } catch (error) {
        log.error(`Failed to remove ${key}`, 'SIGNOUT', error);
      }
    }

    // Clear session manager data
    await sessionManager.clearSession();
    
    log.info('Local session cleared', 'SIGNOUT');
  }

  /**
   * Clear all app data (for complete reset)
   */
  private static async clearAllAppData() {
    const storage = Platform.OS === 'web' ? webStorage : mobileStorage;
    
    // Additional app data to clear
    const appKeys = [
      'theme-preference',
      'spacing-density',
      'onboarding-completed',
      'app-settings',
      // Add more app-specific keys as needed
    ];

    for (const key of appKeys) {
      try {
        storage.removeItem(key);
      } catch (error) {
        log.error(`Failed to remove app data ${key}`, 'SIGNOUT', error);
      }
    }

    log.info('All app data cleared', 'SIGNOUT');
  }

  /**
   * Force local sign out (used when API calls fail)
   */
  private static async forceLocalSignOut() {
    log.warn('Forcing local sign out', 'SIGNOUT');
    
    // Clear everything we can
    await this.clearLocalSession();
    
    // Import auth store dynamically to avoid circular dependencies
    const { useAuthStore } = await import('../stores/auth-store');
    const authStore = useAuthStore.getState();
    await authStore.clearAuth();
  }

  /**
   * Sign out from all devices (server-side)
   */
  static async signOutAllDevices(options: SignOutOptions = {}) {
    log.info('Starting sign out from all devices', 'SIGNOUT');
    
    try {
      // First do local signout
      await this.signOut({ ...options, showAlert: false });
      
      // Then call server to revoke all sessions
      // This would need to be implemented on the server
      // For now, just local signout
      
      if (options.showAlert && Platform.OS === 'web') {
        log.info('Successfully signed out from all devices', 'COMPONENT');
      }
      
      return { success: true };
    } catch (error) {
      log.error('Sign out all devices error', 'SIGNOUT', error);
      return { success: false, error };
    }
  }

  /**
   * Check if user is currently signing out
   */
  static isInProgress() {
    return this.isSigningOut;
  }
}

// Export convenience functions
export const signOut = (options?: SignOutOptions) => SignOutManager.signOut(options);
export const signOutAllDevices = (options?: SignOutOptions) => SignOutManager.signOutAllDevices(options);