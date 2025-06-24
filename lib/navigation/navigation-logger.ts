/**
 * Navigation Logger
 * Logs all navigation events for debugging and analytics
 */

import { router } from 'expo-router';
import { logger } from '@/lib/core/debug/unified-logger';
import { isValidRoute } from './route-validator';

interface NavigationEvent {
  type: 'push' | 'replace' | 'back' | 'setParams';
  href?: string;
  params?: any;
  timestamp: Date;
  valid: boolean;
  stack?: string;
}

class NavigationLogger {
  private history: NavigationEvent[] = [];
  private maxHistorySize = 100;
  private isInitialized = false;
  
  /**
   * Initialize the navigation logger
   */
  public initialize() {
    if (this.isInitialized) return;
    
    try {
      // Check if router is available
      if (!router || typeof router.push !== 'function') {
        throw new Error('Router not available yet');
      }
      
      // Store original methods
      const originalPush = router.push.bind(router);
      const originalReplace = router.replace.bind(router);
      const originalBack = router.back.bind(router);
      const originalSetParams = router.setParams.bind(router);
      
      // Wrap push method
      router.push = (href: any) => {
        const route = typeof href === 'string' ? href : href?.pathname;
        const params = typeof href === 'object' ? href?.params : undefined;
        
        this.logNavigation('push', route, params);
        
        try {
          return originalPush(href);
        } catch (error) {
          logger.error('Push navigation failed', 'NAVIGATION', {
            href,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      };
      
      // Wrap replace method
      router.replace = (href: any) => {
        const route = typeof href === 'string' ? href : href?.pathname;
        const params = typeof href === 'object' ? href?.params : undefined;
        
        this.logNavigation('replace', route, params);
        
        try {
          return originalReplace(href);
        } catch (error) {
          logger.error('Replace navigation failed', 'NAVIGATION', {
            href,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      };
      
      // Wrap back method
      router.back = () => {
        this.logNavigation('back');
        
        try {
          return originalBack();
        } catch (error) {
          logger.error('Back navigation failed', 'NAVIGATION', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      };
      
      // Wrap setParams method
      router.setParams = (params: any) => {
        this.logNavigation('setParams', undefined, params);
        
        try {
          return originalSetParams(params);
        } catch (error) {
          logger.error('SetParams failed', 'NAVIGATION', {
            params,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      };
      
      this.isInitialized = true;
      logger.info('Navigation logger initialized', 'NAVIGATION');
    } catch (error) {
      logger.error('Failed to initialize navigation logger', 'NAVIGATION', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  /**
   * Log a navigation event
   */
  private logNavigation(
    type: NavigationEvent['type'],
    href?: string,
    params?: any
  ) {
    const event: NavigationEvent = {
      type,
      href,
      params,
      timestamp: new Date(),
      valid: href ? isValidRoute(href) : true,
      stack: this.getCallStack(),
    };
    
    // Add to history
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    
    // Log based on validity
    if (!event.valid && href) {
      logger.warn('Invalid route navigation attempted', 'NAVIGATION', {
        type,
        href,
        params,
      });
    } else {
      logger.debug(`Navigation: ${type}`, 'NAVIGATION', {
        href,
        params,
        timestamp: event.timestamp,
      });
    }
  }
  
  /**
   * Get the call stack for debugging
   */
  private getCallStack(): string {
    const stack = new Error().stack || '';
    const lines = stack.split('\n');
    // Skip error creation and logger functions
    const relevantLines = lines.slice(4, 7);
    return relevantLines.join('\n');
  }
  
  /**
   * Get navigation history
   */
  public getHistory(): NavigationEvent[] {
    return [...this.history];
  }
  
  /**
   * Get the last navigation event
   */
  public getLastNavigation(): NavigationEvent | null {
    return this.history[this.history.length - 1] || null;
  }
  
  /**
   * Clear navigation history
   */
  public clearHistory() {
    this.history = [];
    logger.info('Navigation history cleared', 'NAVIGATION');
  }
  
  /**
   * Get navigation statistics
   */
  public getStatistics() {
    const stats = {
      totalNavigations: this.history.length,
      byType: {} as Record<NavigationEvent['type'], number>,
      invalidNavigations: 0,
      topRoutes: {} as Record<string, number>,
    };
    
    for (const event of this.history) {
      // Count by type
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
      
      // Count invalid navigations
      if (!event.valid) {
        stats.invalidNavigations++;
      }
      
      // Count top routes
      if (event.href) {
        stats.topRoutes[event.href] = (stats.topRoutes[event.href] || 0) + 1;
      }
    }
    
    return stats;
  }
}

// Create singleton instance
export const navigationLogger = new NavigationLogger();

// Export convenience functions
export function initializeNavigationLogger() {
  navigationLogger.initialize();
}

export function getNavigationHistory() {
  return navigationLogger.getHistory();
}

export function getNavigationStatistics() {
  return navigationLogger.getStatistics();
}