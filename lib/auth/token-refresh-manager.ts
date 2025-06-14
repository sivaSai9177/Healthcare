import { authClient } from './auth-client';
import { log } from '@/lib/core/debug/logger';
import { Platform } from 'react-native';

interface TokenRefreshConfig {
  refreshThreshold: number; // Refresh when less than X seconds remaining
  retryAttempts: number;
  retryDelay: number;
}

class TokenRefreshManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<any> | null = null;
  
  private config: TokenRefreshConfig = {
    refreshThreshold: 5 * 60, // 5 minutes before expiry
    retryAttempts: 3,
    retryDelay: 1000,
  };

  constructor() {
    // Start monitoring sessions
    this.startSessionMonitoring();
  }

  /**
   * Start monitoring the session and schedule refresh when needed
   */
  private async startSessionMonitoring() {
    // Only run on client side
    if (typeof window === 'undefined' && Platform.OS === 'web') return;
    
    try {
      // In Better Auth v1.2.8, session monitoring is handled by the useSession hook
      // The token refresh manager doesn't need to directly monitor sessions
      // as the auth store and SyncProvider handle this
      log.debug('Session monitoring delegated to SyncProvider', 'AUTH');
      
      // We can listen to auth store changes instead
      const { useAuthStore } = await import('../stores/auth-store');
      const unsubscribe = useAuthStore.subscribe(
        (state) => state.session,
        (session) => {
          if (session?.session) {
            this.scheduleTokenRefresh(session.session);
          }
        }
      );
      
      // Get initial session from store
      const currentSession = useAuthStore.getState().session;
      if (currentSession?.session) {
        this.scheduleTokenRefresh(currentSession.session);
      }
    } catch (error) {
      log.error('Failed to start session monitoring', 'AUTH', error);
    }
  }

  /**
   * Schedule a token refresh based on session expiry
   */
  private scheduleTokenRefresh(session: any) {
    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Calculate when to refresh (5 minutes before expiry)
    const expiresAt = new Date(session.expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const refreshTime = timeUntilExpiry - (this.config.refreshThreshold * 1000);

    if (refreshTime > 0) {
      log.debug('Scheduling token refresh', 'AUTH', {
        expiresAt: new Date(expiresAt).toISOString(),
        refreshIn: Math.round(refreshTime / 1000) + 's'
      });

      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    } else if (timeUntilExpiry > 0) {
      // Token expires soon, refresh immediately
      this.refreshToken();
    }
  }

  /**
   * Refresh the authentication token
   */
  async refreshToken(): Promise<boolean> {
    // If already refreshing, wait for the existing refresh
    if (this.isRefreshing && this.refreshPromise) {
      log.debug('Token refresh already in progress, waiting...', 'AUTH');
      try {
        await this.refreshPromise;
        return true;
      } catch {
        return false;
      }
    }

    this.isRefreshing = true;
    
    // Create refresh promise
    this.refreshPromise = this.performRefresh();
    
    try {
      await this.refreshPromise;
      return true;
    } catch (error) {
      log.error('Token refresh failed', 'AUTH', error);
      return false;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performRefresh(): Promise<void> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        log.info(`Attempting token refresh (attempt ${attempt}/${this.config.retryAttempts})`, 'AUTH');
        
        // Get current session
        const currentSession = await authClient.getSession();
        if (!currentSession?.session) {
          throw new Error('No active session to refresh');
        }

        // Check if session is still valid
        const expiresAt = new Date(currentSession.session.expiresAt).getTime();
        if (Date.now() >= expiresAt) {
          throw new Error('Session has already expired');
        }

        // Perform refresh - Better Auth handles this internally
        // For now, we'll just fetch a fresh session which triggers Better Auth's refresh logic
        const refreshedSession = await authClient.getSession({ 
          fetchOptions: { 
            cache: 'no-cache',
            credentials: Platform.OS === 'web' ? 'include' : 'omit'
          } 
        });

        if (refreshedSession?.session) {
          log.info('Token refresh successful', 'AUTH');
          
          // Schedule next refresh
          this.scheduleTokenRefresh(refreshedSession.session);
          return;
        } else {
          throw new Error('Failed to refresh session');
        }
      } catch (error) {
        lastError = error;
        log.warn(`Token refresh attempt ${attempt} failed`, 'AUTH', error);
        
        if (attempt < this.config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        }
      }
    }

    // All attempts failed
    throw lastError || new Error('Token refresh failed after all attempts');
  }

  /**
   * Stop monitoring sessions and clear timers
   */
  stop() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Manually trigger a token refresh
   */
  async forceRefresh(): Promise<boolean> {
    log.info('Force refreshing token', 'AUTH');
    return this.refreshToken();
  }
}

// Export singleton instance
export const tokenRefreshManager = new TokenRefreshManager();