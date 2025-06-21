/**
 * Router Debug Configuration
 * Centralized routing debug utilities for Expo Router
 */

import { log } from './logger';
import { useDebugStore } from '@/lib/stores/debug-store';

export interface RouteDebugInfo {
  pathname: string;
  params: Record<string, string | string[]>;
  segments: string[];
  timestamp: Date;
  method: 'push' | 'replace' | 'back' | 'canGoBack' | 'setParams';
  stack: string[];
}

class RouterDebugger {
  private history: RouteDebugInfo[] = [];
  private maxHistorySize = 50;
  private isEnabled = __DEV__;
  private isInitialized = false;
  private originalMethods: {
    push?: typeof router.push;
    replace?: typeof router.replace;
    back?: typeof router.back;
    setParams?: typeof router.setParams;
  } = {};
  
  constructor() {
    // Don't wrap router methods in constructor
    // Wait for explicit initialization after navigation container is mounted
  }
  
  public initialize() {
    if (!__DEV__ || this.isInitialized) return;
    
    try {
      this.wrapRouterMethods();
      this.isInitialized = true;
      log.debug('[RouterDebugger] Initialized successfully', 'NAVIGATION');
    } catch (error) {
      log.error('[RouterDebugger] Failed to initialize', error);
    }
  }
  
  private wrapRouterMethods() {
    // Lazy import router to avoid accessing it before navigation is ready
    const { router } = require('expo-router');
    
    // Store original methods
    this.originalMethods.push = router.push.bind(router);
    this.originalMethods.replace = router.replace.bind(router);
    this.originalMethods.back = router.back.bind(router);
    this.originalMethods.setParams = router.setParams.bind(router);
    
    // Wrap router methods to log navigation
    router.push = (href: any) => {
      try {
        this.logNavigation('push', href);
        return this.originalMethods.push!(href);
      } catch (error) {
        log.error('[Router] Push navigation failed', 'NAVIGATION', {
          href,
          error: error?.message || error,
          stack: error?.stack
        });
        throw error;
      }
    };
    
    router.replace = (href: any) => {
      try {
        if (!href) {
          log.warn('[Router] Replace called with null/undefined href', 'NAVIGATION');
          return;
        }
        this.logNavigation('replace', href);
        return this.originalMethods.replace!(href);
      } catch (error) {
        log.error('[Router] Replace navigation failed', 'NAVIGATION', {
          href,
          error: error?.message || error,
          stack: error?.stack
        });
        throw error;
      }
    };
    
    router.back = () => {
      try {
        this.logNavigation('back', null);
        return this.originalMethods.back!();
      } catch (error) {
        log.error('[Router] Back navigation failed', 'NAVIGATION', {
          error: error?.message || error,
          stack: error?.stack
        });
        throw error;
      }
    };
    
    router.setParams = (params: any) => {
      try {
        this.logNavigation('setParams', params);
        return this.originalMethods.setParams!(params);
      } catch (error) {
        log.error('[Router] SetParams navigation failed', 'NAVIGATION', {
          params,
          error: error?.message || error,
          stack: error?.stack
        });
        throw error;
      }
    };
  }
  
  private logNavigation(method: string, href: any) {
    if (!this.isEnabled) return;
    
    // Check debug settings
    const debugStore = useDebugStore.getState();
    if (!debugStore.enableRouterLogging) return;
    
    // Handle null/undefined href
    if (href === null || href === undefined) {
      log.warn(`[Router] Navigation called with null/undefined href`, 'NAVIGATION', {
        method,
        href,
        stack: this.getCallStack()
      });
      return;
    }
    
    // Handle back navigation special case
    if (method === 'back' && href === null) {
      const debugInfo: RouteDebugInfo = {
        method,
        pathname: 'back',
        params: {},
        timestamp: Date.now(),
        stackTrace: this.getStackTrace(),
      };
      
      this.routeHistory.push(debugInfo);
      if (this.routeHistory.length > 100) {
        this.routeHistory = this.routeHistory.slice(-50);
      }
      
      log.info(`[Router] Navigation: ${method}`, 'NAVIGATION', debugInfo);
      return;
    }
    
    const pathname = typeof href === 'string' ? href : (href && href.pathname) || 'unknown';
    const params = typeof href === 'object' ? href?.params : {};
    
    // Log the raw href to debug the route issue
    if (pathname.includes('login') || pathname.includes('auth')) {
      log.info(`[Router] Auth navigation detected - raw href:`, 'NAVIGATION', {
        method,
        rawHref: href,
        pathname,
        hrefType: typeof href,
      });
    }
    
    const debugInfo: RouteDebugInfo = {
      pathname,
      params: params || {},
      segments: pathname.split('/').filter(Boolean),
      timestamp: new Date(),
      method: method as any,
      stack: this.getCallStack(),
    };
    
    // Add to history
    this.history.push(debugInfo);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    
    // Log to console
    log.debug(`[Router] ${method}: ${pathname}`, 'NAVIGATION', {
      params,
      segments: debugInfo.segments,
    });
  }
  
  private getCallStack(): string[] {
    const stack = new Error().stack || '';
    return stack
      .split('\n')
      .slice(3, 8) // Skip error creation and this function
      .map(line => line.trim())
      .filter(line => !line.includes('node_modules'));
  }
  
  public getHistory(): RouteDebugInfo[] {
    return [...this.history];
  }
  
  public clearHistory(): void {
    this.history = [];
  }
  
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  public isDebuggingEnabled(): boolean {
    return this.isEnabled;
  }
  
  public getCurrentRoute(): RouteDebugInfo | null {
    return this.history[this.history.length - 1] || null;
  }
  
  public getRouteCount(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.history.forEach(route => {
      counts[route.pathname] = (counts[route.pathname] || 0) + 1;
    });
    return counts;
  }
}

// Create singleton instance
export const routerDebugger = new RouterDebugger();

// Export convenience functions
export const initializeRouterDebugger = () => routerDebugger.initialize();
export const getNavigationHistory = () => routerDebugger.getHistory();
export const clearNavigationHistory = () => routerDebugger.clearHistory();
export const setRouterDebugging = (enabled: boolean) => routerDebugger.setEnabled(enabled);
export const getCurrentRoute = () => routerDebugger.getCurrentRoute();
export const getRouteStatistics = () => routerDebugger.getRouteCount();