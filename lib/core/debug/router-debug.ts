/**
 * Router Debug Configuration
 * Centralized routing debug utilities for Expo Router
 */

import { router } from 'expo-router';
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
  
  constructor() {
    if (__DEV__) {
      this.wrapRouterMethods();
    }
  }
  
  private wrapRouterMethods() {
    // Wrap router methods to log navigation
    const originalPush = router.push.bind(router);
    const originalReplace = router.replace.bind(router);
    const originalBack = router.back.bind(router);
    const originalSetParams = router.setParams.bind(router);
    
    router.push = (href: any) => {
      this.logNavigation('push', href);
      return originalPush(href);
    };
    
    router.replace = (href: any) => {
      this.logNavigation('replace', href);
      return originalReplace(href);
    };
    
    router.back = () => {
      this.logNavigation('back', null);
      return originalBack();
    };
    
    router.setParams = (params: any) => {
      this.logNavigation('setParams', params);
      return originalSetParams(params);
    };
  }
  
  private logNavigation(method: string, href: any) {
    if (!this.isEnabled) return;
    
    // Check debug settings
    const debugStore = useDebugStore.getState();
    if (!debugStore.enableRouterLogging) return;
    
    const pathname = typeof href === 'string' ? href : href?.pathname || 'unknown';
    const params = typeof href === 'object' ? href.params : {};
    
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
export const getNavigationHistory = () => routerDebugger.getHistory();
export const clearNavigationHistory = () => routerDebugger.clearHistory();
export const setRouterDebugging = (enabled: boolean) => routerDebugger.setEnabled(enabled);
export const getCurrentRoute = () => routerDebugger.getCurrentRoute();
export const getRouteStatistics = () => routerDebugger.getRouteCount();