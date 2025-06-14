import { authClient } from './auth-client';
import { authStore } from '@/lib/stores/auth-store';
import { router } from 'expo-router';
import { log } from '@/lib/core/debug/logger';
import { Platform, AppState, AppStateStatus } from 'react-native';

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
    timeoutDuration: parseInt(process.env.EXPO_PUBLIC_SESSION_TIMEOUT || '1800000'), // 30 minutes default
    warningDuration: 5 * 60 * 1000, // 5 minutes warning
    checkInterval: 60 * 1000, // Check every minute
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
      warningDuration: this.config.warningDuration / 1000 + 's'
    });
    
    this.updateActivity();
    this.startTimers();
    
    // Start periodic checks with a delay to allow OAuth flow to complete
    setTimeout(() => {
      if (this.isActive) {
        this.checkTimer = setInterval(() => {
          this.checkSession();
        }, this.config.checkInterval);
      }
    }, 5000); // 5 second delay before starting checks
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
  }

  /**
   * Check if session is still valid
   */
  private async checkSession() {
    try {
      const session = await authClient.getSession();
      
      if (!session?.session) {
        // No session, trigger timeout
        this.handleTimeout();
        return;
      }
      
      // Check if session has expired
      const expiresAt = new Date(session.session.expiresAt).getTime();
      if (Date.now() >= expiresAt) {
        log.warn('Session has expired', 'AUTH');
        this.handleTimeout();
      }
    } catch (error) {
      log.error('Failed to check session', 'AUTH', error);
    }
  }

  /**
   * Handle session timeout
   */
  private async handleTimeout() {
    log.warn('Session timeout reached', 'AUTH');
    
    // Clear auth state
    authStore.getState().clearAuth();
    
    // Call custom timeout callback
    if (this.timeoutCallback) {
      this.timeoutCallback();
    } else {
      // Default behavior: redirect to login
      if (Platform.OS === 'web') {
        window.location.href = '/login';
      } else {
        router.replace('/(auth)/login');
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