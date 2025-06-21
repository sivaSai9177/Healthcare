import { authClient } from './auth-client';
import { authStore } from '@/lib/stores/auth-store';
import { router } from 'expo-router';
import { log } from '@/lib/core/debug/logger';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { ROUTES } from '@/lib/navigation/routes';

interface SessionTimeoutConfig {
  timeoutDuration: number; // Session timeout in milliseconds
  warningDuration: number; // Show warning before timeout
  checkInterval: number; // How often to check for activity
}

class SessionTimeoutManager {
  private lastActivityTime: number = Date.now();
  private timeoutTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private checkTimer: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private isActive = false;
  
  private config: SessionTimeoutConfig = {
    timeoutDuration: parseInt(process.env.EXPO_PUBLIC_SESSION_TIMEOUT || String(8 * 60 * 60 * 1000)), // 8 hours default (PRD requirement)
    warningDuration: 30 * 60 * 1000, // 30 minutes warning
    checkInterval: 0, // DISABLED - Session checks now handled by SyncProvider only
  };

  private warningCallback?: () => void;
  private timeoutCallback?: () => void;

  constructor() {
    // Setup activity listeners
    this.setupActivityListeners();
    
    // Setup app state listener for mobile
    if (Platform.OS !== 'web') {
      this.setupAppStateListener();
    }
  }

  /**
   * Start monitoring session timeout
   */
  start(options?: {
    onWarning?: () => void;
    onTimeout?: () => void;
  }) {
    if (this.isActive) return;
    
    this.isActive = true;
    this.warningCallback = options?.onWarning;
    this.timeoutCallback = options?.onTimeout;
    
    log.info('Session timeout monitoring started', 'AUTH', {
      timeoutDuration: this.config.timeoutDuration / 1000 + 's',
      warningDuration: this.config.warningDuration / 1000 + 's',
      checkInterval: this.config.checkInterval / 1000 + 's'
    });
    
    this.updateActivity();
    this.startTimers();
    
    // Disable periodic session checks since SyncProvider already handles this
    // The session timeout manager should only handle inactivity timeout
    // Session validity is checked by SyncProvider's TanStack Query
    
    // setTimeout(() => {
    //   if (this.isActive) {
    //     this.checkTimer = setInterval(() => {
    //       this.checkSession();
    //     }, this.config.checkInterval);
    //   }
    // }, 10000); // 10 second delay before starting checks
  }

  /**
   * Stop monitoring session timeout
   */
  stop() {
    this.isActive = false;
    this.clearTimers();
    
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    
    log.info('Session timeout monitoring stopped', 'AUTH');
  }

  /**
   * Update last activity time and reset timers
   */
  updateActivity() {
    this.lastActivityTime = Date.now();
    
    if (this.isActive) {
      this.clearTimers();
      this.startTimers();
    }
  }

  /**
   * Setup activity listeners for user interactions
   */
  private setupActivityListeners() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Web activity listeners
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
      
      const activityHandler = () => {
        this.updateActivity();
      };
      
      events.forEach(event => {
        window.addEventListener(event, activityHandler, { passive: true });
      });
      
