/**
 * Performance monitoring utilities for tracking app performance
 */

import { log } from '@/lib/core/debug/unified-logger';
import React from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private marks: Map<string, number> = new Map();
  
  constructor() {
    // Performance monitoring is initialized
    log.debug('Performance monitor initialized', 'PERFORMANCE');
  }
  
  /**
   * Start timing a performance metric
   */
  startMeasure(name: string) {
    this.marks.set(name, Date.now());
  }
  
  /**
   * End timing and record the metric
   */
  endMeasure(name: string, metadata?: Record<string, any>): number | null {
    const startTime = this.marks.get(name);
    if (!startTime) {
      log.warn(`No start time found for measure: ${name}`, 'PERFORMANCE');
      return null;
    }
    
    const duration = Date.now() - startTime;
    this.marks.delete(name);
    
    this.recordMetric(name, duration, metadata);
    
    // Log if duration exceeds threshold
    const thresholds: Record<string, number> = {
      'alert-list-render': 300,
      'alert-card-render': 50,
      'initial-load': 1500,
      'api-call': 1000,
    };
    
    const threshold = thresholds[name];
    if (threshold && duration > threshold) {
      log.warn(`Performance threshold exceeded for ${name}`, 'PERFORMANCE', {
        duration,
        threshold,
        metadata,
      });
    }
    
    return duration;
  }
  
  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metrics = this.metrics.get(name)!;
    metrics.push(metric);
    
    // Keep only last 100 metrics per name
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    log.debug(`Performance metric: ${name}`, 'PERFORMANCE', {
      value: `${value.toFixed(2)}ms`,
      ...metadata,
    });
  }
  
  /**
   * Get average performance for a metric
   */
  getAverage(name: string): number | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }
  
  /**
   * Get percentile performance for a metric
   */
  getPercentile(name: string, percentile: number): number | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }
    
    const sorted = [...metrics].sort((a, b) => a.value - b.value);
    const index = Math.floor(sorted.length * (percentile / 100));
    return sorted[index]?.value || null;
  }
  
  /**
   * Get performance summary for a metric
   */
  getSummary(name: string) {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }
    
    const values = metrics.map(m => m.value);
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: this.getAverage(name),
      p50: this.getPercentile(name, 50),
      p90: this.getPercentile(name, 90),
      p99: this.getPercentile(name, 99),
    };
  }
  
  /**
   * Log all performance summaries
   */
  logSummaries() {
    const summaries: Record<string, any> = {};
    
    this.metrics.forEach((_, name) => {
      summaries[name] = this.getSummary(name);
    });
    
    log.info('Performance Summary', 'PERFORMANCE', summaries);
    
    return summaries;
  }
  
  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.marks.clear();
  }
  
  /**
   * React hook for measuring component render time
   */
  useRenderTime(componentName: string, dependencies: any[] = []) {
    React.useEffect(() => {
      const renderTime = Date.now();
      
      return () => {
        const duration = Date.now() - renderTime;
        this.recordMetric(`${componentName}-render`, duration, {
          dependencies: dependencies.length,
        });
      };
    }, dependencies);
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience methods
export const startMeasure = (name: string) => performanceMonitor.startMeasure(name);
export const endMeasure = (name: string, metadata?: Record<string, any>) => 
  performanceMonitor.endMeasure(name, metadata);
export const recordMetric = (name: string, value: number, metadata?: Record<string, any>) => 
  performanceMonitor.recordMetric(name, value, metadata);
export const getPerformanceSummary = () => performanceMonitor.logSummaries();

// React hooks
export function usePerformanceMonitor(metricName: string) {
  React.useEffect(() => {
    startMeasure(metricName);
    
    return () => {
      endMeasure(metricName);
    };
  }, [metricName]);
}

export function useMeasureRender(componentName: string) {
  const renderStartRef = React.useRef<number>();
  
  React.useEffect(() => {
    renderStartRef.current = Date.now();
  });
  
  React.useEffect(() => {
    if (renderStartRef.current) {
      const renderTime = Date.now() - renderStartRef.current;
      recordMetric(`${componentName}-render`, renderTime);
    }
  });
}

// Performance marks for critical user journeys
export const performanceMarks = {
  appStart: 'app-start',
  firstContentfulPaint: 'first-contentful-paint',
  alertListLoaded: 'alert-list-loaded',
  alertCreated: 'alert-created',
  loginComplete: 'login-complete',
  navigationComplete: 'navigation-complete',
} as const;

