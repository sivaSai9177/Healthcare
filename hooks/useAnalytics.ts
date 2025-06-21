/**
 * Analytics Hook
 * Provides easy-to-use analytics tracking methods
 */

import { useCallback, useEffect, useRef } from 'react';
import { usePostHog } from '@/components/providers/PostHogProvider';
import { logger } from '@/lib/core/debug/unified-logger';

interface TrackOptions {
  // Additional options for tracking
  timestamp?: Date;
  context?: Record<string, any>;
}

export function useAnalytics() {
  const { posthog, isReady } = usePostHog();

  /**
   * Track a custom event
   */
  const track = useCallback((
    event: string, 
    properties?: Record<string, any>,
    options?: TrackOptions
  ) => {
    try {
      if (posthog && isReady) {
        posthog.capture(event, {
          ...properties,
          timestamp: options?.timestamp || new Date(),
          ...options?.context,
        });
      }
      
      // Also log locally for debugging
      logger.debug('Analytics event', 'ANALYTICS', { 
        event, 
        properties,
        tracked: !!posthog && isReady,
      });
    } catch (error) {
      logger.error('Analytics tracking failed', 'ANALYTICS', error);
    }
  }, [posthog, isReady]);

  /**
   * Identify a user
   */
  const identify = useCallback((
    userId: string, 
    traits?: Record<string, any>
  ) => {
    try {
      if (posthog && isReady) {
        posthog.identify(userId, traits);
        logger.debug('User identified', 'ANALYTICS', { userId });
      }
    } catch (error) {
      logger.error('Analytics identify failed', 'ANALYTICS', error);
    }
  }, [posthog, isReady]);

  /**
   * Track screen views
   */
  const screen = useCallback((
    name: string, 
    properties?: Record<string, any>
  ) => {
    try {
      if (posthog && isReady) {
        posthog.screen(name, properties);
      }
      
      logger.debug('Screen viewed', 'ANALYTICS', { 
        screen: name, 
        properties,
      });
    } catch (error) {
      logger.error('Analytics screen tracking failed', 'ANALYTICS', error);
    }
  }, [posthog, isReady]);

  /**
   * Create an alias for the user
   */
  const alias = useCallback((alias: string) => {
    try {
      if (posthog && isReady) {
        posthog.alias(alias);
        logger.debug('User alias created', 'ANALYTICS', { alias });
      }
    } catch (error) {
      logger.error('Analytics alias failed', 'ANALYTICS', error);
    }
  }, [posthog, isReady]);

  /**
   * Track timing events (performance)
   */
  const trackTiming = useCallback((
    category: string,
    variable: string,
    time: number,
    label?: string
  ) => {
    track('timing_complete', {
      category,
      variable,
      time,
      label,
      unit: 'ms',
    });
  }, [track]);

  /**
   * Track errors
   */
  const trackError = useCallback((
    error: Error | string,
    fatal: boolean = false,
    metadata?: Record<string, any>
  ) => {
    track('error_occurred', {
      error_message: error instanceof Error ? error.message : error,
      error_stack: error instanceof Error ? error.stack : undefined,
      fatal,
      ...metadata,
    });
  }, [track]);

  /**
   * Track feature usage
   */
  const trackFeature = useCallback((
    feature: string,
    action: string,
    metadata?: Record<string, any>
  ) => {
    track(`feature_${feature}_${action}`, {
      feature,
      action,
      ...metadata,
    });
  }, [track]);

  /**
   * Opt user in to tracking
   */
  const optIn = useCallback(() => {
    try {
      if (posthog && isReady) {
        posthog.optIn();
        logger.info('User opted in to analytics', 'ANALYTICS');
      }
    } catch (error) {
      logger.error('Analytics opt-in failed', 'ANALYTICS', error);
    }
  }, [posthog, isReady]);

  /**
   * Opt user out of tracking
   */
  const optOut = useCallback(() => {
    try {
      if (posthog && isReady) {
        posthog.optOut();
        logger.info('User opted out of analytics', 'ANALYTICS');
      }
    } catch (error) {
      logger.error('Analytics opt-out failed', 'ANALYTICS', error);
    }
  }, [posthog, isReady]);

  /**
   * Check if user has opted out
   */
  const hasOptedOut = useCallback((): boolean => {
    if (posthog && isReady) {
      return posthog.hasOptedOut();
    }
    return false;
  }, [posthog, isReady]);

  /**
   * Reset analytics (on logout)
   */
  const reset = useCallback(() => {
    try {
      if (posthog && isReady) {
        posthog.reset();
        logger.info('Analytics reset', 'ANALYTICS');
      }
    } catch (error) {
      logger.error('Analytics reset failed', 'ANALYTICS', error);
    }
  }, [posthog, isReady]);

  /**
   * Flush pending events
   */
  const flush = useCallback(async () => {
    try {
      if (posthog && isReady) {
        await posthog.flush();
        logger.debug('Analytics events flushed', 'ANALYTICS');
      }
    } catch (error) {
      logger.error('Analytics flush failed', 'ANALYTICS', error);
    }
  }, [posthog, isReady]);

  return {
    // Core methods
    track,
    identify,
    screen,
    alias,
    
    // Specialized tracking
    trackTiming,
    trackError,
    trackFeature,
    
    // User preferences
    optIn,
    optOut,
    hasOptedOut,
    
    // Utility methods
    reset,
    flush,
    
    // Status
    isReady,
  };
}

// Convenience hooks for common tracking scenarios

/**
 * Track screen views automatically
 */
export function useScreenTracking(screenName: string, properties?: Record<string, any>) {
  const { screen } = useAnalytics();

  useEffect(() => {
    screen(screenName, properties);
  }, [screenName]);
}

/**
 * Track component mount/unmount timing
 */
export function useComponentTiming(componentName: string) {
  const { trackTiming } = useAnalytics();
  const mountTime = useRef(Date.now());

  useEffect(() => {
    return () => {
      const duration = Date.now() - mountTime.current;
      trackTiming('component_lifecycle', 'mount_duration', duration, componentName);
    };
  }, [componentName, trackTiming]);
}