      // Cleanup function
      return () => {
        events.forEach(event => {
          window.removeEventListener(event, activityHandler);
        });
      };
    }
  }

  /**
   * Setup app state listener for mobile
   */
  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          // App came to foreground, check session
          this.checkSession();
          this.updateActivity();
        } else if (nextAppState === 'background') {
          // App went to background, pause timers
          this.clearTimers();
        }
      }
    );
  }

  /**
   * Start timeout and warning timers
   */
  private startTimers() {
    // Warning timer
    const warningTime = this.config.timeoutDuration - this.config.warningDuration;
    this.warningTimer = setTimeout(() => {
      log.warn('Session timeout warning triggered', 'AUTH');
      if (this.warningCallback) {
        this.warningCallback();
      }
    }, warningTime);
    
    // Timeout timer
    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout();
    }, this.config.timeoutDuration);
  }

  /**
   * Clear all timers
   */
  private clearTimers() {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    
    if (this.checkTimer) {
      clearTimeout(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * Check if session is still valid
   * This should only check if the session exists and is not expired
   * It should NOT trigger timeout based on inactivity
   */
  private async checkSession() {
    // Don't check if not active
    if (!this.isActive) return;
    
    try {
      // Ensure authClient is available
      if (!authClient || typeof authClient.getSession !== 'function') {
        log.warn('Auth client not available for session check', 'AUTH');
        return;
      }
      
      const response = await authClient.getSession();
      
      // Check for various response formats from Better Auth
      const hasValidSession = response && (
        response.session || // Standard format
        response.data?.session || // Wrapped format
        (response.user && response.expiresAt) // Alternative format
      );
      
      if (!hasValidSession) {
        // No session, trigger timeout
        log.warn('No session found during check', 'AUTH', {
          responseKeys: response ? Object.keys(response) : [],
          hasUser: !!(response?.user || response?.data?.user),
          hasSession: !!(response?.session || response?.data?.session)
        });
        this.handleTimeout();
        return;
      }
      
      // Extract session data from various possible formats
      const sessionData = response.session || response.data?.session || response;
      
      // Check if session has expired
      const expiresAt = new Date(sessionData.expiresAt).getTime();
      if (Date.now() >= expiresAt) {
        log.warn('Session has expired', 'AUTH', {
          expiresAt: new Date(expiresAt).toISOString(),
          now: new Date().toISOString()
        });
        this.handleTimeout();
      } else {
        // Session is valid, log for debugging
        log.debug('Session check passed', 'AUTH', {
          expiresAt: new Date(expiresAt).toISOString(),
          remainingMinutes: Math.floor((expiresAt - Date.now()) / 1000 / 60)
        });
      }
    } catch (error) {
      // Only log error if we're still active
      if (this.isActive) {
        // Check if it's a network/parsing error vs actual auth error
        const errorMessage = error?.message || '';
        if (errorMessage.includes('JSON') || errorMessage.includes('network')) {
          log.warn('Network error during session check, skipping', 'AUTH', error);
          return;
        }
        
        log.error('Failed to check session', 'AUTH', error);
      }
    }
  }

  /**
   * Handle session timeout due to inactivity
   */
  private async handleTimeout() {
    log.warn('Session timeout reached due to inactivity', 'AUTH', {
      lastActivity: this.lastActivityTime,
      timeoutDuration: this.config.timeoutDuration
    });
    
    // First check if there's actually a valid session before clearing
    try {
      const currentAuth = authStore?.getState();
      if (!currentAuth?.isAuthenticated) {
        log.info('No active session to timeout', 'AUTH');
        this.stop();
        return;
      }
    } catch (error) {
      log.error('Failed to check auth state', 'AUTH', error);
    }
    
    // Call custom timeout callback if provided
    if (this.timeoutCallback) {
      this.timeoutCallback();
    } else {
      // Clear auth state
      try {
        if (authStore && typeof authStore.getState === 'function') {
          authStore.getState().clearAuth();
        }
      } catch (error) {
        log.error('Failed to clear auth state', 'AUTH', error);
      }
      
      // Default behavior: redirect to login
      if (Platform.OS === 'web') {
        window.location.href = '/login';
      } else {
        router.replace(ROUTES.auth.login);
      }
    }
    
    this.stop();
  }

  /**
   * Get remaining session time in milliseconds
   */
  getRemainingTime(): number {
    const elapsed = Date.now() - this.lastActivityTime;
    const remaining = this.config.timeoutDuration - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Check if session is about to timeout
   */
  isAboutToTimeout(): boolean {
    return this.getRemainingTime() <= this.config.warningDuration;
  }

  /**
   * Extend session by updating activity
   */
  extendSession() {
    log.info('Session extended by user action', 'AUTH');
    this.updateActivity();
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stop();
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

// Export singleton instance
export const sessionTimeoutManager = new SessionTimeoutManager();