/**
 * Session Check Manager
 * Prevents multiple concurrent session checks to avoid database connection exhaustion
 */

import { logger } from '@/lib/core/debug/server-logger';

class SessionCheckManager {
  private isChecking = false;
  private lastCheckTime = 0;
  private checkPromise: Promise<any> | null = null;
  private minCheckInterval = 5000; // 5 seconds between checks
  
  /**
   * Check if we should allow a session check
   */
  shouldCheckSession(): boolean {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheckTime;
    
    // Don't check if we're already checking
    if (this.isChecking) {
      logger.auth.debug('Session check already in progress, skipping', {
        isChecking: this.isChecking,
        timeSinceLastCheck
      });
      return false;
    }
    
    // Don't check if we checked recently
    if (timeSinceLastCheck < this.minCheckInterval) {
      logger.auth.debug('Session checked recently, skipping', {
        timeSinceLastCheck,
        minCheckInterval: this.minCheckInterval
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * Wrap a session check to prevent concurrent checks
   */
  async wrapSessionCheck<T>(checkFn: () => Promise<T>): Promise<T | null> {
    // If already checking, wait for the existing check
    if (this.isChecking && this.checkPromise) {
      logger.auth.debug('Waiting for existing session check');
      try {
        return await this.checkPromise;
      } catch (error) {
        logger.auth.error('Existing session check failed', error);
        return null;
      }
    }
    
    // If we shouldn't check, return null
    if (!this.shouldCheckSession()) {
      return null;
    }
    
    // Mark as checking
    this.isChecking = true;
    this.lastCheckTime = Date.now();
    
    // Create and store the promise
    this.checkPromise = checkFn();
    
    try {
      const result = await this.checkPromise;
      logger.auth.debug('Session check completed successfully');
      return result;
    } catch (error) {
      logger.auth.error('Session check failed', error);
      throw error;
    } finally {
      // Reset state
      this.isChecking = false;
      this.checkPromise = null;
    }
  }
  
  /**
   * Force a session check (bypasses timing restrictions)
   */
  forceCheck() {
    this.lastCheckTime = 0;
    this.isChecking = false;
    this.checkPromise = null;
  }
  
  /**
   * Get status for debugging
   */
  getStatus() {
    return {
      isChecking: this.isChecking,
      lastCheckTime: this.lastCheckTime,
      timeSinceLastCheck: Date.now() - this.lastCheckTime,
      hasActivePromise: !!this.checkPromise
    };
  }
}

// Export singleton instance
export const sessionCheckManager = new SessionCheckManager();